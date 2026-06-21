const { execSync } = require('child_process');
try {
  execSync('git checkout -- server/routes/chat.js', { stdio: 'inherit' });
  console.log('Successfully reverted server/routes/chat.js');
} catch (e) {
  console.error('Failed to revert:', e.message);
}
