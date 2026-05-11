const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    "if (window.location.pathname.includes('chatbot.html')) {",
    "console.log('🤖 Chatbot Init: Fullscreen Check for', window.location.pathname); if (window.location.pathname.includes('chatbot.html')) {"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added logging to SharedUI.js");
