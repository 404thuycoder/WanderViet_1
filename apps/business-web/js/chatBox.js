/**
 * chatBox.js — ULTIMATE SMART AI CHATBOT v6.0 (DIVERSE VERSION)
 * Một nhân viên CSKH ảo toàn diện, am hiểu doanh nghiệp và có khả năng tư vấn chuyên sâu.
 */
(function () {
    'use strict';

    // ── CONFIG & STATE ──────────────────────────────────────────
    const LS_PREFIX = 'chat_smart_v6_';
    let aiSession = { 
        step: 'idle', 
        data: {}, 
        history: [], 
        lastService: null,
        isSearching: false 
    };

    // ── KNOWLEDGE & DATA ─────────────────────────────────────────
    const companyProfile = {
        name: "WanderViệt Enterprise",
        address: "123 Đường Du Lịch, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        phone: "1900 1234",
        email: "info@wanderviet.com",
        hours: "8:00 - 18:00 (Hàng ngày)",
        services: ["Tour du lịch", "Khách sạn", "Vé máy bay", "Thuê xe", "Giải pháp Tech", "Digital Marketing"]
    };

    const variations = {
        greeting: [
            "Chào bạn! Em là Trợ lý ảo của WanderViệt. Em có thể giúp gì cho mình ạ? 😊",
            "WanderViệt xin chào! Rất vui được hỗ trợ bạn. Bạn cần tư vấn về Tour hay Khách sạn ạ?",
            "Chào mừng bạn đến với WanderViệt! Em có thể giúp bạn tìm kiếm thông tin dịch vụ hoặc báo giá ngay nhé! ✨",
            "Alo! Em là trợ lý thông minh của WanderViệt đây. Bạn cần em hỗ trợ phần nào ạ?"
        ],
        contact: [
            `Dạ, bạn có thể liên hệ với bên em qua:\n📍 Địa chỉ: ${companyProfile.address}\n📞 Hotline: ${companyProfile.phone}\n📧 Email: ${companyProfile.email}\nBên em luôn sẵn sàng hỗ trợ bạn!`,
            `Đây là thông tin liên lạc của WanderViệt ạ:\n☎️ Hotline: ${companyProfile.phone}\n🏠 Văn phòng: ${companyProfile.address}\nBạn cần em kết nối với nhân viên tư vấn không ạ?`,
            `Để được hỗ trợ trực tiếp, mình có thể gọi số ${companyProfile.phone} hoặc ghé thăm văn phòng tại ${companyProfile.address} nhé! 🏢`
        ],
        services: [
            `WanderViệt cung cấp các giải pháp toàn diện bao gồm: \n- ${companyProfile.services.join('\n- ')}\nBạn quan tâm đến mảng nào nhất ạ?`,
            `Dạ bên em có rất nhiều dịch vụ đa dạng: ${companyProfile.services.join(', ')}. Bạn muốn em gửi thông tin chi tiết của phần nào ạ?`,
            `Từ Tour du lịch đến Giải pháp Công nghệ, WanderViệt đều có đủ ạ: \n✅ ${companyProfile.services.join('\n✅ ')}\nMình cần em tư vấn thêm không?`
        ],
        price: [
            "Giá dịch vụ bên em rất linh hoạt: Tour từ 1.8tr và Phòng từ 1.2tr. Bạn đang quan tâm đến dịch vụ cụ thể nào ạ?",
            "Dạ giá cả tùy thuộc vào thời điểm và hạng dịch vụ. Thông thường Tour bên em từ 1.8tr/người. Bạn muốn em báo giá tour nào ạ?",
            "WanderViệt luôn có giá tốt nhất cho khách hàng. Tour trọn gói chỉ từ 1.8tr thôi ạ. Mình đi ngày nào để em check giá chính xác nhé? 💸"
        ],
        thanks: [
            "Dạ không có gì ạ! Rất vui được hỗ trợ bạn. Chúc bạn một ngày tốt lành! ❤️",
            "Cảm ơn bạn đã quan tâm đến WanderViệt! Chúc bạn có những trải nghiệm tuyệt vời ạ. 😊",
            "Dạ vâng ạ! Em luôn ở đây nếu bạn cần hỗ trợ thêm nhé. Tạm biệt bạn! 👋"
        ],
        fallback: [
            "Dạ em chưa rõ ý mình lắm. Bạn có thể nói rõ hơn là đang quan tâm đến **Tour**, **Phòng khách sạn** hay **Giá cả** không ạ?",
            "Em xin lỗi, em chưa hiểu câu hỏi của mình. Mình có thể chọn một trong các gợi ý dưới đây để em hỗ trợ nhanh hơn nhé! 🙏",
            "Ý bạn là muốn tìm thông tin về dịch vụ hay hỏi về giá cả ạ? Bạn nói rõ hơn một chút để em trợ giúp tốt nhất nhé."
        ]
    };

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // ── AI BRAIN (NLU & LOGIC) ───────────────────────────────────
    function normalize(text) {
        if (!text) return '';
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').trim();
    }

    async function processAIResponse(userInput) {
        const raw = userInput;
        const clean = normalize(raw);

        // 0. PRIVACY GUARD — Chặn câu hỏi nhạy cảm
        const privacyPatterns = [
            /doanh\s*thu|l[oợ]i\s*nhu[aậ]n|l[aã]i\s*l[oỗ]|t[ỉỷ]\s*su[aấ]t/i,
            /t[aà]i\s*ch[ií]nh\s*(c[uủ]a\s*)?(doanh\s*nghi[eệ]p|c[oô]ng\s*ty)/i,
            /revenue|profit|\bloss\b/i,
            /th[oô]ng\s*tin\s*c[aá]\s*nh[aâ]n|\bcmnd\b|\bcccd\b/i,
            /m[aậ]t\s*kh[aẩ]u|password|api\s*key/i,
        ];
        if (privacyPatterns.some(p => p.test(raw))) {
            return {
                text: 'Xin lỗi, em không thể tư vấn về thông tin đó. Em chỉ hỗ trợ về dịch vụ và vận hành Business Portal WanderViệt. Bạn cần hướng dẫn gì không ạ? 🏢',
                quick: ['Hướng dẫn đăng dịch vụ', 'Quản lý đặt chỗ', 'Liên hệ hỗ trợ']
            };
        }

        // 1. Hướng dẫn sử dụng Business Portal
        const portalGuidePatterns = [
            /h[uướ]ng\s*d[aẫ]n|c[aá]ch\s*d[uù]ng|s[uử]\s*d[uụ]ng|t[íi]nh\s*n[aă]ng/i,
            /dashboard|qu[aả]n\s*l[ýy]|d[iị]ch\s*v[uụ]|booking|[đd][aặ]t\s*ch[oỗ]/i,
            /th[eê]m\s*d[iị]ch\s*v[uụ]|[đd][aă]ng\s*d[iị]ch\s*v[uụ]|c[aậ]p\s*nh[aậ]t/i,
        ];
        if (portalGuidePatterns.some(p => p.test(raw))) {
            return {
                text: pick([
                    'Business Portal WanderViệt gồm các tính năng chính:\n- **Dashboard**: Tổng quan hoạt động\n- **Quản lý Dịch vụ**: Thêm/sửa tour, phòng\n- **Đặt chỗ (Bookings)**: Quản lý lịch đặt\n- **Tin nhắn**: Giao tiếp với khách\nBạn cần hướng dẫn phần nào ạ?',
                    'Dạ em có thể hướng dẫn bạn:\n✅ Thêm dịch vụ mới\n✅ Xem và xử lý đặt chỗ\n✅ Nhắn tin với khách hàng\n✅ Cập nhật thông tin dịch vụ\nBạn muốn bắt đầu từ đâu ạ?',
                ]),
                quick: ['Cách thêm dịch vụ', 'Xem đặt chỗ', 'Nhắn tin khách hàng']
            };
        }

        // 2. Nhận diện Ý định
        const intents = {
            greeting: ['chao', 'hi', 'hello', 'oi', 'alo'],
            price: ['gia', 'bao nhieu', 'chi phi', 'dat khong', 're khong'],
            contact: ['lien he', 'so dien thoai', 'hotline', 'dia chi', 'o dau', 'email'],
            booking: ['dat cho', 'book', 'thue', 'mua', 'dang ky'],
            services: ['co dich vu gi', 'lam gi', 'san pham', 'co gi'],
            thanks: ['cam on', 'thank', 'ok', 'tot qua']
        };

        // 3. Tìm kiếm dịch vụ thực tế
        let foundService = null;
        if (clean.includes('tour') || clean.includes('khach san') || clean.includes('phong') || clean.includes('xe') || clean.includes('ve')) {
            try {
                const res = await window.api.get('/business/places');
                const list = res.data || res || [];
                foundService = list.find(s => normalize(s.name).includes(clean) || clean.includes(normalize(s.name)));
                if (foundService) aiSession.lastService = foundService;
            } catch (e) { console.error('AI Search Error:', e); }
        }

        // 4. Xử lý theo Context đặt chỗ
        if (aiSession.step === 'asking_people') {
            const num = raw.match(/\d+/);
            if (num) {
                aiSession.step = 'asking_date';
                aiSession.data.people = num[0];
                return { text: `Dạ em ghi nhận đoàn ${num[0]} người. Bạn dự kiến ngày khởi hành/nhận phòng là ngày nào ạ?`, quick: ['Ngày mai', 'Cuối tuần này', 'Tháng sau'] };
            }
            return { text: 'Dạ mình dự kiến đi mấy người ạ?', quick: ['1 người', '2 người', 'Đoàn đông'] };
        }
        if (aiSession.step === 'asking_date') {
            aiSession.step = 'asking_phone';
            aiSession.data.date = raw;
            return { text: `Ngày ${raw} bên em vẫn còn chỗ ạ. Bạn vui lòng để lại **Số điện thoại** để nhân viên liên hệ xác nhận nhé.`, quick: [] };
        }
        if (aiSession.step === 'asking_phone') {
            const phone = raw.match(/\d{9,11}/);
            if (phone) {
                aiSession.step = 'idle';
                return { text: `Tuyệt vời! Em đã ghi nhận. Nhân viên sẽ liên hệ số **${phone[0]}** sớm nhất. Cảm ơn bạn! 😊`, quick: ['Hỏi thêm', 'Kết thúc'] };
            }
            return { text: 'Dạ cho em xin số điện thoại để liên hệ xác nhận ạ.', quick: [] };
        }

        // 5. Trả lời theo Intent
        if (intents.greeting.some(k => clean.includes(k)))
            return { text: pick(variations.greeting), quick: ['Xem Tour nổi bật', 'Tìm khách sạn', 'Hướng dẫn Portal'] };
        if (intents.contact.some(k => clean.includes(k)))
            return { text: pick(variations.contact), quick: ['Gọi hotline', 'Gửi Email'] };
        if (intents.services.some(k => clean.includes(k)))
            return { text: pick(variations.services), quick: ['Dịch vụ Tour', 'Hướng dẫn đăng dịch vụ'] };
        if (intents.price.some(k => clean.includes(k))) {
            if (aiSession.lastService)
                return { text: `Dịch vụ **${aiSession.lastService.name}** có giá **${aiSession.lastService.price?.toLocaleString?.() || 'Liên hệ'} VNĐ**. Bạn muốn đặt không ạ?`, quick: ['Đặt ngay', 'Tư vấn thêm'] };
            return { text: pick(variations.price), quick: ['Báo giá Tour', 'Báo giá Khách sạn'] };
        }
        if (intents.booking.some(k => clean.includes(k)) || foundService) {
            aiSession.step = 'asking_people';
            const name = foundService?.name || aiSession.lastService?.name || 'dịch vụ';
            return { text: `Dạ em hỗ trợ đặt **${name}**. Đoàn mình dự kiến đi bao nhiêu người ạ?`, quick: ['2 người', '4 người', 'Đoàn trên 10'] };
        }
        if (intents.thanks.some(k => clean.includes(k)))
            return { text: pick(variations.thanks), quick: ['Hỏi thêm', 'Kết thúc'] };

        // 6. Off-topic — hướng về Business Portal
        const offTopicPatterns = [
            /h[oọ]c|tr[uườ]ng|b[eệ]nh|thu[oố]c|ch[ứú]ng\s*kho[aá]n/i,
            /th[eờ]i\s*ti[eế]t|b[oó]ng\s*[đd][aá]|game|phim/i,
        ];
        if (offTopicPatterns.some(p => p.test(raw))) {
            return {
                text: 'Xin lỗi, em chỉ hỗ trợ về dịch vụ và vận hành Business Portal WanderViệt ạ. Bạn cần hướng dẫn gì về nền tảng không? 🏢',
                quick: ['Hướng dẫn Portal', 'Tư vấn Tour', 'Liên hệ hỗ trợ']
            };
        }

        return { text: pick(variations.fallback), quick: ['Tư vấn Tour', 'Tư vấn Khách sạn', 'Hướng dẫn Portal'] };
    }

    // ── UI RENDERING ─────────────────────────────────────────────
    const css = `
    #smart-cb-backdrop { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.15); backdrop-filter: blur(4px); z-index: 10000; animation: fadeIn .3s ease; }
    #smart-cb-backdrop.open { display: block; }
    #smart-cb-panel { display: none; position: fixed; bottom: 100px; right: 24px; width: 420px; max-height: 680px; background: #fff; border-radius: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05); z-index: 10001; flex-direction: column; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; animation: slideUp .4s cubic-bezier(.16, 1, .3, 1); }
    #smart-cb-panel.open { display: flex; }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { opacity:0; transform: translateY(40px) scale(0.95); } to { opacity:1; transform: none; } }
    
    .cb-header { padding: 24px; background: linear-gradient(135deg, #1e1b4b, #4338ca); color: #fff; display: flex; align-items: center; gap: 16px; }
    .cb-avatar { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 26px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .cb-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; background: #fff; scroll-behavior: smooth; }
    .cb-msg { display: flex; align-items: flex-end; gap: 10px; max-width: 85%; animation: msgIn 0.3s ease-out; }
    @keyframes msgIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }
    .cb-msg.received { align-self: flex-start; }
    .cb-msg.sent { align-self: flex-end; flex-direction: row-reverse; }
    .cb-bubble { padding: 14px 20px; border-radius: 22px; font-size: 15px; line-height: 1.6; word-break: break-word; }
    .cb-msg.received .cb-bubble { background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
    .cb-msg.sent .cb-bubble { background: #4338ca; color: #fff; border-bottom-right-radius: 4px; }
    
    .cb-quick-wrap { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 24px 16px; background: #fff; }
    .cb-quick-btn { padding: 8px 16px; border-radius: 20px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 13px; font-weight: 700; color: #4338ca; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .cb-quick-btn:hover { border-color: #4338ca; background: #f5f3ff; transform: translateY(-1px); }

    .cb-input-area { padding: 16px 24px 24px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: center; background: #fff; }
    .cb-input { flex: 1; border: 2px solid #f1f5f9; border-radius: 14px; padding: 12px 18px; font-size: 15px; outline: none; background: #f8fafc; transition: 0.2s; }
    .cb-input:focus { border-color: #4338ca; background: #fff; box-shadow: 0 0 0 4px rgba(67, 56, 202, 0.05); }
    .cb-send-btn { width: 48px; height: 48px; border-radius: 14px; background: #4338ca; border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: 0.2s; }
    .cb-send-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(67, 56, 202, 0.3); }

    .cb-typing { display: none; padding: 0 24px 12px; font-size: 13px; color: #94a3b8; font-weight: 700; font-style: italic; }
    #smart-cb-trigger { position: fixed; bottom: 24px; right: 24px; width: 64px; height: 64px; background: linear-gradient(135deg, #1e1b4b, #4338ca); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; cursor: pointer; z-index: 9999; box-shadow: 0 12px 35px rgba(67, 56, 202, 0.4); transition: 0.3s cubic-bezier(.34,1.56,.64,1); }
    #smart-cb-trigger:hover { transform: translateY(-5px) scale(1.1); }
    `;

    function buildUI() {
        if (document.getElementById('smart-cb-style')) return;
        const style = document.createElement('style');
        style.id = 'smart-cb-style';
        style.textContent = css;
        document.head.appendChild(style);

        const el = document.createElement('div');
        el.innerHTML = `
        <div id="smart-cb-trigger" title="Hỏi trợ lý ảo">🤖</div>
        <div id="smart-cb-backdrop"></div>
        <div id="smart-cb-panel">
            <div class="cb-header">
                <div class="cb-avatar">👩‍💼</div>
                <div style="flex:1">
                    <div style="font-weight:900;font-size:17px">Trợ lý WanderViệt</div>
                    <div style="font-size:12px;opacity:0.8;display:flex;align-items:center;gap:4px">● Đang trực tuyến ⚡</div>
                </div>
                <button id="smart-cb-close" style="background:transparent;border:none;color:#fff;cursor:pointer;font-size:22px">✕</button>
            </div>
            <div class="cb-messages" id="smart-cb-messages"></div>
            <div class="cb-typing" id="smart-cb-typing">Trợ lý đang soạn phản hồi...</div>
            <div class="cb-quick-wrap" id="smart-cb-quick"></div>
            <div class="cb-input-area">
                <input class="cb-input" id="smart-cb-input" placeholder="Hỏi em về tour, phòng, giá cả...">
                <button class="cb-send-btn" id="smart-cb-send">➤</button>
            </div>
        </div>`;
        document.body.appendChild(el);

        document.getElementById('smart-cb-trigger').onclick = () => window.SmartChat.open();
        document.getElementById('smart-cb-close').onclick = () => window.SmartChat.close();
        document.getElementById('smart-cb-send').onclick = () => window.SmartChat.send();
        document.getElementById('smart-cb-input').onkeydown = (e) => { if (e.key === 'Enter') window.SmartChat.send(); };
    }

    window.SmartChat = {
        open() {
            document.getElementById('smart-cb-panel').classList.add('open');
            document.getElementById('smart-cb-backdrop').classList.add('open');
            this.renderMessages();
            document.getElementById('smart-cb-input').focus();
        },
        close() {
            document.getElementById('smart-cb-panel').classList.remove('open');
            document.getElementById('smart-cb-backdrop').classList.remove('open');
        },
        async send(manualText) {
            const input = document.getElementById('smart-cb-input');
            const text = manualText || input.value.trim();
            if (!text) return;
            
            this.addMessage('user', text);
            if (!manualText) input.value = '';
            
            const typing = document.getElementById('smart-cb-typing');
            typing.style.display = 'block';
            this.scroll();

            const reply = await processAIResponse(text);
            
            setTimeout(() => {
                typing.style.display = 'none';
                this.addMessage('bot', reply.text);
                this.renderQuick(reply.quick);
            }, 800);
        },
        addMessage(role, text) {
            const msgs = JSON.parse(localStorage.getItem(LS_PREFIX + 'history') || '[]');
            msgs.push({ role, text, time: new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) });
            localStorage.setItem(LS_PREFIX + 'history', JSON.stringify(msgs));
            this.renderMessages();
        },
        renderMessages() {
            const container = document.getElementById('smart-cb-messages');
            const msgs = JSON.parse(localStorage.getItem(LS_PREFIX + 'history') || '[]');
            if (msgs.length === 0) {
                container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#64748b;font-size:14.5px;line-height:1.7">Chào bạn! Em là <b>Trợ lý WanderViệt</b>. Em có thể giúp gì cho mình về Tour, Khách sạn hay thông tin dịch vụ ạ?</div>`;
                this.renderQuick(["Tư vấn Tour", "Giá phòng", "Liên hệ"]);
                return;
            }
            container.innerHTML = msgs.map(m => `
                <div class="cb-msg ${m.role === 'user' ? 'sent' : 'received'}">
                    <div class="cb-bubble">${m.text.replace(/\n/g, '<br>')}</div>
                </div>
            `).join('');
            this.scroll();
        },
        renderQuick(list) {
            const wrap = document.getElementById('smart-cb-quick');
            if (!list || list.length === 0) { wrap.innerHTML = ''; return; }
            wrap.innerHTML = list.map(q => `<button class="cb-quick-btn" onclick="window.SmartChat.send('${q}')">${q}</button>`).join('');
        },
        scroll() {
            const container = document.getElementById('smart-cb-messages');
            container.scrollTop = container.scrollHeight;
        }
    };

    window.ChatBox = window.SmartChat;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
    else buildUI();

})();

