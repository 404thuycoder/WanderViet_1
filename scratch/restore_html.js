const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// 1. HTML: Add notranslate and Expand button
content = content.replace(
    '<div id="global-chat-panel" class="chat-panel" hidden>',
    '<div id="global-chat-panel" class="chat-panel notranslate" hidden>'
);
content = content.replace(
    '<button type="button" class="btn-icon-sm" title="Chat mới" id="global-chat-new-btn">',
    '<button type="button" class="btn-icon-sm" title="Phóng to" id="global-chat-expand-btn">⤢</button>\n              <button type="button" class="btn-icon-sm" title="Chat mới" id="global-chat-new-btn">'
);

fs.writeFileSync(path, content, 'utf8');
console.log("HTML changes applied");
