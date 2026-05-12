const mongoose = require('mongoose');
const Place = require('./models/Place');
require('dotenv').config();

const updates = [
  {
    id: "69f6e9d382d104bcf3474fd2", // Mường Thanh
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
  },
  {
    id: "69f7400fee6fda6373f918a8", // Lẩu Thái
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80"
  },
  {
    id: "69f0e9b636d59235d59283e9", // Câu Mực
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80"
  },
  {
    id: "69f0e9b636d59235d59283ea", // Spa
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecee?w=800&q=80"
  },
  {
    id: "69f0e9b636d59235d59283e5", // Seaplane
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80"
  }
];

async function repair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    for (const item of updates) {
      const res = await Place.findByIdAndUpdate(item.id, { image: item.image }, { returnDocument: 'after' });
      if (res) {
        console.log(`Updated: ${res.name} -> ${item.image}`);
      } else {
        console.log(`Not found: ${item.id}`);
      }
    }
    
    // Also fix any place with empty image
    const emptyPlaces = await Place.find({ image: "" });
    console.log(`Found ${emptyPlaces.length} places with empty images`);
    for (const p of emptyPlaces) {
      await Place.findByIdAndUpdate(p._id, { image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80" });
      console.log(`Fixed empty image for: ${p.name}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repair();
