const { execSync } = require('child_process');

const files = [
  'scratch/seed-halong-biz.js',
  'scratch/seed-halong.js',
  'scratch/seed-biz-real.js'
];

files.forEach(f => {
  try {
    console.log(`\n=== File: ${f} from 2ee28e6441f7fb5af64bda631504d412ae74cddc~1 ===`);
    const content = execSync(`git show 2ee28e6441f7fb5af64bda631504d412ae74cddc~1:${f}`, { encoding: 'utf8' });
    console.log(content.substring(0, 1500) + '\n... [truncated] ...');
    
    // Save to a temp file in scripts/temp/ so we can inspect it or run it if needed
    const savePath = `d:/D_n_mới/WanderViet_1/scripts/temp/recovered_${f.split('/').pop()}`;
    const fs = require('fs');
    fs.writeFileSync(savePath, content, 'utf8');
    console.log(`Saved to ${savePath}`);
  } catch (err) {
    console.error(`Error on file ${f}:`, err.message);
  }
});
