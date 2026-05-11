const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// Use regex to handle CRLF vs LF differences
const result = content.replace(
    /loadSharedChat\(\); \/\/ Load instantly from cache\r?\n\s+if \(currentSessionId\) \{\r?\n\s+loadChatHistory\(currentSessionId\); \/\/ Sync with server in background\r?\n\s+\}/,
    `const _sharedCache = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');\r\n      if (_sharedCache.length > 0) {\r\n        // Has cached messages - restore them (works for expand/shrink sync)\r\n        loadSharedChat();\r\n      } else if (currentSessionId) {\r\n        // No local cache - load from server\r\n        loadChatHistory(currentSessionId);\r\n      } else {\r\n        // Fresh start\r\n        loadSharedChat();\r\n      }`
);

if (result !== content) {
    fs.writeFileSync(path, result, 'utf8');
    console.log("✅ Init order fixed successfully");
} else {
    console.log("❌ Regex did not match");
}
