/* ================================================
   history.js — Accuracy & Functional Validation
   ================================================ */
(function () {
  const T = localStorage.getItem('wander_token');
  let user = null, placeMap = {}, bookingMap = {}, allData = [];
  let tab = 'wishlist', fCat = 'all', fStat = 'all', fRegion = 'all', fPay = 'all', fTime = 'all';

  const $ = s => document.querySelector(s);
  const fmtVND = n => Number(n||0).toLocaleString('vi-VN') + 'đ';
  const fmtD = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
  const fmtDT = d => d ? new Date(d).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', second:'2-digit'}) : '—';
  const LOGO = '/assets/wanderviet-logo-cropped-rounded.png';

  // Phương thức thanh toán online → coi là đã thanh toán ngay khi đặt
  const ONLINE_METHODS = ['transfer', 'momo', 'zalopay', 'card', 'bank', 'vnpay', 'international_card'];
  const isOnlinePaid = b => b.paymentStatus === 'paid' || ONLINE_METHODS.includes(b.paymentMethod);

  const STATUS = {
    pending:   ['Chờ duyệt', 'warn'],
    confirmed: ['Đã duyệt',  'info'],
    completed: ['Hoàn thành','ok'  ],
    cancelled: ['Đã hủy',    'err' ],
    success:   ['Thành công','ok'  ],
    failed:    ['Thất bại',  'err' ],
    planning:  ['Đang lên lịch','info'],
  };

  async function init() {
    if (!T) return;
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/auth/me', { headers:{'x-auth-token':T} }),
        fetch('/api/public/places')
      ]);
      const [me, pl] = await Promise.all([r1.json(), r2.json()]);
      if (me.success) user = me.user;
      if (pl.success) pl.data.forEach(p => { placeMap[p._id] = p; if (p.id) placeMap[p.id] = p; });

      await loadGlobalStats();
      document.querySelectorAll('.nav-item[data-tab]').forEach(el =>
        el.addEventListener('click', () => switchTab(el.dataset.tab))
      );
      $('.hero-search button')?.addEventListener('click', () => renderList());
      $('#search-input')?.addEventListener('input', () => renderList());

      switchTab('wishlist');
    } catch(e) { console.error(e); }
  }

  async function loadGlobalStats() {
    try {
      const [rB, rT, rX] = await Promise.all([
        fetch('/api/bookings/my', { headers:{'x-auth-token':T} }).then(r=>r.json()),
        fetch('/api/planner/my-trips', { headers:{'x-auth-token':T} }).then(r=>r.json()),
        fetch('/api/payments/transactions', { headers:{'x-auth-token':T} }).then(r=>r.json())
      ]);
      if (rB.success) {
        const isRental = (b) => {
          if (b.businessCategory === 'rental') return true;
          const pl = placeMap[b.placeId] || {};
          return pl.businessCategory === 'rental' || pl.kind === 'thue-xe';
        };
        const nonRentals = rB.data.filter(b => !isRental(b));
        const rentals = rB.data.filter(b => isRental(b));
        $('#count-bookings').textContent = nonRentals.length;
        $('#count-rentals').textContent = rentals.length;
        rB.data.forEach(b => { bookingMap[b.bookingId] = b; bookingMap[b._id] = b; });
        if (rB.data.some(b => b.status === 'pending')) $('#pending-dot').style.display = 'block';
      }
      if (rT.success) $('#count-trips').textContent = rT.data.length;
      if (rX.success) $('#count-txns').textContent = rX.data.length;
      $('#count-wishlist').textContent = user?.favorites?.length || 0;

      if (rX.success) {
        const total = rX.data.filter(t => t.status==='success' && t.type!=='refund').reduce((sum, t) => sum + t.amount, 0);
        $('#stat-spent').textContent = fmtVND(total);
      }
      if (rT.success) $('#stat-trips').textContent = rT.data.length;
      if (rB.success) {
        const done = new Set(rB.data.filter(b=>b.status==='completed').map(b=>b.placeId));
        $('#stat-places').textContent = done.size || user?.favorites?.length || 0;
      }
    } catch(e) {}
  }

  function switchTab(next) {
    tab = next; fCat = 'all'; fStat = 'all'; fRegion = 'all'; fPay = 'all'; fTime = 'all';
    document.querySelectorAll('.nav-item[data-tab]').forEach(el => el.classList.toggle('is-active', el.dataset.tab === tab));
    $('#tab-title').textContent = { wishlist:'Yêu thích', bookings:'Đặt chỗ', rentals:'Thuê xe / Đặt xe', trips:'Hành trình AI', transactions:'Giao dịch', activities:'Hoạt động' }[tab];
    updateDynamicSidebar();
    loadTab();
  }

  function updateDynamicSidebar() {
    const box = $('#dynamic-filters'); box.innerHTML = '';
    const addS = (lb, items, cur, type) => {
      const d = document.createElement('div'); d.className='sb-filter-group';
      d.innerHTML = `<p class="sb-label">${lb}</p><div class="sb-filter-list">${items.map(i=>`<div class="sb-filter-item ${cur===i.id?'active':''}" onclick="setF('${type}','${i.id}')">${i.lb}</div>`).join('')}</div>`;
      box.appendChild(d);
    };
    if (tab==='bookings') {
      addS('Dịch vụ', [{id:'all',lb:'Tất cả'},{id:'Lưu trú Elite',lb:'Khách sạn'},{id:'Ẩm thực & Giải trí',lb:'Nhà hàng'},{id:'Trải nghiệm Tour',lb:'Tour'}], fCat,'cat');
      addS('Thanh toán', [{id:'all',lb:'Tất cả'},{id:'paid',lb:'Đã thanh toán'},{id:'unpaid',lb:'Chưa thanh toán'}], fPay,'pay');
    } else if (tab==='rentals') {
      addS('Loại xe', [{id:'all',lb:'Tất cả'},{id:'motorbike',lb:'Xe máy'},{id:'car',lb:'Ô tô'},{id:'electric',lb:'Xe điện'}], fCat,'cat');
      addS('Thanh toán', [{id:'all',lb:'Tất cả'},{id:'paid',lb:'Đã thanh toán'},{id:'unpaid',lb:'Chưa thanh toán'}], fPay,'pay');
    } else if (tab==='trips') {
      addS('Vùng miền', [{id:'all',lb:'Toàn quốc'},{id:'Bắc',lb:'Miền Bắc'},{id:'Trung',lb:'Miền Trung'},{id:'Nam',lb:'Miền Nam'}], fRegion,'region');
    }
  }

  window.setF = (t, v) => {
    if(t==='cat') fCat=v; if(t==='stat') fStat=v; if(t==='region') fRegion=v; if(t==='pay') fPay=v;
    updateDynamicSidebar(); renderList();
  };

  async function loadTab() {
    $('#list-area').innerHTML = '<div class="empty-box">Đang kiểm tra dữ liệu...</div>';
    const EP = { bookings:'/api/bookings/my', rentals:'/api/bookings/my', trips:'/api/planner/my-trips', transactions:'/api/payments/transactions', activities:'/api/activities/my' };
    try {
      if (tab === 'wishlist') allData = (user?.favorites||[]).map(id => placeMap[id]).filter(Boolean);
      else {
        const r = await fetch(EP[tab] || EP['bookings'], { headers:{'x-auth-token':T} });
        const j = await r.json();
        if (tab === 'rentals') {
          allData = j.success ? j.data.filter(b => {
            if (b.businessCategory === 'rental') return true;
            const pl = placeMap[b.placeId] || {};
            return pl.businessCategory === 'rental' || pl.kind === 'thue-xe';
          }) : [];
        } else if (tab === 'bookings') {
          allData = j.success ? j.data.filter(b => {
            if (b.businessCategory === 'rental') return false;
            const pl = placeMap[b.placeId] || {};
            return !(pl.businessCategory === 'rental' || pl.kind === 'thue-xe');
          }) : [];
        } else {
          allData = j.success ? j.data : [];
        }
      }
    } catch(e) {}
    renderList();
  }

  function renderList() {
    const qVal = $('#search-input')?.value.toLowerCase() || '';
    let data = [...allData];
    if (fCat!=='all') data = data.filter(i => (placeMap[i.placeId]?.category===fCat || i.category===fCat));
    if (fPay!=='all') data = data.filter(i => i.paymentStatus === fPay);
    if (qVal) data = data.filter(i => (i.name||i.placeName||i.destination||'').toLowerCase().includes(qVal));

    $('#result-count-val').textContent = data.length;
    if(!data.length) { $('#list-area').innerHTML = '<div class="empty-box">Chưa tìm thấy bản ghi nào khớp.</div>'; return; }

    $('#list-area').innerHTML = (tab==='activities'?'<div class="timeline">':'<div class="card-grid">') + 
      data.map(item => {
        if(tab==='wishlist') return cardV(item);
        if(tab==='bookings') return cardB(item);
        if(tab==='rentals') return cardR(item);
        if(tab==='trips')    return cardT(item);
        if(tab==='transactions') return cardX(item);
        if(tab==='activities') return cardA(item);
        return '';
      }).join('') + '</div>';
  }

  // --- HÀNH ĐỘNG THỰC TẾ ---
  window.doAction = (action, id) => {
    if (action === 'pay') window.location.href = `payment.html?bookingId=${id}`;
    if (action === 'view_place') window.location.href = `place-detail.html?id=${id}`;
    if (action === 'view_trip') window.location.href = `planner.html?itinId=${id}`;
    if (action === 'review') WanderUI.showToast('Chức năng đánh giá đang được chuẩn bị...', 'info');
  };

  function cardV(p) { 
    return `
      <div class="v-card">
        <div class="v-img-wrap">          <img src="${getSafeImage(p.image, LOGO)}" onerror="this.onerror=null;this.src=LOGO;"><div class="v-badge-top">⭐ ${p.ratingAvg||5}</div></div>
        <div class="v-body">
          <p class="v-cat">${p.category||'Địa điểm'}</p>
          <h4 class="v-title">${p.name}</h4>
          <div class="v-meta"><span>📍 ${p.region}</span></div>
        </div>
        <div class="v-footer">
          <button class="btn-action" style="color:#64748b; font-weight:700; background:none; border:none; cursor:pointer;" onclick="doAction('view_place','${p._id}')">Chi tiết</button>
          <button class="btn-action" style="background:var(--accent); color:#fff; border:none; padding:6px 15px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="doAction('view_place','${p._id}')">Đặt ngay</button>
        </div>
      </div>`; 
  }

  function cardB(b) { 
    const pl=placeMap[b.placeId]||{}; const [l,c]=STATUS[b.status]||[b.status,'info'];
    const isUnpaid = !isOnlinePaid(b) && b.status !== 'cancelled';
    const isDone = b.status === 'completed';
    return `
      <div class="v-card">
        <div class="v-img-wrap"><img src="${getSafeImage(pl.image, LOGO)}" onerror="this.onerror=null;this.src=LOGO;"><div class="v-status-tag tag-${c}">${l}</div></div>
        <div class="v-body">
          <p class="v-cat">${pl.category||'Dịch vụ'}</p>
          <h4 class="v-title">${b.placeName}</h4>
          <div class="v-meta"><span>📅 ${fmtD(b.useDate)}</span><span style="color:${isUnpaid?'#ef4444':'#10b981'}">${isOnlinePaid(b)?'\u0110\u00e3 thanh to\u00e1n':'Ch\u01b0a thanh to\u00e1n'}</span></div>
        </div>
        <div class="v-footer">
          ${isUnpaid ? `<button class="btn-action" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:800; cursor:pointer; flex:1;" onclick="doAction('pay','${b._id}')">THANH TOÁN NGAY</button>` : `<button class="btn-action" style="background:#f1f5f9; color:#1e293b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; flex:1;" onclick="doAction('view_place','${b.placeId}')">Xem dịch vụ</button>`}
          ${isDone ? `<button class="btn-action" style="background:#f5f3ff; color:var(--accent); border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; margin-left:10px;" onclick="doAction('review','${b.bookingId}')">Đánh giá</button>` : ''}
        </div>
      </div>`;
  }

  function cardT(t) { 
    const [l,c] = STATUS[t.status] || ['Đang lên lịch', 'info'];
    return `
      <div class="v-card" style="border-left: 5px solid var(--accent);">
        <div class="v-body" style="padding: 25px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div class="v-status-tag tag-${c}" style="position: static;">${l}</div>
            <span style="font-size: 0.7rem; color: #94a3b8;">#${t._id.slice(-6).toUpperCase()}</span>
          </div>
          <h4 class="v-title">Chuyến đi ${t.destination}</h4>
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="font-size: 0.85rem; font-weight: 700;">🕒 ${t.days} Ngày</div>
            <div style="font-size: 0.85rem; font-weight: 700;">👥 ${t.companion || 'Chưa rõ'}</div>
          </div>
          <button style="width:100%; background:var(--accent); color:#fff; border:none; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;" onclick="doAction('view_trip','${t._id}')">MỞ BẢN ĐỒ</button>
        </div>
      </div>`; 
  }


  function cardR(b) {
    const pl = placeMap[b.placeId] || {};
    const [l, c] = STATUS[b.status] || [b.status, 'info'];
    const isUnpaid = !isOnlinePaid(b) && b.status !== 'cancelled';
    const isDone = b.status === 'completed';
    return `
      <div class="v-card">
        <div class="v-img-wrap"><img src="${getSafeImage(pl.image, LOGO)}" onerror="this.onerror=null;this.src=LOGO;"><div class="v-status-tag tag-${c}">${l}</div><div class="v-badge-top">🚗 Thuê xe</div></div>
        <div class="v-body">
          <p class="v-cat" style="color:#f59e0b">THUÊ XE / ĐẶT XE</p>
          <h4 class="v-title">${b.placeName}</h4>
          <div class="v-meta">
            <span>📅 ${fmtD(b.useDate)}</span>
            <span>👥 ${b.peopleCount || 1} người</span>
            <span style="color:${isUnpaid ? '#ef4444' : '#10b981'}">${isOnlinePaid(b) ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
          </div>
          ${b.totalPrice > 0 ? `<div style="margin-top:10px; font-size:1.1rem; font-weight:800; color:#0f172a">${fmtVND(b.totalPrice)}</div>` : ''}
        </div>
        <div class="v-footer">
          ${isUnpaid ? `<button class="btn-action" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:800; cursor:pointer; flex:1;" onclick="doAction('pay','${b._id}')">THANH TOÁN NGAY</button>` : `<button class="btn-action" style="background:#f1f5f9; color:#1e293b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; flex:1;" onclick="doAction('view_place','${b.placeId}')">Xem dịch vụ</button>`}
          ${isDone ? `<button class="btn-action" style="background:#fff7ed; color:#f59e0b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; margin-left:10px;" onclick="doAction('review','${b.bookingId}')">Đánh giá</button>` : ''}
        </div>
      </div>`;
  }

  function cardX(t) { 
    const b = bookingMap[t.bookingId]; 
    const imgSrc = (t.type === 'upgrade') ? LOGO : (b ? placeMap[b.placeId]?.image : LOGO);
    return `
      <div class="v-card">
        <div class="v-img-wrap"><img src="${getSafeImage(imgSrc, LOGO)}" onerror="this.onerror=null;this.src=LOGO;"><div class="v-badge-top">${fmtVND(t.amount)}</div></div>
        <div class="v-body">
          <p class="v-cat" style="color:${t.type==='refund'?'#10b981':'var(--accent)'}">${t.type.toUpperCase()}</p>
          <h4 class="v-title">${t.description}</h4>
          <div class="v-meta">🕒 ${fmtD(t.createdAt)}</div>
        </div>
        <div class="v-footer">
          <button style="width:100%; background:#fff; border:1px solid #e2e8f0; padding:8px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="WanderUI.showToast('Đang tải hóa đơn...','success')">Tải hóa đơn PDF</button>
        </div>
      </div>`; 
  }
  function cardA(a) { return `<div class="act-log"><div class="act-dot"></div><div class="act-info"><p class="act-time">${fmtDT(a.timestamp)}</p><p class="act-txt">${a.description}</p></div></div>`; }

  init();
})();
