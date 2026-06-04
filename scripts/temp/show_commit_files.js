const { execSync } = require('child_process');

try {
  console.log('Showing files modified in commit 2ee28e6441f7fb5af64bda631504d412ae74cddc:');
  const files = execSync('git show --name-status 2ee28e6441f7fb5af64bda631504d412ae74cddc', { encoding: 'utf8' });
  console.log(files);
} catch (err) {
  console.error(err.message);
}
