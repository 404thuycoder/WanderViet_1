const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/places/69f6e9d382d104bcf3474fd2/faqs/6a084a057e60272f3ce3a97c/vote',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
