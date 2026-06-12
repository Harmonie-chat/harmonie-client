import { spawnSync } from 'node:child_process';

const runGit = (args, options = {}) =>
  spawnSync('git', args, {
    stdio: 'ignore',
    ...options,
  });

const repoCheck = runGit(['rev-parse', '--is-inside-work-tree']);

if (repoCheck.error?.code === 'ENOENT') {
  process.exit(0);
}

if (repoCheck.error) {
  console.warn(`Skipping Git hooks setup: ${repoCheck.error.message}`);
  process.exit(0);
}

if (repoCheck.status !== 0) {
  process.exit(0);
}

const hookConfig = runGit(['config', 'core.hooksPath', '.githooks'], {
  stdio: 'pipe',
});

if (hookConfig.error) {
  console.warn(`Skipping Git hooks setup: ${hookConfig.error.message}`);
  process.exit(0);
}

if (hookConfig.status !== 0) {
  const reason = hookConfig.stderr?.toString().trim() || 'git config failed.';
  console.warn(`Skipping Git hooks setup: ${reason}`);
}

process.exit(0);
