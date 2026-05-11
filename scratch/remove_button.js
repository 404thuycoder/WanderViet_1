const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/chatbot.html';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<button id="manual-chat-open"[\s\S]+?<\/button>/, '');

fs.writeFileSync(path, content, 'utf8');
console.log("Removed manual fallback button successfully");
