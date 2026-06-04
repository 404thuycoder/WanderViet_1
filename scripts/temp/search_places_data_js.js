const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../../apps/user-web/js/places-data.js'), 'utf8');
const lines = content.split('\n');
console.log('Searching places-data.js for "Thủy", "Thùy", "Anh":');
lines.forEach((line, idx) => {
  if (/thủy|thùy|anh/i.test(line)) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
