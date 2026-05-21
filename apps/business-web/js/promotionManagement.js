/**
 * Business Promotion Management Module
 * Quản lý mã khuyến mãi cho Business Portal
 */
(function() {
  'use strict';

  function getToken() {
    return localStorage.getItem('biz_auth_token') || 
           localStorage.getItem('wander_business_token') ||
           sessionStorage.getItem('biz_auth_token') ||
           sessionStorage.getItem('wander_business_token') ||
           localStorage.getItem('token');
  }

  async function apiFetch(url, opts = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['x-auth-token'] = token;
    const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
    return res.json();
  }

  let bizPlaces = []; // Cache places for scope selector

  async function loadBizPlaces() {
    if (bizPlaces.length > 0) return bizPlaces;
    try {
      const res = await apiFetch('/api/services/places');
      if (res.success) bizPlaces = res.data || [];
    } catch(e) {}
    return bizPlaces;
  }

  // ── Render Promotions View ──
  async function renderPromotions() {
    const container = document.getElementById('promo-mgmt-container');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2rem">
        <div>
          <h2 style="font-size:1.6rem;font-weight:800;color:#fff;margin:0">Mã khuyến mãi</h2>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9rem">Tạo và quản lý mã giảm giá cho dịch vụ của bạn. Chi phí giảm giá trích từ doanh thu.</p>
        </div>
        <button class="biz-promo-add-btn" onclick="window.BizPromo.showModal()" style="background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;padding:12px 24px;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 10px 30px rgba(99,102,241,0.3);display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">+</span> Tạo mã mới
        </button>
      </div>

      <!-- Stats Row -->
      <div id="promo-stats-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem">
        <div class="card" style="padding:1.25rem;text-align:center">
          <div style="font-size:0.75rem;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1px">Tổng mã</div>
          <div id="ps-total" style="font-size:1.8rem;font-weight:800;color:#fff;margin-top:4px">0</div>
        </div>
        <div class="card" style="padding:1.25rem;text-align:center">
          <div style="font-size:0.75rem;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1px">Đang hoạt động</div>
          <div id="ps-active" style="font-size:1.8rem;font-weight:800;color:#10b981;margin-top:4px">0</div>
        </div>
        <div class="card" style="padding:1.25rem;text-align:center">
          <div style="font-size:0.75rem;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1px">Lượt sử dụng</div>
          <div id="ps-uses" style="font-size:1.8rem;font-weight:800;color:#38bdf8;margin-top:4px">0</div>
        </div>
        <div class="card" style="padding:1.25rem;text-align:center">
          <div style="font-size:0.75rem;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1px">Đã tài trợ</div>
          <div id="ps-spent" style="font-size:1.8rem;font-weight:800;color:#f59e0b;margin-top:4px">0đ</div>
        </div>
      </div>

      <!-- Voucher Table -->
      <div class="card" style="padding:0;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:rgba(255,255,255,0.02)">
              <th style="text-align:left;padding:14px 20px;color:#64748b;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.05)">Mã / Chương trình</th>
              <th style="text-align:left;padding:14px 16px;color:#64748b;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.05)">Giá trị</th>
              <th style="text-align:left;padding:14px 16px;color:#64748b;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.05)">Lượt dùng / Hạn</th>
              <th style="text-align:right;padding:14px 20px;color:#64748b;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.05)">Hành động</th>
            </tr>
          </thead>
          <tbody id="promo-tbody">
            <tr><td colspan="4" style="text-align:center;padding:3rem;color:#94a3b8">Đang tải...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    await loadVoucherList();
    await loadStats();
  }

  async function loadStats() {
    try {
      const res = await apiFetch('/api/vouchers/business/stats');
      if (res.success) {
        const d = res.data;
        const el = (id) => document.getElementById(id);
        if (el('ps-total')) el('ps-total').textContent = d.totalVouchers;
        if (el('ps-active')) el('ps-active').textContent = d.activeCount;
        if (el('ps-uses')) el('ps-uses').textContent = d.totalUsages;
        if (el('ps-spent')) el('ps-spent').textContent = d.totalDiscountGiven.toLocaleString('vi-VN') + 'đ';
      }
    } catch(e) {}
  }

  async function loadVoucherList() {
    const tbody = document.getElementById('promo-tbody');
    if (!tbody) return;

    try {
      const res = await apiFetch('/api/vouchers/business');
      if (!res.success) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:3rem;color:#ef4444">Lỗi tải dữ liệu</td></tr>';
        return;
      }

      const vouchers = res.data || [];
      if (vouchers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:3rem;color:#94a3b8">Chưa có mã khuyến mãi nào. Bấm "Tạo mã mới" để bắt đầu!</td></tr>';
        return;
      }

      tbody.innerHTML = vouchers.map(v => {
        const valLabel = v.discountType === 'percent'
          ? `Giảm ${v.discountValue}%${v.maxDiscount ? ' (max ' + v.maxDiscount.toLocaleString('vi-VN') + 'đ)' : ''}`
          : v.discountValue.toLocaleString('vi-VN') + 'đ';
        const limitLabel = v.totalLimit > 0 ? `${v.usedCount}/${v.totalLimit}` : `${v.usedCount} (∞)`;
        const dateLabel = v.endDate ? new Date(v.endDate).toLocaleDateString('vi-VN') : 'Vĩnh viễn';
        const statusColor = v.status === 'active' ? '#10b981' : v.status === 'paused' ? '#f59e0b' : '#ef4444';
        const statusLabel = v.status === 'active' ? 'Active' : v.status === 'paused' ? 'Tạm dừng' : 'Hết hạn';
        const scopeLabel = v.scope === 'specific_services' ? '🎯 Dịch vụ chỉ định' : '🌐 Tất cả';

        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
            <td style="padding:16px 20px">
              <div style="font-weight:700;color:#a78bfa;font-size:0.95rem">${v.code}</div>
              <div style="font-size:0.8rem;color:#94a3b8">${v.title}</div>
              <div style="font-size:0.7rem;color:#64748b;margin-top:2px">${scopeLabel}</div>
            </td>
            <td style="padding:16px">
              <div style="font-weight:600;color:#fff">${valLabel}</div>
              ${v.minOrderValue > 0 ? `<div style="font-size:0.7rem;color:#64748b">Đơn tối thiểu: ${v.minOrderValue.toLocaleString('vi-VN')}đ</div>` : ''}
            </td>
            <td style="padding:16px">
              <div style="font-size:0.9rem;color:#cbd5e1">${limitLabel}</div>
              <div style="font-size:0.7rem;color:#64748b">HSD: ${dateLabel}</div>
              <span style="display:inline-block;margin-top:4px;font-size:0.7rem;font-weight:700;color:${statusColor};background:${statusColor}15;padding:2px 8px;border-radius:4px;border:1px solid ${statusColor}30">${statusLabel}</span>
            </td>
            <td style="padding:16px;text-align:right">
              <button onclick="window.BizPromo.edit('${v._id}')" style="background:rgba(99,102,241,0.1);color:#a78bfa;border:1px solid rgba(99,102,241,0.2);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;margin-right:6px">Sửa</button>
              <button onclick="window.BizPromo.remove('${v._id}','${v.code}')" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600">Xóa</button>
            </td>
          </tr>
        `;
      }).join('');
    } catch(e) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:3rem;color:#ef4444">Lỗi kết nối</td></tr>';
    }
  }

  // ── Modal Create/Edit ──
  function showModal(editData = null) {
    const isEdit = !!editData;
    const d = editData || {};
    const modalId = 'biz-promo-modal';
    document.getElementById(modalId)?.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';

    // Build place options for scope
    const placeOpts = bizPlaces.map(p => {
      const checked = d.applicablePlaces && d.applicablePlaces.includes(p.id || p._id) ? 'checked' : '';
      return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.8rem;color:#cbd5e1;padding:4px 0"><input type="checkbox" class="place-check" value="${p.id || p._id}" ${checked}> ${p.name}</label>`;
    }).join('');

    overlay.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:20px;width:580px;max-width:95vw;max-height:90vh;overflow-y:auto;padding:2rem;box-shadow:0 40px 100px rgba(0,0,0,0.8)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
          <h2 style="margin:0;font-size:1.2rem;color:#fff">${isEdit ? '✏️ Sửa mã khuyến mãi' : '🎫 Tạo mã khuyến mãi'}</h2>
          <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer">×</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Mã Code *</label>
            <input type="text" id="bp-code" value="${d.code || ''}" placeholder="VD: MUAHE50" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;text-transform:uppercase" ${isEdit ? 'disabled' : ''}>
          </div>
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Tên chương trình *</label>
            <input type="text" id="bp-title" value="${d.title || ''}" placeholder="VD: Khuyến mãi mùa hè" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-top:1rem">
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Loại giảm *</label>
            <select id="bp-type" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
              <option value="percent" ${d.discountType === 'percent' || !d.discountType ? 'selected' : ''}>Phần trăm (%)</option>
              <option value="fixed" ${d.discountType === 'fixed' ? 'selected' : ''}>Cố định (đ)</option>
            </select>
          </div>
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Giá trị *</label>
            <input type="number" id="bp-value" value="${d.discountValue || ''}" placeholder="10" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Giảm tối đa (đ)</label>
            <input type="number" id="bp-max" value="${d.maxDiscount || 0}" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-top:1rem">
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Đơn tối thiểu (đ)</label>
            <input type="number" id="bp-min-order" value="${d.minOrderValue || 0}" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Tổng lượt dùng</label>
            <input type="number" id="bp-total" value="${d.totalLimit || 0}" placeholder="0=Vô hạn" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Lượt/người</label>
            <input type="number" id="bp-per-user" value="${d.perUserLimit || 1}" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Bắt đầu</label>
            <input type="datetime-local" id="bp-start" value="${d.startDate ? new Date(d.startDate).toISOString().slice(0,16) : ''}" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
          <div><label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Kết thúc</label>
            <input type="datetime-local" id="bp-end" value="${d.endDate ? new Date(d.endDate).toISOString().slice(0,16) : ''}" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff">
          </div>
        </div>

        <div style="margin-top:1rem">
          <label style="font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px">Phạm vi áp dụng</label>
          <select id="bp-scope" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff" onchange="document.getElementById('bp-places-box').style.display=this.value==='specific_services'?'block':'none'">
            <option value="all" ${(!d.scope || d.scope === 'all') ? 'selected' : ''}>Tất cả dịch vụ của tôi</option>
            <option value="specific_services" ${d.scope === 'specific_services' ? 'selected' : ''}>Chỉ các dịch vụ được chọn</option>
          </select>
          <div id="bp-places-box" style="display:${d.scope === 'specific_services' ? 'block' : 'none'};margin-top:8px;max-height:150px;overflow-y:auto;background:rgba(255,255,255,0.02);padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.05)">
            ${placeOpts || '<div style="color:#64748b;font-size:0.8rem">Không có dịch vụ nào</div>'}
          </div>
        </div>

        <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.05);display:flex;justify-content:flex-end;gap:0.75rem">
          <button onclick="document.getElementById('${modalId}').remove()" style="background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);padding:10px 20px;border-radius:10px;cursor:pointer;font-weight:600">Hủy</button>
          <button id="bp-submit" style="background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-weight:700;min-width:120px">${isEdit ? 'Lưu' : 'Tạo mã'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('bp-submit').onclick = async () => {
      const code = document.getElementById('bp-code').value.trim();
      const title = document.getElementById('bp-title').value.trim();
      const discountValue = document.getElementById('bp-value').value;
      if (!code || !title || !discountValue) {
        alert('Vui lòng điền đầy đủ các trường bắt buộc (*)');
        return;
      }

      const places = [];
      document.querySelectorAll('#bp-places-box .place-check:checked').forEach(c => places.push(c.value));

      const payload = {
        code, title,
        discountType: document.getElementById('bp-type').value,
        discountValue,
        maxDiscount: document.getElementById('bp-max').value,
        minOrderValue: document.getElementById('bp-min-order').value,
        totalLimit: document.getElementById('bp-total').value,
        perUserLimit: document.getElementById('bp-per-user').value,
        startDate: document.getElementById('bp-start').value || null,
        endDate: document.getElementById('bp-end').value || null,
        scope: document.getElementById('bp-scope').value,
        applicablePlaces: places
      };

      const btn = document.getElementById('bp-submit');
      btn.disabled = true;
      btn.textContent = 'Đang xử lý...';

      try {
        let result;
        if (isEdit) {
          result = await apiFetch(`/api/vouchers/business/${d._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          result = await apiFetch('/api/vouchers/business', { method: 'POST', body: JSON.stringify(payload) });
        }

        if (result && result.success) {
          overlay.remove();
          renderPromotions();
        } else {
          alert(result?.message || 'Lỗi');
          btn.disabled = false;
          btn.textContent = isEdit ? 'Lưu' : 'Tạo mã';
        }
      } catch(e) {
        alert('Lỗi kết nối');
        btn.disabled = false;
        btn.textContent = isEdit ? 'Lưu' : 'Tạo mã';
      }
    };
  }

  // ── Public API ──
  window.BizPromo = {
    init: async function() {
      await loadBizPlaces();
      renderPromotions();
    },
    showModal,
    edit: async function(id) {
      try {
        const res = await apiFetch('/api/vouchers/business');
        if (res.success) {
          const v = (res.data || []).find(x => x._id === id);
          if (v) showModal(v);
        }
      } catch(e) {}
    },
    remove: async function(id, code) {
      if (!confirm(`Xóa mã "${code}"? Thao tác không thể hoàn tác.`)) return;
      try {
        const res = await apiFetch(`/api/vouchers/business/${id}`, { method: 'DELETE' });
        if (res.success) renderPromotions();
        else alert(res?.message || 'Lỗi');
      } catch(e) { alert('Lỗi kết nối'); }
    }
  };

  // Auto-init when promotions view is shown
  const origNav = window.navigateToView;
  if (origNav) {
    window.navigateToView = function(view) {
      origNav(view);
      if (view === 'promotions') {
        setTimeout(() => window.BizPromo.init(), 100);
      }
    };
  }

})();
