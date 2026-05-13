const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('./server/models/Place');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const res = await Place.updateOne(
      { _id: '69feecfa5bc470cda4e5ba34' }, 
      { $set: { images: ['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhSDNZK09UT4V2Fo9JZ_WKhgcu7jwiY_DC-JCSeB_Pyufk1K3bjWaPAZjbbR5g6i6oyehYbEXhwjUBQUQ1fLCfmgQCIWVWlsS8VnTW6oPsYRRCErWu6A3brl4T_gaMtIu3CbcCNkdn759Dv/s1600/khach-san-long-chau-ha-tien.jpg'] } }
    );
    console.log('Update result:', res);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
