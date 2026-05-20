
const fs = require('fs');
const f = 'f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\payment.html';
let buf = fs.readFileSync(f);

function replaceHex(buf, badHex, goodHex) {
  const bad = Buffer.from(badHex, 'hex');
  const good = Buffer.from(goodHex, 'hex');
  const parts = [];
  let i = 0;
  while (i < buf.length) {
    let match = (i + bad.length <= buf.length);
    if (match) {
      for (let j = 0; j < bad.length; j++) {
        if (buf[i+j] !== bad[j]) { match = false; break; }
      }
    }
    if (match) {
      parts.push(good);
      i += bad.length;
      console.log(`Replaced ${badHex} with ${goodHex}`);
    } else {
      parts.push(buf.slice(i, i+1));
      i++;
    }
  }
  return Buffer.concat(parts);
}

// 1. Fix "bỏ" (U+1ECF = e1 bb 8f) from double-encoded c3 a1 c2 bb c2 8f
buf = replaceHex(buf, 'c3a1c2bbc28f', 'e1bb8f');

// 2. Fix "dịch" (U+1ECB = e1 bb 8b) from double-encoded c3 a1 c2 bb e2 80 b9
buf = replaceHex(buf, 'c3a1c2bbe280b9', 'e1bb8b');

fs.writeFileSync(f, buf);
console.log('Done.');
