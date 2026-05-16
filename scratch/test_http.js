const http = require('http');

const url = 'http://localhost:3000/uploads/place-1778883125716-15692415.jpg';
console.log(`Checking ${url}...`);

http.get(url, (res) => {
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log("Success!");
    } else {
      console.log("Body snippet:", data.substring(0, 100));
    }
    process.exit(0);
  });
}).on('error', (err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
