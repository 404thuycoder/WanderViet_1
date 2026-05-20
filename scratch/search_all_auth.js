const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== '.gemini' && file !== 'brain' && file !== 'artifacts') {
          searchDir(fullPath);
        }
      } else {
        if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('Đăng nhập để tiếp tục') || content.includes('hành trình của bạn')) {
            console.log(`Found pattern in: ${fullPath}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('Đăng nhập để tiếp tục') || line.includes('hành trình của bạn')) {
                console.log(`  Line ${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      }
    }
  } catch (err) {}
}

console.log('Searching ENTIRE codebase...');
searchDir('f:\\WanderViet_1\\WanderViet_1');
console.log('Search completed.');
