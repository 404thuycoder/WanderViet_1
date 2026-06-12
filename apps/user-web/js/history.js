/* ================================================
   history.js — Accuracy & Functional Validation
   ================================================ */
(function () {
  const T = localStorage.getItem('wander_token');
  let user = null, placeMap = {}, bookingMap = {}, allData = [];
  let tab = 'wishlist', fCat = 'all', fStat = 'all', fRegion = 'all', fPay = 'all', fTime = 'all';
  let selectMode = false;

  const $ = s => document.querySelector(s);
  const fmtVND = n => Number(n||0).toLocaleString('vi-VN') + 'đ';
  const fmtD = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
  const fmtDT = d => d ? new Date(d).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', second:'2-digit'}) : '—';
  const LOGO = '/assets/wanderviet-logo-cropped-rounded.png';

  const isServicePlace = p => {
    if (!p) return false;
    if (p.isTour || p.isUtility) return true;
    const serviceKinds = ['khach-san', 'nha-hang', 'tien-ich', 'thue-xe', 'tour', 'dich-vu'];
    if (serviceKinds.includes(p.kind)) return true;
    const serviceCats = ['dining', 'stay', 'tour', 'facility', 'rental', 'hotel', 'restaurant', 'spa', 'transport', 'meeting'];
    if (serviceCats.includes(p.businessCategory)) return true;
    return false;
  };

  function getSmartFallbackImage(name) {
    if (!name) return LOGO;
    const n = name.toLowerCase();
    if (n.includes('tuyên quang')) return 'https://vcdn1-dulich.vnecdn.net/2023/12/28/nahang4-1703754248-1703754258-3629-1703758253.jpg?w=1200';
    if (n.includes('hà nội') || n.includes('hanoi')) return 'https://bizweb.dktcdn.net/100/242/347/files/album-anh-ve-ha-noi-01-0cbc70a3-b767-46e7-9904-d09ad5092662.jpg?v=1720771375029';
    if (n.includes('đà nẵng') || n.includes('danang')) return 'https://cdn-media.sforum.vn/storage/app/media/ctvseo_MH/%E1%BA%A3nh%20%C4%91%E1%BA%B9p%20%C4%91%C3%A0%20n%E1%BA%B5ng/anh-dep-da-nang-thumb.jpg';
    if (n.includes('hạ long') || n.includes('halong')) return 'https://cdn-media.sforum.vn/storage/app/media/anh-vinh-ha-long-28.jpg';
    if (n.includes('hồ chí minh') || n.includes('sài gòn') || n.includes('saigon') || n.includes('tphcm')) return 'https://bcp.cdnchinhphu.vn/334894974524682240/2025/10/31/tphcm-hinh-ah-17619225878251619451780.jpg';
    if (n.includes('lẩu') || n.includes('nướng') || n.includes('ăn') || n.includes('nhà hàng') || n.includes('quán') || n.includes('ẩm thực') || n.includes('dining') || n.includes('thái')) return 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&q=80';
    if (n.includes('khách sạn') || n.includes('hotel') || n.includes('resort') || n.includes('stay') || n.includes('homestay') || n.includes('mường thanh')) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
    if (n.includes('xe') || n.includes('car') || n.includes('rental') || n.includes('xe máy') || n.includes('ô tô')) return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80';
    return `/api/public/place-photo?name=${encodeURIComponent(name)}`;
  }

  const getTrashIds = () => JSON.parse(localStorage.getItem('wander_trash_ids') || '[]');
  const setTrashIds = ids => {
    localStorage.setItem('wander_trash_ids', JSON.stringify(ids));
    $('#count-trash').textContent = ids.length;
  };

  function showConfirmModal(title, message) {
    return new Promise((resolve) => {
      const modal = $('#custom-confirm-modal');
      const titleEl = $('#confirm-modal-title');
      const messageEl = $('#confirm-modal-message');
      const okBtn = $('#confirm-modal-ok-btn');
      const cancelBtn = $('#confirm-modal-cancel-btn');
      if (!modal) return resolve(confirm(message));

      titleEl.textContent = title;
      messageEl.textContent = message;
      modal.style.display = 'flex';
      modal.offsetHeight;
      modal.classList.add('show');

      const cleanup = (result) => {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      };
      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }
      okBtn.addEventListener('click', onOk, { once: true });
      cancelBtn.addEventListener('click', onCancel, { once: true });
    });
  }

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
      const [rB, rT, rX, rA] = await Promise.all([
        fetch('/api/bookings/my', { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
        fetch('/api/planner/my-trips', { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
        fetch('/api/payments/transactions', { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
        fetch('/api/activities/my', { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
      ]);

      const trashIds = getTrashIds();

      if (rB.success) {
        const isRental = (b) => {
          if (b.businessCategory === 'rental') return true;
          const pl = placeMap[b.placeId] || {};
          return pl.businessCategory === 'rental' || pl.kind === 'thue-xe';
        };
        const activeBookings = rB.data.filter(b => !trashIds.includes(b._id || b.bookingId));
        const nonRentals = activeBookings.filter(b => !isRental(b));
        const rentals = activeBookings.filter(b => isRental(b));
        
        $('#count-bookings').textContent = nonRentals.length;
        $('#count-rentals').textContent = rentals.length;
        rB.data.forEach(b => { bookingMap[b.bookingId] = b; bookingMap[b._id] = b; });
        if (activeBookings.some(b => b.status === 'pending')) $('#pending-dot').style.display = 'block';
        else $('#pending-dot').style.display = 'none';
      }

      if (rT.success) {
        const activeTrips = rT.data.filter(t => !trashIds.includes(t._id));
        $('#count-trips').textContent = activeTrips.length;
      }

      if (rX.success) {
        const activeTxns = rX.data.filter(t => !trashIds.includes(t._id));
        $('#count-txns').textContent = activeTxns.length;
      }

      if (rA.success) {
        const activeActs = rA.data.filter(a => !trashIds.includes(a._id));
        $('#count-acts').textContent = activeActs.length;
      }

      const activeFavs = (user?.favorites||[]).filter(id => placeMap[id] && !trashIds.includes(id));
      $('#count-wishlist').textContent = activeFavs.length;

      // Count resolved trash items to avoid showing counts for missing/unapproved places or deleted records
      const resolvedIds = new Set();
      (user?.favorites || []).forEach(id => { if (placeMap[id]) resolvedIds.add(id); });
      if (rB.success) rB.data.forEach(b => { if (b._id) resolvedIds.add(b._id); if (b.bookingId) resolvedIds.add(b.bookingId); });
      if (rT.success) rT.data.forEach(t => { if (t._id) resolvedIds.add(t._id); });
      if (rX.success) rX.data.forEach(x => { if (x._id) resolvedIds.add(x._id); });
      if (rA.success) rA.data.forEach(a => { if (a._id) resolvedIds.add(a._id); });
      const activeTrashCount = trashIds.filter(id => resolvedIds.has(id)).length;
      $('#count-trash').textContent = activeTrashCount;
    } catch(e) {}
  }

  function switchTab(next) {
    tab = next; fCat = 'all'; fStat = 'all'; fRegion = 'all'; fPay = 'all'; fTime = 'all';
    document.querySelectorAll('.nav-item[data-tab]').forEach(el => el.classList.toggle('is-active', el.dataset.tab === tab));
    $('#tab-title').textContent = { wishlist:'Yêu thích', bookings:'Đặt chỗ', rentals:'Thuê xe / Đặt xe', trips:'Hành trình AI', transactions:'Giao dịch', activities:'Hoạt động', trash:'Thùng rác' }[tab];
    
    const clearBtn = $('#clear-all-btn');
    if (clearBtn) {
      if (tab === 'trash') {
        clearBtn.textContent = '🗑️ Dọn sạch thùng rác';
      } else {
        clearBtn.textContent = '🗑️ Xóa tất cả';
      }
    }
    
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
    if (tab === 'wishlist') {
      addS('Thể loại', [{id:'all',lb:'Tất cả'},{id:'place',lb:'Địa điểm'},{id:'service',lb:'Dịch vụ'}], fCat,'cat');
    } else if (tab==='bookings') {
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

  async function loadTrashItems() {
    const trashIds = getTrashIds();
    if (trashIds.length === 0) return [];
    const EP = { bookings:'/api/bookings/my', trips:'/api/planner/my-trips', transactions:'/api/payments/transactions', activities:'/api/activities/my' };
    try {
      const [rB, rT, rX, rA] = await Promise.all([
        fetch(EP.bookings, { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
        fetch(EP.trips, { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
        fetch(EP.transactions, { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
        fetch(EP.activities, { headers:{'x-auth-token':T} }).then(r=>r.json().catch(()=>({data:[]}))),
      ]);

      const allItems = [];

      const favs = (user?.favorites||[]).map(id => placeMap[id]).filter(Boolean).map(item => ({ ...item, _historyType: 'wishlist' }));
      allItems.push(...favs);

      if (rB.success) {
        rB.data.forEach(b => {
          const isRental = b.businessCategory === 'rental' || (placeMap[b.placeId] || {}).businessCategory === 'rental' || (placeMap[b.placeId] || {}).kind === 'thue-xe';
          allItems.push({ ...b, _historyType: isRental ? 'rentals' : 'bookings' });
        });
      }

      if (rT.success) {
        rT.data.forEach(t => allItems.push({ ...t, _historyType: 'trips' }));
      }

      if (rX.success) {
        rX.data.forEach(x => allItems.push({ ...x, _historyType: 'transactions' }));
      }

      if (rA.success) {
        rA.data.forEach(a => allItems.push({ ...a, _historyType: 'activities' }));
      }

      return allItems.filter(item => trashIds.includes(item._id || item.id));
    } catch(e) {
      console.error(e);
      return [];
    }
  }

  function updateTabStats() {
    const sSpent = $('#stat-spent');
    const sTrips = $('#stat-trips');
    const sPlaces = $('#stat-places');
    if (!sSpent || !sTrips || !sPlaces) return;

    const lbSpent = sSpent.closest('.stat-mini')?.querySelector('.stat-lb');
    const lbTrips = sTrips.closest('.stat-mini')?.querySelector('.stat-lb');
    const lbPlaces = sPlaces.closest('.stat-mini')?.querySelector('.stat-lb');

    if (tab === 'wishlist') {
      const uniqueRegions = new Set(allData.map(p => p.region).filter(Boolean)).size;
      const ratings = allData.map(p => p.ratingAvg || 5);
      const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1) + ' ⭐' : '—';
      
      sSpent.textContent = allData.length;
      if (lbSpent) lbSpent.textContent = 'Địa điểm';
      
      sTrips.textContent = uniqueRegions;
      if (lbTrips) lbTrips.textContent = 'Tỉnh thành';
      
      sPlaces.textContent = avgRating;
      if (lbPlaces) lbPlaces.textContent = 'Đánh giá';
    } 
    else if (tab === 'bookings') {
      const totalSpent = allData.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const completed = allData.filter(b => b.status === 'completed').length;
      const pending = allData.filter(b => b.status === 'pending').length;
      
      sSpent.textContent = fmtVND(totalSpent);
      if (lbSpent) lbSpent.textContent = 'Chi tiêu đặt chỗ';
      
      sTrips.textContent = completed;
      if (lbTrips) lbTrips.textContent = 'Hoàn thành';
      
      sPlaces.textContent = pending;
      if (lbPlaces) lbPlaces.textContent = 'Chờ duyệt';
    } 
    else if (tab === 'rentals') {
      const totalSpent = allData.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const completed = allData.filter(b => b.status === 'completed').length;
      const pending = allData.filter(b => b.status === 'pending').length;
      
      sSpent.textContent = fmtVND(totalSpent);
      if (lbSpent) lbSpent.textContent = 'Chi tiêu thuê xe';
      
      sTrips.textContent = completed;
      if (lbTrips) lbTrips.textContent = 'Hoàn thành';
      
      sPlaces.textContent = pending;
      if (lbPlaces) lbPlaces.textContent = 'Chờ duyệt';
    } 
    else if (tab === 'trips') {
      const totalDays = allData.reduce((sum, t) => sum + (parseInt(t.days) || 1), 0);
      const uniqueDest = new Set(allData.map(t => t.destination).filter(Boolean)).size;
      
      sSpent.textContent = allData.length;
      if (lbSpent) lbSpent.textContent = 'Chuyến đi';
      
      sTrips.textContent = totalDays + ' ngày';
      if (lbTrips) lbTrips.textContent = 'Tổng số ngày';
      
      sPlaces.textContent = uniqueDest;
      if (lbPlaces) lbPlaces.textContent = 'Điểm đến';
    } 
    else if (tab === 'transactions') {
      const totalSuccess = allData.filter(t => t.status === 'success' && t.type !== 'refund').reduce((sum, t) => sum + t.amount, 0);
      const totalRefund = allData.filter(t => t.status === 'success' && t.type === 'refund').reduce((sum, t) => sum + t.amount, 0);
      const successCount = allData.filter(t => t.status === 'success').length;
      
      sSpent.textContent = fmtVND(totalSuccess);
      if (lbSpent) lbSpent.textContent = 'Tổng chi tiêu';
      
      sTrips.textContent = fmtVND(totalRefund);
      if (lbTrips) lbTrips.textContent = 'Tổng hoàn tiền';
      
      sPlaces.textContent = successCount;
      if (lbPlaces) lbPlaces.textContent = 'Thành công';
    } 
    else if (tab === 'activities') {
      const uniqueDays = new Set(allData.map(a => a.timestamp ? new Date(a.timestamp).toDateString() : '').filter(Boolean)).size;
      const timestamps = allData.map(a => a.timestamp ? new Date(a.timestamp).getTime() : 0).filter(Boolean);
      const lastActive = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toLocaleDateString('vi-VN') : '—';
      
      sSpent.textContent = allData.length;
      if (lbSpent) lbSpent.textContent = 'Hoạt động';
      
      sTrips.textContent = uniqueDays;
      if (lbTrips) lbTrips.textContent = 'Số ngày';
      
      sPlaces.textContent = lastActive;
      if (lbPlaces) lbPlaces.textContent = 'Gần nhất';
    } 
    else if (tab === 'trash') {
      const bookingsCount = allData.filter(item => item._historyType === 'bookings' || item._historyType === 'rentals').length;
      const othersCount = allData.filter(item => item._historyType !== 'bookings' && item._historyType !== 'rentals').length;
      
      sSpent.textContent = allData.length;
      if (lbSpent) lbSpent.textContent = 'Mục đã xóa';
      
      sTrips.textContent = bookingsCount;
      if (lbTrips) lbTrips.textContent = 'Đặt & Thuê';
      
      sPlaces.textContent = othersCount;
      if (lbPlaces) lbPlaces.textContent = 'Mục khác';
    }
  }

  async function loadTab() {
    $('#list-area').innerHTML = '<div class="empty-box">Đang kiểm tra dữ liệu...</div>';
    
    selectMode = false;
    const selectBtn = $('#toggle-select-mode-btn');
    if (selectBtn) {
      selectBtn.textContent = '📝 Chọn';
      selectBtn.style.background = 'rgba(99, 102, 241, 0.1)';
      selectBtn.style.color = 'var(--primary)';
      selectBtn.style.borderColor = 'rgba(99, 102, 241, 0.2)';
    }

    const saCb = $('#select-all-checkbox');
    if (saCb) saCb.checked = false;
    const selBar = $('#selection-bar');
    if (selBar) selBar.style.display = 'none';

    if (tab === 'trash') {
      allData = await loadTrashItems();
      updateTabStats();
      renderList();
      return;
    }

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

    const trashIds = getTrashIds();
    allData = allData.filter(item => !trashIds.includes(item._id || item.id));
    updateTabStats();
    renderList();
  }

  function renderList() {
    const qVal = $('#search-input')?.value.toLowerCase() || '';
    let data = [...allData];
    if (fCat!=='all') {
      if (tab === 'wishlist') {
        if (fCat === 'place') {
          data = data.filter(p => !isServicePlace(p));
        } else if (fCat === 'service') {
          data = data.filter(p => isServicePlace(p));
        }
      } else {
        data = data.filter(i => (placeMap[i.placeId]?.category===fCat || i.category===fCat));
      }
    }
    if (fPay!=='all') data = data.filter(i => i.paymentStatus === fPay);
    if (qVal) data = data.filter(i => (i.name||i.placeName||i.destination||'').toLowerCase().includes(qVal));

    $('#result-count-val').textContent = data.length;
    if(!data.length) { 
      $('#list-area').innerHTML = '<div class="empty-box">Chưa tìm thấy bản ghi nào khớp.</div>'; 
      $('#selection-bar').style.display = 'none';
      return; 
    }

    $('#list-area').innerHTML = (tab==='activities' || (tab==='trash' && data.every(i => i._historyType === 'activities')) ? '<div class="timeline">' : '<div class="card-grid">') + 
      data.map(item => {
        const itemTab = tab === 'trash' ? item._historyType : tab;
        if(itemTab==='wishlist') return cardV(item);
        if(itemTab==='bookings') return cardB(item);
        if(itemTab==='rentals') return cardR(item);
        if(itemTab==='trips')    return cardT(item);
        if(itemTab==='transactions') return cardX(item);
        if(itemTab==='activities') return cardA(item);
        return '';
      }).join('') + '</div>';
      
      window.updateSelectedCount();
  }

  window.doAction = (action, id) => {
    if (selectMode) return;
    if (action === 'pay') window.location.href = `payment.html?pay=${id}`;
    if (action === 'view_place') window.location.href = `place-detail.html?id=${id}`;
    if (action === 'view_trip') window.location.href = `planner.html?itinId=${id}&view=true`;
    if (action === 'review') {
      const b = bookingMap[id];
      if (b) {
        const pl = placeMap[b.placeId] || {};
        const bizId = b.placeId;
        const bizName = pl.name || b.placeName || 'Doanh nghiệp';
        window.location.href = `feedback.html?tab=business&bizId=${bizId}&bizName=${encodeURIComponent(bizName)}`;
      } else {
        window.location.href = 'feedback.html?tab=business';
      }
    }
  };

  window.handleCardClick = (id, type, event) => {
    if (!selectMode) return;
    if (event.target.classList.contains('item-checkbox')) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const cardContainer = event.target.closest('.v-card, .act-info');
    if (cardContainer) {
      const cb = cardContainer.querySelector('.item-checkbox');
      if (cb) {
        cb.checked = !cb.checked;
        window.updateSelectedCount();
      }
    }
  };

  window.toggleSelectMode = () => {
    selectMode = !selectMode;
    const btn = $('#toggle-select-mode-btn');
    if (btn) {
      btn.textContent = selectMode ? '❌ Hủy chọn' : '📝 Chọn';
      if (selectMode) {
        btn.style.background = 'rgba(239, 68, 68, 0.1)';
        btn.style.color = '#ef4444';
        btn.style.borderColor = 'rgba(239, 68, 68, 0.2)';
      } else {
        btn.style.background = 'rgba(99, 102, 241, 0.1)';
        btn.style.color = 'var(--primary)';
        btn.style.borderColor = 'rgba(99, 102, 241, 0.2)';
      }
    }
    const selBar = $('#selection-bar');
    if (selBar) selBar.style.display = selectMode ? 'flex' : 'none';
    const saCb = $('#select-all-checkbox');
    if (saCb) saCb.checked = false;
    renderList();
  };

  window.moveToTrashSingle = (type, id, event) => {
    if (event) event.stopPropagation();
    const trashIds = getTrashIds();
    if (!trashIds.includes(id)) {
      trashIds.push(id);
      setTrashIds(trashIds);
    }
    WanderUI.showToast('Đã chuyển mục này vào Thùng rác', 'success');
    loadTab();
    loadGlobalStats();
  };

  window.restoreSingle = (type, id) => {
    if (selectMode) return;
    const trashIds = getTrashIds();
    setTrashIds(trashIds.filter(x => x !== id));
    WanderUI.showToast('Đã khôi phục mục thành công', 'success');
    loadTab();
    loadGlobalStats();
  };

  window.deletePermanentlySingle = async (type, id) => {
    if (selectMode) return;
    try {
      let url = '';
      if (type === 'wishlist') url = `/api/places/${id}/favorite`;
      else if (type === 'bookings' || type === 'rentals') url = `/api/bookings/${id}`;
      else if (type === 'trips') url = `/api/planner/permanent/${id}`;
      else if (type === 'transactions') url = `/api/payments/transactions/${id}`;
      else if (type === 'activities') url = `/api/activities/${id}`;

      if (url) {
        const method = type === 'wishlist' ? 'POST' : 'DELETE';
        const res = await fetch(url, { method, headers: { 'x-auth-token': T } });
        const j = await res.json();
        if (!j.success) {
          WanderUI.showToast('Lỗi khi xóa: ' + (j.message || ''), 'err');
          return;
        }
      }
      if (type === 'wishlist' && user && user.favorites) {
        user.favorites = user.favorites.filter(x => x !== id);
      }
    } catch(e) { console.error(e); }

    const trashIds = getTrashIds();
    setTrashIds(trashIds.filter(x => x !== id));
    WanderUI.showToast('Đã xóa vĩnh viễn thành công', 'success');
    loadTab();
    loadGlobalStats();
  };

  window.toggleSelectAll = (el) => {
    const checked = el.checked;
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = checked);
    window.updateSelectedCount();
  };

  window.updateSelectedCount = () => {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(cb => {
      const card = cb.closest('.v-card') || cb.closest('.act-info');
      if (card) {
        if (cb.checked) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      }
    });

    const selected = Array.from(checkboxes).filter(cb => cb.checked);
    const total = checkboxes.length;
    const saCb = $('#select-all-checkbox');
    if (saCb) saCb.checked = selected.length === total && total > 0;
    const countLbl = $('#selected-count-label');
    if (countLbl) countLbl.textContent = `Đã chọn ${selected.length} mục`;
    const selBar = $('#selection-bar');
    if (selBar) {
      if (selectMode) {
        selBar.style.display = 'flex';
        const bRestore = $('#batch-restore-btn');
        const bDelete = $('#batch-delete-btn');
        if (tab === 'trash') {
          if (bRestore) bRestore.style.display = 'inline-block';
          if (bDelete) bDelete.textContent = 'Xóa vĩnh viễn';
        } else {
          if (bRestore) bRestore.style.display = 'none';
          if (bDelete) bDelete.textContent = 'Xóa mục đã chọn';
        }
      } else {
        selBar.style.display = 'none';
      }
    }
  };

  window.batchRestore = () => {
    const selected = document.querySelectorAll('.item-checkbox:checked');
    if (selected.length === 0) return;
    const trashIds = getTrashIds();
    let updated = [...trashIds];
    selected.forEach(cb => {
      updated = updated.filter(x => x !== cb.dataset.id);
    });
    setTrashIds(updated);
    WanderUI.showToast(`Đã khôi phục ${selected.length} mục thành công`, 'success');
    loadTab();
    loadGlobalStats();
  };

  window.batchDelete = async () => {
    const selected = document.querySelectorAll('.item-checkbox:checked');
    if (selected.length === 0) return;
    const count = selected.length;
    const label = tab === 'trash' ? 'xóa vĩnh viễn' : 'đưa vào thùng rác';
    if (count > 1) {
      const confirmed = await showConfirmModal('Xác nhận hành động', `Bạn có chắc chắn muốn ${label} ${count} mục đã chọn?`);
      if (!confirmed) return;
    }
    if (tab === 'trash') {
      for (const cb of selected) {
        const id = cb.dataset.id;
        const type = cb.dataset.type;
        try {
          let url = '';
          if (type === 'wishlist') url = `/api/places/${id}/favorite`;
          else if (type === 'bookings' || type === 'rentals') url = `/api/bookings/${id}`;
          else if (type === 'trips') url = `/api/planner/permanent/${id}`;
          else if (type === 'transactions') url = `/api/payments/transactions/${id}`;
          else if (type === 'activities') url = `/api/activities/${id}`;
          if (url) {
            const method = type === 'wishlist' ? 'POST' : 'DELETE';
            await fetch(url, { method, headers: { 'x-auth-token': T } });
          }
          if (type === 'wishlist' && user && user.favorites) {
            user.favorites = user.favorites.filter(x => x !== id);
          }
        } catch(e) {}
      }
      const trashIds = getTrashIds();
      let updated = [...trashIds];
      selected.forEach(cb => {
        updated = updated.filter(x => x !== cb.dataset.id);
      });
      setTrashIds(updated);
      WanderUI.showToast(`Đã xóa vĩnh viễn ${count} mục`, 'success');
    } else {
      const trashIds = getTrashIds();
      selected.forEach(cb => {
        const id = cb.dataset.id;
        if (!trashIds.includes(id)) trashIds.push(id);
      });
      setTrashIds(trashIds);
      WanderUI.showToast(`Đã chuyển ${count} mục vào Thùng rác`, 'success');
    }
    loadTab();
    loadGlobalStats();
  };

  window.clearAllTab = async () => {
    const count = allData.length;
    if (count === 0) return;
    const label = tab === 'trash' ? 'dọn sạch thùng rác (xóa vĩnh viễn toàn bộ)' : 'chuyển toàn bộ mục trong tab này vào thùng rác';
    if (count > 1) {
      const confirmed = await showConfirmModal('Xác nhận hành động', `Bạn có chắc chắn muốn ${label}?`);
      if (!confirmed) return;
    }
    if (tab === 'trash') {
      const items = await loadTrashItems();
      for (const item of items) {
        const id = item._id || item.id;
        const type = item._historyType;
        try {
          let url = '';
          if (type === 'wishlist') url = `/api/places/${id}/favorite`;
          else if (type === 'bookings' || type === 'rentals') url = `/api/bookings/${id}`;
          else if (type === 'trips') url = `/api/planner/permanent/${id}`;
          else if (type === 'transactions') url = `/api/payments/transactions/${id}`;
          else if (type === 'activities') url = `/api/activities/${id}`;
          if (url) {
            const method = type === 'wishlist' ? 'POST' : 'DELETE';
            await fetch(url, { method, headers: { 'x-auth-token': T } });
          }
        } catch(e) {}
      }
      setTrashIds([]);
      WanderUI.showToast('Đã dọn sạch thùng rác', 'success');
    } else {
      const trashIds = getTrashIds();
      allData.forEach(item => {
        const id = item._id || item.id;
        if (!trashIds.includes(id)) trashIds.push(id);
      });
      setTrashIds(trashIds);
      WanderUI.showToast('Đã chuyển toàn bộ mục vào Thùng rác', 'success');
    }
    loadTab();
    loadGlobalStats();
  };

  function cardV(p) { 
    const id = p._id || p.id;
    const type = tab === 'trash' ? p._historyType : tab;
    const imgUrl = p.image || p.coverImage || (p.images && p.images[0]) || `/api/public/place-photo?name=${encodeURIComponent(p.name || '')}`;
    const checkboxHtml = selectMode ? `<div class="item-checkbox-wrap"><input type="checkbox" class="item-checkbox" data-id="${id}" data-type="${type}" onchange="updateSelectedCount()"></div>` : '';
    
    let footerHtml = '';
    if (tab === 'trash') {
      footerHtml = `
        <button class="btn-batch btn-batch-restore" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="restoreSingle('${type}', '${id}')">Khôi phục</button>
        <button class="btn-batch btn-batch-delete" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="deletePermanentlySingle('${type}', '${id}')">Xóa vĩnh viễn</button>
      `;
    } else {
      const showBookNow = isServicePlace(p);
      footerHtml = `
        <button class="btn-action" style="color:#64748b; font-weight:700; background:none; border:none; cursor:pointer; ${!showBookNow ? 'flex:1; text-align:center; padding:6px 0;' : ''}" onclick="doAction('view_place','${p._id}')">Chi tiết</button>
        ${showBookNow ? `<button class="btn-action" style="background:var(--accent); color:#fff; border:none; padding:6px 15px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="doAction('view_place','${p._id}')">Đặt ngay</button>` : ''}
      `;
    }

    return `
      <div class="v-card ${selectMode ? 'select-mode-active' : ''}" onclick="handleCardClick('${id}', '${type}', event)">
        <div class="v-img-wrap">
          ${checkboxHtml}
          <img src="${imgUrl}" onerror="this.onerror=null;this.src='/assets/wanderviet-logo-cropped-rounded.png';">
          <div class="v-badge-top">⭐ ${p.ratingAvg||5}</div>
        </div>
        <div class="v-body">
          <p class="v-cat">${p.category || (isServicePlace(p) ? 'Dịch vụ' : 'Địa điểm')}</p>
          <h4 class="v-title">${p.name}</h4>
          <div class="v-meta"><span>📍 ${p.region}</span></div>
        </div>
        <div class="v-footer">
          ${footerHtml}
        </div>
      </div>`; 
  }

  function cardB(b) { 
    const id = b._id || b.bookingId;
    const type = tab === 'trash' ? b._historyType : tab;
    const pl=placeMap[b.placeId]||{}; const [l,c]=STATUS[b.status]||[b.status,'info'];
    const isUnpaid = !isOnlinePaid(b) && b.status !== 'cancelled';
    const isDone = b.status === 'completed';
    const imgUrl = pl.image || pl.coverImage || (pl.images && pl.images[0]) || `/api/public/place-photo?name=${encodeURIComponent(b.placeName || 'Dịch vụ')}`;
    const checkboxHtml = selectMode ? `<div class="item-checkbox-wrap"><input type="checkbox" class="item-checkbox" data-id="${id}" data-type="${type}" onchange="updateSelectedCount()"></div>` : '';

    let footerHtml = '';
    if (tab === 'trash') {
      footerHtml = `
        <button class="btn-batch btn-batch-restore" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="restoreSingle('${type}', '${id}')">Khôi phục</button>
        <button class="btn-batch btn-batch-delete" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="deletePermanentlySingle('${type}', '${id}')">Xóa vĩnh viễn</button>
      `;
    } else {
      footerHtml = `
        ${isUnpaid ? `<button class="btn-action" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:800; cursor:pointer; flex:1;" onclick="doAction('pay','${b.bookingId}')">THANH TOÁN NGAY</button>` : `<button class="btn-action" style="background:#f1f5f9; color:#1e293b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; flex:1;" onclick="doAction('view_place','${b.placeId}')">Xem dịch vụ</button>`}
        ${isDone ? `<button class="btn-action" style="background:#f5f3ff; color:var(--accent); border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; margin-left:10px;" onclick="doAction('review','${b.bookingId}')">Đánh giá</button>` : ''}
      `;
    }

    return `
      <div class="v-card ${selectMode ? 'select-mode-active' : ''}" onclick="handleCardClick('${id}', '${type}', event)">
        <div class="v-img-wrap">
          ${checkboxHtml}
          <img src="${imgUrl}" onerror="this.onerror=null;this.src='/assets/wanderviet-logo-cropped-rounded.png';">
          <div class="v-status-tag tag-${c}">${l}</div>
        </div>
        <div class="v-body">
          <p class="v-cat">${pl.category||'Dịch vụ'}</p>
          <h4 class="v-title">${b.placeName}</h4>
          <div class="v-meta"><span>📅 ${fmtD(b.useDate)}</span><span style="color:${isUnpaid?'#ef4444':'#10b981'}">${isOnlinePaid(b)?'Đã thanh toán':'Chưa thanh toán'}</span></div>
        </div>
        <div class="v-footer">
          ${footerHtml}
        </div>
      </div>`;
  }

  function cardT(t) { 
    const id = t._id;
    const type = tab === 'trash' ? t._historyType : tab;
    const [l,c] = STATUS[t.status] || ['Đang lên lịch', 'info'];
    const checkboxHtml = selectMode ? `<div class="item-checkbox-wrap"><input type="checkbox" class="item-checkbox" data-id="${id}" data-type="${type}" onchange="updateSelectedCount()"></div>` : '';
    
    let footerHtml = '';
    if (tab === 'trash') {
      footerHtml = `
        <div class="v-footer" style="padding:0; border:none; margin-top:15px; gap:10px; display:flex;">
          <button class="btn-batch btn-batch-restore" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="restoreSingle('${type}', '${id}')">Khôi phục</button>
          <button class="btn-batch btn-batch-delete" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="deletePermanentlySingle('${type}', '${id}')">Xóa vĩnh viễn</button>
        </div>
      `;
    } else {
      footerHtml = `<button style="width:100%; background:var(--accent); color:#fff; border:none; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;" onclick="doAction('view_trip','${t._id}')">MỞ BẢN ĐỒ</button>`;
    }

    return `
      <div class="v-card ${selectMode ? 'select-mode-active' : ''}" style="border-left: 5px solid var(--accent); position: relative;" onclick="handleCardClick('${id}', '${type}', event)">
        ${checkboxHtml}
        <div class="v-body" style="padding: 25px 25px 25px ${selectMode ? '48px' : '25px'};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div class="v-status-tag tag-${c}" style="position: static; margin-left: ${selectMode ? '23px' : '0'};">${l}</div>
            <span style="font-size: 0.7rem; color: #94a3b8; margin-left: auto;">#${t._id.slice(-6).toUpperCase()}</span>
          </div>
          <h4 class="v-title">Chuyến đi ${t.destination}</h4>
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="font-size: 0.85rem; font-weight: 700;">🕒 ${t.days} Ngày</div>
            <div style="font-size: 0.85rem; font-weight: 700;">👥 ${t.companion || 'Chưa rõ'}</div>
          </div>
          ${footerHtml}
        </div>
      </div>`; 
  }

  function cardR(b) {
    const id = b._id || b.bookingId;
    const type = tab === 'trash' ? b._historyType : tab;
    const pl = placeMap[b.placeId] || {};
    const [l, c] = STATUS[b.status] || [b.status, 'info'];
    const isUnpaid = !isOnlinePaid(b) && b.status !== 'cancelled';
    const isDone = b.status === 'completed';
    const imgUrl = pl.image || pl.coverImage || (pl.images && pl.images[0]) || `/api/public/place-photo?name=${encodeURIComponent(b.placeName || 'Thuê xe')}`;
    const checkboxHtml = selectMode ? `<div class="item-checkbox-wrap"><input type="checkbox" class="item-checkbox" data-id="${id}" data-type="${type}" onchange="updateSelectedCount()"></div>` : '';

    let footerHtml = '';
    if (tab === 'trash') {
      footerHtml = `
        <button class="btn-batch btn-batch-restore" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="restoreSingle('${type}', '${id}')">Khôi phục</button>
        <button class="btn-batch btn-batch-delete" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="deletePermanentlySingle('${type}', '${id}')">Xóa vĩnh viễn</button>
      `;
    } else {
      footerHtml = `
        ${isUnpaid ? `<button class="btn-action" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:800; cursor:pointer; flex:1;" onclick="doAction('pay','${b.bookingId}')">THANH TOÁN NGAY</button>` : `<button class="btn-action" style="background:#f1f5f9; color:#1e293b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; flex:1;" onclick="doAction('view_place','${b.placeId}')">Xem dịch vụ</button>`}
        ${isDone ? `<button class="btn-action" style="background:#fff7ed; color:#f59e0b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; margin-left:10px;" onclick="doAction('review','${b.bookingId}')">Đánh giá</button>` : ''}
      `;
    }

    return `
      <div class="v-card ${selectMode ? 'select-mode-active' : ''}" onclick="handleCardClick('${id}', '${type}', event)">
        <div class="v-img-wrap">
          ${checkboxHtml}
          <img src="${imgUrl}" onerror="this.onerror=null;this.src='/assets/wanderviet-logo-cropped-rounded.png';">
          <div class="v-status-tag tag-${c}">${l}</div>
          <div class="v-badge-top">🚗 Thuê xe</div>
        </div>
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
          ${footerHtml}
        </div>
      </div>`;
  }

  function cardX(t) { 
    const id = t._id;
    const type = tab === 'trash' ? t._historyType : tab;
    const b = bookingMap[t.bookingId]; 
    const pl = b ? (placeMap[b.placeId] || {}) : {};
    let imgUrl = LOGO;
    if (t.type !== 'upgrade') {
      imgUrl = pl.image || pl.coverImage || (pl.images && pl.images[0]) || `/api/public/place-photo?name=${encodeURIComponent(t.placeName || b?.placeName || '')}`;
    }
    const checkboxHtml = selectMode ? `<div class="item-checkbox-wrap"><input type="checkbox" class="item-checkbox" data-id="${id}" data-type="${type}" onchange="updateSelectedCount()"></div>` : '';

    let footerHtml = '';
    if (tab === 'trash') {
      footerHtml = `
        <button class="btn-batch btn-batch-restore" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="restoreSingle('${type}', '${id}')">Khôi phục</button>
        <button class="btn-batch btn-batch-delete" style="flex:1; border:none; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="deletePermanentlySingle('${type}', '${id}')">Xóa vĩnh viễn</button>
      `;
    } else {
      footerHtml = `<button style="width:100%; background:#fff; border:1px solid #e2e8f0; padding:8px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="WanderUI.showToast('Đang tải hóa đơn...','success')">Tải hóa đơn PDF</button>`;
    }

    return `
      <div class="v-card ${selectMode ? 'select-mode-active' : ''}" onclick="handleCardClick('${id}', '${type}', event)">
        <div class="v-img-wrap">
          ${checkboxHtml}
          <img src="${imgUrl}" onerror="this.onerror=null;this.src='/assets/wanderviet-logo-cropped-rounded.png';">
          <div class="v-badge-top">${fmtVND(t.amount)}</div>
        </div>
        <div class="v-body">
          <p class="v-cat" style="color:${t.type==='refund'?'#10b981':'var(--accent)'}">${t.type.toUpperCase()}</p>
          <h4 class="v-title">${t.description}</h4>
          <div class="v-meta">🕒 ${fmtD(t.createdAt)}</div>
        </div>
        <div class="v-footer">
          ${footerHtml}
        </div>
      </div>`; 
  }

  function cardA(a) { 
    const id = a._id;
    const type = tab === 'trash' ? a._historyType : tab;
    const checkboxHtml = selectMode ? `<div class="item-checkbox-wrap" style="top: 12px; left: 12px; width: 22px; height: 22px;"><input type="checkbox" class="item-checkbox" data-id="${id}" data-type="${type}" onchange="updateSelectedCount()"></div>` : '';

    let actionsHtml = '';
    if (tab === 'trash') {
      actionsHtml = `
        <div style="margin-top: 8px; font-size: 0.8rem; display: flex; gap: 12px;">
          <span style="color:var(--primary); font-weight:700; cursor:pointer;" onclick="restoreSingle('${type}', '${id}')">Khôi phục</span>
          <span style="color:#ef4444; font-weight:700; cursor:pointer;" onclick="deletePermanentlySingle('${type}', '${id}')">Xóa vĩnh viễn</span>
        </div>
      `;
    }

    return `
      <div class="act-log">
        <div class="act-dot"></div>
        <div class="act-info ${selectMode ? 'select-mode-active' : ''}" style="position: relative;" onclick="handleCardClick('${id}', '${type}', event)">
          ${checkboxHtml}
          <div style="padding-left: ${selectMode ? '32px' : '0'};">
            <p class="act-time">${fmtDT(a.timestamp)}</p>
            <p class="act-txt">${a.description}</p>
            ${actionsHtml}
          </div>
        </div>
      </div>`; 
  }

  init();
})();
