
const fs = require('fs');
const f = 'f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\payment.html';
let content = fs.readFileSync(f, 'utf8');

// Replace standard strings in javascript
content = content.replace("document.getElementById('current-bank-label').textContent = 'NgÃ¢n hÃ ng ná»™i Ä‘á»‹a';", "document.getElementById('current-bank-label').textContent = 'Ngân hàng nội địa';");
content = content.replace("document.getElementById('current-bank-label').textContent = 'NgÃ¢n hàng ná»™i đá»‹a';", "document.getElementById('current-bank-label').textContent = 'Ngân hàng nội địa';");

content = content.replace("onclick=\"window.history.back()\">Há»§y bá»  giao dá»‹ch</button>", "onclick=\"window.history.back()\">Hủy bỏ giao dịch</button>");
content = content.replace("onclick=\"window.history.back()\">Hủy bá»  giao dá»‹ch</button>", "onclick=\"window.history.back()\">Hủy bỏ giao dịch</button>");

content = content.replace("Ä ang xá»\u00ad lÃ½...", "Đang xử lý...");
content = content.replace("Đang xá»\u00ad lÃ½...", "Đang xử lý...");
content = content.replace("Đang xá»\u00ad lÃ½...", "Đang xử lý...");

content = content.replace("Thanh toÃ¡n thÃ\u00a0nh cÃ´ng! ðŸŽ‰", "Thanh toán thành công! 🎉");
content = content.replace("Thanh toán thành cÃ´ng! ðŸŽ‰", "Thanh toán thành công! 🎉");
content = content.replace("Thanh toán thành cÃ´ng! 🎉", "Thanh toán thành công! 🎉");

content = content.replace("Thá»\u00ad láº¡i giao dá»‹ch", "Thử lại giao dịch");
content = content.replace("Thá»\u00ad lại giao dá»‹ch", "Thử lại giao dịch");

fs.writeFileSync(f, content, 'utf8');
console.log('JS Strings Replaced successfully.');
