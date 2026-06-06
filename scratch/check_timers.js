const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'apps', 'user-web', 'planner.html'),
  path.join(__dirname, '..', 'apps', 'user-web', 'js', 'planner.js')
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`File does not exist: ${file}`);
    return;
  }
  console.log(`\n=== Scanning ${path.basename(file)} ===`);
  const content = fs.readFileSync(file, 'utf8');
  content.split('\n').forEach((line, idx) => {
    if (line.includes('setInterval') || line.includes('setTimeout') || line.includes('opacity') || line.includes('src =')) {
      if (line.trim().length < 150) {
        console.log(`${idx + 1}: ${line.trim()}`);
      }
    }
  });
});
