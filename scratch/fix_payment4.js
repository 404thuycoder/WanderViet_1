
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

// Replace c3a2e282ace2809d (â€” double encoded) with en-dash "–" (e2 80 93) or simple " - " (20 2d 20)
buf = replaceHex(buf, 'c3a2e282ace2809d', '202d20');

fs.writeFileSync(f, buf);
console.log('Done.');
