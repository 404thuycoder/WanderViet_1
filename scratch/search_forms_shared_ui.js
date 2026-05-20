const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/SharedUI.js', 'utf8');
const lines = content.split('\n');

console.log('Searching for login/submit/register forms in SharedUI.js...');
lines.forEach((line, index) => {
  if (line.includes('auth') || line.includes('login') || line.includes('register') || line.includes('forgot')) {
    if (line.includes('form') || line.includes('submit') || line.includes('button') || line.includes('click')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
