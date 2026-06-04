const { execSync } = require('child_process');

const commits = ['ef36702', '80470ed', 'cab4f12', '76ee5c1'];

commits.forEach(commit => {
  try {
    console.log(`\n=== Commit: ${commit} ===`);
    const diff = execSync(`git show ${commit}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const lines = diff.split('\n');
    lines.forEach((line, idx) => {
      if (/Anh Thủy|Thủy Phi Cơ|Luxury Dinner|Câu Mực/i.test(line)) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
      }
    });
  } catch (err) {
    console.error(`Error on commit ${commit}:`, err.message);
  }
});
