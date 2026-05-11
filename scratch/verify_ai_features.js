const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch(e) { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n========== BUSINESS PORTAL TEST ==========\n');

  // Step 1: Login
  console.log('1. Đăng nhập với tài khoản muongthanh@gmail.com...');
  const loginData = JSON.stringify({ email: 'muongthanh@gmail.com', password: 'Matkhaua123@' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 3002,
    path: '/api/business/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);

  console.log('   Status:', loginRes.status);
  if (!loginRes.body.success) {
    // Try alternate login path
    console.log('   Thử đường dẫn login khác...');
    const loginRes2 = await makeRequest({
      hostname: 'localhost', port: 3000,
      path: '/api/auth/business/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, loginData);
    console.log('   Status (port 3000):', loginRes2.status, JSON.stringify(loginRes2.body).slice(0, 200));
    if (loginRes2.body.token) {
      await runTests(loginRes2.body.token);
    }
    return;
  }

  const token = loginRes.body.token;
  console.log('   ✅ Đăng nhập thành công! Token nhận được.');
  await runTests(token);
}

async function runTests(token) {
  function apiGet(path, port = 3002) {
    return makeRequest({
      hostname: 'localhost', port,
      path, method: 'GET',
      headers: { 'x-auth-token': token }
    });
  }

  // Step 2: Test AI Analytics
  console.log('\n2. Kiểm tra AI Analytics (/api/business/ai-analytics)...');
  const aiRes = await apiGet('/api/business/ai-analytics');
  console.log('   Status:', aiRes.status);
  if (aiRes.status === 200 && aiRes.body.success) {
    const d = aiRes.body.data;
    console.log('   ✅ AI Analytics OK!');
    console.log('   --- Dữ liệu nhận được ---');
    console.log('   📈 Xu hướng:', d.trend, `(${d.trendPercent}%)`);
    console.log('   📅 Booking tháng này:', d.monthBookings);
    console.log('   🎯 Tỷ lệ chuyển đổi:', d.conversionRate + '%');
    console.log('   ⚠️  Bất thường:', d.anomaly ? d.anomaly.message : 'Không có');
    console.log('   🏙️  Địa điểm hot:', d.hotLocations);
    console.log('   💰 Giá thị trường:', d.marketPrice?.toLocaleString(), '-', d.priceEvaluation);
    console.log('   🔮 Dự đoán:', d.prediction?.count, 'booking,', d.prediction?.status);
    console.log('   🔭 Tầm nhìn thị trường:', d.marketOutlook?.status, `(+${d.marketOutlook?.growth}%)`);
    console.log('   💡 Gợi ý:', d.suggestion);
    console.log('   ❓ Lý do:', d.reason);
    console.log('   🎖️  Tier:', d.tier);
    console.log('\n   --- Kiểm tra đầy đủ tính năng ---');
    const features = [
      { name: 'Xu hướng (trend)', ok: d.trend !== undefined },
      { name: 'Phần trăm tăng trưởng (trendPercent)', ok: d.trendPercent !== undefined },
      { name: 'Tỷ lệ chuyển đổi PRO (conversionRate)', ok: d.conversionRate !== undefined },
      { name: 'Phát hiện bất thường (anomaly)', ok: d.anomaly !== undefined || d.anomaly === null },
      { name: 'Địa điểm hot (hotLocations)', ok: Array.isArray(d.hotLocations) && d.hotLocations.length > 0 },
      { name: 'Giá thị trường (marketPrice)', ok: d.marketPrice !== undefined },
      { name: 'Đánh giá giá (priceEvaluation)', ok: d.priceEvaluation !== undefined },
      { name: 'Dự đoán tuần sau PRO (prediction)', ok: d.prediction !== undefined },
      { name: 'Tầm nhìn thị trường ULTRA (marketOutlook)', ok: d.marketOutlook !== undefined },
      { name: 'Gợi ý chiến lược (suggestion)', ok: d.suggestion !== undefined },
      { name: 'Giải thích Explainable AI (reason)', ok: d.reason !== undefined },
    ];
    features.forEach(f => console.log(`   ${f.ok ? '✅' : '❌'} ${f.name}`));
  } else {
    console.log('   ❌ AI Analytics LỖI!');
    console.log('   Chi tiết:', JSON.stringify(aiRes.body).slice(0, 500));
  }

  // Step 3: Test Stats
  console.log('\n3. Kiểm tra Stats (/api/business/stats)...');
  const statsRes = await apiGet('/api/business/stats');
  console.log('   Status:', statsRes.status, statsRes.body.success ? '✅' : '❌');

  // Step 4: Test Reviews
  console.log('\n4. Kiểm tra Reviews (/api/business/reviews)...');
  const reviewsRes = await apiGet('/api/business/reviews');
  console.log('   Status:', reviewsRes.status, reviewsRes.body.success ? '✅' : '❌');
  
  console.log('\n========================================');
  console.log('Kiểm tra hoàn tất!');
}

main().catch(err => console.error('Lỗi chính:', err.message));
