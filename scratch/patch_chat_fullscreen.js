const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

const fullscreenLogic = `
    if (window.location.pathname.includes('chatbot.html')) {
      panel.hidden = false;
      panel.classList.add('chat-panel--fullscreen');
      // Hide the floating FAB wrapper completely
      if (fabWrap) fabWrap.style.display = 'none';
    }
`;

// Inject after panel assignment in initGlobalChatbot
content = content.replace(
    "const log = document.getElementById('global-chat-log');",
    "const log = document.getElementById('global-chat-log');" + fullscreenLogic
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fullscreen logic injected into SharedUI.js");
