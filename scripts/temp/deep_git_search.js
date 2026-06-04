const { execSync } = require('child_process');

try {
  console.log('Searching git logs for "Anh Thủy" to find the commit...');
  const commitHashes = execSync('git log --all --grep="Anh Thủy" --format="%H"', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  
  if (commitHashes.length === 0) {
    // Let's search patch logs of all commits for "Anh Thủy"
    console.log('No commit messages contain "Anh Thủy". Searching diff contents...');
    const matchCommits = execSync('git log -G"Anh Thủy" --format="%H %s"', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    console.log('Commits with diffs containing "Anh Thủy":');
    console.log(matchCommits);
    
    for (const line of matchCommits) {
      const hash = line.split(' ')[0];
      console.log(`\n=== Commit: ${line} ===`);
      const show = execSync(`git show ${hash}`, { encoding: 'utf8', maxBuffer: 10*1024*1024 });
      const showLines = show.split('\n');
      showLines.forEach((l, idx) => {
        if (/Anh Thủy/i.test(l)) {
          console.log(`Line ${idx+1}: ${l}`);
        }
      });
    }
  } else {
    console.log('Commits with message containing "Anh Thủy":', commitHashes);
  }
} catch (err) {
  console.error(err.message);
}
