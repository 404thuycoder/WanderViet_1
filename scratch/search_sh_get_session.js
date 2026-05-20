const fs = require('fs');
const content = fs.readFileSync('f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\js\\SharedUI.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('getSession')) {
    console.log(`SharedUI.js Line ${idx + 1}: ${line.trim()}`);
  }
});
