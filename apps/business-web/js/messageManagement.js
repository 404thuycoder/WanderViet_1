/**
 * messageManagement.js — Zenith Dark Messenger
 * Advanced Chat interface for WanderViet AI Business Partner Hub.
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

        // 0. Dạy trí nhớ (chỉ cho phép dạy về nghiệp vụ portal, không dạy thông tin nhạy cảm)
        if (raw.toLowerCase().startsWith('day:')) {
            const parts = raw.substring(4).split('=');
            if (parts.length === 2) {
                const k = normalize(parts[0]);
                const v = parts[1].trim();
                // Từ chối ghi nhớ thông tin nhạy cảm
                const sensitiveKeys = ['doanh thu', 'loi nhuan', 'lai lo', 'mat khau', 'password', 'cmnd', 'cccd', 'tai khoan'];
                if (sensitiveKeys.some(sk => k.includes(sk))) {
                    return 'Xin lỗi, em không thể ghi nhớ thông tin nhạy cảm. Chỉ có thể dạy em về nghiệp vụ sử dụng portal ạ.';
                }
                aiMemory[k] = v;
                localStorage.setItem('chatbot_memory_v5', JSON.stringify(aiMemory));
                return `Đã học! Khi hỏi về '${k}', em sẽ trả lời: '${v}'`;
            }
        }

        // 1. PRIVACY GUARD — Chặn câu hỏi nhạy cảm tuyệt đối
        const privacyPatterns = [
            /doanh\s*thu|l[oợ]i\s*nhu[aậ]n|l[aã]i\s*l[oỗ]|t[ỉỷ]\s*xu[aấ]t/i,
            /t[aà]i\s*ch[ií]nh\s*(doanh\s*nghi[eệ]p|c[oô]ng\s*ty)/i,
            /revenue|profit|\bloss\b|margin/i,
            /m[aậ]t\s*kh[aẩ]u|password|api\s*key|secret/i,
            /\bcmnd\b|\bcccd\b|c[aă]n\s*c[uư][oớ]c|h[oộ]\s*chi[eế]u/i,
            /th[oô]ng\s*tin\s*c[aá]\s*nh[aâ]n.*(?:user|ng[uư][oờ]i\s*d[uù]ng)/i,
        ];
        if (privacyPatterns.some(p => p.test(raw))) {
            return 'Xin lỗi, em không thể tư vấn về thông tin đó. Em chỉ hỗ trợ vận hành Business Portal WanderViet AI. Bạn cần hướng dẫn tính năng nào không ạ? 🏢';
        }

        // 2. Tra trí nhớ đã học
        for (let k in aiMemory) {
            if (clean.includes(k)) return aiMemory[k];
        }

        // 3. Hướng dẫn sử dụng Business Portal
        const portalGuide = [
            'huong dan', 'cach dung', 'su dung', 'tinh nang', 'dashboard',
            'quan ly', 'dich vu', 'booking', 'dat cho', 'them dich vu', 'dang dich vu',
            'cap nhat', 'chinh sua', 'xoa dich vu', 'tin nhan', 'thong bao'
        ];
        if (portalGuide.some(k => clean.includes(k))) {
            const guides = {
                'dashboard': 'Dashboard hiển thị tổng quan: số lượt đặt, dịch vụ đang chạy và thông báo mới nhất của bạn.',
                'them dich vu': 'Để thêm dịch vụ: vào **Quản lý Dịch vụ** → nhấn **+ Thêm mới** → điền thông tin và nhấn **Lưu**. Dịch vụ sẽ chờ Admin duyệt.',
                'dang dich vu': 'Để đăng dịch vụ: vào **Quản lý Dịch vụ** → nhấn **+ Thêm mới** → điền thông tin và nhấn **Lưu**.',
                'dat cho': 'Vào tab **Đặt chỗ (Bookings)** để xem danh sách đặt chỗ, xác nhận hoặc từ chối yêu cầu.',
                'booking': 'Vào tab **Đặt chỗ (Bookings)** để xem và xử lý các yêu cầu đặt dịch vụ từ khách.',
                'tin nhan': 'Vào tab **Tin nhắn** để giao tiếp trực tiếp với khách hàng đã đặt dịch vụ.',
            };
            for (const key in guides) {
                if (clean.includes(key)) return guides[key];
            }
            return 'Business Portal WanderViet AI gồm:\n✅ **Dashboard**: Tổng quan\n✅ **Quản lý Dịch vụ**: Thêm/sửa/xóa\n✅ **Đặt chỗ**: Xử lý booking\n✅ **Tin nhắn**: Chat với khách\nBạn cần hướng dẫn phần nào ạ?';
        }

        // 4. Xử lý flow đặt chỗ
        if (aiSession.step === 'asking_people') {
            const num = raw.match(/\d+/);
            if (num) {
                aiSession.step = 'asking_date';
                aiSession.data.people = num[0];
                return `Dạ, em ghi nhận đặt cho ${num[0]} người. Mình dự định khởi hành/nhận phòng vào ngày nào ạ?`;
            }
            return 'Dạ mình đi mấy người để em kiểm tra chỗ ạ?';
        }
        if (aiSession.step === 'asking_date') {
            aiSession.step = 'asking_phone';
            aiSession.data.date = raw;
            return `Ngày ${raw} bên em vẫn còn dịch vụ ạ. Bạn cho em xin số điện thoại để giữ chỗ nhé!`;
        }
        if (aiSession.step === 'asking_phone') {
            const phone = raw.match(/\d{9,11}/);
            if (phone) {
                aiSession = { step: 'idle', data: {} };
                return `Tuyệt vời! Em đã nhận số ${phone[0]}. Nhân viên sẽ gọi lại trong ít phút ạ. Cảm ơn! 😊`;
            }
            return 'Dạ cho em xin số điện thoại để liên hệ xác nhận ạ.';
        }

        // 5. Intent cơ bản
        const intents = {
            services: ['dich vu', 'co gi', 'lam gi', 'san pham'],
            booking:  ['dat phong', 'thue phong', 'book', 'dat cho', 'nghi'],
            tour:     ['tour', 'du lich', 'di choi'],
            price:    ['gia', 'bao nhieu', 'bao tien', 'chi phi'],
            greeting: ['chao', 'hi', 'hello', 'oi', 'alo'],
        };
        if (intents.greeting.some(k => clean.includes(k)))
            return 'Chào bạn! Em là Trợ lý WanderViet AI. Em có thể hỗ trợ bạn về dịch vụ du lịch hoặc hướng dẫn sử dụng Business Portal. Bạn cần gì ạ?';
        if (intents.services.some(k => clean.includes(k)))
            return 'Bên em cung cấp **Tour du lịch** và **Khách sạn & Resort** cao cấp. Bạn muốn tìm hiểu dịch vụ nào ạ?';
        if (intents.booking.some(k => clean.includes(k)) || clean.includes('phong')) {
            aiSession.step = 'asking_people';
            return 'Dạ em hỗ trợ đặt phòng. Mình dự định đi mấy người ạ?';
        }
        if (intents.tour.some(k => clean.includes(k))) {
            aiSession.step = 'asking_people';
            return 'Dạ em hỗ trợ đặt tour. Đoàn mình mấy người để em báo giá ưu đãi ạ?';
        }
        if (intents.price.some(k => clean.includes(k)))
            return 'Giá dịch vụ linh hoạt theo thời điểm và hạng. Bạn quan tâm tour hay phòng khách sạn để em gửi bảng giá ạ?';

        // 6. Off-topic — từ chối lịch sự
        const offTopicPatterns = [
            /h[oọ]c|tr[uườ]ng|b[eệ]nh|thu[oố]c|ch[ứú]ng\s*kho[aá]n/i,
            /b[oó]ng\s*[đd][aá]|game|phim|nh[aạ]c|th[eờ]i\s*ti[eế]t/i,
        ];
        if (offTopicPatterns.some(p => p.test(raw)))
            return 'Xin lỗi, em chỉ hỗ trợ về dịch vụ và vận hành Business Portal WanderViet AI ạ. Bạn cần hướng dẫn gì không? 🏢';

        return 'Dạ em là Trợ lý WanderViet AI. Bạn có thể hỏi về đặt tour, đặt phòng, hoặc hướng dẫn sử dụng Business Portal ạ!';
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
            { id: AI_BOT_ID, customerName: 'Trợ lý AI WanderViet AI', avatar: '👩‍💼', status: 'online', lastMessage: 'Em có thể giúp gì cho mình ạ?', time: 'Online', isAI: true },
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

