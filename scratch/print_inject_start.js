const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/SharedUI.js', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(line => line.includes('function injectCommonComponents('));
if (startIdx !== -1) {
  for (let i = startIdx; i < startIdx + 80; i++) {
    if (lines[i] !== undefined) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
}
