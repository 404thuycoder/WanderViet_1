require('dotenv').config();
const http = require('http');

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json', 'Accept': 'application/json',
        ...(token ? { 'x-auth-token': token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({ _raw: raw.substring(0, 100) }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const ACCOUNTS = [
  { name: 'Ha Long Luxury Hotel',     email: 'halong@luxury.com',              customId: 'business43113762' },
  { name: 'halongluxury.com',         email: 'halong@luxury.com',              customId: 'business18017811' },
  { name: 'Mường Thanh Tuyên Quang', email: 'muongthanh@gmail.com',           customId: 'business52623887' },
  { name: 'Mường Thanh',              email: 'admin@company.com',              customId: 'business68662868' },
  { name: 'Tông Trang Thôn',          email: 'tongtrang@gmail.com',            customId: 'business76123070' },
  { name: 'WanderCar Hà Nội',         email: 'hanoi@wandercar.vn',             customId: 'BIZ-RENTAL-HN' },
  { name: 'WanderCar Sài Gòn',        email: 'saigon@wandercar.vn',            customId: 'BIZ-RENTAL-SG' },
  { name: 'Nhà xe Phú Quốc Xanh',    email: 'phuquoc@wandercar.vn',           customId: 'BIZ-RENTAL-PQ' },
];

async function main() {
  console.log('=== Kiểm tra dịch vụ tất cả business accounts ===\n');
  
  for (const acc of ACCOUNTS) {
    const loginRes = await apiCall('POST', '/api/auth/business/login', {
      email: acc.email, password: 'password@2006'
    });
    
    if (!loginRes.success || !loginRes.token) {
      console.log(`❌ [${acc.name}] Đăng nhập thất bại: ${loginRes.message}`);
      continue;
    }
    
    const placesRes = await apiCall('GET', '/api/business/places', null, loginRes.token);
    const count = placesRes.data?.length || 0;
    const emoji = count > 0 ? '✅' : '⚠️ ';
    
    console.log(`${emoji} [${acc.name}] — ${count} dịch vụ:`);
    if (placesRes.data) {
      placesRes.data.forEach(p => console.log(`     • [${p.kind}] ${p.name}`));
    }
  }
  
  console.log('\n=== TỔNG KẾT ===');
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await mongoose.connection.db.collection('places').countDocuments();
  const partner = await mongoose.connection.db.collection('places').countDocuments({ source: 'partner' });
  const system = await mongoose.connection.db.collection('places').countDocuments({ source: 'system' });
  console.log(`Tổng places trong DB: ${total}`);
  console.log(`  - Hệ thống (system): ${system}`);
  console.log(`  - Doanh nghiệp (partner): ${partner}`);
  mongoose.connection.close();
}

main().catch(console.error);
