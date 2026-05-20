
const fs = require('fs');
const f = 'f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\payment.html';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("Há»§y bá»  giao dá»‹ch", "Hủy bỏ giao dịch");
content = content.replace("Hủy bá»  giao dá»‹ch", "Hủy bỏ giao dịch");

fs.writeFileSync(f, content, 'utf8');
console.log('Cancel button text fixed.');
