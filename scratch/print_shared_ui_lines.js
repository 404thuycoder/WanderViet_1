const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/SharedUI.js', 'utf8');
const lines = content.split('\n');

console.log('--- SharedUI.js around line 1148 ---');
for (let i = 1130; i < 1250; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

console.log('\n--- SharedUI.js around line 4102 ---');
for (let i = 4090; i < 4180; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
