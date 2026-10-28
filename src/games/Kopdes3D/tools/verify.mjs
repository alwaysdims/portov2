import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    console.error(result.stdout, result.stderr);
    process.exit(result.status || 1);
  }
  return result.stdout;
}
console.log(`Runtime: ${process.version}`);
const tests = readdirSync(resolve(root, 'src/games/SeranganFajar/tests')).filter(name => name.endsWith('.test.js')).map(name => `src/games/SeranganFajar/tests/${name}`);
console.log(run(['--test', ...tests]).split('\n').filter(line => /tests |pass |fail |duration_ms/.test(line)).join('\n'));
if (existsSync(resolve(root, 'src/games/Kopdes3D/tests'))) console.log(run(['node_modules/vitest/vitest.mjs', 'run', 'src/games/Kopdes3D/tests', '--no-file-parallelism']));
run(['node_modules/eslint/bin/eslint.js', 'src/games/Kopdes3D', 'src/App.jsx', 'src/games/GameGates.jsx']);
const lint = spawnSync(process.execPath, ['node_modules/eslint/bin/eslint.js', '.', '--format', 'json'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
if (!lint.stdout?.startsWith('[')) throw new Error(`ESLint failed: ${lint.stderr}`);
const findings = JSON.parse(lint.stdout).flatMap(file => file.messages.map(message => `${file.filePath.replaceAll('\\', '/').split('/src/')[1]}:${message.ruleId}:${message.severity}`)).sort();
const baseline = [
  'context/LanguageContext.jsx:react-refresh/only-export-components:2',
  'context/ThemeContext.jsx:react-refresh/only-export-components:2',
  'games/GameContainer.jsx:no-unused-vars:2',
  'games/GameContainer.jsx:react-hooks/exhaustive-deps:1',
  'games/GameContainer.jsx:react-hooks/set-state-in-effect:2',
  'games/GameContainer.jsx:react-hooks/purity:2',
  'games/GameContainer.jsx:react-hooks/purity:2',
  'games/HelloWorld.jsx:null:2',
  'sections/Certificates.jsx:no-unused-vars:2',
].sort();
if (JSON.stringify(findings) !== JSON.stringify(baseline)) throw new Error(`Lint differs from documented baseline:\n${findings.join('\n')}`);
console.log('Focused lint PASS; global lint unchanged: 8 existing errors, 1 warning.');
console.log(run(['node_modules/vite/bin/vite.js', 'build']).split('\n').filter(line => /built in|modules transformed|Kopdes/.test(line)).join('\n'));
console.log('PASS: regression tests, focused lint, baseline comparison, production build.');
