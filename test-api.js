async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/public/all-places');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
            console.log("First item keys:", Object.keys(json.data[0]));
            const bizItems = json.data.filter(p => p.hasRealBusiness);
            console.log("Items with hasRealBusiness:", bizItems.length);
        } else {
            console.log("Failed or empty:", json);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
