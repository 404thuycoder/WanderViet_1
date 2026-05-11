const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add notranslate
content = content.replace('id="global-chat-panel" class="chat-panel"', 'id="global-chat-panel" class="chat-panel notranslate"');

// 2. Add Expand button
if (!content.includes('id="global-chat-expand-btn"')) {
    content = content.replace(
        '<button type="button" class="btn-icon-sm" title="Chat mới" id="global-chat-new-btn">',
        '<button type="button" class="btn-icon-sm" title="Phóng to" id="global-chat-expand-btn">⤢</button>\n              <button type="button" class="btn-icon-sm" title="Chat mới" id="global-chat-new-btn">'
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log("Patch applied successfully");
