const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// Update appendMsg to ALWAYS save to wander_shared_chat for persistence
const updatedAppendMsg = `
    function appendMsg(text, role, isHTML = false, skipCache = false) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-msg ' + (role === 'user' ? 'user-msg' : 'bot-msg');
      if (isHTML) msgDiv.innerHTML = '<div class="msg-content">' + text + '</div>';
      else msgDiv.textContent = text;
      log.appendChild(msgDiv);
      log.scrollTop = log.scrollHeight;

      // Save to shared cache for cross-page persistence
      if (!skipCache) {
        const cache = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');
        cache.push({ text, role, isHTML });
        // Keep only last 50 messages to avoid bloat
        if (cache.length > 50) cache.shift();
        localStorage.setItem('wander_shared_chat', JSON.stringify(cache));
      }
    }
`;

// Replace the old appendMsg function
// It's usually defined inside initGlobalChatbot
content = content.replace(
    /function appendMsg\(text, role, isHTML = false, skipCache = false\) \{[\s\S]+?log\.scrollTop = log\.scrollHeight;\s+\}/,
    updatedAppendMsg
);

fs.writeFileSync(path, content, 'utf8');
console.log("Improved appendMsg to support real-time cross-page synchronization");
