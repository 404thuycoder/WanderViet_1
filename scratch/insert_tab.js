const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'apps', 'user-web', 'planner.html');
let html = fs.readFileSync(filePath, 'utf-8');

// Xem xem spotReviewTab đã có trong file chưa (để tránh bị trùng lặp)
if (html.includes('id="spotReviewTab"')) {
  console.log('⚠️ spotReviewTab is already present in the file. Removing duplicate checks...');
  // Xóa bất kỳ instance cũ nào nếu có để chèn chuẩn xác
  html = html.replace(/<div id="spotReviewTab"[\s\S]*?<\/div>/g, '');
}

// Chèn spotReviewTab mới vào ngay dưới thẻ đóng của column 2 (.v2-dest-directory)
const targetPattern = `                    <div id="reviewPanelSpots" style="flex:1; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:0.4rem; padding-right:2px; margin-top:0.25rem;">
                      <!-- Injected via JS -->
                    </div>
                  </div>`;

// Thử tìm mẫu lỏng lẻo hơn (không phụ thuộc khoảng trắng chính xác)
const loosePattern = `id="reviewPanelSpots" style="flex:1; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:0.4rem; padding-right:2px; margin-top:0.25rem;">\r\n                      <!-- Injected via JS -->\r\n                    </div>\r\n                  </div>`;
const loosePatternLF = `id="reviewPanelSpots" style="flex:1; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:0.4rem; padding-right:2px; margin-top:0.25rem;">\n                      <!-- Injected via JS -->\n                    </div>\n                  </div>`;

let found = false;

const injectionText = `\n                  <!-- PREMIUM OVERLAY DETAIL PANEL -->\n                  <div id="spotReviewTab" class="spot-review-tab" style="display:none;"></div>`;

if (html.includes(targetPattern)) {
  html = html.replace(targetPattern, targetPattern + injectionText);
  found = true;
  console.log('✅ Pattern 1: Inserted spotReviewTab successfully!');
} else if (html.includes(loosePattern)) {
  html = html.replace(loosePattern, loosePattern + injectionText);
  found = true;
  console.log('✅ Pattern 2 (CRLF): Inserted spotReviewTab successfully!');
} else if (html.includes(loosePatternLF)) {
  html = html.replace(loosePatternLF, loosePatternLF + injectionText);
  found = true;
  console.log('✅ Pattern 3 (LF): Inserted spotReviewTab successfully!');
} else {
  // Dự phòng: Tìm phần kết thúc của reviewPanelSpots bằng regex
  const regex = /(id="reviewPanelSpots"[\s\S]*?<\/div>\s*<\/div>)/;
  if (regex.test(html)) {
    html = html.replace(regex, `$1${injectionText}`);
    found = true;
    console.log('✅ Pattern 4 (Regex): Inserted spotReviewTab successfully!');
  }
}

if (found) {
  // Kiểm tra xem đã chèn thành công chưa
  console.log('Verification: Has spotReviewTab:', html.includes('id="spotReviewTab"'));
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log('🎉 Successfully saved changes!');
} else {
  console.log('❌ Failed to find injection point for spotReviewTab!');
}
