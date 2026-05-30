const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('./server/models/Place');

async function fix() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. Finding place with id "tphcm"...');
    
    const correctImages = [
      "https://bcp.cdnchinhphu.vn/334894974524682240/2025/10/31/tphcm-hinh-ah-17619225878251619451780.jpg",
      "https://media.istockphoto.com/id/1324017792/vi/anh/%E1%BA%A3nh-ch%E1%BB%A5p-t%E1%BB%AB-tr%C3%AAn-cao-tuy%E1%BB%87t-%C4%91%E1%BA%B9p-c%E1%BB%A7a-s%C3%A0i-g%C3%B2n-th%C3%A0nh-ph%E1%BB%9IC-h%E1%BB%93-ch%C3%AD-minh-v%E1%BB%81-%C4%91%C3%AAm.jpg?s=612x612&w=0&k=20&c=poxrZh-OyNJdMELgQPYzDernnhWf2CW3auY8rxnqj-o=",
      "https://media.istockphoto.com/id/1757396329/vi/anh/nh%C3%ACn-t%E1%BB%AB-tr%C3%AAn-kh%C3%B4ng-v%C3%A0o-s%C3%A1ng-s%E1%BB%9Bm-t%E1%BA%A1i-landmark-81-l%C3%A0-m%E1%BB%99t-t%C3%B2a-nh%C3%A0-ch%E1%BB%8Dc-tr%E1%BB%9Di-si%C3%AAu-cao-%E1%BB%9F-trung-t%C3%A2m.jpg?s=612x612&w=0&k=20&c=ZtrLBnVoRhn4Ckg7bxpjlqUz3IkVKAiZt-pCVTF7ufA="
    ];

    const res = await Place.updateOne(
      { id: 'tphcm' }, 
      { $set: { images: correctImages } }
    );
    console.log('Update result:', res);
    
    // Double check the database status
    const doc = await Place.findOne({ id: 'tphcm' });
    if (doc) {
      console.log('Current images in DB for tphcm:', doc.images);
    } else {
      console.log('Document not found!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error during update:', err);
    process.exit(1);
  }
}

fix();
