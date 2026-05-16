const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/places/69f6e9d382d104bcf3474fd2',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // If the server didn't restart, we can see it here? Actually GET /api/places/:id was already fixed long ago.
  });
});
req.end();
