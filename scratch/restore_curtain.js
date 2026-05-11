const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// The safety fallback logic for the translation curtain
const curtainFallbackLogic = `
  // WanderViet Translation Curtain Safety Fallback
  (function() {
    const curtainTimeout = setTimeout(() => {
      document.documentElement.classList.remove('translating-curtain');
      console.log("🕒 Translation curtain fallback triggered (1.5s)");
    }, 1500);

    window.addEventListener('load', () => {
      // If page is fully loaded and curtain still there, remove it
      setTimeout(() => {
        document.documentElement.classList.remove('translating-curtain');
      }, 500);
    });

    document.addEventListener('google-translate-finished', () => {
      clearTimeout(curtainTimeout);
      document.documentElement.classList.remove('translating-curtain');
    });
  })();
`;

// Inject at the very beginning of the SharedUI.js content
if (!content.includes('translating-curtain')) {
    content = curtainFallbackLogic + "\n" + content;
}

fs.writeFileSync(path, content, 'utf8');
console.log("Restored translation curtain safety fallback");
