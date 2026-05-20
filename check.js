const fs = require('fs');
const html = fs.readFileSync('apps/user-web/index.html', 'utf8');
const ids = ['personal-picks', 'destinations', 'top-partners', 'offers', 'business-services', 'smart-search', 'planner', 'itineraries', 'experiences', 'reviews', 'contact'];
const missing = ids.filter(id => !html.includes(`id="${id}"`));
console.log('Missing IDs:', missing);
