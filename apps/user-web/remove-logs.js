const fs = require('fs');
let c = fs.readFileSync('SharedUI.js', 'utf8');
const originalLength = c.length;
// Remove lines containing these exact debug logs
const logsToRemove = [
    'console.log("🔍 syncAuthUI called");',
    'console.log("⏳ syncAuthUI: already in progress, skipping (throttled)");',
    'console.log("⏳ syncAuthUI: throttled, skipping");',
    'console.log("🔑 Token exists:", !!token);',
    'console.log("🔘 Login buttons found:", authBtns.length);',
    'console.log("👤 Profile trays found:", profileTrays.length);',
    'console.log("❌ No token - showing login button");',
    'console.log("❌ Token invalid format (not 3 parts)");',
    'console.log("✅ Token valid - hiding login, showing profile");',
    'console.log("❌ Token expired (401)");',
    'console.log("🛠️ WanderUI: Injecting Header...");',
    'console.log("🎙️ WanderUI: voice-helper.js loaded.");',
    'console.log("🎙️ WanderUI: Connecting VoiceGuide...");',
    'console.log("🚀 WanderUI Initializing components...");',
    'console.log("📄 Current page:", window.location.pathname);',
    'console.log("⚠️ WanderUI already initialized, skipping");',
    'console.log("🔐 [SharedUI.js loaded] wander_token exists:", !!_debugToken);',
    'console.log("🔐 [SharedUI.js loaded] token parts:", parts.length);',
    'console.log("🔐 [SharedUI.js loaded] token invalid");',
    'console.log("🔄 Force syncAuthUI (100ms)");',
    'console.log("🔄 Force syncAuthUI (500ms)");'
];

logsToRemove.forEach(logStr => {
    // Escape string for regex, or just replace the string directly if we split by line
});

let lines = c.split('\n');
lines = lines.filter(line => {
    let trimmed = line.trim();
    for (let logStr of logsToRemove) {
        if (trimmed.includes(logStr) || trimmed === logStr) return false;
    }
    // Also handle inline setTimeouts
    if (trimmed.includes('console.log("🔄 Force syncAuthUI')) {
        return false;
    }
    return true;
});

// Also manually fix the setTimeout force syncAuthUI lines if they were inline
let newContent = lines.join('\n');
newContent = newContent.replace(/setTimeout\(\(\) => \{ console\.log\("🔄 Force syncAuthUI \(100ms\)"\); syncAuthUI\(\); \}, 100\);/g, 'setTimeout(syncAuthUI, 100);');
newContent = newContent.replace(/setTimeout\(\(\) => \{ console\.log\("🔄 Force syncAuthUI \(500ms\)"\); syncAuthUI\(\); \}, 500\);/g, 'setTimeout(syncAuthUI, 500);');

fs.writeFileSync('SharedUI.js', newContent);
console.log("Removed noisy logs. Original length:", originalLength, "New length:", newContent.length);
