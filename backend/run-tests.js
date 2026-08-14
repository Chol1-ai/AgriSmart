const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'tests');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.js'));
if (!files.length) {
  console.error('No test files found');
  process.exit(1);
}
let failed = false;
for (const f of files) {
  console.log('\n=== Running test:', f, '===\n');
  const res = spawnSync(process.execPath, ['--test', path.join(testDir, f)], { stdio: 'inherit' });
  if (res.status !== 0) {
    failed = true;
    console.error('Test failed:', f);
  }
}
process.exit(failed ? 1 : 0);
