const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the line that clears session on every page load
// This was causing the chat to reset when navigating between index.html and chatbot.html
content = content.replace("localStorage.removeItem('wander_current_session');", "// localStorage.removeItem('wander_current_session'); // Preserved for sync");
content = content.replace("localStorage.removeItem('wander_shared_chat');", "// localStorage.removeItem('wander_shared_chat'); // Preserved for sync");

// 2. Ensure loadSharedChat() is called on initialization
if (!content.includes('loadSharedChat();')) {
    content = content.replace(
        "let currentSessionId = null;",
        "let currentSessionId = localStorage.getItem('wander_current_session');\n    // Initial load of shared chat content\n    setTimeout(() => { if (typeof loadSharedChat === 'function') loadSharedChat(); }, 100);"
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log("Chat synchronization enabled between small and large views");
