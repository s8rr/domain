const { execSync } = require('child_process');

try {
  // Extract files that were added or modified against main branch
  const changed = execSync('git diff --name-only --diff-filter=AM origin/main...HEAD')
    .toString().trim().split('\n').filter(Boolean);

  // Extract files that were deleted against main branch
  const deleted = execSync('git diff --name-only --diff-filter=D origin/main...HEAD')
    .toString().trim().split('\n').filter(Boolean);

  console.log('📊 Changed files detected:', changed);
  console.log('🗑️ Deleted files detected:', deleted);

} catch (error) {
  console.log('⚠️ Could not determine changed files (this is normal on manual dispatch or if git history is shallow).');
}
