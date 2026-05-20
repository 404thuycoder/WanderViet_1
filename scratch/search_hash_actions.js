const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/main.js', 'utf8');
const lines = content.split('\n');

console.log('Searching for handleHashActions in main.js...');
lines.forEach((line, index) => {
  if (line.includes('handleHashActions')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
