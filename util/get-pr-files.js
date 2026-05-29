const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Extract files that were added or modified against main branch
  const changed = execSync('git diff --name-only --diff-filter=AM origin/main HEAD')
    .toString().trim().split('\n').filter(Boolean);

  // Extract files that were deleted against main branch
  const deleted = execSync('git diff --name-only --diff-filter=D origin/main HEAD')
    .toString().trim().split('\n').filter(Boolean);

  console.log('📊 Changed files detected:', changed);
  console.log('🗑️ Deleted files detected:', deleted);

  // Safely pass these down as stringified arrays to the environment variables
  fs.appendFileSync(process.env.GITHUB_ENV, `CHANGED_FILES=${JSON.stringify(changed)}\n`);
  fs.appendFileSync(process.env.GITHUB_ENV, `DELETED_FILES=${JSON.stringify(deleted)}\n`);
} catch (err) {
  console.error('❌ Failed to extract PR file differences:', err.message);
  process.exit(1);
}
