const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fullscreen Initialization (Move panel to body)
const fullscreenInit = `
    const isChatPage = window.location.pathname.includes('chatbot.html');
    if (isChatPage) {
        document.body.appendChild(panel);
        panel.hidden = false;
        panel.classList.add('chat-panel--fullscreen');
        if (fabWrap) fabWrap.style.display = 'none';
    }
`;
content = content.replace(
    "const log = document.getElementById('global-chat-log');",
    "const log = document.getElementById('global-chat-log');" + fullscreenInit
);

// 2. Expand/Shrink/Auto-open logic
const comprehensiveChatLogic = `
    // --- COMPREHENSIVE CHAT LOGIC (Expand/Shrink/Auto-open) ---
    const expandBtn = document.getElementById('global-chat-expand-btn');
    if (isChatPage) {
      if (expandBtn) {
        expandBtn.innerHTML = '⤓';
        expandBtn.title = 'Thu nhỏ';
        expandBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'index.html?openchat=true';
        };
      }
    } else {
      if (expandBtn) {
        expandBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'chatbot.html';
        };
      }
      if (window.location.search.includes('openchat=true')) {
        panel.hidden = false;
        fab.setAttribute('aria-expanded', 'true');
      }
    }
`;

content = content.replace(
    "if (newBtn) {",
    "if (newBtn) {"
).replace(
    "    // History Button",
    comprehensiveChatLogic + "\n    // History Button"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Logic restored and fixed correctly");
