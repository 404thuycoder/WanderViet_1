/**
 * serviceManagement.js — API Integrated version
 */
(function() {
    'use strict';

    const state = {
        services: [],
        filter: 'all',
        kindFilter: 'all',
        search: '',
        editingId: null
    };

    // ── Styles ──────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        .sm-container { max-width:1400px; margin:0 auto; font-family:'Plus Jakarta Sans',sans-serif; color: #fff; }
        .sm-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
        .sm-title { font-size:28px; font-weight:900; color:#fff; }
        .sm-btn-primary { background:linear-gradient(135deg,#6366f1,#a855f7); color:white; border:none; padding:14px 28px; border-radius:14px; font-weight:700; cursor:pointer; transition:all .3s; box-shadow:0 10px 20px rgba(99,102,241,.25); font-size:15px; }
        .sm-btn-primary:hover { transform:translateY(-3px); box-shadow:0 15px 30px rgba(99,102,241,.35); }
        .sm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .sm-filters { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; background:rgba(255,255,255,0.03); backdrop-filter:blur(20px); padding:16px; border-radius:20px; border:1px solid rgba(255,255,255,0.08); }
        .sm-tabs { display:flex; gap:8px; background:rgba(255,255,255,0.05); padding:6px; border-radius:14px; }
        .sm-tab { padding:10px 20px; border-radius:10px; cursor:pointer; font-size:14px; font-weight:700; color:#94a3b8; transition:all .2s; user-select:none; }
        .sm-tab.active { background:rgba(255,255,255,0.1); color:#fff; box-shadow:0 4px 12px rgba(0,0,0,.1); }
        .sm-search { padding:12px 20px; border-radius:14px; border:1px solid rgba(255,255,255,0.1); width:280px; font-size:14px; outline:none; transition:all .2s; background:rgba(255,255,255,0.03); color:#fff; }
        .sm-search:focus { border-color:#6366f1; background:rgba(255,255,255,0.06); }

        .sm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:24px; padding-bottom:40px; }
        .sm-card { background:rgba(255,255,255,0.03); backdrop-filter:blur(20px); border-radius:16px; border:1px solid rgba(255,255,255,0.08); box-shadow:0 4px 15px rgba(0,0,0,.2); overflow:hidden; transition:all 0.3s; display:flex; flex-direction:column; position: relative; }
        .sm-card:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,.4); border-color: rgba(99,102,241,0.3); }
        .sm-card-img { width:100%; height:180px; object-fit:cover; background:#1e293b; }
        .sm-card-body { padding:20px; flex:1; display:flex; flex-direction:column; }
        .sm-card-title { font-size:17px; font-weight:800; margin-bottom:8px; color:#fff; }
        .sm-card-loc { font-size:13px; color:#94a3b8; margin-bottom:12px; font-weight:500; }
        .sm-card-price { font-size:19px; font-weight:900; color:#4ade80; margin-bottom:4px; }
        .sm-card-unit { font-size:13px; color:#94a3b8; font-weight:600; }
        .sm-card-stats { display:flex; justify-content:space-between; font-size:13px; color:#94a3b8; margin:12px 0; }
        .sm-card-actions { display:flex; gap:8px; margin-top:auto; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05); }
        .sm-btn-action { flex:1; padding:10px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#cbd5e1; transition:all .2s; }
        .sm-btn-action:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .sm-btn-action.delete { color:#f87171; }
        .sm-btn-action.delete:hover { background:rgba(239,68,68,0.1); }

        .sm-badge { padding:5px 12px; border-radius:20px; font-size:11px; font-weight:800; display:inline-block; text-transform:uppercase; }
        .sm-badge.approved { background:rgba(16,185,129,0.1); color:#34d399; }
        .sm-badge.pending { background:rgba(245,158,11,0.1); color:#fbbf24; }
        .sm-badge.rejected { background:rgba(239,68,68,0.1); color:#f87171; }
        .sm-badge.paused { background:rgba(148,163,184,0.1); color:#94a3b8; }

        .sm-modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(10px); z-index:999999; align-items:center; justify-content:center; }
        .sm-modal-overlay.active { display:flex; }
        .sm-modal { background:#111827; border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:36px; width:100%; max-width:700px; max-height:95vh; overflow-y:auto; box-shadow: 0 40px 100px rgba(0,0,0,0.5); color:#fff; }
        .sm-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px; }
        .sm-form-group { display:flex; flex-direction:column; gap:8px; }
        .sm-form-group.full { grid-column:1/-1; }
        .sm-form-label { font-size:13px; font-weight:700; color:#94a3b8; }
        .sm-form-control { padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:#fff; font-size:14px; transition:all .2s; outline:none; }
        .sm-form-control:focus { border-color:#6366f1; background:rgba(255,255,255,0.06); box-shadow:0 0 0 4px rgba(99,102,241,.1); }
        .sm-modal-actions { display:flex; gap:12px; justify-content:flex-end; }
        .sm-btn-cancel { padding:12px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); font-weight:700; cursor:pointer; color:#cbd5e1; }
        .sm-btn-cancel:hover { background:rgba(255,255,255,0.1); color:#fff; }

        .sm-empty { grid-column:1/-1; text-align:center; padding:80px; background:rgba(255,255,255,0.02); border-radius:24px; border:2px dashed rgba(255,255,255,0.1); color:#94a3b8; }

        .spinner-small { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    // ── Data Handling ───────────────────────────────────────────
    async function loadServices() {
        const grid = document.getElementById('sm-grid');
        if (grid) grid.innerHTML = '<div class="sm-empty"><div class="spinner"></div><p>Đang tải dịch vụ từ máy chủ...</p></div>';
        
        try {
            const json = await apiFetch('/api/business/places?t=' + Date.now());
            if (json.success) {
                state.services = json.data;
                renderGrid();
            } else {
                if (grid) grid.innerHTML = `<div class="sm-empty"><p style="color:#ef4444">Lỗi: ${json.message}</p></div>`;
            }
        } catch (err) {
            if (grid) grid.innerHTML = '<div class="sm-empty"><p style="color:#ef4444">Lỗi kết nối máy chủ</p></div>';
        }
    }

    // ── Utils ───────────────────────────────────────────────────
    function formatMoney(n) {
        if (!n && n !== 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN').format(n) + ' VND';
    }

    function toast(msg, type = 'success') {
        if (window.WanderUI && window.WanderUI.showToast) {
            window.WanderUI.showToast(msg, type);
        } else {
            alert(msg);
        }
    }

    function debounce(fn, ms) {
        let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    }

    // ── Compute filtered list ───────────────────────────────────
    function getFiltered() {
        let list = state.services.slice();
        if (state.filter !== 'all') {
            const statusMap = { active: 'approved', pending: 'pending', paused: 'rejected' };
            list = list.filter(s => s.status === (statusMap[state.filter] || state.filter));
        }
        if (state.kindFilter !== 'all') {
            const k = state.kindFilter;
            list = list.filter(s => {
                // Check businessCategory (new)
                if (s.businessCategory === k) return true;
                
                // Mapping legacy 'kind' to new filters
                if (k === 'dining' && s.kind === 'nha-hang') return true;
                if (k === 'stay' && s.kind === 'khach-san') return true;
                if (k === 'tour' && (s.kind === 'trai-nghiem' || s.kind === 'diem-du-lich' || s.isTour)) return true;
                if (k === 'facility' && s.kind === 'tien-ich') return true;
                
                // Direct kind match fallback
                return s.kind === k;
            });
        }
        if (state.search) {
            const q = state.search.toLowerCase();
            list = list.filter(s =>
                (s.name || '').toLowerCase().includes(q) ||
                (s.region || '').toLowerCase().includes(q)
            );
        }
        return list;
    }

    // ── Render ──────────────────────────────────────────────────
    function badge(status) {
        const map = { approved: ['approved','Hoạt động'], pending: ['pending','Chờ duyệt'], rejected: ['rejected','Bị từ chối'] };
        const [cls, label] = map[status] || ['paused', status || 'N/A'];
        return `<span class="sm-badge ${cls}">${label}</span>`;
    }

    function typeLabel(s) {
        if (s.businessCategory === 'tour' || s.isTour) return '🗺️ Tour';
        if (s.businessCategory === 'dining' || s.kind === 'nha-hang') return '🍽️ Ẩm thực';
        if (s.businessCategory === 'stay' || s.kind === 'khach-san') return '🏨 Lưu trú';
        if (s.kind === 'giai-tri') return '🎡 Giải trí';
        return '📍 Dịch vụ';
    }

    function renderGrid() {
        const grid = document.getElementById('sm-grid');
        if (!grid) return;
        const list = getFiltered();
        if (!list.length) {
            grid.innerHTML = `
                <div class="sm-empty">
                    <div style="font-size:40px;margin-bottom:16px">📭</div>
                    <h3 style="color:#475569">Không có dịch vụ nào</h3>
                    <p style="color:#94a3b8;margin-top:8px">Nhấn "+ Thêm dịch vụ mới" để bắt đầu</p>
                </div>`;
            return;
        }
        grid.innerHTML = list.map(s => {
            const img = s.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80';
            return `
            <div class="sm-card">
                <img src="${img}" class="sm-card-img" alt="${s.name}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80'">
                <div class="sm-card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                        ${badge(s.status)}
                        <span style="font-size:12px;color:#64748b;font-weight:800;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:12px">${typeLabel(s)}</span>
                    </div>
                    <h3 class="sm-card-title">${s.name}</h3>
                    <div class="sm-card-loc">📍 ${s.region || 'Chưa cập nhật'}</div>
                    <div class="sm-card-price">${formatMoney(s.priceFrom)}<span class="sm-card-unit">${s.priceTo ? ' - ' + formatMoney(s.priceTo) : ''}</span></div>
                    <div class="sm-card-stats">
                        <span>⭐ ${s.ratingAvg || '0'} (${s.reviewCount || 0})</span>
                        <span>🔥 <b>${s.bookingsCount || 0}</b> lượt đặt</span>
                    </div>
                    <div class="sm-card-actions">
                        <button class="sm-btn-action" onclick="window.smActions.edit('${s._id}')">✏️ Sửa</button>
                        <button class="sm-btn-action" style="color:#6366f1;font-weight:800" onclick="window.smActions.support('${s._id}')">💬 Hỗ trợ</button>
                        <button class="sm-btn-action delete" onclick="window.smActions.delete('${s._id}')">🗑️</button>
                    </div>
                </div>
                ${s.rejectionReason ? `<div style="padding:10px; background:rgba(239,68,68,0.1); color:#f87171; font-size:11px; border-top:1px solid rgba(239,68,68,0.2)">Lý do từ chối: ${s.rejectionReason}</div>` : ''}
            </div>`;
        }).join('');
    }

    // ── Actions ─────────────────────────────────────────────────
    window.smActions = {
        async delete(id) {
            if (!confirm('🚨 Bạn có chắc muốn xóa dịch vụ này khỏi hệ thống?')) return;
            try {
                const res = await apiFetch(`/api/business/places/${id}`, { method: 'DELETE' });
                if (res.success) {
                    toast('Đã xóa dịch vụ');
                    loadServices();
                } else {
                    toast(res.message, 'error');
                }
            } catch (err) {
                toast('Lỗi kết nối', 'error');
            }
        },

        edit(id) {
            state.editingId = id;
            const svc = state.services.find(s => s._id === id);
            if (!svc) return;
            
            const eliteModal = document.getElementById('add-svc-overlay');
            if (eliteModal) {
                document.body.classList.remove('is-logging-in');
                
                // Populate Elite form
                document.querySelector('.svc-modal-title').textContent = '✏️ Chỉnh sửa dịch vụ';
                if(document.getElementById('svc-name')) document.getElementById('svc-name').value = svc.name || '';
                if(document.getElementById('svc-kind')) document.getElementById('svc-kind').value = svc.kind || 'diem-du-lich';
                if(document.getElementById('svc-businessCategory')) document.getElementById('svc-businessCategory').value = svc.businessCategory || 'other';
                if(document.getElementById('svc-price')) document.getElementById('svc-price').value = svc.priceFrom || '';
                if(document.getElementById('svc-price-to')) document.getElementById('svc-price-to').value = svc.priceTo || '';
                if(document.getElementById('svc-region')) document.getElementById('svc-region').value = svc.region || '';
                if(document.getElementById('svc-city')) document.getElementById('svc-city').value = svc.city || '';
                if(document.getElementById('svc-address')) document.getElementById('svc-address').value = svc.address || '';
                if(document.getElementById('svc-phone')) document.getElementById('svc-phone').value = svc.contactPhone || '';
                if(document.getElementById('svc-email')) document.getElementById('svc-email').value = svc.contactEmail || '';
                if(document.getElementById('svc-website')) document.getElementById('svc-website').value = svc.website || '';
                if(document.getElementById('svc-open-time')) document.getElementById('svc-open-time').value = svc.openTime || '';
                if(document.getElementById('svc-close-time')) document.getElementById('svc-close-time').value = svc.closeTime || '';
                if(document.getElementById('svc-image')) document.getElementById('svc-image').value = svc.image || '';
                if(document.getElementById('svc-desc')) document.getElementById('svc-desc').value = svc.description || '';
                if(document.getElementById('svc-overview')) document.getElementById('svc-overview').value = svc.overview || '';
                if(document.getElementById('svc-video')) document.getElementById('svc-video').value = svc.videoUrl || '';
                if(document.getElementById('svc-tags') && Array.isArray(svc.tags)) document.getElementById('svc-tags').value = svc.tags.join(', ');
                if(document.getElementById('svc-visit-duration')) document.getElementById('svc-visit-duration').value = svc.visitDuration || '';
                if(document.getElementById('svc-crowd-level')) document.getElementById('svc-crowd-level').value = svc.crowdLevel || 'medium';
                if(document.getElementById('svc-cost-level')) document.getElementById('svc-cost-level').value = svc.costLevel || 'standard';
                if(document.getElementById('svc-suitability') && Array.isArray(svc.suitability)) document.getElementById('svc-suitability').value = svc.suitability.join(', ');
                if(document.getElementById('svc-best-time')) document.getElementById('svc-best-time').value = svc.bestTimeToVisit || '';
                if(document.getElementById('svc-best-season')) document.getElementById('svc-best-season').value = svc.bestSeason || '';
                if(document.getElementById('svc-internet')) document.getElementById('svc-internet').value = svc.internetQuality || 'fair';
                if(document.getElementById('svc-parking')) document.getElementById('svc-parking').value = svc.parking || 'none';
                
                // Map/GPS
                if(document.getElementById('svc-lat')) document.getElementById('svc-lat').value = (svc.gpsCoordinates && svc.gpsCoordinates.lat) || svc.lat || '';
                if(document.getElementById('svc-lng')) document.getElementById('svc-lng').value = (svc.gpsCoordinates && svc.gpsCoordinates.lng) || svc.lng || '';

                
                // SEO
                if (svc.seo) {
                    if(document.getElementById('svc-meta-title')) document.getElementById('svc-meta-title').value = svc.seo.metaTitle || '';
                    if(document.getElementById('svc-meta-desc')) document.getElementById('svc-meta-desc').value = svc.seo.metaDescription || '';
                    if(document.getElementById('svc-keywords') && Array.isArray(svc.seo.keywords)) document.getElementById('svc-keywords').value = svc.seo.keywords.join(', ');
                }

                // Checkboxes & Tour
                const chkTour = document.getElementById('svc-is-tour');
                if(chkTour) {
                    chkTour.checked = !!svc.isTour;
                    const tourFields = document.getElementById('tour-fields');
                    if (tourFields) tourFields.style.display = chkTour.checked ? 'flex' : 'none';
                    if (svc.isTour) {
                        if(document.getElementById('svc-duration')) document.getElementById('svc-duration').value = svc.tourDuration || '';
                        if(document.getElementById('svc-diff')) document.getElementById('svc-diff').value = svc.tourDifficulty || 'easy';
                    }
                }
                
                // Highlights
                const hlList = document.getElementById('highlight-list');
                if (hlList) {
                    hlList.innerHTML = '';
                    if (Array.isArray(svc.highlights)) {
                        svc.highlights.forEach(hl => {
                            const div = document.createElement('div');
                            div.className = 'builder-item';
                            div.innerHTML = `<input type="text" value="${hl.replace(/"/g,'&quot;')}" class="hl-input"><span class="builder-btn-remove">✕</span>`;
                            div.querySelector('.builder-btn-remove').onclick = () => div.remove();
                            hlList.appendChild(div);
                        });
                    }
                }
                
                // Amenities
                if (Array.isArray(svc.amenities)) {
                    document.querySelectorAll('.amenity-card').forEach(card => {
                        if (svc.amenities.includes(card.dataset.value)) card.classList.add('selected');
                        else card.classList.remove('selected');
                    });
                }

                // Tour Itinerary (Day-by-Day)
                const tourItList = document.getElementById('itinerary-list');
                if (tourItList) {
                    tourItList.innerHTML = '';
                    if (Array.isArray(svc.tourItinerary)) {
                        svc.tourItinerary.forEach((item, idx) => {
                            const div = document.createElement('div');
                            div.className = 'builder-item';
                            div.innerHTML = `
                              <b style="font-size:12px; color:#6366f1; width:50px;">Ngày ${item.day || (idx + 1)}</b>
                              <input type="text" value="${(item.title||'').replace(/"/g,'&quot;')}" class="it-title">
                              <input type="text" value="${(item.detail||'').replace(/"/g,'&quot;')}" class="it-desc">
                              <span class="builder-btn-remove">✕</span>
                            `;
                            div.querySelector('.builder-btn-remove').onclick = () => div.remove();
                            tourItList.appendChild(div);
                        });
                    }
                }

                // Suggested Itineraries (Multi-Plan Builder)
                const plansContainer = document.getElementById('itinerary-plans-container');
                if (plansContainer) {
                    plansContainer.innerHTML = '';
                    if (Array.isArray(svc.suggestedItineraries)) {
                        svc.suggestedItineraries.forEach(plan => {
                            const block = document.createElement('div');
                            block.className = 'sug-plan-block';
                            block.style.cssText = 'background:rgba(99,102,241,0.07);border:1.5px solid rgba(99,102,241,0.25);border-radius:14px;padding:16px;margin-bottom:16px;';
                            block.innerHTML = `
                              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                                  <select class="plan-type" style="background:rgba(0,0,0,0.3);border:1px solid rgba(99,102,241,0.4);color:#c4b5fd;padding:7px 12px;border-radius:8px;font-size:13px;font-weight:700;">
                                    <option value="couple" ${plan.type==='couple'?'selected':''}>💕 Cặp đôi</option>
                                    <option value="family" ${plan.type==='family'?'selected':''}>👨‍👩‍👧 Gia đình</option>
                                    <option value="budget" ${plan.type==='budget'?'selected':''}>💰 Tiết kiệm</option>
                                    <option value="luxury" ${plan.type==='luxury'?'selected':''}>✨ Sang trọng</option>
                                    <option value="solo" ${plan.type==='solo'?'selected':''}>🧘 Solo</option>
                                    <option value="group" ${plan.type==='group'?'selected':''}>👥 Nhóm bạn</option>
                                  </select>
                                  <select class="plan-duration" style="background:rgba(0,0,0,0.3);border:1px solid rgba(99,102,241,0.4);color:#c4b5fd;padding:7px 12px;border-radius:8px;font-size:13px;font-weight:700;">
                                    <option value="1" ${plan.duration==='1 ngày'?'selected':''}>1 ngày</option>
                                    <option value="2" ${plan.duration==='2 ngày'?'selected':''}>2 ngày</option>
                                    <option value="3" ${plan.duration==='3 ngày'?'selected':''}>3 ngày</option>
                                  </select>
                                  <input type="text" class="plan-name" value="${(plan.name||'').replace(/"/g,'&quot;')}" placeholder="Tên kế hoạch" style="flex:1;min-width:200px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 12px;border-radius:8px;font-size:13px;">
                                </div>
                                <button type="button" onclick="this.closest('.sug-plan-block').remove()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:8px;padding:7px 12px;cursor:pointer;font-size:12px;white-space:nowrap;">🗑 Xóa kế hoạch</button>
                              </div>
                              <div class="plan-steps-list" style="display:flex;flex-direction:column;"></div>
                              <button type="button" class="btn-add-step" style="margin-top:10px;width:100%;padding:9px;background:rgba(99,102,241,0.1);border:1.5px dashed rgba(99,102,241,0.4);border-radius:10px;color:#a5b4fc;font-size:12px;font-weight:700;cursor:pointer;transition:0.2s;">＋ Thêm hoạt động</button>
                            `;
                            
                            const stepsList = block.querySelector('.plan-steps-list');
                            if (Array.isArray(plan.timeline)) {
                                plan.timeline.forEach(step => {
                                    const row = document.createElement('div');
                                    row.className = 'sug-step-item';
                                    row.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;margin-bottom:8px;';
                                    row.innerHTML = `
                                      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
                                        <input type="text" class="sug-time" value="${(step.time||'').replace(/"/g,'&quot;')}" placeholder="08:00" style="width:70px;flex:none;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
                                        <input type="text" class="sug-activity" value="${(step.activity||'').replace(/"/g,'&quot;')}" placeholder="Tên hoạt động" style="flex:1;min-width:180px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
                                        <button type="button" onclick="this.closest('.sug-step-item').remove()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:12px;">✕ Xóa</button>
                                      </div>
                                      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                                        <input type="text" class="sug-location" value="${(step.location||'').replace(/"/g,'&quot;')}" placeholder="📍 Địa điểm..." style="flex:1;min-width:150px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
                                        <input type="text" class="sug-tips" value="${(step.tips||'').replace(/"/g,'&quot;')}" placeholder="💡 Mẹo..." style="flex:1;min-width:150px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
                                      </div>
                                      <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                        <input type="text" class="sug-img" value="${(step.image||'').replace(/"/g,'&quot;')}" placeholder="🖼️ URL ảnh" style="flex:1;min-width:200px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:12px;">
                                        <textarea class="sug-desc" placeholder="📝 Mô tả..." rows="2" style="flex:2;min-width:200px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:12px;resize:vertical;">${step.description||''}</textarea>
                                      </div>
                                    `;
                                    stepsList.appendChild(row);
                                });
                            }
                            
                            block.querySelector('.btn-add-step').onclick = () => {
                                const row = document.createElement('div');
                                row.className = 'sug-step-item';
                                row.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;margin-bottom:8px;';
                                row.innerHTML = `
                                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
                                    <input type="text" class="sug-time" placeholder="08:00" style="width:70px;flex:none;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
                                    <input type="text" class="sug-activity" placeholder="Tên hoạt động" style="flex:1;min-width:180px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
                                    <button type="button" onclick="this.closest('.sug-step-item').remove()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:12px;">✕ Xóa</button>
                                  </div>
                                `;
                                stepsList.appendChild(row);
                            };
                            
                            plansContainer.appendChild(block);
                        });
                    }
                }

                // Images & Gallery Previews
                const primaryPreview = document.getElementById('svc-primary-preview');
                const mainImgInput = document.getElementById('svc-image');
                if (primaryPreview) {
                    primaryPreview.innerHTML = '';
                    if (svc.image) {
                        const div = document.createElement('div');
                        div.className = 'preview-item';
                        div.innerHTML = `<img src="${svc.image}"><button type="button" class="remove-btn">&times;</button>`;
                        div.querySelector('.remove-btn').onclick = () => {
                            div.remove();
                            if (mainImgInput) mainImgInput.value = '';
                        };
                        primaryPreview.appendChild(div);
                    }
                }

                const galleryPreview = document.getElementById('svc-gallery-preview');
                const galleryInput = document.getElementById('svc-imgs');
                if (galleryPreview) {
                    galleryPreview.innerHTML = '';
                    // Try to use modern 'gallery' array first, fallback to 'images'
                    const items = (Array.isArray(svc.gallery) && svc.gallery.length > 0) ? svc.gallery : (Array.isArray(svc.images) ? svc.images.map(url => ({ url, category: 'other' })) : []);
                    
                    items.forEach(item => {
                        const url = typeof item === 'string' ? item : item.url;
                        const category = item.category || 'other';
                        const isVideo = url.toLowerCase().match(/\.(mp4|webm|mov)$/) || item.type === 'video';
                        
                        const div = document.createElement('div');
                        div.className = 'preview-item';
                        div.innerHTML = `
                            <img src="${url}">
                            <button type="button" class="remove-btn">&times;</button>
                            <select class="gallery-tag-select">
                                <option value="other" ${category==='other'?'selected':''}>🏷️ Phân loại</option>
                                <option value="view" ${['view','nature','space'].includes(category)?'selected':''}>🌅 Cảnh quan & Không gian</option>
                                <option value="dining" ${['dining','food','menu'].includes(category)?'selected':''}>🍴 Ẩm thực & Thực đơn</option>
                                <option value="service" ${['service','room','amenity'].includes(category)?'selected':''}>✨ Dịch vụ & Tiện ích</option>
                                <option value="activity" ${category==='activity'?'selected':''}>🛶 Hoạt động & Trải nghiệm</option>
                                <option value="customer" ${category==='customer'?'selected':''}>📸 Nội dung từ khách hàng</option>
                                <option value="video" ${isVideo || category==='video' ? 'selected' : ''}>🎥 Video</option>
                            </select>
                        `;
                        div.querySelector('.remove-btn').onclick = () => div.remove();
                        galleryPreview.appendChild(div);
                    });
                }

                // Gallery Textarea
                if (galleryInput && Array.isArray(svc.images)) {
                    galleryInput.value = svc.images.join(', ');
                }

                // Reset global file trackers to avoid carry-over
                window.svcSelectedFiles = [];
                window.svcGalleryFiles = [];

                // Experiences
                const expList = document.getElementById('experience-list');
                if (expList) {
                    expList.innerHTML = '';
                    if (Array.isArray(svc.experiences)) {
                        svc.experiences.forEach(exp => {
                            const div = document.createElement('div');
                            div.className = 'builder-item';
                            div.style.flexDirection = 'column';
                            div.style.alignItems = 'stretch';
                            div.innerHTML = `
                              <input type="text" value="${(exp.title||'').replace(/"/g,'&quot;')}" class="exp-title" style="margin-bottom:8px;">
                              <textarea class="exp-desc" style="margin-bottom:8px; height:60px; resize:none; padding:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">${exp.description||''}</textarea>
                              <div style="display:flex; gap:8px;">
                                <input type="text" value="${(exp.icon||'').replace(/"/g,'&quot;')}" class="exp-icon" style="width:60px;">
                                <input type="text" value="${(exp.difficulty||'').replace(/"/g,'&quot;')}" class="exp-diff" style="width:80px;">
                                <input type="text" value="${(exp.duration||'').replace(/"/g,'&quot;')}" class="exp-duration" style="flex:1;">
                                <input type="number" value="${exp.priceEstimate||''}" class="exp-price" style="flex:1;">
                              </div>
                              <span class="builder-btn-remove" style="align-self:flex-end; margin-top:8px;">✕</span>
                            `;
                            div.querySelector('.builder-btn-remove').onclick = () => div.remove();
                            expList.appendChild(div);
                        });
                    }
                }

                // FAQs
                const faqList = document.getElementById('faq-list');
                if (faqList) {
                    faqList.innerHTML = '';
                    if (Array.isArray(svc.faqs)) {
                        svc.faqs.forEach(faq => {
                            const div = document.createElement('div');
                            div.className = 'builder-item';
                            div.style.flexDirection = 'column';
                            div.style.alignItems = 'stretch';
                            div.innerHTML = `
                              <input type="text" value="${(faq.question||'').replace(/"/g,'&quot;')}" class="faq-question" style="margin-bottom:8px;">
                              <input type="text" value="${(faq.answer||'').replace(/"/g,'&quot;')}" class="faq-answer">
                              <span class="builder-btn-remove" style="align-self:flex-end; margin-top:8px;">✕</span>
                            `;
                            div.querySelector('.builder-btn-remove').onclick = () => div.remove();
                            faqList.appendChild(div);
                        });
                    }
                }

                // Safety Tips
                const safetyList = document.getElementById('safety-list');
                if (safetyList) {
                    safetyList.innerHTML = '';
                    if (Array.isArray(svc.safetyTips)) {
                        svc.safetyTips.forEach(s => {
                            const div = document.createElement('div');
                            div.className = 'builder-item';
                            div.style.flexDirection = 'column';
                            div.style.alignItems = 'stretch';
                            div.innerHTML = `
                              <div style="display:flex; gap:10px; margin-bottom:8px;">
                                <input type="text" value="${(s.title||'').replace(/"/g,'&quot;')}" class="safety-title" style="flex:1;">
                                <select class="safety-severity" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:8px; padding:0 8px;">
                                  <option value="low" ${s.severity==='low'?'selected':''}>🟢 Nhẹ</option>
                                  <option value="medium" ${s.severity==='medium'?'selected':''}>🟡 Trung bình</option>
                                  <option value="high" ${s.severity==='high'?'selected':''}>🔴 Nghiêm trọng</option>
                                </select>
                              </div>
                              <textarea class="safety-desc" style="height:60px; resize:none; padding:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:12px;">${s.description||''}</textarea>
                              <span class="builder-btn-remove" style="align-self:flex-end; margin-top:8px;">✕ Xóa cảnh báo</span>
                            `;
                            div.querySelector('.builder-btn-remove').onclick = () => div.remove();
                            safetyList.appendChild(div);
                        });
                    }
                }

                // Bring & Avoid
                const bringList = document.getElementById('bring-list');
                if (bringList) {
                    bringList.innerHTML = '';
                    if (Array.isArray(svc.whatToBring)) {
                        svc.whatToBring.forEach(b => {
                            const div = document.createElement('div');
                            div.className = 'builder-item';
                            div.innerHTML = `<input type="text" value="${b.replace(/"/g,'&quot;')}" class="bring-input"><span class="builder-btn-remove">✕</span>`;
                            div.querySelector('.builder-btn-remove').onclick = () => div.remove();
                            bringList.appendChild(div);
                        });
                    }
                }
                const avoidList = document.getElementById('avoid-list');
                if (avoidList) {
                    avoidList.innerHTML = '';
                    if (Array.isArray(svc.whatNotToDo)) {
                        svc.whatNotToDo.forEach(b => {
                            const div = document.createElement('div');
                            div.className = 'builder-item';
                            div.innerHTML = `<input type="text" value="${b.replace(/"/g,'&quot;')}" class="avoid-input"><span class="builder-btn-remove">✕</span>`;
                            div.querySelector('.builder-btn-remove').onclick = () => div.remove();
                            avoidList.appendChild(div);
                        });
                    }
                }

                // Setup submit button
                const btnSubmit = document.getElementById('add-svc-submit-btn');
                if (btnSubmit) {
                    btnSubmit.textContent = 'Lưu thay đổi';
                    btnSubmit.dataset.editId = id;
                }

                eliteModal.classList.add('is-open');
                if (window.initEliteMap) window.initEliteMap();
            } else {
                // Fallback Legacy modal
                document.getElementById('sm-modal-title').textContent = '✏️ Chỉnh sửa dịch vụ';
                document.getElementById('sm-form-name').value = svc.name || '';
                document.getElementById('sm-form-kind').value = svc.kind || 'diem-du-lich';
                document.getElementById('sm-form-region').value = svc.region || '';
                document.getElementById('sm-form-address').value = svc.address || '';
                document.getElementById('sm-form-priceFrom').value = svc.priceFrom || '';
                document.getElementById('sm-form-image').value = svc.image || '';
                document.getElementById('sm-form-description').value = svc.description || '';
                document.getElementById('sm-form-highlights').value = Array.isArray(svc.highlights) ? svc.highlights.join('\n') : (svc.highlights || '');
                document.getElementById('sm-form-policy').value = svc.policy || '';
                document.getElementById('sm-form-businessCategory').value = svc.businessCategory || 'other';
                document.getElementById('sm-form-isTour').checked = !!svc.isTour;
                document.getElementById('sm-modal-wrapper').classList.add('active');
            }
        },

        add() {
            const eliteModal = document.getElementById('add-svc-overlay');
            if (eliteModal) {
                // Remove is-logging-in class to enable clicks
                document.body.classList.remove('is-logging-in');
                eliteModal.classList.add('is-open');
                if (window.initEliteMap) window.initEliteMap();
            } else {
                state.editingId = null;
                document.getElementById('sm-modal-title').textContent = '✨ Thêm dịch vụ mới';
                const formIds = ['sm-form-name','sm-form-region','sm-form-address','sm-form-priceFrom','sm-form-image','sm-form-description', 'sm-form-highlights', 'sm-form-policy'];
                formIds.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                document.getElementById('sm-form-kind').value = 'diem-du-lich';
                document.getElementById('sm-form-businessCategory').value = 'other';
                document.getElementById('sm-form-isTour').checked = false;
                document.getElementById('sm-modal-wrapper').classList.add('active');
            }
        },

        closeModal() {
            document.getElementById('sm-modal-wrapper').classList.remove('active');
        },

        async save() {
            const btn = document.querySelector('.sm-modal-actions .sm-btn-primary');
            const originalHtml = btn.innerHTML;
            
            const name = document.getElementById('sm-form-name').value.trim();
            const region = document.getElementById('sm-form-region').value.trim();
            if (!name || !region) {
                toast('⚠️ Vui lòng điền Tên và Khu vực!', 'error'); return;
            }

            btn.innerHTML = '<div class="spinner" style="width:16px;height:16px"></div>';
            btn.disabled = true;

            const payload = new FormData();
            payload.append('name', name);
            payload.append('kind', document.getElementById('sm-form-kind').value);
            payload.append('region', region);
            payload.append('address', document.getElementById('sm-form-address').value.trim());
            payload.append('priceFrom', Number(document.getElementById('sm-form-priceFrom').value) || 0);
            payload.append('image', document.getElementById('sm-form-image').value.trim());
            payload.append('description', document.getElementById('sm-form-description').value.trim());
            payload.append('businessCategory', document.getElementById('sm-form-businessCategory').value);
            payload.append('isTour', document.getElementById('sm-form-isTour').checked);
            
            const highlightsText = document.getElementById('sm-form-highlights').value.trim();
            if (highlightsText) {
                highlightsText.split('\n').filter(l => l.trim()).forEach(h => payload.append('highlights', h.trim()));
            }
            
            payload.append('policy', document.getElementById('sm-form-policy').value.trim());
            
            const fileInput = document.getElementById('sm-form-image-file');
            if (fileInput && fileInput.files.length > 0) {
                Array.from(fileInput.files).forEach(f => {
                    payload.append('imageFile', f);
                });
            }

            const token = window.getAuthToken ? window.getAuthToken() : (localStorage.getItem('biz_auth_token') || sessionStorage.getItem('biz_auth_token') || localStorage.getItem('wander_business_token'));

            try {
                const url = state.editingId ? `/api/business/places/${state.editingId}` : '/api/business/places';
                const res = await fetch(url, {
                    method: state.editingId ? 'PUT' : 'POST',
                    headers: { 'x-auth-token': token },
                    body: payload
                }).then(r => r.json());

                if (res.success) {
                    toast(state.editingId ? 'Cập nhật thành công' : 'Đã gửi yêu cầu phê duyệt', 'success');
                    window.smActions.closeModal();
                    loadServices();
                } else {
                    toast(res.message || 'Lỗi lưu dữ liệu', 'error');
                }
            } catch (err) {
                toast('Lỗi kết nối máy chủ', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        },
        
        previewImages(input) {
            const preview = document.getElementById('sm-form-image-preview');
            preview.innerHTML = '';
            if (!input.files || input.files.length === 0) return;
            Array.from(input.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML += `<div style="position:relative; width:60px; height:60px; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1)">
                        <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">
                    </div>`;
                };
                reader.readAsDataURL(file);
            });
        },
        
        support(id) {
            if (window.ChatBox) {
                const svc = state.services.find(s => s._id === id);
                window.ChatBox.open(id, svc ? svc.name : 'Dịch vụ');
            } else {
                toast('Chức năng hỗ trợ đang khởi tạo...', 'info');
            }
        }
    };

    // ── Bootstrap ───────────────────────────────────────────────
    window.initServiceManagement = function() {
        const wrapper = document.getElementById('service-mgmt-container');
        if (!wrapper) return;

        wrapper.innerHTML = `
        <div class="sm-container">
            <div class="sm-header">
                <div>
                    <h2 class="sm-title">Quản lý dịch vụ</h2>
                    <p style="color:#94a3b8; font-size:14px; margin-top:4px">Đăng tải và quản lý các sản phẩm du lịch của bạn trên WanderViệt.</p>
                </div>
                <button class="sm-btn-primary" onclick="window.smActions.add()">+ Thêm dịch vụ mới</button>
            </div>
            <div class="sm-filters" style="flex-direction:column; align-items:flex-start; gap:20px;">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center; flex-wrap:wrap; gap:16px;">
                    <div class="sm-tabs" id="sm-tabs">
                        <div class="sm-tab active" data-filter="all">Tất cả trạng thái</div>
                        <div class="sm-tab" data-filter="active">Đang hoạt động</div>
                        <div class="sm-tab" data-filter="pending">Chờ duyệt</div>
                        <div class="sm-tab" data-filter="paused">Bị từ chối</div>
                    </div>
                    <input type="text" class="sm-search" id="sm-search-input" placeholder="🔍 Tìm kiếm tên, địa điểm...">
                </div>
                <div class="sm-tabs" id="sm-kind-tabs" style="background:transparent; padding:0; gap:12px;">
                    <div class="sm-tab active" data-kind="all" style="border:1px solid rgba(255,255,255,0.1)">🌐 Tất cả loại hình</div>
                    <div class="sm-tab" data-kind="dining" style="border:1px solid rgba(255,255,255,0.1)">🍽️ Ẩm thực / Nhà hàng</div>
                    <div class="sm-tab" data-kind="stay" style="border:1px solid rgba(255,255,255,0.1)">🏨 Khách sạn / Stay</div>
                    <div class="sm-tab" data-kind="tour" style="border:1px solid rgba(255,255,255,0.1)">🗺️ Tour / Trải nghiệm</div>
                    <div class="sm-tab" data-kind="facility" style="border:1px solid rgba(255,255,255,0.1)">⚙️ Tiện ích</div>
                </div>
            </div>
            <div class="sm-grid" id="sm-grid"></div>

            <div class="sm-modal-overlay" id="sm-modal-wrapper">
                <div class="sm-modal">
                    <h3 id="sm-modal-title" style="font-size:22px;font-weight:900;margin-bottom:28px;color:#fff"></h3>
                    <div class="sm-form-grid">
                        <div class="sm-form-group full">
                            <label class="sm-form-label">Tên dịch vụ *</label>
                            <input type="text" id="sm-form-name" class="sm-form-control" placeholder="Ví dụ: Tour Hạ Long 5 Sao VIP">
                        </div>
                        <div class="sm-form-group">
                            <label class="sm-form-label">Phân loại</label>
                            <select id="sm-form-kind" class="sm-form-control">
                                <option value="diem-du-lich">🏛️ Điểm tham quan</option>
                                <option value="trai-nghiem">🎨 Trải nghiệm</option>
                                <option value="khach-san">🏨 Lưu trú Elite</option>
                                <option value="nha-hang">🥘 Ẩm thực & Giải trí</option>
                                <option value="giai-tri">🎡 Giải trí</option>
                                <option value="tien-ich">⚙️ Tiện ích</option>
                            </select>
                        </div>
                        <div class="sm-form-group">
                            <label class="sm-form-label">Nhóm quản lý (Category)</label>
                            <select id="sm-form-businessCategory" class="sm-form-control">
                                <option value="dining">🍽️ Ẩm thực (Dining)</option>
                                <option value="stay">🏨 Lưu trú (Stay)</option>
                                <option value="tour">🗺️ Tour & Trải nghiệm</option>
                                <option value="facility">⚙️ Tiện ích & Cơ sở vật chất</option>
                                <option value="other">📦 Khác</option>
                            </select>
                        </div>
                        <div class="sm-form-group" style="flex-direction:row; align-items:center; gap:10px; margin-top:25px">
                            <input type="checkbox" id="sm-form-isTour" style="width:18px;height:18px">
                            <label class="sm-form-label" for="sm-form-isTour" style="margin:0">Đây là một Tour du lịch</label>
                        </div>
                        <div class="sm-form-group">
                            <label class="sm-form-label">Khu vực (Tỉnh/Thành phố) *</label>
                            <input type="text" id="sm-form-region" class="sm-form-control" placeholder="Ví dụ: Quảng Ninh">
                        </div>
                        <div class="sm-form-group">
                            <label class="sm-form-label">Địa chỉ chi tiết</label>
                            <input type="text" id="sm-form-address" class="sm-form-control" placeholder="Số nhà, tên đường...">
                        </div>
                        <div class="sm-form-group">
                            <label class="sm-form-label">Giá khởi điểm (VNĐ)</label>
                            <input type="number" id="sm-form-priceFrom" class="sm-form-control" placeholder="Ví dụ: 2500000">
                        </div>
                        <div class="sm-form-group full">
                            <label class="sm-form-label">Hình ảnh dịch vụ</label>
                            <div style="display:flex; flex-direction:column; gap:10px;">
                                <input type="text" id="sm-form-image" class="sm-form-control" placeholder="Dán link ảnh đại diện chính (unsplash, google...)">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-size:12px; color:#94a3b8;">Hoặc tải nhiều ảnh từ thiết bị:</span>
                                    <button class="sm-btn-action" style="background:rgba(255,255,255,0.05); color:#fff; padding:8px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; font-size:12px;" onclick="document.getElementById('sm-form-image-file').click()">📸 Chọn ảnh</button>
                                    <input type="file" id="sm-form-image-file" accept="image/*" multiple hidden onchange="window.smActions.previewImages(this)">
                                </div>
                                <div id="sm-form-image-preview" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:5px; min-height: 40px;"></div>
                            </div>
                        </div>
                        <div class="sm-form-group full">
                            <label class="sm-form-label">Mô tả dịch vụ</label>
                            <textarea id="sm-form-description" class="sm-form-control" style="height:120px;resize:none" placeholder="Nhập mô tả chi tiết để thu hút khách hàng..."></textarea>
                        </div>
                        <div class="sm-form-group full">
                            <label class="sm-form-label">Điểm nổi bật (Highlights) - Mỗi dòng một ý</label>
                            <textarea id="sm-form-highlights" class="sm-form-control" style="height:80px;resize:none" placeholder="Ví dụ: &#10;Miễn phí nước suối&#10;Xe Limousine đời mới..."></textarea>
                        </div>
                        <div class="sm-form-group full">
                            <label class="sm-form-label">Chính sách hoàn hủy & Quy định</label>
                            <textarea id="sm-form-policy" class="sm-form-control" style="height:80px;resize:none" placeholder="Nhập các quy định về việc hủy đơn, trả phòng..."></textarea>
                        </div>
                    </div>
                    <div class="sm-modal-actions">
                        <button class="sm-btn-cancel" onclick="window.smActions.closeModal()">Hủy bỏ</button>
                        <button class="sm-btn-primary" onclick="window.smActions.save()">Lưu & Gửi phê duyệt</button>
                    </div>
                </div>
            </div>
        </div>`;

        // Events
        document.getElementById('sm-search-input').addEventListener('input', debounce(e => {
            state.search = e.target.value; renderGrid();
        }, 250));

        document.querySelectorAll('#sm-tabs .sm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#sm-tabs .sm-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.filter = tab.dataset.filter;
                renderGrid();
            });
        });

        document.querySelectorAll('#sm-kind-tabs .sm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#sm-kind-tabs .sm-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.kindFilter = tab.dataset.kind;
                renderGrid();
            });
        });

        loadServices();
        checkAndSyncLegacyData();

        // Listen for new service additions from other forms (like Elite form)
        window.addEventListener('svc-added', () => {
            loadServices();
        });
    };

    async function checkAndSyncLegacyData() {
        const LS_KEY = 'biz_services';
        const legacyData = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        if (legacyData.length === 0) return;

        console.log('Detected legacy local data, syncing to server...', legacyData);
        // Removed intrusive alert/toast

        let successCount = 0;
        for (const item of legacyData) {
            try {
                // Map legacy fields to new fields
                const payload = {
                    name: item.name,
                    kind: item.category === 'tour' ? 'diem-du-lich' : (item.category === 'hotel' ? 'khach-san' : 'nha-hang'),
                    region: item.location || 'Chưa rõ',
                    address: item.location || '',
                    priceFrom: item.price || 0,
                    image: item.image || '',
                    description: item.desc || '',
                    isTour: item.category === 'tour',
                    status: 'pending',
                    source: 'partner'
                };

                const res = await apiFetch('/api/business/places', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (res.success) successCount++;
            } catch (e) {
                console.error('Failed to sync item:', item, e);
            }
        }

        if (successCount > 0) {
            console.log(`Successfully synced ${successCount} legacy services.`);
            localStorage.removeItem(LS_KEY); // Clean up
            loadServices();
        }
    }

})();

