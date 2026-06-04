const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../../apps/business-web/pages/dashboard.html'), 'utf8');
const match = content.match(/const DEMO_ITEMS = \[\s*([\s\S]*?)\s*\];/);
if (match) {
  const itemsText = match[1];
  // Parse or match individual items
  const itemNames = [];
  const regex = /name:\s*['"](.*?)['"]/g;
  let m;
  while ((m = regex.exec(itemsText)) !== null) {
    itemNames.push(m[1]);
  }
  console.log('DEMO_ITEMS names in dashboard.html:');
  console.log(itemNames);
} else {
  console.log('DEMO_ITEMS not found in dashboard.html');
}
