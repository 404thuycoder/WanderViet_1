const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// Refine Shrink logic to ensure it returns to the small floating view on index.html
const refinedShrinkLogic = `
    if (window.location.pathname.includes('chatbot.html')) {
      console.log('🚀 Entering Fullscreen Mode');
      document.body.appendChild(panel);
      panel.hidden = false;
      panel.classList.add('chat-panel--fullscreen');
      if (fabWrap) fabWrap.style.display = 'none';

      if (expandBtn) {
        expandBtn.innerHTML = '⤓';
        expandBtn.title = 'Thu nhỏ';
        expandBtn.onclick = () => {
          // Navigate to index.html and tell it to open the chat
          window.location.href = 'index.html?openchat=true';
        };
      }
    }
`;

// Also add logic to index.html (via SharedUI.js) to auto-open chat if the param is present
const autoOpenLogic = `
    // Auto-open chat if requested via URL param
    if (window.location.search.includes('openchat=true')) {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
    }
`;

// Replace the fullscreen logic
content = content.replace(
    /console\.log\('🤖 Chatbot Init: Fullscreen Check for', window\.location\.pathname\); if \(window\.location\.pathname\.includes\('chatbot\.html'\)\) \{[\s\S]+?\}\s+?\}\s+?\}/,
    refinedShrinkLogic + '\n    }\n    ' + autoOpenLogic + '\n  }'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Refined Shrink logic and added auto-open support in SharedUI.js");
