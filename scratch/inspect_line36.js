
const fs = require('fs');
const f = 'f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\payment.html';
const content = fs.readFileSync(f, 'utf8');
const line36 = content.split('\n')[35]; // 0-indexed, so line 36 is index 35
console.log('Line 36 text:', line36);
const buf = Buffer.from(line36);
console.log('Line 36 hex:', buf.toString('hex'));
