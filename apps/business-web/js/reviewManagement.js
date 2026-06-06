/**
 * reviewManagement.js
 * Professional Reviews Management Module (Vanilla JS implementing React-like State Pattern)
 */

(function() {
    'use strict';

    // --- State Management ---
    const state = {
        services: [],
        selectedServiceId: '',
        reviews: [],
        loading: false,
        filterStar: 'all', // all, 5, 4, 3, 2, 1
        
        // Form state
        formRating: 5,
        formComment: ''
    };

    // --- Styles ---
    const style = document.createElement('style');
    style.textContent = `
        .rm-container { max-width: 1200px; margin: 0 auto; font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; padding-bottom: 40px; }
        .rm-header { margin-bottom: 24px; }
        .rm-title { font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 8px; }
        .rm-subtitle { font-size: 15px; color: #94a3b8; }

        .rm-grid { display: grid; grid-template-columns: 1fr 350px; gap: 24px; align-items: start; }
        @media (max-width: 900px) { .rm-grid { grid-template-columns: 1fr; } }

        .rm-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); padding: 24px; }
        .rm-card-title { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }

        /* Select Service */
        .rm-select { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); font-size: 15px; font-weight: 600; outline: none; background: rgba(255,255,255,0.03); transition: all 0.2s; cursor: pointer; color: #fff; margin-bottom: 24px; }
        .rm-select:focus { border-color: #6366f1; background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }

        /* Stats */
        .rm-stats { display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .rm-stats-big { font-size: 36px; font-weight: 900; color: #fff; }
        .rm-stats-stars { color: #f59e0b; font-size: 20px; letter-spacing: 2px; }
        .rm-stats-total { font-size: 14px; color: #94a3b8; font-weight: 500; margin-top: 4px; }

        /* Filters */
        .rm-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .rm-filter-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); font-size: 14px; font-weight: 600; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
        .rm-filter-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .rm-filter-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 4px 12px rgba(99,102,241,0.2); }

        /* Review List */
        .rm-list { display: flex; flex-direction: column; gap: 16px; }
        .rm-item { padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); transition: all 0.2s; }
        .rm-item:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
        .rm-item-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .rm-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; }
        .rm-user { font-weight: 700; color: #fff; font-size: 15px; }
        .rm-time { font-size: 13px; color: #64748b; font-weight: 500; margin-left: auto; }
        .rm-stars { color: #f59e0b; font-size: 14px; letter-spacing: 1px; margin-bottom: 8px; }
        .rm-comment { font-size: 15px; color: #cbd5e1; line-height: 1.6; }

        /* Form */
        .rm-form-group { margin-bottom: 16px; }
        .rm-form-label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px; color: #94a3b8; }
        .rm-textarea { width: 100%; padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); font-size: 14px; font-family: inherit; resize: vertical; min-height: 120px; background: rgba(255,255,255,0.03); transition: all 0.2s; box-sizing: border-box; color:#fff; }
        .rm-textarea:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        .rm-btn-submit { width: 100%; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 20px rgba(99,102,241,0.25); }
        .rm-btn-submit:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99,102,241,0.35); }
        .rm-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Star Selector */
        .rm-star-select { display: flex; gap: 8px; flex-direction: row-reverse; justify-content: flex-end; }
        .rm-star-select input { display: none; }
        .rm-star-select label { font-size: 32px; color: rgba(255,255,255,0.1); cursor: pointer; transition: color 0.2s; }
        .rm-star-select label:hover, .rm-star-select label:hover ~ label, .rm-star-select input:checked ~ label { color: #f59e0b; }

        /* Loader */
        .rm-loader { text-align: center; padding: 40px; color: #94a3b8; font-weight: 500; }
        .rm-empty { text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 2px dashed rgba(255,255,255,0.1); }
        .rm-empty-icon { font-size: 40px; margin-bottom: 16px; opacity: 0.5; }
    `;
    document.head.appendChild(style);

    // --- Helpers ---
    function toast(msg, type = 'success') {
        let existing = document.getElementById('rm-toast');
        if (existing) existing.remove();
        
        const t = document.createElement('div');
        t.id = 'rm-toast';
        t.style.cssText = `
            position:fixed; top:24px; right:24px; z-index:99999;
            padding:14px 24px; border-radius:12px; font-weight:700;
            font-size:14px; box-shadow:0 10px 30px rgba(0,0,0,0.15);
            transition:all 0.3s; opacity:0; transform:translateY(-10px);
            background:${type==='error'?'#ef4444':'#10b981'}; color:#fff;
        `;
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateY(0)'; });
        setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(), 300); }, 3000);
    }

    function timeAgo(dateString) {
        const d = new Date(dateString);
        const now = new Date();
        const diffMs = now - d;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay === 1) return `Hôm qua`;
        if (diffDay < 30) return `${diffDay} ngày trước`;
        return d.toLocaleDateString('vi-VN');
    }

    function renderStars(rating) {
        const full = Math.floor(rating);
        let stars = '';
        for(let i=0; i<5; i++) {
            if (i < full) stars += '★';
            else stars += '☆'; 
        }
        return stars;
    }

    // --- Data Fetching ---
    async function loadServices() {
        if (!window.isLoggedIn()) {
            const select = document.getElementById('rm-service-select');
            if (select) select.innerHTML = '<option>Chưa đăng nhập</option>';
            return;
        }
        try {
            const res = await window.api.get('/business/places');
            state.services = res.data || [];
            
            if (state.services.length > 0 && !state.selectedServiceId) {
                state.selectedServiceId = state.services[0]._id;
            }
            renderServiceSelect();
            if (state.selectedServiceId) {
                loadReviews();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function loadReviews() {
        if (!state.selectedServiceId) return;
        state.loading = true;
        renderReviews();

        try {
            const res = await window.api.get(`/business/reviews?placeId=${state.selectedServiceId}`);
            state.reviews = res.data || [];
        } catch (err) {
            console.error(err);
            state.reviews = [];
        } finally {
            state.loading = false;
            renderReviews();
            renderStats();
        }
    }

    // --- Action Handlers ---
    window.rmActions = {
        changeService: function(e) {
            state.selectedServiceId = e.target.value;
            loadReviews();
        },
        changeFilter: function(star) {
            state.filterStar = star;
            renderReviews();
            renderFilters();
        },
        setRating: function(val) {
            state.formRating = parseInt(val);
        },
        submitReview: async function() {
            const comment = document.getElementById('rm-form-comment').value.trim();
            
            if (!state.selectedServiceId) {
                return toast('Vui lòng chọn dịch vụ trước', 'error');
            }
            if (!state.formRating) {
                return toast('Vui lòng chọn số sao (1-5)', 'error');
            }
            if (!comment) {
                return toast('Vui lòng nhập nội dung đánh giá', 'error');
            }

            const btn = document.getElementById('rm-submit-btn');
            btn.disabled = true;
            btn.textContent = 'Đang gửi...';

            try {
                await window.api.post('/business/reviews', {
                    serviceId: state.selectedServiceId,
                    rating: state.formRating,
                    comment: comment
                });

                toast('Đã gửi đánh giá thành công!');
                document.getElementById('rm-form-comment').value = '';
                document.getElementById('star5').checked = true;
                state.formRating = 5;
                await loadReviews();
                loadServices();
            } catch (err) {
                toast(err.message || 'Lỗi khi gửi đánh giá', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Gửi đánh giá';
            }
        }
    };

    // --- Render Functions ---
    function renderServiceSelect() {
        const select = document.getElementById('rm-service-select');
        if (!select) return;

        if (state.services.length === 0) {
            select.innerHTML = '<option value="">Không có dịch vụ nào</option>';
            return;
        }

        select.innerHTML = state.services.map(s => 
            `<option value="${s._id}" ${s._id === state.selectedServiceId ? 'selected' : ''}>
                ${s.name} ${s.rating ? `(⭐ ${s.rating})` : ''}
            </option>`
        ).join('');
    }

    function renderFilters() {
        const container = document.getElementById('rm-filters');
        if (!container) return;

        const filters = [
            { val: 'all', label: 'Tất cả' },
            { val: 5, label: '5 Sao' },
            { val: 4, label: '4 Sao' },
            { val: 3, label: '3 Sao' },
            { val: 2, label: '2 Sao' },
            { val: 1, label: '1 Sao' }
        ];

        container.innerHTML = filters.map(f => `
            <button class="rm-filter-btn ${state.filterStar == f.val ? 'active' : ''}" 
                    onclick="window.rmActions.changeFilter('${f.val}')">
                ${f.label}
            </button>
        `).join('');
    }

    function renderStats() {
        const container = document.getElementById('rm-stats');
        if (!container) return;

        if (state.reviews.length === 0) {
            container.innerHTML = `
                <div class="rm-stats-big">0.0</div>
                <div>
                    <div class="rm-stats-stars">☆☆☆☆☆</div>
                    <div class="rm-stats-total">Chưa có đánh giá nào</div>
                </div>
            `;
            return;
        }

        const total = state.reviews.length;
        const sum = state.reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = (sum / total).toFixed(1);

        container.innerHTML = `
            <div class="rm-stats-big">${avg}</div>
            <div>
                <div class="rm-stats-stars">${renderStars(avg)}</div>
                <div class="rm-stats-total">Dựa trên ${total} đánh giá từ khách hàng</div>
            </div>
        `;
    }

    function renderReviews() {
        const list = document.getElementById('rm-list');
        if (!list) return;

        if (state.loading) {
            list.innerHTML = '<div class="rm-loader">⏳ Đang tải dữ liệu đánh giá...</div>';
            return;
        }

        let filtered = state.reviews;
        if (state.filterStar !== 'all') {
            filtered = filtered.filter(r => r.rating == state.filterStar);
        }

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="rm-empty">
                    <div class="rm-empty-icon">📭</div>
                    <h3 style="color: #cbd5e1;">Chưa có đánh giá nào</h3>
                    <p style="color: #94a3b8; font-size: 14px;">Hãy mời khách hàng trải nghiệm và để lại đánh giá.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = filtered.map(r => {
            const userName = r.userName || (r.user && r.user.name ? r.user.name : 'Khách hàng');
            const initial = userName.charAt(0).toUpperCase();

            const imagesHtml = (r.images && r.images.length > 0) 
                ? `<div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                    ${r.images.map(img => `<img src="${img}" style="width:70px; height:70px; object-fit:cover; border-radius:8px; border:1px solid rgba(255,255,255,0.1); cursor:pointer;" onclick="window.open('${img}')">`).join('')}
                   </div>`
                : '';

            return `
                <div class="rm-item">
                    <div class="rm-item-header">
                        <div class="rm-avatar">${initial}</div>
                        <div>
                            <div class="rm-user">${userName}</div>
                            <div class="rm-stars">${renderStars(r.rating)}</div>
                        </div>
                        <div class="rm-time">${timeAgo(r.createdAt)}</div>
                    </div>
                    <div class="rm-comment">${r.comment}</div>
                    ${imagesHtml}
                </div>
            `;
        }).join('');
    }

    // --- Bootstrapper ---
    window.initReviewManagement = function() {
        const wrapper = document.getElementById('review-mgmt-container');
        if (!wrapper) return;

        wrapper.innerHTML = `
            <div class="rm-container">
                <div class="rm-header">
                    <h2 class="rm-title">Quản lý Đánh giá</h2>
                    <div class="rm-subtitle">Xem phản hồi thực tế và kiểm thử luồng đánh giá dịch vụ</div>
                </div>

                <select id="rm-service-select" class="rm-select" onchange="window.rmActions.changeService(event)">
                    <option>Đang tải dịch vụ...</option>
                </select>

                <div class="rm-grid">
                    <div>
                        <div class="rm-card" style="margin-bottom: 24px;">
                            <div class="rm-card-title">Tổng quan Đánh giá</div>
                            <div id="rm-stats" class="rm-stats"></div>
                            <div id="rm-filters" class="rm-filters"></div>
                        </div>
                        <div id="rm-list" class="rm-list"></div>
                    </div>

                    <div>
                        <div class="rm-card" style="position: sticky; top: 24px;">
                            <div class="rm-card-title">Gửi Đánh giá (Test)</div>
                            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px; line-height: 1.5;">
                                Sử dụng form này để kiểm thử việc lưu đánh giá vào cơ sở dữ liệu thật.
                            </p>
                            
                            <div class="rm-form-group">
                                <label class="rm-form-label">Chọn mức độ hài lòng *</label>
                                <div class="rm-star-select">
                                    <input type="radio" name="rating" id="star5" value="5" checked onclick="window.rmActions.setRating(5)">
                                    <label for="star5">★</label>
                                    <input type="radio" name="rating" id="star4" value="4" onclick="window.rmActions.setRating(4)">
                                    <label for="star4">★</label>
                                    <input type="radio" name="rating" id="star3" value="3" onclick="window.rmActions.setRating(3)">
                                    <label for="star3">★</label>
                                    <input type="radio" name="rating" id="star2" value="2" onclick="window.rmActions.setRating(2)">
                                    <label for="star2">★</label>
                                    <input type="radio" name="rating" id="star1" value="1" onclick="window.rmActions.setRating(1)">
                                    <label for="star1">★</label>
                                </div>
                            </div>

                            <div class="rm-form-group">
                                <label class="rm-form-label">Nhận xét của bạn *</label>
                                <textarea id="rm-form-comment" class="rm-textarea" placeholder="Chia sẻ trải nghiệm của bạn..."></textarea>
                            </div>

                            <button id="rm-submit-btn" class="rm-btn-submit" onclick="window.rmActions.submitReview()">Gửi đánh giá</button>
                        </div>
                    </div>
            </div>
        `;

        renderFilters();
        loadServices();
    };

})();

