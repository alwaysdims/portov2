import { spawnSync } from 'node:child_process';
import { globSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignored = ['**/node_modules/**', '**/.git/**', '**/dist/**'];

export function classifyTest(file, source) {
  const runners = [['node', 'node:test'], ['vitest', 'vitest']].filter(([, module]) =>
    new RegExp(`(?:\\bfrom\\s*|\\bimport\\s*(?:\\(\\s*)?|\\brequire\\s*\\(\\s*)['"]${module}['"]`).test(source));
  if (runners.length !== 1) throw new Error(`${file}: expected exactly one runner import (node:test or vitest); found ${runners.length}.`);
  return runners[0][0];
}

export function discoverTests(directory = root) {
  const suites = { node: [], vitest: [] };
  const files = globSync('**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}', { cwd: directory, exclude: ignored });
  for (const file of files.map(file => file.replaceAll('\\', '/')).sort()) {
    suites[classifyTest(file, readFileSync(resolve(directory, file), 'utf8'))].push(file);
  }
  for (const [runner, files] of Object.entries(suites)) {
    if (!files.length) throw new Error(`No ${runner} suites discovered.`);
  }
  return suites;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).some(arg => arg !== '--list')) throw new Error('Usage: node tools/test.mjs [--list]');
  const suites = discoverTests();
  console.log(`Runtime: ${process.version} (${process.execPath})`);
  console.log(`Discovery ignores generated/dependency directories only: ${ignored.join(', ')}`);
  for (const [runner, files] of Object.entries(suites)) console.log(`${runner}: ${files.length} suites\n${files.map(file => `  ${file}`).join('\n')}`);
  console.log('Vitest excludes node:test suites listed above; npm test executes both runners.');
  if (!process.argv.includes('--list')) {
    for (const args of [
      ['--test', ...suites.node],
      ['node_modules/vitest/vitest.mjs', 'run', '--no-file-parallelism'],
    ]) {
      const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
      if (result.error) console.error(result.error);
      if (result.signal) console.error(`Runner terminated by ${result.signal}`);
      if (result.status !== 0) process.exitCode = result.status || 1;
    }
  }
}
