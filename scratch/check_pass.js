const bcrypt = require('bcryptjs');

const hash = '$2b$10$njCKJ2tnTVQQhOUWEwoe6uVLal7Wy51lFMiTRvmaBYUrRDmg/Y9oe';
const commonPasswords = [
  '123456',
  '12345678',
  '123456789',
  'password',
  'admin',
  'admin123',
  'halong',
  'halongluxury',
  'halong@luxury.com',
  'business18017811',
  'toan_dev',
  '21062006', // from .env mongodb password!
  'toan1_db_user'
];

async function check() {
  for (const pw of commonPasswords) {
    const match = await bcrypt.compare(pw, hash);
    if (match) {
      console.log(`FOUND PASSWORD: "${pw}"`);
      return;
    }
  }
  console.log('No common password matched.');
}

check().catch(console.error);
