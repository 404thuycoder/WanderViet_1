const fs = require('fs');
const path = require('path');

const placesDataPath = path.join(__dirname, '../apps/user-web/js/places-data.js');
const content = fs.readFileSync(placesDataPath, 'utf-8');
const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
const placesData = new Function('return ' + arrayMatch[1])();

console.log('Checking for file:// or local path URLs in places-data.js...');
placesData.forEach(p => {
  if (p.image && (p.image.startsWith('file://') || p.image.startsWith('C:'))) {
    console.log(`❌ Place: ${p.name} (${p.id}) has broken main image: ${p.image}`);
  }
  if (p.images) {
    p.images.forEach((img, idx) => {
      if (img.startsWith('file://') || img.startsWith('C:')) {
        console.log(`❌ Place: ${p.name} (${p.id}) has broken gallery image at index ${idx}: ${img}`);
      }
    });
  }
});
console.log('Done checking.');
