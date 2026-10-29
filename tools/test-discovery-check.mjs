import assert from 'node:assert/strict';
import { classifyTest, discoverTests } from './test.mjs';
import config from '../vitest.config.js';

assert.equal(classifyTest('node.test.js', "import { test } from 'node:test';"), 'node');
assert.equal(classifyTest('vitest.test.js', "import { test } from 'vitest';"), 'vitest');
assert.throws(() => classifyTest('unknown.test.js', 'test(() => {});'), /exactly one/);
assert.throws(() => classifyTest('mixed.test.js', "import 'node:test'; import 'vitest';"), /exactly one/);

const suites = discoverTests();
for (const name of ['animation', 'boss_attack_math', 'combat_objectives', 'difficulty', 'progression', 'vfx']) {
  assert.ok(suites.node.includes(`src/games/SeranganFajar/tests/${name}.test.js`), `Missing node:test suite: ${name}`);
}
for (const name of ['cameraShake', 'checkoutFlow', 'combat', 'combatBalancing', 'combatInput', 'combatPhysics', 'combatSkills', 'combatVisuals', 'environment', 'gameClock', 'gameLogic', 'objectivePhysics', 'objectives', 'shopping', 'skillInput', 'skillPhysics']) {
  assert.ok(suites.vitest.includes(`src/games/Kopdes3D/tests/${name}.test.js`), `Missing Vitest suite: ${name}`);
}
assert.deepEqual(config.test.include, suites.vitest);
assert.equal(new Set([...suites.node, ...suites.vitest]).size, suites.node.length + suites.vitest.length);
console.log(`Discovery PASS: ${suites.node.length} node:test suites; ${suites.vitest.length} Vitest suites; no overlap or unclassified suites.`);
