const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// Update the fullscreen logic to include a "Shrink" button
const shrinkLogic = `
    console.log('🤖 Chatbot Init: Fullscreen Check for', window.location.pathname); 
    if (window.location.pathname.includes('chatbot.html')) {
      console.log('🚀 Entering Fullscreen Mode');
      document.body.appendChild(panel);
      panel.hidden = false;
      panel.classList.add('chat-panel--fullscreen');
      if (fabWrap) fabWrap.style.display = 'none';

      // Update Expand button to become a Shrink button
      if (expandBtn) {
        expandBtn.innerHTML = '⤓';
        expandBtn.title = 'Thu nhỏ';
        expandBtn.onclick = () => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = 'index.html';
          }
        };
      }
    }
`;

// Replace the previous fullscreen logic block
content = content.replace(
    /console\.log\('🤖 Chatbot Init: Fullscreen Check for', window\.location\.pathname\); if \(window\.location\.pathname\.includes\('chatbot\.html'\)\) \{[\s\S]+?\}\s+?\}\s+?\}/,
    shrinkLogic + '\n    }\n  }'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated SharedUI.js with Shrink functionality");
