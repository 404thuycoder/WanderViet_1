const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('apps/user-web/index.html', 'utf8');
const oldHtmlBtn = '<button type="button" class="filter-btn" data-biz-filter="nha-hang">🍲 Nhà hàng & Ẩm thực</button>';
const newHtmlBtn = oldHtmlBtn + '\n          <button type="button" class="filter-btn" data-biz-filter="thue-xe">🚗 Thuê xe</button>';

if (html.includes(oldHtmlBtn)) {
  html = html.replace(oldHtmlBtn, newHtmlBtn);
  fs.writeFileSync('apps/user-web/index.html', html, 'utf8');
  console.log('Updated index.html');
} else {
  console.log('Could not find oldHtmlBtn in index.html');
}

// 2. Update business-services.html as well just in case
try {
  let bsHtml = fs.readFileSync('apps/user-web/business-services.html', 'utf8');
  if (bsHtml.includes(oldHtmlBtn)) {
    bsHtml = bsHtml.replace(oldHtmlBtn, newHtmlBtn);
    fs.writeFileSync('apps/user-web/business-services.html', bsHtml, 'utf8');
    console.log('Updated business-services.html');
  }
} catch (e) {}

// 3. Update js/main.js
let js = fs.readFileSync('apps/user-web/js/main.js', 'utf8');
const oldFilter = "if (filter === 'nha-hang') return p.kind === 'nha-hang';";
const newFilter = oldFilter + "\n                if (filter === 'thue-xe') return p.kind === 'thue-xe' || p.businessCategory === 'rental';";

const oldLabel = "else if (p.kind === 'nha-hang' || p.kind === 'giai-tri') catLabel = 'Ẩm thực & Giải trí';";
const newLabel = oldLabel + "\n          else if (p.kind === 'thue-xe' || p.businessCategory === 'rental') catLabel = 'Thuê xe Dịch vụ';";

const oldFallback = "else if (p.kind === 'nha-hang' || p.kind === 'giai-tri') fallbackImg = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';";
const newFallback = oldFallback + "\n          else if (p.kind === 'thue-xe' || p.businessCategory === 'rental') fallbackImg = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80';";

let updatedJs = false;
if (js.includes(oldFilter)) {
  js = js.replace(oldFilter, newFilter);
  updatedJs = true;
} else {
  console.log('Could not find oldFilter in js/main.js');
}

if (js.includes(oldLabel)) {
  js = js.replace(oldLabel, newLabel);
  updatedJs = true;
} else {
  console.log('Could not find oldLabel in js/main.js');
}

if (js.includes(oldFallback)) {
  js = js.replace(oldFallback, newFallback);
  updatedJs = true;
} else {
  console.log('Could not find oldFallback in js/main.js');
}

if (updatedJs) {
  fs.writeFileSync('apps/user-web/js/main.js', js, 'utf8');
  console.log('Updated js/main.js');
}
