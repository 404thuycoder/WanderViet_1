
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
    if (match) { parts.push(good); i += bad.length; }
    else { parts.push(buf.slice(i, i+1)); i++; }
  }
  return Buffer.concat(parts);
}

// – (U+2013 en-dash) = UTF-8: e2 80 93
// Double-encoded: e2→â(c3a2), 80→€ in W1252 (0x80=U+20AC, UTF-8: e2 82 ac), 93→" in W1252 (0x93=U+201C, UTF-8: e2 80 9c)
// So double-encoded bytes: c3a2 e282ac e2809c
buf = replaceHex(buf, 'c3a2e282ace2809c', 'e28093');
console.log('Fixed en-dash');

// ế (U+1EBF) = e1bbbf
// W1252: e1→á(c3a1), bb→»(c2bb), bf→¿(c2bf)
// double: c3a1 c2bb c2bf
buf = replaceHex(buf, 'c3a1c2bbc2bf', 'e1bbbf');
console.log('Fixed ế (chuyến)');

fs.writeFileSync(f, buf);
console.log('Done.');
