const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/user-web/js/places-data.js');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('sa-pa')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
