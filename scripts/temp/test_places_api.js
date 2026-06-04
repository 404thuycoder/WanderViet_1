require('dotenv').config();
const http = require('http');

const opts = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/places',
  method: 'GET',
  headers: { 'Accept': 'application/json' }
};

const req = http.request(opts, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (!json.data) { console.log('Error:', json.message || JSON.stringify(json)); return; }

      const biz = json.data.filter(p => p.source === 'partner' || p.ownerName);
      const sys = json.data.filter(p => p.source !== 'partner' && !p.ownerName);
      console.log(`\n📊 API /api/places trả về ${json.data.length} places:`);
      console.log(`   - System: ${sys.length}`);
      console.log(`   - Doanh nghiệp (partner): ${biz.length}\n`);

      biz.forEach(p => {
        console.log(`   ✅ [${p.kind}] ${p.name} | owner: ${p.ownerId} | ownerName: ${p.ownerName || 'N/A'}`);
      });
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw (first 500):', data.substring(0, 500));
    }
  });
});

req.on('error', err => console.log('Request error:', err.message));
req.end();
