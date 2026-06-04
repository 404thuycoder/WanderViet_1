const { execSync } = require('child_process');

try {
  console.log('Searching git history patches for "Anh Thủy" or "Thủy Phi Cơ" or "Luxury Dinner" or "Câu Mực" or "Spa"...');
  
  // We can search commit messages and diffs for these strings.
  // Using git log -G is very powerful: it searches for lines in diffs that match the regex.
  const stdout = execSync('git log -G"Anh Thủy|Thủy Phi Cơ|Luxury Dinner|Câu Mực|Spa" --oneline', { encoding: 'utf8' });
  console.log('Matching commits:');
  console.log(stdout || '(none)');
} catch (err) {
  console.error('Error running git log:', err.message);
}
