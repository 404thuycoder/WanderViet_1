const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/chatbot.html';
let content = fs.readFileSync(path, 'utf8');

const v = Date.now();
content = content.replace(/SharedUI\.js\?v=\d+/g, 'SharedUI.js?v=' + v);

if (!content.includes('manual-chat-open')) {
    content = content.replace('</header>', '</header><button id="manual-chat-open" style="position:fixed; bottom:20px; right:20px; z-index:10000; padding:10px 20px; background:#2563eb; color:white; border-radius:30px; border:none; cursor:pointer; font-weight:600;" onclick="const p=document.getElementById(\'global-chat-panel\'); if(p){p.hidden=false; p.style.display=\'flex\'}">Mở Chat thủ công</button>');
}

fs.writeFileSync(path, content, 'utf8');
console.log("Updated chatbot.html with manual fallback");
