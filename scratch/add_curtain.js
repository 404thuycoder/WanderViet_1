const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../apps/user-web');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const curtainCode = `
    <!-- WanderViet Translation Curtain -->
    <script>
      if (document.cookie.match(/googtrans=\\/vi\\/(?!vi)[a-zA-Z-]+/)) {
        document.write('<style>body { visibility: hidden; opacity: 0; } #translate-curtain { visibility: visible; opacity: 1; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999999; transition: opacity 0.4s ease; } .wander-spinner { width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; } .curtain-text { color: #f1f5f9; font-family: sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 1px; } @keyframes spin { to { transform: rotate(360deg); } }</style>');
        document.write('<div id="translate-curtain"><div class="wander-spinner"></div><div class="curtain-text">Translating Experience...</div></div>');
      }
    </script>
`;

let count = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('WanderViet Translation Curtain')) {
    // Inject right after <head> or <meta charset>
    if (content.includes('<head>')) {
      content = content.replace('<head>', '<head>\n' + curtainCode);
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
    }
  }
});

console.log('Injected curtain into ' + count + ' files.');
