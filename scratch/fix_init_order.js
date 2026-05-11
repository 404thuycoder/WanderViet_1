const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// Fix 1: Never override shared cache with server history on load
// The bug: loadChatHistory() clears log.innerHTML and fills with server data,
// erasing the shared cache messages already loaded by loadSharedChat()
const oldInit = `    // Welcome message or resume session
    setTimeout(() => {
      loadSharedChat(); // Load instantly from cache
      if (currentSessionId) {
        loadChatHistory(currentSessionId); // Sync with server in background
      }
    }, 100);`;

const newInit = `    // Welcome message or resume session
    // Priority: shared cache (ensures expand/shrink sync) > server history > welcome
    setTimeout(() => {
      const _sharedCache = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');
      if (_sharedCache.length > 0) {
        // Has cached messages from small panel — restore them in fullscreen too
        loadSharedChat();
      } else if (currentSessionId) {
        // No local cache — load from server history
        loadChatHistory(currentSessionId);
      } else {
        // Fresh start
        loadSharedChat();
      }
    }, 100);`;

if (content.includes(oldInit)) {
    content = content.replace(oldInit, newInit);
    console.log("✅ Init logic fixed");
} else {
    console.log("❌ Could not find init block. Trying raw replace...");
    // Try a simpler match
    content = content.replace(
        'loadSharedChat(); // Load instantly from cache\n      if (currentSessionId) {\n        loadChatHistory(currentSessionId); // Sync with server in background\n      }\n    }, 100);',
        `const _sharedCache = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');\n      if (_sharedCache.length > 0) {\n        loadSharedChat();\n      } else if (currentSessionId) {\n        loadChatHistory(currentSessionId);\n      } else {\n        loadSharedChat();\n      }\n    }, 100);`
    );
    console.log("Tried raw replace");
}

// Fix 2: loadChatHistory should NOT clear shared cache
// Make loadChatHistory NOT call localStorage.removeItem for wander_shared_chat
// Instead use a separate key for server session

fs.writeFileSync(path, content, 'utf8');
console.log("Saved SharedUI.js");
