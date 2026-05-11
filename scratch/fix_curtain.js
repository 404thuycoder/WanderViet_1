const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../apps/user-web');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const correctCurtainCode = `
    <!-- WanderViet Translation Curtain -->
    <script>
      if (document.cookie.match(/googtrans=\\/vi\\/(?!vi)[a-zA-Z-]+/)) {
        document.documentElement.classList.add('translating-curtain');
      }
    </script>
    <style>
      html.translating-curtain::before {
        content: "Translating Experience...";
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #0f172a; color: #f1f5f9;
        display: flex; align-items: center; justify-content: center;
        z-index: 9999999; font-family: sans-serif; font-size: 16px; font-weight: 600; letter-spacing: 1px;
      }
      html.translating-curtain body {
        opacity: 0 !important;
        pointer-events: none !important;
      }
      html.translated-ltr::before, html.translated-rtl::before {
        display: none !important;
      }
      html.translated-ltr body, html.translated-rtl body {
        opacity: 1 !important;
        pointer-events: auto !important;
        transition: opacity 0.4s ease;
      }
    </style>
`;

let count = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the old bad curtain code completely
  const startMarker = '<!-- WanderViet Translation Curtain -->';
  const endMarker = '</script>';
  
  if (content.includes(startMarker)) {
    // Find where the old curtain block ends
    const startIndex = content.indexOf(startMarker);
    const scriptEnd = content.indexOf('</script>', startIndex) + 9;
    
    // We need to carefully replace the old block with the new block
    const before = content.substring(0, startIndex);
    const after = content.substring(scriptEnd);
    
    content = before + correctCurtainCode.trim() + after;
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
  }
});

console.log('Fixed curtain in ' + count + ' files.');
