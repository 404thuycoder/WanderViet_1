const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/SharedUI.js', 'utf8');
const lines = content.split('\n');
console.log('Searching for "Tài khoản" in SharedUI.js...');
lines.forEach((line, index) => {
  if (line.includes('Tài khoản') || line.includes('auth-panel') || line.includes('modal-auth') || line.includes('Quên mật khẩu')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
