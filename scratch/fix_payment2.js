
const fs = require('fs');
const f = 'f:\\WanderViet_1\\WanderViet_1\\apps\\user-web\\payment.html';

let buf = fs.readFileSync(f);

// Replace byte sequences: find hex pattern, replace with correct UTF-8
function replaceHex(buf, badHex, goodHex) {
  const bad = Buffer.from(badHex, 'hex');
  const good = Buffer.from(goodHex, 'hex');
  const parts = [];
  let i = 0;
  while (i < buf.length) {
    let found = false;
    if (i + bad.length <= buf.length) {
      let match = true;
      for (let j = 0; j < bad.length; j++) {
        if (buf[i + j] !== bad[j]) { match = false; break; }
      }
      if (match) { parts.push(good); i += bad.length; found = true; }
    }
    if (!found) { parts.push(buf.slice(i, i+1)); i++; }
  }
  return Buffer.concat(parts);
}

// ==== Map: double-encoded → correct UTF-8 ====
// Each Vietnamese char: original UTF-8 bytes → misread as Win-1252 → re-saved as UTF-8

const fixes = [
  // Title <title>: "Cổng thanh toán – WanderViệt"
  // ổ (U+1ED5) = e1bb95 → W1252: e1=á(c3a1), bb=»(c2bb), 95=•(e28099 in utf8? actually U+2022=e28022)
  // 0x95 in W1252 = U+2022 BULLET → UTF-8: e2 80 a2
  // double-encoded ổ: c3a1 c2bb e280a2
  ['c3a1c2bbe280a2', 'e1bb95'], // ổ

  // á (U+00E1) = c3a1 → W1252: c3=Ã(c383), a1=¡(c2a1) → double: c383c2a1
  ['c383c2a1', 'c3a1'], // á

  // – (U+2013) = e28093 → W1252: e2=â(c3a2), 80=€(e282ac), 93="(e2809c) → double: c3a2 e282ac e2809c
  ['c3a2e282ace2809c', 'e28093'], // –

  // ệ (U+1EC7) = e1bb87 → W1252: e1=á(c3a1), bb=»(c2bb), 87=‡(e280a1) → double: c3a1 c2bb e280a1
  // 0x87 in W1252 = U+2021 DOUBLE DAGGER → UTF-8: e2 80 a1
  ['c3a1c2bbe280a1', 'e1bb87'], // ệ

  // Đ (U+0110) = c490 → W1252: c4=Ä(c384), 90=\u0090(c290) → double: c384 c290
  ['c384c290', 'c490'], // Đ

  // ể (U+1EC3) = e1bb83 → W1252: e1=á(c3a1), bb=»(c2bb), 83=ƒ(c692) → double: c3a1 c2bb c692
  // 0x83 in W1252 = U+0192 LATIN SMALL LETTER F WITH HOOK → UTF-8: c6 92
  ['c3a1c2bbc692', 'e1bb83'], // ể

  // ề (U+1EC1) = e1bb81 → W1252: e1=á(c3a1), bb=»(c2bb), 81=PAD(c281) → double: c3a1 c2bb c281
  ['c3a1c2bbc281', 'e1bb81'], // ề

  // ế (U+1EBF) = e1bbbf → W1252: e1=á(c3a1), bb=»(c2bb), bf=¿(c2bf) → double: c3a1 c2bb c2bf
  ['c3a1c2bbc2bf', 'e1bbbf'], // ế

  // đ (U+0111) = c491 → W1252: c4=Ä(c384), 91='(e28099) → double: c384 e28099
  // 0x91 in W1252 = U+2018 LEFT SINGLE QUOTATION MARK → UTF-8: e2 80 98
  ['c384e28098', 'c491'], // đ

  // ủ (U+1EE7) = e1bba7 → W1252: e1=á(c3a1), bb=»(c2bb), a7=§(c2a7) → double: c3a1 c2bb c2a7
  ['c3a1c2bbc2a7', 'e1bba7'], // ủ

  // ạ (U+1EA1) = e1ba a1 → W1252: e1=á(c3a1), ba=º(c2ba), a1=¡(c2a1) → double: c3a1 c2ba c2a1
  ['c3a1c2bac2a1', 'e1baa1'], // ạ

  // ơ (U+01A1) = c6a1 → W1252: c6=Æ(c386), a1=¡(c2a1) → double: c386 c2a1
  ['c386c2a1', 'c6a1'], // ơ

  // à (U+00E0) = c3a0 → W1252: c3=Ã(c383), a0=NBSP(c2a0) → double: c383 c2a0
  ['c383c2a0', 'c3a0'], // à

  // ● (U+25CF) = e2 97 8f → W1252: e2=â(c3a2), 97=—(e28094), 8f=\u008f(c28f)
  // 0x97 in W1252 = U+2014 EM DASH → UTF-8: e2 80 94
  // 0x8f in W1252 = undefined → U+008F → UTF-8: c2 8f
  ['c3a2e28094c28f', 'e2978f'], // ●

  // XÁC NHẬN THANH TOÁN fix:
  // Á (U+00C1) = c381 → W1252: c3=Ã(c383), 81=\u0081(c281) → double: c383 c281
  ['c383c281', 'c381'], // Á

  // Ậ (U+1EAC) = e1ba ac → W1252: e1=á(c3a1), ba=º(c2ba), ac=¬(c2ac) → double: c3a1 c2ba c2ac
  ['c3a1c2bac2ac', 'e1baac'], // Ậ

  // Â (or similar for title continuation)
];

let out = buf;
for (const [bad, good] of fixes) {
  const before = out.length;
  out = replaceHex(out, bad, good);
  if (out.length !== before) console.log(`Fixed: ${bad} -> ${good}`);
}

fs.writeFileSync(f, out);
console.log('Done. File written.');
