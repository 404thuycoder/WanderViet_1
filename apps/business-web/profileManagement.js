/**
 * profileManagement.js — Trang hồ sơ doanh nghiệp (Zenith Dark Edition)
 */
(function () {
    'use strict';

    // ── Lấy dữ liệu user hiện tại ───────────────────────────────
    function getCurrentBiz() {
        var keys = ['biz_auth_user', 'currentUser'];
        for (var i = 0; i < keys.length; i++) {
            var raw = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
            if (raw) { try { return JSON.parse(raw); } catch (e) { } }
        }
        return null;
    }

    function getMyServices() {
        var stored = [];
        try { stored = JSON.parse(localStorage.getItem('biz_services') || '[]'); } catch (e) { }
        if (stored.length > 0) return stored;
        return [
            { id: 's1', name: 'Tour Hạ Long VIP 2N1Đ',    price: 2500000, unit: 'người', category: 'tour',       status: 'active',  rating: 4.8, bookings: 124, location: 'Quảng Ninh', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80' },
            { id: 's2', name: 'Khách sạn Mường Thanh',     price: 1800000, unit: 'đêm',   category: 'hotel',      status: 'active',  rating: 4.5, bookings: 87,  location: 'Đà Nẵng',   image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' },
            { id: 's3', name: 'Nhà hàng Bếp Việt Hội An',  price: 350000,  unit: 'người', category: 'restaurant', status: 'active',  rating: 4.7, bookings: 203, location: 'Hội An',    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' }
        ];
    }

    function getDefaultBiz(user) {
        return {
            id:          (user && (user.id || user._id)) || 'biz_default',
            name:        (user && (user.name || user.displayName)) || 'Doanh nghiệp của tôi',
            description: (user && user.description) || 'Chúng tôi cung cấp các dịch vụ du lịch cao cấp, trải nghiệm khó quên cho khách hàng trên khắp Việt Nam.',
            address:     (user && user.address) || '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
            phone:       (user && user.phone)   || '0901 234 567',
            email:       (user && user.email)   || '',
            website:     (user && user.website) || '',
            category:    (user && user.category)|| 'Tour & Travel',
            founded:     (user && user.founded) || '2020',
            tier:        (user && user.tier)    || 'PARTNER',
        };
    }

    // ── Utils ────────────────────────────────────────────────────
    function formatPrice(n) {
        if (!n && n !== 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN').format(n) + ' VND';
    }

    function statusCfg(s) {
        var map = {
            active:  { label: 'Đang hoạt động', bg: 'rgba(5, 150, 105, 0.2)', color: '#34d399' },
            pending: { label: 'Chờ duyệt',       bg: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24' },
            paused:  { label: 'Tạm dừng',        bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
        };
        return map[s] || { label: s || 'Không rõ', bg: 'rgba(71, 85, 105, 0.2)', color: '#94a3b8' };
    }

    function typeLabel(cat) {
        var map = { tour: '🗺️ Tour', hotel: '🏨 Hotel', restaurant: '🍽️ Restaurant' };
        return map[cat] || '📍 Service';
    }

    function safeName(str) {
        return str.replace(/'/g, "\\'");
    }

    var css = `
        .pf-wrap { padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; }
        .pf-cover { height: 220px; border-radius: 28px; background: linear-gradient(135deg, #6366f1, #a855f7, #4f46e5); position: relative; margin-bottom: 70px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); overflow: visible; }
        .pf-avatar { position: absolute; bottom: -45px; left: 40px; width: 110px; height: 110px; border-radius: 28px; background: linear-gradient(135deg, #1e293b, #0f172a); border: 4px solid #111827; display: flex; align-items: center; justify-content: center; font-size: 48px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
        .pf-cover-btns { position: absolute; bottom: 20px; right: 24px; display: flex; gap: 12px; }
        .pf-btn { padding: 12px 24px; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1); }
        .pf-btn-primary { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; box-shadow: 0 8px 20px rgba(99,102,241,0.3); }
        .pf-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(99,102,241,0.4); }
        .pf-btn-ghost { background: rgba(255,255,255,0.1); color: #fff; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
        .pf-btn-ghost:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }

        .pf-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(25px); border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); overflow: hidden; }
        .pf-card-head { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px 12px; }
        .pf-card-title { font-size: 17px; font-weight: 800; color: #fff; }
        .pf-card-body { padding: 20px 32px 32px; }

        .pf-biz-name { font-size: 32px; font-weight: 900; color: #fff; margin-bottom: 6px; letter-spacing: -0.5px; }
        .pf-biz-desc { font-size: 15px; color: #94a3b8; line-height: 1.7; margin-bottom: 20px; max-width: 800px; }
        .pf-info-chip { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 10px 18px; font-size: 13px; color: #cbd5e1; font-weight: 600; margin: 4px; }
        
        .pf-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px; }
        .pf-stat { background: rgba(255,255,255,0.03); border-radius: 24px; padding: 24px; text-align: center; border: 1px solid rgba(255,255,255,0.05); transition: transform .3s; }
        .pf-stat:hover { transform: translateY(-5px); border-color: rgba(99,102,241,0.2); }
        .pf-stat-val { font-size: 32px; font-weight: 900; color: #fff; line-height: 1; }
        .pf-stat-lbl { font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; }

        .pf-layout { display: grid; grid-template-columns: 350px 1fr; gap: 24px; }
        .pf-col { display: flex; flex-direction: column; gap: 24px; }
        
        .pf-fac-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #cbd5e1; }
        
        .pf-svc-item { display: flex; gap: 20px; padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; transition: all .3s; cursor: pointer; background: rgba(255,255,255,0.02); }
        .pf-svc-item:hover { border-color: #6366f1; background: rgba(255,255,255,0.05); transform: translateX(8px); }
        .pf-svc-img { width: 100px; height: 85px; object-fit: cover; border-radius: 16px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
        .pf-svc-name { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .pf-svc-price { font-size: 18px; font-weight: 900; color: #4ade80; }
        .pf-svc-meta { display: flex; gap: 14px; font-size: 13px; color: #94a3b8; margin-top: 8px; font-weight: 600; }
        
        .pf-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(15px); z-index: 9999; align-items: center; justify-content: center; }
        .pf-modal-overlay.active { display: flex; }
        .pf-modal { background: #111827; border-radius: 32px; padding: 40px; width: 100%; max-width: 550px; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); color: #fff; box-shadow: 0 50px 100px rgba(0,0,0,0.5); }
        .pf-form-label { display: block; font-size: 14px; font-weight: 700; color: #94a3b8; margin-bottom: 10px; }
        .pf-form-ctrl { width: 100%; padding: 14px 20px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); font-size: 15px; outline: none; box-sizing: border-box; transition: all .2s; font-family: inherit; color: #fff; }
        .pf-form-ctrl:focus { border-color: #6366f1; background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        
        @media (max-width: 1000px) { .pf-layout { grid-template-columns: 1fr; } .pf-stats { grid-template-columns: repeat(2, 1fr); } }
    `;

    // ── Build functions ──────────────────────────────────────────
    function buildInfoChips(biz) {
        var chips = [
            { icon: '📍', text: biz.address },
            { icon: '📞', text: biz.phone },
            { icon: '📧', text: biz.email || 'Chưa cập nhật' },
            { icon: '🏷️', text: biz.category },
            { icon: '📅', text: 'Thành lập ' + biz.founded },
        ];
        return chips.map(function (c) {
            return '<span class="pf-info-chip">' + c.icon + ' ' + c.text + '</span>';
        }).join('');
    }

    function buildServiceCards(svcs) {
        if (!svcs.length) {
            return '<div style="text-align:center;padding:60px 20px;color:#94a3b8">' +
                '<div style="font-size:56px;margin-bottom:20px;opacity:0.3">📭</div>' +
                '<h3 style="color:#fff;margin:0 0 10px;font-size:18px">Chưa có dịch vụ</h3>' +
                '<p style="font-size:14px;margin:0 0 24px">Thêm dịch vụ đầu tiên để khách hàng tìm thấy bạn!</p>' +
                '<button class="pf-btn pf-btn-primary" onclick="window.navigateToView(\'services\')">+ Thêm dịch vụ ngay</button>' +
                '</div>';
        }

        return svcs.map(function (s) {
            var sc    = statusCfg(s.status);
            var img   = s.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80';
            var sname = safeName(s.name || 'Dịch vụ');

            return '<div class="pf-svc-item" onclick="window.navigateToView(\'services\')">' +
                '<img class="pf-svc-img" src="' + img + '" alt="' + sname + '" onerror="this.src=\'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80\'">' +
                '<div style="flex:1;min-width:0">' +
                    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">' +
                        '<p class="pf-svc-name">' + (s.name || 'Dịch vụ') + '</p>' +
                        '<span style="padding:4px 10px;border-radius:12px;font-size:11px;font-weight:800;background:' + sc.bg + ';color:' + sc.color + ';flex-shrink:0">' + sc.label + '</span>' +
                    '</div>' +
                    '<div class="pf-svc-price">' + formatPrice(s.price) + '<span style="font-size:13px;color:#94a3b8;font-weight:600"> / ' + (s.unit || 'người') + '</span></div>' +
                    '<div class="pf-svc-meta">' +
                        '<span>📍 ' + (s.location || 'Chưa cập nhật') + '</span>' +
                        '<span>⭐ ' + (s.rating > 0 ? s.rating : 'N/A') + '</span>' +
                        '<span>🔥 ' + (s.bookings || 0) + ' đặt</span>' +
                    '</div>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    // ── Main render ──────────────────────────────────────────────
    function render() {
        var user  = getCurrentBiz();
        var biz   = getDefaultBiz(user);
        var svcs  = getMyServices();

        var totalBookings = svcs.reduce(function (s, x) { return s + (x.bookings || 0); }, 0);
        var activeCount   = svcs.filter(function (s) { return s.status === 'active'; }).length;
        var ratedSvcs     = svcs.filter(function (s) { return s.rating > 0; });
        var avgRating     = ratedSvcs.length
            ? (ratedSvcs.reduce(function (s, x) { return s + x.rating; }, 0) / ratedSvcs.length).toFixed(1)
            : '—';

        var handle = '@' + biz.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

        return `
        <div class="pf-wrap">
            <div class="pf-cover">
                <div class="pf-avatar">🏨</div>
                <div class="pf-cover-btns">
                    <button class="pf-btn pf-btn-ghost" onclick="window.pfActions.edit()">✏️ Sửa hồ sơ</button>
                    <button class="pf-btn pf-btn-primary" onclick="window.navigateToView('services')">+ Thêm dịch vụ</button>
                </div>
            </div>

            <div class="pf-card">
                <div class="pf-card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px">
                        <div style="flex:1">
                            <h1 class="pf-biz-name">${biz.name}</h1>
                            <div style="font-size:14px;color:#6366f1;font-weight:800;margin-bottom:12px;letter-spacing:1px">${handle.toUpperCase()}</div>
                            <p class="pf-biz-desc">${biz.description}</p>
                            <div id="pf-chips">${buildInfoChips(biz)}</div>
                        </div>
                        <span style="background:rgba(99,102,241,0.1);color:#a5b4fc;padding:8px 20px;border-radius:14px;font-size:13px;font-weight:800;border:1px solid rgba(99,102,241,0.2)">${biz.tier}</span>
                    </div>
                </div>
            </div>

            <div class="pf-stats">
                <div class="pf-stat"><div class="pf-stat-val" style="color:#6366f1">${svcs.length}</div><div class="pf-stat-lbl">Sản phẩm</div></div>
                <div class="pf-stat"><div class="pf-stat-val" style="color:#10b981">${activeCount}</div><div class="pf-stat-lbl">Hoạt động</div></div>
                <div class="pf-stat"><div class="pf-stat-val" style="color:#f59e0b">${totalBookings}</div><div class="pf-stat-lbl">Lượt đặt</div></div>
                <div class="pf-stat"><div class="pf-stat-val" style="color:#f87171">${avgRating}</div><div class="pf-stat-lbl">Đánh giá TB</div></div>
            </div>

            <div class="pf-layout">
                <div class="pf-col">
                    <div class="pf-card">
                        <div class="pf-card-head"><div class="pf-card-title">🛎️ Liên hệ & Thông tin</div></div>
                        <div class="pf-card-body">
                            <div class="pf-fac-item">📍 ${biz.address}</div>
                            <div class="pf-fac-item">📞 ${biz.phone}</div>
                            <div class="pf-fac-item">📧 ${biz.email || 'N/A'}</div>
                            <div class="pf-fac-item">🌐 ${biz.website || 'N/A'}</div>
                            <div class="pf-fac-item">📅 Từ ${biz.founded}</div>
                        </div>
                    </div>
                    <div class="pf-card">
                        <div class="pf-card-head"><div class="pf-card-title">✨ Tiện ích đặc quyền</div></div>
                        <div class="pf-card-body" style="display:flex;flex-wrap:wrap;gap:8px">
                            ${['🚗 Đưa đón','🍽️ Bữa ăn','🛡️ Bảo hiểm','📸 Chụp ảnh','🎧 HDV','🏊 Hồ bơi','📶 Wifi','🅿️ Đỗ xe','♻️ Eco','💳 Online'].map(f => 
                                '<span style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:12px;font-weight:700;color:#cbd5e1">' + f + '</span>'
                            ).join('')}
                        </div>
                    </div>
                </div>

                <div class="pf-col">
                    <div class="pf-card">
                        <div class="pf-card-head">
                            <div class="pf-card-title">🧳 Danh sách dịch vụ</div>
                            <a style="font-size:13px;color:#6366f1;font-weight:800;cursor:pointer;text-decoration:none" onclick="window.navigateToView('services')">Quản lý →</a>
                        </div>
                        <div class="pf-card-body">${buildServiceCards(svcs)}</div>
                    </div>
                </div>
            </div>

            <div class="pf-modal-overlay" id="pf-modal">
                <div class="pf-modal">
                    <h3 style="font-size:24px;font-weight:900;margin:0 0 28px;color:#fff">✏️ Chỉnh sửa hồ sơ</h3>
                    <div style="margin-bottom:20px"><label class="pf-form-label">Tên doanh nghiệp</label><input type="text" id="pf-edit-name" class="pf-form-ctrl" value="${biz.name}"></div>
                    <div style="margin-bottom:20px"><label class="pf-form-label">Mô tả ngắn</label><textarea id="pf-edit-desc" class="pf-form-ctrl">${biz.description}</textarea></div>
                    <div style="margin-bottom:20px"><label class="pf-form-label">Địa chỉ trụ sở</label><input type="text" id="pf-edit-addr" class="pf-form-ctrl" value="${biz.address}"></div>
                    <div style="margin-bottom:20px"><label class="pf-form-label">Số điện thoại</label><input type="text" id="pf-edit-phone" class="pf-form-ctrl" value="${biz.phone}"></div>
                    <div style="margin-bottom:20px"><label class="pf-form-label">Email công việc</label><input type="email" id="pf-edit-email" class="pf-form-ctrl" value="${biz.email}"></div>
                    <div style="margin-bottom:28px"><label class="pf-form-label">Website</label><input type="text" id="pf-edit-web" class="pf-form-ctrl" value="${biz.website}" placeholder="https://..."></div>
                    <div style="display:flex;gap:12px;justify-content:flex-end">
                        <button class="pf-btn pf-btn-ghost" onclick="window.pfActions.closeModal()">Hủy bỏ</button>
                        <button class="pf-btn pf-btn-primary" onclick="window.pfActions.save()">💾 Lưu thay đổi</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ── Global actions ───────────────────────────────────────────
    window.pfActions = {
        edit: function () { document.getElementById('pf-modal').classList.add('active'); },
        closeModal: function () { document.getElementById('pf-modal').classList.remove('active'); },
        save: function () {
            var name = document.getElementById('pf-edit-name').value.trim();
            var desc = document.getElementById('pf-edit-desc').value.trim();
            if (!name) return alert('Tên không được để trống');

            var user = getCurrentBiz() || {};
            user.name = name;
            user.description = desc;
            user.address = document.getElementById('pf-edit-addr').value.trim();
            user.phone = document.getElementById('pf-edit-phone').value.trim();
            user.email = document.getElementById('pf-edit-email').value.trim();
            user.website = document.getElementById('pf-edit-web').value.trim();

            localStorage.setItem('biz_auth_user', JSON.stringify(user));
            this.closeModal();
            window.initProfile();
            
            // Toast
            if (window.WanderUI && window.WanderUI.showToast) {
                window.WanderUI.showToast('Đã cập nhật hồ sơ doanh nghiệp', 'success');
            } else {
                alert('Đã cập nhật hồ sơ!');
            }
        }
    };

    // ── Main init ────────────────────────────────────────────────
    window.initProfile = function () {
        var wrapper = document.getElementById('profile-mgmt-container');
        if (!wrapper) return;

        if (!document.getElementById('pf-style')) {
            var st = document.createElement('style');
            st.id = 'pf-style';
            st.textContent = css;
            document.head.appendChild(st);
        }

        wrapper.innerHTML = render();
    };

}());

