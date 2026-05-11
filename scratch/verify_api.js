const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/routes/business.js';

try {
  const content = fs.readFileSync(path, 'utf8');
  if (content.includes('/ai-analytics')) {
    console.log('SUCCESS: /ai-analytics route is registered in routes/business.js');
    
    // Check for specific logic keywords
    const keywords = ['trendPercent', 'hotLocations', 'marketPrice', 'prediction', 'suggestion'];
    const missing = keywords.filter(k => !content.includes(k));
    
    if (missing.length === 0) {
      console.log('SUCCESS: All core logic components found in the route.');
    } else {
      console.log('WARNING: Missing some logic components:', missing);
    }
  } else {
    console.log('FAILURE: /ai-analytics route not found.');
  }
} catch (err) {
  console.error('Error reading file:', err);
}
