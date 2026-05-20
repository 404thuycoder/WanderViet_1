
const fs = require('fs');
const f = 'f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\payment.html';
const content = fs.readFileSync(f, 'utf8');
const line540 = content.split('\n')[539]; // 0-indexed
console.log('Line 540 text:', line540);
console.log('Line 540 hex:', Buffer.from(line540).toString('hex'));
