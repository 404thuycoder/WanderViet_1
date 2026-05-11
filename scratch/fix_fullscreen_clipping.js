const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// Update the fullscreen logic to move the panel to body
const newFullscreenLogic = `
    console.log('🤖 Chatbot Init: Fullscreen Check for', window.location.pathname); 
    if (window.location.pathname.includes('chatbot.html')) {
      console.log('🚀 Entering Fullscreen Mode');
      // Move panel to body to avoid header clipping/stacking issues
      document.body.appendChild(panel);
      panel.hidden = false;
      panel.classList.add('chat-panel--fullscreen');
      // Hide the floating FAB wrapper completely
      if (fabWrap) fabWrap.style.display = 'none';
    }
`;

// Replace the old block (including the logging I added)
content = content.replace(
    /console\.log\('🤖 Chatbot Init: Fullscreen Check for', window\.location\.pathname\); if \(window\.location\.pathname\.includes\('chatbot\.html'\)\) \{[\s\S]+?\}/,
    newFullscreenLogic
);

fs.writeFileSync(path, content, 'utf8');
console.log("Moved chatbot panel to body in SharedUI.js for fullscreen mode");
