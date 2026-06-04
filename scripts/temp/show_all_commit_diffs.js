const { execSync } = require('child_process');

try {
  const stdout = execSync('git log -G"Anh Thủy|Thủy Phi Cơ|Luxury Dinner|Câu Mực|Spa" --format="%H %s"', { encoding: 'utf8' });
  const lines = stdout.trim().split('\n');
  console.log(`Found ${lines.length} commits matching -G search.`);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(' ');
    const hash = parts[0];
    const subject = parts.slice(1).join(' ');
    
    console.log(`\n=== Commit: ${hash} (${subject}) ===`);
    const diff = execSync(`git show ${hash}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const diffLines = diff.split('\n');
    diffLines.forEach((dLine, idx) => {
      if (/Anh Thủy|Thủy Phi Cơ|Luxury Dinner|Câu Mực/i.test(dLine)) {
        console.log(`Line ${idx + 1}: ${dLine.trim()}`);
      }
    });
  }
} catch (err) {
  console.error('Error:', err.message);
}
