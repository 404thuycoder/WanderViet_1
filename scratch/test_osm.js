const fetch = require('node-fetch');
async function test() {
    const query = '[out:json];nwr["name"~"Cà Phê Homes"];out body;';
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
}
test();
