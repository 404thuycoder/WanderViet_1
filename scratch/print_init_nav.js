const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/SharedUI.js', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(line => line.includes('function initNavigation('));
if (startIdx === -1) {
  console.log('initNavigation not found!');
} else {
  console.log(`Found initNavigation at line ${startIdx + 1}`);
  for (let i = startIdx; i < startIdx + 100; i++) {
    if (lines[i]) console.log(`${i + 1}: ${lines[i]}`);
  }
}
