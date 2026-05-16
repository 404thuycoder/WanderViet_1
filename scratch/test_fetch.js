const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch if node version is high

async function test() {
  try {
    const url = 'http://localhost:3000/uploads/place-1778883125716-15692415.jpg';
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      console.log("Success! File is accessible.");
    } else {
      const text = await res.text();
      console.log("Response:", text);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
