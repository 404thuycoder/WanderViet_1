/**
 * messageManagement.js — Zenith Dark Messenger
 * Advanced Chat interface for WanderViệt Business Partner Hub.
 */
(function() {
    'use strict';

    let activeConvId = null;
    let localMessages = [];
    let localConversations = [];
    
    let aiMemory = JSON.parse(localStorage.getItem('chatbot_memory_v5') || '{}');
    let aiSession = { step: 'idle', data: {} };

    const HISTORY_KEY = 'chatbot_history_messages_v5';
    const AI_BOT_ID = 'ai-assistant';

    // ── Logic AI ────────────────────────────────────────────────
    function normalize(text) {
        if (!text) return '';
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').trim();
    }

    function getBotReply(userMessage) {
        const raw = userMessage;
        const clean = normalize(raw);

        if (raw.toLowerCase().startsWith('day:')) {
            const parts = raw.substring(4).split('=');
            if (parts.length === 2) {
                const k = normalize(parts[0]);
                const v = parts[1].trim();
                aiMemory[k] = v;
                localStorage.setItem('chatbot_memory_v5', JSON.stringify(aiMemory));
                return `Đã học! Từ giờ khi nhắc đến '${k}', em sẽ trả lời: '${v}'`;
            }
        }

        for (let k in aiMemory) {
            if (clean.includes(k)) return aiMemory[k];
        }

        if (aiSession.step === 'asking_people') {
            const num = raw.match(/\d+/);
            if (num) {
                aiSession.step = 'asking_date';
                aiSession.data.people = num[0];
                return `Dạ, em ghi nhận đặt cho ${num[0]} người. Vậy mình dự định khởi hành/nhận phòng vào ngày nào ạ?`;
            }
            return "Dạ mình đi mấy người để em kiểm tra chỗ ạ?";
        }

        if (aiSession.step === 'asking_date') {
            aiSession.step = 'asking_phone';
            aiSession.data.date = raw;
            return `Ngày ${raw} bên em vẫn còn dịch vụ ạ. Bạn cho em xin số điện thoại để em giữ chỗ cho mình nhé!`;
        }

        if (aiSession.step === 'asking_phone') {
            const phone = raw.match(/\d{9,11}/);
            if (phone) {
                aiSession = { step: 'idle', data: {} };
                return `Tuyệt vời! Em đã nhận số ${phone[0]}. Nhân viên sẽ gọi lại tư vấn chi tiết cho mình trong ít phút nữa ạ. Cảm ơn bạn! 😊`;
            }
            return "Dạ cho em xin số điện thoại để liên hệ xác nhận ạ.";
        }

        const intents = {
            services: ["dich vu", "co gi", "lam gi", "san pham", "tien ich"],
            booking: ["dat phong", "thue phong", "book", "dat cho", "nghi"],
            tour: ["tour", "du lich", "di choi"],
            price: ["gia", "bao nhieu", "bao tien", "chi phi"]
        };

        if (intents.services.some(k => clean.includes(k))) {
            return "Dạ bên em cung cấp 2 dịch vụ chính: \n1. **Khách sạn & Resort** cao cấp. \n2. **Tour du lịch trọn gói**. \nBạn muốn tìm hiểu kỹ hơn về dịch vụ nào ạ?";
        }

        if (intents.booking.some(k => clean.includes(k)) || clean.includes("phong")) {
            aiSession.step = 'asking_people';
            return "Dạ em hỗ trợ mình đặt phòng ạ. Mình dự định đi mấy người để em tư vấn hạng phòng phù hợp nhất?";
        }

        if (intents.tour.some(k => clean.includes(k))) {
            aiSession.step = 'asking_people';
            return "Dạ em hỗ trợ đặt tour ạ. Mình đi đoàn mấy người để em báo giá ưu đãi nhất?";
        }

        if (intents.price.some(k => clean.includes(k))) {
            return "Dạ giá bên em rất linh hoạt tùy theo thời điểm và hạng dịch vụ. Bạn đang quan tâm đến tour hay phòng khách sạn để em gửi bảng giá mới nhất ạ?";
        }

        return "Dạ em đã nhận được tin nhắn của bạn. Em là trợ lý ảo WanderViệt, bạn có thể hỏi em về đặt tour, đặt phòng hoặc báo giá ạ!";
    }

    // ── Styles ──────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        .msg-mgmt-container { width: 100%; height: 650px; display: flex; flex-direction: column; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(0,0,0,0.4); color:#fff; }
        .messenger-layout { display: grid; grid-template-columns: 320px 1fr; height: 100%; overflow: hidden; }
        
        .msg-sidebar { border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; background: rgba(255,255,255,0.02); height: 100%; }
        .sidebar-head { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .conv-list { flex: 1; overflow-y: auto; padding: 12px; }
        
        .conv-item { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 20px; cursor: pointer; transition: all 0.3s; margin-bottom: 4px; border: 1px solid transparent; }
        .conv-item:hover { background: rgba(255,255,255,0.05); }
        .conv-item.active { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; box-shadow: 0 10px 25px rgba(99,102,241,0.3); border-color: rgba(255,255,255,0.1); }
        
        .chat-main { display: flex; flex-direction: column; height: 100%; background: transparent; overflow: hidden; }
        .chat-header { padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); display:flex; justify-content:space-between; align-items:center; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; }
        
        .bubble { max-width: 80%; padding: 14px 20px; font-size: 15px; line-height: 1.6; border-radius: 20px; position: relative; animation: slideUp 0.4s ease-out; }
        .bubble-in { align-self: flex-start; background: rgba(255,255,255,0.05); color: #fff; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
        .bubble-out { align-self: flex-end; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(99,102,241,0.2); }
        .bubble-ai { background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); color: #fff; }
        
        .chat-input-area { padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.02); }
        .chat-input { flex: 1; padding: 14px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); outline: none; background: rgba(255,255,255,0.03); font-size: 15px; color:#fff; transition:all 0.2s; }
        .chat-input:focus { border-color:#6366f1; background:rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        .btn-send { width: 50px; height: 50px; border-radius: 16px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 15px rgba(99,102,241,0.3); transition: all 0.2s; }
        .btn-send:hover { transform: scale(1.05); opacity: 0.9; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // ── Utils ───────────────────────────────────────────────────
    function forceScrollToBottom() {
        const container = document.getElementById('chat-messages-container');
        if (!container) return;
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
            const lastMsg = container.lastElementChild;
            if (lastMsg) lastMsg.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
    }

    function nowStr() {
        const now = new Date();
        return now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    }

    // ── Main Logic ──────────────────────────────────────────────
    window.initMessageManagement = function() {
        localMessages = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        localConversations = [
            { id: AI_BOT_ID, customerName: 'Trợ lý AI WanderViệt', avatar: '👩‍💼', status: 'online', lastMessage: 'Em có thể giúp gì cho mình ạ?', time: 'Online', isAI: true },
            { id: 'c-1', customerName: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', lastMessage: 'Báo giá cho mình nhé', time: '10:30' }
        ];

        const container = document.getElementById('message-mgmt-container');
        if (!container) return;

        container.innerHTML = `
            <div class="msg-mgmt-container">
                <div class="messenger-layout">
                    <div class="msg-sidebar">
                        <div class="sidebar-head"><h3 style="font-weight:900; color:#fff; font-size:18px">Tin nhắn</h3></div>
                        <div class="conv-list" id="conv-list"></div>
                    </div>
                    <div class="msg-main" id="chat-main-view">
                        <div style="flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:24px; text-align:center; height:100%;">
                            <div style="font-size:70px; background:rgba(99,102,241,0.1); width:140px; height:140px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#6366f1; border: 1px solid rgba(99,102,241,0.2)">💬</div>
                            <h2 style="font-weight:900; color:#fff; font-size:22px">Trung tâm Chăm sóc Khách hàng</h2>
                            <p style="color:#94a3b8; max-width:350px; font-size:15px; line-height:1.6">Chọn một cuộc hội thoại để bắt đầu hỗ trợ khách hàng của bạn.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        renderConversations();
    };

    function renderConversations() {
        const container = document.getElementById('conv-list');
        if (!container) return;
        container.innerHTML = localConversations.map(c => `
            <div class="conv-item ${activeConvId === c.id ? 'active' : ''}" onclick="window.selectConversation('${c.id}')">
                <div style="width:54px; height:54px; border-radius:16px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0">
                    ${c.avatar.length > 2 ? `<img src="${c.avatar}" style="width:100%; height:100%; border-radius:16px; object-fit:cover;">` : c.avatar}
                </div>
                <div class="conv-info" style="flex:1; min-width:0">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-weight:800; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${c.customerName}</span>
                        <span style="font-size:10px; color:#94a3b8; font-weight:700">${c.time}</span>
                    </div>
                    <div style="font-size:12px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${c.lastMessage}</div>
                </div>
            </div>
        `).join('');
    }

    window.selectConversation = function(id) {
        activeConvId = id;
        const conv = localConversations.find(c => c.id === id);
        renderConversations();

        const mainView = document.getElementById('chat-main-view');
        mainView.innerHTML = `
            <div class="chat-main">
                <div class="chat-header">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="font-size:24px;">${conv.avatar.length > 2 ? `<img src="${conv.avatar}" style="width:50px; height:50px; border-radius:14px; object-fit:cover;">` : conv.avatar}</div>
                        <div>
                            <div style="font-weight:900; color:#fff; font-size:17px;">${conv.customerName}</div>
                            <div style="font-size:12px; color:#4ade80; font-weight:700;">Đang hoạt động ✨</div>
                        </div>
                    </div>
                    <button onclick="localStorage.removeItem('${HISTORY_KEY}'); window.initMessageManagement();" style="font-size:11px; font-weight:800; color:#f87171; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); padding:8px 16px; border-radius:12px; cursor:pointer;">Xóa lịch sử</button>
                </div>
                <div class="chat-messages" id="chat-messages-container"></div>
                <div class="chat-input-area">
                    <input type="text" placeholder="Nhập tin nhắn..." id="chat-input-field" class="chat-input">
                    <button onclick="window.handleSendMessage()" class="btn-send">➤</button>
                </div>
            </div>
        `;

        renderMessages(id);
        const input = document.getElementById('chat-input-field');
        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.handleSendMessage(); });
        }
    };

    function renderMessages(convId) {
        let msgs = localMessages.filter(m => m.conversationId === convId);
        const container = document.getElementById('chat-messages-container');
        if (!container) return;

        if (msgs.length === 0 && convId === AI_BOT_ID) {
            msgs = [{ conversationId: AI_BOT_ID, sender: 'customer', content: 'Chào bạn! Em là trợ lý ảo hỗ trợ tư vấn dịch vụ. Bạn muốn tìm hiểu về **Tour du lịch** hay **Đặt phòng khách sạn** ạ?', time: 'Hệ thống' }];
        }

        container.innerHTML = msgs.map(m => `
            <div class="bubble ${m.sender === 'customer' ? 'bubble-in' : 'bubble-out'} ${convId === AI_BOT_ID && m.sender === 'customer' ? 'bubble-ai' : ''}">
                ${m.content}
                <div style="font-size:9px; color:#94a3b8; margin-top:6px; text-align:right; font-weight:700;">${m.time}</div>
            </div>
        `).join('');

        forceScrollToBottom();
    }

    window.handleSendMessage = function() {
        const input = document.getElementById('chat-input-field');
        if (!input || !activeConvId) return;

        const content = input.value.trim();
        if (!content) return;

        localMessages.push({ id: Date.now(), conversationId: activeConvId, sender: 'business', content, time: nowStr() });
        input.value = '';
        renderMessages(activeConvId);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(localMessages));

        if (activeConvId === AI_BOT_ID) {
            setTimeout(() => {
                const reply = getBotReply(content);
                localMessages.push({ id: 'ai-' + Date.now(), conversationId: AI_BOT_ID, sender: 'customer', content: reply, time: nowStr() });
                renderMessages(AI_BOT_ID);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(localMessages));
            }, 800);
        }
    };

})();

