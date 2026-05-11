const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    "appendMsg(m.text, m.role, false, true); // skipCache = true",
    "appendMsg(m.text, m.role, m.isHTML || false, true); // skipCache = true"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed loadSharedChat to handle HTML messages correctly");
