const fs = require('fs');
const path = require('path');

const placesDataPath = path.join(__dirname, '../apps/user-web/js/places-data.js');
const content = fs.readFileSync(placesDataPath, 'utf-8');
const arrayMatch = content.match(/window\.WANDER_PLACES\s*=\s*(\[[\s\S]*\]);/);
const placesData = new Function('return ' + arrayMatch[1])();

const sapa = placesData.find(p => p.id === 'sa-pa' || p.name.includes('Sa Pa'));
console.log('Sa Pa in places-data.js:', sapa);
