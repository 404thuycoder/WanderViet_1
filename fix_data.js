const mongoose = require('mongoose');
const Place = require('./models/Place');
require('dotenv').config();

async function fixClassifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // 1. Fix Hotels
    const res1 = await Place.updateMany(
      { 
        $or: [
          { name: /Mường Thanh|Khách sạn|Hotel|Resort|Nghỉ dưỡng|Homestay|Villa/i },
          { kind: 'tien-ich', description: /phòng|nghỉ|chỗ ở/i }
        ],
        kind: { $ne: 'khach-san' }
      },
      { $set: { kind: 'khach-san', isUtility: false } }
    );
    console.log(`Updated ${res1.modifiedCount} places to khach-san`);

    // 2. Fix Restaurants/Dining
    const res2 = await Place.updateMany(
      { 
        $or: [
          { name: /Nhà hàng|Restaurant|Mì cay|Quán ăn|Lẩu|Buffet|Bữa tối|Dinner|Café|Cà phê/i },
          { description: /ẩm thực|món ăn|thưởng thức|hải sản/i, kind: 'tien-ich' }
        ],
        kind: { $ne: 'nha-hang' }
      },
      { $set: { kind: 'nha-hang', isUtility: false } }
    );
    console.log(`Updated ${res2.modifiedCount} places to nha-hang`);

    // 3. Fix Amusement/Entertainment
    const res3 = await Place.updateMany(
      { 
        $or: [
          { name: /Sun World|VinWonders|Công viên|Vui chơi|Giải trí|Spa|Massage|Vé/i },
          { kind: 'tien-ich', description: /vui chơi|thư giãn|trò chơi/i }
        ],
        kind: { $ne: 'giai-tri' }
      },
      { $set: { kind: 'giai-tri', isUtility: false } }
    );
    console.log(`Updated ${res3.modifiedCount} places to giai-tri`);

    // 4. Ensure Tours are marked correctly
    const res4 = await Place.updateMany(
      { 
        $or: [
          { name: /Tour|Chuyến đi|Hành trình/i },
          { isTour: true }
        ],
        kind: { $ne: 'diem-du-lich' } 
      },
      { $set: { isTour: true, kind: 'diem-du-lich' } }
    );
    console.log(`Updated ${res4.modifiedCount} tours to diem-du-lich (with isTour: true)`);

    console.log('Database cleanup complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixClassifications();
