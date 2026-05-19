const fs = require('fs');
const path = require('path');

const jsFile = path.join(__dirname, '../apps/user-web/js/history.js');
let js = fs.readFileSync(jsFile, 'utf8');

// ── Fix 1: "Xem dịch vụ" dùng place-detail.html thay vì navigator.html ──
const oldViewPlace = `if (action === 'view_place') window.location.href = \`navigator.html?placeId=\${id}\`;`;
const newViewPlace = `if (action === 'view_place') window.location.href = \`place-detail.html?id=\${id}\`;`;

if (js.includes(oldViewPlace)) {
  js = js.replace(oldViewPlace, newViewPlace);
  console.log('Fix 1: navigator.html → place-detail.html ✓');
} else {
  console.warn('Fix 1: không tìm thấy đoạn navigator.html');
}

// ── Fix 2: Nhận diện "rental" bằng nhiều cách (businessCategory hoặc kind) ──
// Hiện tại chỉ dùng booking.businessCategory, nhưng booking cũ có thể null/other
// Thêm logic fallback: kiểm tra place.kind === 'thue-xe' hoặc place.businessCategory === 'rental'

const oldNonRentalsFilter = `        const nonRentals = rB.data.filter(b => b.businessCategory !== 'rental');
        const rentals = rB.data.filter(b => b.businessCategory === 'rental');`;
const newNonRentalsFilter = `        const isRental = (b) => {
          if (b.businessCategory === 'rental') return true;
          const pl = placeMap[b.placeId] || {};
          return pl.businessCategory === 'rental' || pl.kind === 'thue-xe';
        };
        const nonRentals = rB.data.filter(b => !isRental(b));
        const rentals = rB.data.filter(b => isRental(b));`;

if (js.includes(oldNonRentalsFilter)) {
  js = js.replace(oldNonRentalsFilter, newNonRentalsFilter);
  console.log('Fix 2a: isRental() helper with fallback ✓');
} else {
  console.warn('Fix 2a: không tìm thấy đoạn filter count');
}

// Fix loadTab cũng cần dùng isRental helper
const oldRentalsTab = `        if (tab === 'rentals') {
          allData = j.success ? j.data.filter(b => b.businessCategory === 'rental') : [];
        } else if (tab === 'bookings') {
          allData = j.success ? j.data.filter(b => b.businessCategory !== 'rental') : [];
        } else {`;
const newRentalsTab = `        if (tab === 'rentals') {
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
        } else {`;

if (js.includes(oldRentalsTab)) {
  js = js.replace(oldRentalsTab, newRentalsTab);
  console.log('Fix 2b: loadTab rental filter with fallback ✓');
} else {
  console.warn('Fix 2b: không tìm thấy đoạn loadTab filter');
}

fs.writeFileSync(jsFile, js, 'utf8');
console.log('\n✅ history.js đã được cập nhật!');
