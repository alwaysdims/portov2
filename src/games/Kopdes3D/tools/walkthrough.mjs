import assert from 'node:assert/strict';
import { connect, gameURL, wait, save, outputPath, errors, warnings } from './cdp.mjs';

// Real CDP input only. No simulation, clock, cooldown or HP writes.
const c = await connect();
const report = { url: gameURL, checks: [], states: [] };
async function key(code, key, windowsVirtualKeyCode) {
  for (const type of ['keyDown', 'keyUp']) await c.call('Input.dispatchKeyEvent', { type, code, key, windowsVirtualKeyCode });
}
async function capture(label) { report.states.push({ label, state: await c.state() }); }
const snapshot = () => c.evaluate(`(()=>{const e=document.querySelector('.kopdes-skills');let f=e[Object.keys(e).find(k=>k.startsWith('__reactFiber'))],r=f;while(r.return)r=r.return;if(r.stateNode.current!==r)f=f.alternate;for(;f;f=f.return)if(f.memoizedProps?.combat?.skills)return f.memoizedProps.combat;throw Error('Combat snapshot missing')})()`);
async function check(label, run) { await run(); report.checks.push(label); console.log('PASS', label); }
try {
  await c.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await c.fresh(); await c.activate(); await wait(350);
  await check('directional dash', async () => {
    const before = (await c.state()).actors[0];
    await key('Digit1', '1', 49); await wait(400);
    assert.ok((await c.state()).actors[0].z > before.z + 1);
  });
  await c.tap('KeyQ'); await wait(150);
  assert.ok((await c.state()).text.includes('Ompreng'));
  report.checks.push('weapon switching');
  await c.down('ShiftLeft'); await c.move('z', 7.7); await c.up('ShiftLeft');
  await c.tap('KeyR');
  await c.until(c.state, s => s.text.includes('R · CAST') || /stun|STUN/i.test(s.text), 'accepted prison cast');
  await wait(800); await capture('prison');
  await c.until(c.state, s => !s.text.includes('R · CAST'), 'prison recovery');
  await c.tap('KeyF');
  await c.until(c.state, s => s.text.includes('Penjaga tersisa: 0'), 'ultimate kill and gate unlock');
  report.checks.push('prison cast', 'ultimate kill', 'enemy death', 'gate unlock'); await capture('gate');
  await c.move('z', 30); await c.move('x', -2.7); await c.move('z', 31.75); await key('KeyE', 'e', 69); await wait(150);
  await c.move('z', 33); await key('KeyE', 'e', 69); await wait(150);
  await c.move('z', 34.25); await key('KeyE', 'e', 69); await wait(150);
  await c.move('x', 0); await c.move('z', 37.3); await key('KeyE', 'e', 69); await wait(150); await key('KeyE', 'e', 69); await wait(150);
  await c.move('z', 36); await c.move('x', 4.5); await key('KeyE', 'e', 69);
  await c.until(c.state, s => s.dialog && !s.locked, 'checkout modal');
  const before = await c.state(), beforeCombat = await snapshot();
  for (const code of ['KeyR', 'KeyF', 'KeyJ']) await c.tap(code);
  await c.down('KeyW'); await wait(600); await c.up('KeyW');
  const after = await c.state(), afterCombat = await snapshot();
  assert.deepEqual(after.actors, before.actors); assert.ok(after.dialog && !after.locked);
  assert.equal(afterCombat.tick, beforeCombat.tick);
  assert.deepEqual(afterCombat.skills, beforeCombat.skills);
  assert.equal(afterCombat.cast, beforeCombat.cast);
  report.checks.push('product interactions', 'shopping', 'modal lockout'); await capture('checkout');
  await c.clickText('Konfirmasi bayar Rp78.000'); await wait(300); await capture('receipt');
  assert.ok((await c.state()).text.includes('Lihat hasil misi'));
  await c.clickText('Lihat hasil misi');
  await c.until(() => c.evaluate('({title:document.querySelector("dialog[open] #kopdes-dialog-title")?.textContent,score:document.querySelector(".kopdes-result-score")?.textContent})'), v => v.title === 'Misi selesai!' && /\/100/.test(v.score), 'mission result DOM');
  assert.equal((await snapshot()).objective.stage, 'MISSION_COMPLETE');
  await capture('mission-result');
  report.checks.push('checkout Rp78.000', 'receipt', 'mission result');
  await c.clickText('Ulangi misi');
  await c.until(c.state, s => s.text.includes('Keranjang kosong.') && s.text.includes('Gerbang: LOCKED') && s.actors[1]?.z > 11, 'reset');
  assert.ok(!(await c.state()).locked); report.checks.push('retry');
  report.errors = errors(c.events); report.warnings = warnings(c.events);
  assert.equal(report.errors.length, 0); report.pass = true;
  console.log('WALKTHROUGH PASS', report.checks);
} catch (error) { report.pass = false; report.failure = error.stack; process.exitCode = 1; console.error(error); }
finally { await c.close(); await save(outputPath('walkthrough'), report); }
