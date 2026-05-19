const fs = require('fs');
const path = require('path');

// ── Patch history.html ──────────────────────────────────────────────
const htmlFile = path.join(__dirname, '../apps/user-web/history.html');
let html = fs.readFileSync(htmlFile, 'utf8');

// Tìm đoạn nav-item bookings và thêm rental sau nó
const bookingNavPattern = /(<div class="nav-item" data-tab="bookings">[\s\S]*?<\/div>\s*<\/div>)/;
const rentalNav = `$1\n        <div class="nav-item" data-tab="rentals">\n          <span>🚗</span> <span>Thuê xe</span> <span class="nav-count" id="count-rentals">0</span>\n        </div>`;

if (html.includes('data-tab="rentals"')) {
  console.log('HTML: tab rentals đã tồn tại, bỏ qua.');
} else {
  html = html.replace(bookingNavPattern, rentalNav);
  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log('HTML: Đã thêm tab Thuê xe ✓');
}

// ── Patch history.js ────────────────────────────────────────────────
const jsFile = path.join(__dirname, '../apps/user-web/js/history.js');
let js = fs.readFileSync(jsFile, 'utf8');

// 1. Thêm 'rentals' vào EP map trong loadTab
const oldEP = `const EP = { bookings:'/api/bookings/my', trips:'/api/planner/my-trips', transactions:'/api/payments/transactions', activities:'/api/activities/my' };`;
const newEP = `const EP = { bookings:'/api/bookings/my', rentals:'/api/bookings/my?type=rental', trips:'/api/planner/my-trips', transactions:'/api/payments/transactions', activities:'/api/activities/my' };`;

// 2. Tab title map — thêm rentals
const oldTitle = `{ wishlist:'Yêu thích', bookings:'Đặt chỗ', trips:'Hành trình AI', transactions:'Giao dịch', activities:'Hoạt động' }[tab]`;
const newTitle = `{ wishlist:'Yêu thích', bookings:'Đặt chỗ', rentals:'Thuê xe / Đặt xe', trips:'Hành trình AI', transactions:'Giao dịch', activities:'Hoạt động' }[tab]`;

// 3. renderList — thêm branch rentals
const oldRenderBranch = `        if(tab==='bookings') return cardB(item);`;
const newRenderBranch = `        if(tab==='bookings') return cardB(item);\n        if(tab==='rentals') return cardR(item);`;

// 4. updateDynamicSidebar — thêm bộ lọc cho tab rentals
const oldSidebarRentals = `    if (tab==='bookings') {
      addS('Dịch vụ', [{id:'all',lb:'Tất cả'},{id:'Lưu trú Elite',lb:'Khách sạn'},{id:'Ẩm thực & Giải trí',lb:'Nhà hàng'},{id:'Trải nghiệm Tour',lb:'Tour'}], fCat,'cat');
      addS('Thanh toán', [{id:'all',lb:'Tất cả'},{id:'paid',lb:'Đã thanh toán'},{id:'unpaid',lb:'Chưa thanh toán'}], fPay,'pay');
    } else if (tab==='trips') {`;
const newSidebarRentals = `    if (tab==='bookings') {
      addS('Dịch vụ', [{id:'all',lb:'Tất cả'},{id:'Lưu trú Elite',lb:'Khách sạn'},{id:'Ẩm thực & Giải trí',lb:'Nhà hàng'},{id:'Trải nghiệm Tour',lb:'Tour'}], fCat,'cat');
      addS('Thanh toán', [{id:'all',lb:'Tất cả'},{id:'paid',lb:'Đã thanh toán'},{id:'unpaid',lb:'Chưa thanh toán'}], fPay,'pay');
    } else if (tab==='rentals') {
      addS('Loại xe', [{id:'all',lb:'Tất cả'},{id:'motorbike',lb:'Xe máy'},{id:'car',lb:'Ô tô'},{id:'electric',lb:'Xe điện'}], fCat,'cat');
      addS('Thanh toán', [{id:'all',lb:'Tất cả'},{id:'paid',lb:'Đã thanh toán'},{id:'unpaid',lb:'Chưa thanh toán'}], fPay,'pay');
    } else if (tab==='trips') {`;

// 5. loadGlobalStats — thêm count rentals
const oldCountSection = `      if (rB.success) {
        $('#count-bookings').textContent = rB.data.length;
        rB.data.forEach(b => { bookingMap[b.bookingId] = b; bookingMap[b._id] = b; });
        if (rB.data.some(b => b.status === 'pending')) $('#pending-dot').style.display = 'block';
      }`;
