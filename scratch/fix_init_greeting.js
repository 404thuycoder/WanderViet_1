const fs = require('fs');
const file = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/appendMsg\('Xin chào! Tôi là Trợ lý WanderViệt[^']*?', 'bot'\)/g, "appendMsg(getLocalizedGreeting(), 'bot')");

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacing loadSharedChat greetings.');
