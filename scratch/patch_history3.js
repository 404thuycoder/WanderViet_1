const fs = require('fs');
const path = require('path');

const jsFile = path.join(__dirname, '../apps/user-web/js/history.js');
let js = fs.readFileSync(jsFile, 'utf8');

// Fix 1: EP endpoint cho rentals — không cần ?type=rental nữa, dùng /api/bookings/my như bookings
// vì client-side sẽ filter theo businessCategory và placeMap
const oldEP = `const EP = { bookings:'/api/bookings/my', rentals:'/api/bookings/my?type=rental', trips:'/api/planner/my-trips', transactions:'/api/payments/transactions', activities:'/api/activities/my' };`;
const newEP = `const EP = { bookings:'/api/bookings/my', rentals:'/api/bookings/my', trips:'/api/planner/my-trips', transactions:'/api/payments/transactions', activities:'/api/activities/my' };`;

if (js.includes(oldEP)) {
  js = js.replace(oldEP, newEP);
  console.log('Fix EP map ✓');
} else {
  console.warn('EP map: không tìm thấy, có thể đã đúng rồi');
}

// Fix 2: Thêm version cache buster mới để buộc browser reload JS
// Trong HTML đổi ?v=6.0 → ?v=6.1
fs.writeFileSync(jsFile, js, 'utf8');
console.log('history.js saved ✓');

// Fix HTML version
const htmlFile = path.join(__dirname, '../apps/user-web/history.html');
let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace('history.js?v=6.0', 'history.js?v=6.1');
fs.writeFileSync(htmlFile, html, 'utf8');
console.log('HTML version bump: history.js?v=6.1 ✓');

console.log('\n✅ Done!');
