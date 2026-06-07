const fs = require('fs');
const path = require('path');

const filePath = 'd:\\D_n_mới\\WanderViet_1\\apps\\business-web\\js\\serviceManagement.js';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

for (let i = 300; i < 350; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
