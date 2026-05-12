const mongoose = require('mongoose');
const Place = require('./models/Place');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to DB');
    const places = await Place.find({});
    let updatedCount = 0;

    for (let p of places) {
        let fallbackImg = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80';
        if (p.kind === 'khach-san') fallbackImg = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';
        else if (p.kind === 'nha-hang' || p.kind === 'giai-tri') fallbackImg = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';
        else if (p.isTour || p.kind === 'trai-nghiem') fallbackImg = 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=600&q=80';

        let needsUpdate = false;

        // Check if image is missing, empty, or points to a non-existent local file like logo.png
        const isBadUrl = (url) => {
            if (!url || url.length < 5) return true;
            if (url.includes('logo.png')) return true; // often a bad default
            return false;
        };

        if (isBadUrl(p.image)) {
            p.image = fallbackImg;
            needsUpdate = true;
        }

        if (!p.images || p.images.length === 0 || isBadUrl(p.images[0])) {
            p.images = [fallbackImg];
            needsUpdate = true;
        }

        if (needsUpdate) {
            await p.save();
            updatedCount++;
        }
    }

    console.log(`Updated images for ${updatedCount} places.`);
    process.exit(0);
}).catch(console.error);
