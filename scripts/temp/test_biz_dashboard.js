/**
 * Test đăng nhập vào business dashboard và lấy danh sách places
 * để xác nhận dịch vụ hiển thị đúng
 */
require('dotenv').config();
const http = require('http');

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'x-auth-token': token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve({ _raw: raw.substring(0, 200) }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. Login as business - Ha Long Luxury Hotel
  console.log('=== Test Business: Ha Long Luxury Hotel ===');
  const loginRes = await apiCall('POST', '/api/auth/business/login', {
    email: 'halong@luxury.com',
    password: 'password@2006'
  });
  
  if (!loginRes.success || !loginRes.token) {
    console.log('Login failed:', loginRes.message || JSON.stringify(loginRes));
    
    // Try to find out what business accounts exist
    console.log('\n--- Checking business accounts ---');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const accounts = await mongoose.connection.db.collection('businessaccounts')
      .find({}, { projection: { name: 1, email: 1, customId: 1 } }).toArray();
    console.log('Business accounts:');
    accounts.forEach(a => console.log(`  ${a.name} | email: ${a.email} | customId: ${a.customId}`));
    await mongoose.connection.close();
    return;
  }

  const token = loginRes.token;
  console.log('✅ Logged in as:', loginRes.data?.name || loginRes.data?.displayName);

  // 2. Get places for this business
  const placesRes = await apiCall('GET', '/api/business/places', null, token);
  console.log(`\n📦 Business places: ${placesRes.data?.length || 0}`);
  if (placesRes.data) {
    placesRes.data.forEach(p => console.log(`  - [${p.kind}] ${p.name} | status: ${p.status}`));
  }
}

main().catch(console.error);
