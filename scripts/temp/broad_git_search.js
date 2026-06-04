const { execSync } = require('child_process');

try {
  console.log('Searching git history for "thuy" or "thùy" (broad search)...');
  const matchCommits = execSync('git log -G"thuy|thùy|thủy" --format="%H %s"', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  console.log('Commits found:', matchCommits);
  
  // Show diff details for the first few commits
  for (const line of matchCommits.slice(0, 5)) {
    const hash = line.split(' ')[0];
    console.log(`\n=== Commit: ${line} ===`);
    const show = execSync(`git show ${hash}`, { encoding: 'utf8', maxBuffer: 10*1024*1024 });
    const showLines = show.split('\n');
    showLines.forEach((l, idx) => {
      if (/thuy|thùy|thủy/i.test(l)) {
        console.log(`Line ${idx+1}: ${l}`);
      }
    });
  }
} catch (err) {
  console.error(err.message);
}
