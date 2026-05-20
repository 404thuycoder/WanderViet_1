const fs = require('fs');
const content = fs.readFileSync('f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\js\\main.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('function setSession') || line.includes('function saveProfileForUser') || line.includes('getSession')) {
    console.log(`main.js Line ${idx + 1}: ${line.trim()}`);
  }
});
