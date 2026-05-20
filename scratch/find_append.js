const fs = require('fs');
const content = fs.readFileSync('f:/WanderViet_1/WanderViet_1/apps/user-web/js/SharedUI.js', 'utf8');
const lines = content.split('\n');

// Find where the injected div is appended
const startIdx = lines.findIndex(line => line.includes('function injectCommonComponents('));
let braceCount = 0;
let started = false;

for (let i = startIdx; i < startIdx + 800; i++) {
  if (!lines[i]) continue;
  const line = lines[i];
  
  if (line.includes('appendChild') || line.includes('insertBefore') || line.includes('prepend') || line.includes('innerHTML') && !line.includes('div.innerHTML')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
}
