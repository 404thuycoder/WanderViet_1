const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'apps', 'user-web', 'planner.html');
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Sửa CSS của .spot-review-tab để ẩn/hiện thông qua class .active thay vì inline display + !important
const oldCSSPattern = `    .spot-review-tab {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 100 !important;
      border-radius: 1.25rem !important;
      padding: 1.5rem !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 1.2rem !important;
      overflow-y: auto !important;
      backdrop-filter: blur(20px) !important;
      animation: fadeInUpPremium 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;`;

const newCSSPattern = `    .spot-review-tab {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 100 !important;
      border-radius: 1.25rem !important;
      padding: 1.5rem !important;
      display: none !important; /* Ẩn mặc định để tránh chèn ép layout */
      flex-direction: column !important;
      gap: 1.2rem !important;
      overflow-y: auto !important;
      backdrop-filter: blur(20px) !important;
    }
    .spot-review-tab.active {
      display: flex !important;
      animation: fadeInUpPremium 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }`;

if (html.includes(oldCSSPattern)) {
  html = html.replace(oldCSSPattern, newCSSPattern);
  console.log('✅ CSS: Đã cập nhật cơ chế ẩn hiện sang class .active!');
} else {
  console.log('⚠️ Không tìm thấy CSS pattern chính xác, kiểm tra và dùng thay thế đơn giản hơn...');
  // Thay thế đơn giản
  html = html.replace(/display: flex !important;\s*flex-direction: column !important;\s*gap: 1\.2rem !important;\s*overflow-y: auto !important;\s*backdrop-filter: blur\(20px\) !important;\s*animation: cubic-bezier\(0\.16, 1, 0\.3, 1\) forwards !important;/, 'display: none !important;\n      flex-direction: column !important;\n      gap: 1.2rem !important;\n      overflow-y: auto !important;\n      backdrop-filter: blur(20px) !important;\n    }\n    .spot-review-tab.active {\n      display: flex !important;\n      animation: fadeInUpPremium 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;');
}

// 2. Cập nhật hàm showSpotDetails(spot) trong JS để sử dụng classList.add('active') thay vì style.display = 'block'
html = html.replace(
  `      const tab = document.getElementById('spotReviewTab');
      if (!tab) return;
      tab.style.display = 'block';`,
  `      const tab = document.getElementById('spotReviewTab');
      if (!tab) return;
      tab.classList.add('active');`
);
console.log('✅ JS: Đã đổi showSpotDetails sang dùng classList.add("active")');

// 3. Cập nhật HTML phần nút đóng trong showSpotDetails để dùng classList.remove('active')
html = html.replace(
  `onclick="document.getElementById('spotReviewTab').style.display='none';"`,
  `onclick="document.getElementById('spotReviewTab').classList.remove('active');"`
);
console.log('✅ JS: Đã đổi nút đóng sang classList.remove("active")');

// 4. Khắc phục triệt để lỗi Bản đồ Leaflet Map (Đổi window.v2DestMap thành window.v2LeafletMap)
// Tìm và thay thế tất cả các tham chiếu tới window.v2DestMap trong phần showCityAttractions
html = html.replace(/window\.v2DestMap/g, 'window.v2LeafletMap');
html = html.replace(/window\.v2DestMarker/g, 'window.v2LeafletMarker');
console.log('✅ JS: Đã sửa lỗi biến trùng tên ID bằng cách chuyển sang window.v2LeafletMap!');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('\n🎉 Các lỗi hiển thị và bản đồ đã được sửa chữa triệt để!');
