async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/public/all-places');
        const json = await res.json();
        if (json.success && json.data) {
            const realBusinesses = json.data.filter(p => p.ownerId !== p._id);
            console.log("Real businesses:", realBusinesses.map(p => p.ownerName));
        }
    } catch (e) {
        console.error(e);
    }
}
test();