const newCountSection = `      if (rB.success) {
        const nonRentals = rB.data.filter(b => b.businessCategory !== 'rental');
        const rentals = rB.data.filter(b => b.businessCategory === 'rental');
        $('#count-bookings').textContent = nonRentals.length;
        $('#count-rentals').textContent = rentals.length;
        rB.data.forEach(b => { bookingMap[b.bookingId] = b; bookingMap[b._id] = b; });
        if (rB.data.some(b => b.status === 'pending')) $('#pending-dot').style.display = 'block';
      }`;

// 6. loadTab — lọc dữ liệu rentals từ bookings API
const oldLoadTabFetch = `      else {
        const r = await fetch(EP[tab], { headers:{'x-auth-token':T} });
        const j = await r.json();
        allData = j.success ? j.data : [];
      }`;
const newLoadTabFetch = `      else {
        const r = await fetch(EP[tab] || EP['bookings'], { headers:{'x-auth-token':T} });
        const j = await r.json();
        if (tab === 'rentals') {
          allData = j.success ? j.data.filter(b => b.businessCategory === 'rental') : [];
        } else if (tab === 'bookings') {
          allData = j.success ? j.data.filter(b => b.businessCategory !== 'rental') : [];
        } else {
          allData = j.success ? j.data : [];
        }
      }`;

// 7. Card cho thuê xe — thêm trước function cardX
const cardRentalFn = `
  function cardR(b) {
    const pl = placeMap[b.placeId] || {};
    const [l, c] = STATUS[b.status] || [b.status, 'info'];
    const isUnpaid = b.paymentStatus === 'unpaid' && b.status !== 'cancelled';
    const isDone = b.status === 'completed';
    return \`
      <div class="v-card">
        <div class="v-img-wrap"><img src="\${pl.image || LOGO}"><div class="v-status-tag tag-\${c}">\${l}</div><div class="v-badge-top">🚗 Thuê xe</div></div>
        <div class="v-body">
          <p class="v-cat" style="color:#f59e0b">THUÊ XE / ĐẶT XE</p>
          <h4 class="v-title">\${b.placeName}</h4>
          <div class="v-meta">
            <span>📅 \${fmtD(b.useDate)}</span>
            <span>👥 \${b.peopleCount || 1} người</span>
            <span style="color:\${isUnpaid ? '#ef4444' : '#10b981'}">\${b.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
          </div>
          \${b.totalPrice > 0 ? \`<div style="margin-top:10px; font-size:1.1rem; font-weight:800; color:#0f172a">\${fmtVND(b.totalPrice)}</div>\` : ''}
        </div>
        <div class="v-footer">
          \${isUnpaid ? \`<button class="btn-action" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:8px; font-weight:800; cursor:pointer; flex:1;" onclick="doAction('pay','\${b._id}')">THANH TOÁN NGAY</button>\` : \`<button class="btn-action" style="background:#f1f5f9; color:#1e293b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; flex:1;" onclick="doAction('view_place','\${b.placeId}')">Xem dịch vụ</button>\`}
          \${isDone ? \`<button class="btn-action" style="background:#fff7ed; color:#f59e0b; border:none; padding:8px 15px; border-radius:8px; font-weight:700; cursor:pointer; margin-left:10px;" onclick="doAction('review','\${b.bookingId}')">Đánh giá</button>\` : ''}
        </div>
      </div>\`;
  }

`;

let changed = false;

function applyPatch(label, from, to) {
  if (js.includes(from)) {
    js = js.replace(from, to);
    console.log(`JS: ${label} ✓`);
    changed = true;
  } else {
    console.warn(`JS: ${label} — không tìm thấy đoạn cần patch!`);
  }
}

applyPatch('EP map', oldEP, newEP);
applyPatch('tab title', oldTitle, newTitle);
applyPatch('render branch', oldRenderBranch, newRenderBranch);
applyPatch('sidebar rentals filter', oldSidebarRentals, newSidebarRentals);
applyPatch('count rentals', oldCountSection, newCountSection);
applyPatch('loadTab fetch', oldLoadTabFetch, newLoadTabFetch);

// Insert cardR function before cardX
if (!js.includes('function cardR(')) {
  js = js.replace('  function cardX(', cardRentalFn + '  function cardX(');
  console.log('JS: cardR function inserted ✓');
  changed = true;
} else {
  console.log('JS: cardR đã tồn tại, bỏ qua.');
}

if (changed) {
  fs.writeFileSync(jsFile, js, 'utf8');
  console.log('\n✅ Tất cả patches đã được áp dụng thành công!');
} else {
  console.log('\n⚠️  Không có thay đổi nào được thực hiện.');
}
