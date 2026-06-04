require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const sample = await db.collection('places').findOne({ category: { $exists: true } });
  console.log('Sample place with category:', sample ? JSON.stringify({ name: sample.name, category: sample.category, kind: sample.kind, businessCategory: sample.businessCategory }) : 'NONE');

  const distinctCats = await db.collection('places').distinct('category');
  console.log('Distinct categories:', distinctCats);

  const distinctKinds = await db.collection('places').distinct('kind');
  console.log('Distinct kinds:', distinctKinds);

  const distinctBizCats = await db.collection('places').distinct('businessCategory');
  console.log('Distinct businessCategories:', distinctBizCats);

  mongoose.connection.close();
}).catch(console.error);
