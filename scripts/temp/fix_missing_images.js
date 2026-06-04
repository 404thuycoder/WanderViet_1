require('dotenv').config();
const mongoose = require('mongoose');

// Fix images for business43113762 old services that are missing images
const FIXES = [
  {
    id: 'khach-1780562172112-4136',
    name: 'Khách sạn Heritage 5 Sao',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'
    ]
  },
  {
    id: 'nha-1780562172229-171',
    name: 'Buffet Hải Sản Legend',
    image: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'
    ]
  },
  {
    id: 'tour-1780562172307-5991',
    name: 'Tour Hạ Long VIP 2N1Đ',
    image: 'https://images.unsplash.com/photo-1559592413-7ece35b49c2d?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1559592413-7ece35b49c2d?w=800&q=80',
      'https://images.unsplash.com/photo-1533038590840-1cde6b5697df?w=800&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
    ]
  },
  {
    id: 'tour-1780562172392-8233',
    name: 'Thuê Du Thuyền Riêng',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      'https://images.unsplash.com/photo-1586276508390-ec22fc4c0fa4?w=800&q=80'
    ]
  }
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  let fixed = 0;
  for (const fix of FIXES) {
    const result = await db.collection('places').updateOne(
      { id: fix.id },
      { $set: { image: fix.image, images: fix.images } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Fixed images for: "${fix.name}"`);
      fixed++;
    } else {
      console.log(`❌ No change for: "${fix.name}" (id: ${fix.id})`);
    }
  }
  console.log(`\nFixed ${fixed}/${FIXES.length} services.`);
  mongoose.connection.close();
}).catch(console.error);
