const fs = require('fs');
const path = require('path');

function searchAllFiles(dir) {
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== '.gemini') {
          searchAllFiles(fullPath);
        }
      } else {
        if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.css')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.toLowerCase().includes('tiếp tục hành trình của bạn') || content.toLowerCase().includes('đăng nhập để tiếp tục')) {
            console.log(`FOUND MATCH IN: ${fullPath}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.toLowerCase().includes('tiếp tục hành trình') || line.toLowerCase().includes('đăng nhập để tiếp tục')) {
                console.log(`  Line ${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      }
    }
  } catch (err) {}
}

console.log('Starting extremely deep search for matches...');
searchAllFiles('f:\\WanderViet_1\\WanderViet_1');
console.log('Search finished.');
