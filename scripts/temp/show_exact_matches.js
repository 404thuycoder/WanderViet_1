const fs = require('fs');
const path = require('path');

const files = [
  'apps/business-web/pages/dashboard.html',
  'apps/user-web/js/main.js',
  'apps/user-web/js/places-data.js',
  'scripts/db/importPlaces.js',
  'scripts/db/repairPartnerImages.js',
  'scripts/db/seedPlaces.js'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, '../..', f);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  console.log(`\n=== Matches in ${f} ===`);
  lines.forEach((line, idx) => {
    if (/Anh Thủy|Thủy Phi Cơ|Luxury Dinner|Câu Mực/i.test(line)) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
