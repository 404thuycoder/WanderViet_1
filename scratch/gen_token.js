const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = {
  id: 'business52623887',
  _id: '69f6dc9b54ccdb778025af56',
  customId: 'business52623887',
  portal: 'business',
  role: 'business'
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');
console.log('BUSINESS_TOKEN=' + token);
process.exit(0);
