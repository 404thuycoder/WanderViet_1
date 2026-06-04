const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../../apps/admin-web/index.html');
let content = fs.readFileSync(file, 'utf8');

const target = '<select id="place-category-filter"';
const startIdx = content.indexOf(target);

if (startIdx === -1) {
  console.error('Target select not found');
  process.exit(1);
}

const endSelect = content.indexOf('</select>', startIdx);
if (endSelect === -1) {
  console.error('End select not found');
  process.exit(1);
}

const oldSelect = content.substring(startIdx, endSelect + 9);
const newSelect = `<select id="place-category-filter" class="admin-search-input" style="max-width: 150px; height: 36px; padding: 0 0.75rem; font-size: 0.85rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;">
                  <option value="all">Loại: Tất cả</option>
                  <option value="diem-du-lich">Điểm du lịch</option>
                  <option value="khach-san">Lưu trú</option>
                  <option value="nha-hang">Ẩm thực</option>
                  <option value="tour">Tour du lịch</option>
                  <option value="dich-vu">Dịch vụ</option>
                  <option value="trai-nghiem">Trải nghiệm</option>
                </select>`;

content = content.replace(oldSelect, newSelect);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully replaced place-category-filter options in index.html programmatically!');
