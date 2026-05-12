const http = require('http');

const data = JSON.stringify({
  name: "NODE_REQ PENDING TEST",
  kind: "khach-san",
  region: "Ha Long"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/business/places',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJ1c2luZXNzNTI2MjM4ODciLCJfaWQiOiI2OWY2ZGM5YjU0Y2NkYjc3ODAyNWFmNTYiLCJjdXN0b21JZCI6ImJ1c2luZXNzNTI2MjM4ODciLCJwb3J0YWwiOiJidXNpbmVzcyIsInJvbGUiOiJidXNpbmVzcyIsImlhdCI6MTc3ODI1MTczOH0.UNhzEsGwFnoh2c7fQ_8MIOcURYtjMW3PJxMuz2iZZuo',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e);
  process.exit(1);
});

req.write(data);
req.end();
