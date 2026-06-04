const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.md'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content)) {
        console.log(`Match found in: ${fullPath}`);
      }
    }
  }
}

console.log('Searching for "Anh Thủy" or "Thủy Phi Cơ" in the workspace...');
searchDir(path.join(__dirname, '../..'), /Anh Thủy|Thủy Phi Cơ|Luxury Dinner|Câu Mực/i);
console.log('Search finished.');
