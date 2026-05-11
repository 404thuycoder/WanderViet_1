const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    "document.addEventListener('DOMContentLoaded', initAll);",
    "if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initAll); } else { initAll(); }"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Improved initAll call logic in SharedUI.js");
