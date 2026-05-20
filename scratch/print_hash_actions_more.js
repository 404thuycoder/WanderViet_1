const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/main.js', 'utf8');
const lines = content.split('\n');

console.log('--- main.js handleHashActions ---');
for (let i = 3700; i < 3760; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
