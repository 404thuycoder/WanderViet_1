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
        if (file.endsWith('.js') || file.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('modal__lede') || content.includes('modal-auth') || content.includes('auth-title')) {
            console.log(`FOUND IN: ${fullPath}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('modal__lede') || line.includes('modal-auth') || line.includes('auth-title') || line.includes('innerHTML') || line.includes('textContent')) {
                console.log(`  Line ${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      }
    }
  } catch (err) {}
}

console.log('Searching for modal selectors and manipulation...');
searchAllFiles('f:\\WanderViet_1\\WanderViet_1');
console.log('Search finished.');
