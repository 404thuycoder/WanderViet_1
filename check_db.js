const mongoose = require('mongoose');
const Place = require('./server/models/Place');
const BusinessAccount = require('./server/models/BusinessAccount');

mongoose.connect('mongodb://localhost:27017/wanderviet').then(async () => {
    const places = await Place.find({ status: 'approved' }).sort({ createdAt: -1 });
    const p = places.find(x => x.name.includes("Ha Long") || x.ownerId === "BIZ-001-HALONG" || x.name.includes("HALONG"));
    console.log("Found Place:", p);

    function buildIdQuery(id) {
        const conditions = [{ customId: id }];
        if (mongoose.Types.ObjectId.isValid(id)) conditions.push({ _id: id });
        return { $or: conditions };
    }

    if (p) {
        let ownerName = 'WanderViet AI Partner';
        let ownerId = null;
        
        if (p.ownerId) {
            const owner = await BusinessAccount.findOne(buildIdQuery(p.ownerId)).select('displayName name _id');
            if (owner) {
                ownerName = owner.displayName || owner.name;
                ownerId = owner._id;
            } else {
                ownerName = p.ownerName || p.name;
                ownerId = p._id;
            }
        } else {
            ownerName = p.ownerName || p.name;
            ownerId = p._id;
        }
        
        const result = { ...p._doc, ownerName, ownerId };
        console.log("Result object keys:", Object.keys(result));
        console.log("Result ownerId:", result.ownerId);
        console.log("p._doc.ownerId:", p._doc.ownerId);
    }
    process.exit(0);
});
