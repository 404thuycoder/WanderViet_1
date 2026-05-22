const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'apps', 'user-web', 'planner.html');
let html = fs.readFileSync(filePath, 'utf-8');

let count = 0;

// 1. Kids section - replace inline styles with CSS classes
const kidsOld = `border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:0.4rem;">
                          <div style="font-weight:700; font-size:0.7rem; color:#fff; display:flex; justify-content:space-between; margin-bottom:0.15rem;">`;
const kidsNew = `border-bottom:1px solid var(--border, #e2e8f0); padding-bottom:0.4rem;">
                          <div class="v2-age-bold" style="font-size:0.7rem; display:flex; justify-content:space-between; margin-bottom:0.15rem;">`;

if (html.includes(kidsOld)) {
  html = html.replace(kidsOld, kidsNew);
  // Do it again for adults section (same pattern)
  if (html.includes(kidsOld)) {
    html = html.replace(kidsOld, kidsNew);
  }
  count++;
  console.log('✅ Age section headers replaced');
} else {
  console.log('❌ Kids/Adults header pattern not found');
}

// 2. Replace all age text divs (color:var(--text-muted))
const ageTextOld = `<div style="font-size:0.65rem; color:var(--text-muted); line-height:1.3;">`;
const ageTextNew = `<div class="v2-age-text" style="font-size:0.65rem; line-height:1.3;">`;
while (html.includes(ageTextOld)) {
  html = html.replace(ageTextOld, ageTextNew);
  count++;
}
console.log(`✅ Age text divs replaced (${count} total changes so far)`);

// 3. Replace KidSpot/KidFood/KidPlay inline style with class
html = html.replace(/id="v2AgeKidSpot" style="color:var\(--text\)"/g, 'id="v2AgeKidSpot" class="v2-age-bold"');
html = html.replace(/id="v2AgeKidFood" style="color:var\(--text\)"/g, 'id="v2AgeKidFood" class="v2-age-bold"');
html = html.replace(/id="v2AgeKidPlay" style="color:var\(--text\)"/g, 'id="v2AgeKidPlay" class="v2-age-bold"');
console.log('✅ Kid age spans replaced');

// 4. Replace AdultSpot/AdultFood/AdultPlay
html = html.replace(/id="v2AgeAdultSpot" style="color:var\(--text\)"/g, 'id="v2AgeAdultSpot" class="v2-age-bold"');
html = html.replace(/id="v2AgeAdultFood" style="color:var\(--text\)"/g, 'id="v2AgeAdultFood" class="v2-age-bold"');
html = html.replace(/id="v2AgeAdultPlay" style="color:var\(--text\)"/g, 'id="v2AgeAdultPlay" class="v2-age-bold"');
console.log('✅ Adult age spans replaced');

// 5. Column 2 title - remove color:#fff and add class
html = html.replace(
  '<span style="font-size:0.75rem; font-weight:700; color:#fff;">',
  '<span class="v2-filter-title" style="font-size:0.75rem; font-weight:700;">'
);
console.log('✅ Filter title class added');

// 6. Also update the JS spot-card innerHTML to use spot-card-desc class
html = html.replace(
  `<p style="margin:0; font-size:0.65rem; color:var(--text-muted); line-height:1.35;">`,
  `<p class="spot-card-desc" style="margin:0; font-size:0.65rem; line-height:1.35;">`
);
console.log('✅ Spot card desc class added');

// Verify
console.log('\n--- Verification ---');
console.log('Has v2-age-bold class:', html.includes('class="v2-age-bold"'));
console.log('Has v2-age-text class:', html.includes('class="v2-age-text"'));
console.log('Has v2-filter-title class:', html.includes('class="v2-filter-title"'));
console.log('Has spot-card-desc class:', html.includes('class="spot-card-desc"'));
console.log('NO more color:#fff in age headers:', !html.includes('color:#fff; display:flex; justify-content:space-between'));

fs.writeFileSync(filePath, html, 'utf-8');
console.log('\n🎉 File saved successfully!');
