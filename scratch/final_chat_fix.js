const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the old/faulty fullscreen check block
content = content.replace(/console\.log\('🤖 Chatbot Init: Fullscreen Check for', window\.location\.pathname\); if \(window\.location\.pathname\.includes\('chatbot\.html'\)\) \{[\s\S]+?\}/, '');

// 2. Comprehensive Expand/Shrink/Auto-open logic
const comprehensiveChatLogic = `
    // --- COMPREHENSIVE CHAT LOGIC (Expand/Shrink/Auto-open) ---
    const expandBtn = document.getElementById('global-chat-expand-btn');
    const isChatPage = window.location.pathname.includes('chatbot.html');

    if (isChatPage) {
      console.log('🚀 Entering Fullscreen Mode');
      // Move panel to body to avoid header clipping
      document.body.appendChild(panel);
      panel.hidden = false;
      panel.classList.add('chat-panel--fullscreen');
      if (fabWrap) fabWrap.style.display = 'none';

      if (expandBtn) {
        expandBtn.innerHTML = '⤓';
        expandBtn.title = 'Thu nhỏ';
        expandBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'index.html?openchat=true';
        };
      }
    } else {
      // Logic for regular pages
      if (expandBtn) {
        expandBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'chatbot.html';
        };
      }
      // Auto-open if requested
      if (window.location.search.includes('openchat=true')) {
        panel.hidden = false;
        fab.setAttribute('aria-expanded', 'true');
      }
    }
`;

// 3. Inject it where expandBtn was originally handled
content = content.replace(
    /\/\/ Expand Button[\s\S]+?if \(expandBtn\) \{[\s\S]+?\}\s+?\}\s+?\}/,
    comprehensiveChatLogic + '\n    }'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Applied comprehensive chat logic fix to SharedUI.js");
