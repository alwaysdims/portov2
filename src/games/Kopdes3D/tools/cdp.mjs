import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

// Node >=22; dedicated, already-running Chrome + local production preview only.
export const gameURL = process.env.KOPDES_URL || 'http://127.0.0.1:4173/games/kopdes-3d';
const endpoint = process.env.KOPDES_CDP || 'http://127.0.0.1:9231';
function localURL(value) {
  const url = new URL(value);
  if (!['http:', 'ws:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password) {
    throw new Error(`Local HTTP/CDP endpoint required: ${value}`);
  }
  return url;
}
localURL(gameURL);
localURL(endpoint);
export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
export const rootExpression = `(()=>{const c=document.querySelector('canvas');if(!c)return null;let f=c[Object.keys(c).find(k=>k.startsWith('__reactFiber'))],s;for(;f&&!s;f=f.return)for(const n of [f,f.alternate])for(let h=n?.memoizedState;h;h=h.next)if(h.memoizedState?.current?.scene)s=h.memoizedState.current;return s})()`;
export function outputPath(kind) {
  if (process.env.KOPDES_OUTPUT) return process.env.KOPDES_OUTPUT;
  if (!process.env.TMPDIR) throw new Error('Set KOPDES_OUTPUT (JSON file) or TMPDIR; no repository output default');
  return join(process.env.TMPDIR, `kopdes311-${kind}-${Date.now()}.json`);
}
export async function save(path, report) {
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
}
export async function connect() {
  const response = await fetch(new URL('/json/list', endpoint), { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`CDP discovery HTTP ${response.status}`);
  const pages = (await response.json()).filter(tab => tab.type === 'page');
  let matches = pages.filter(tab => tab.url === gameURL);
  if (!matches.length) matches = pages.filter(tab => {
    try { return new URL(tab.url).origin === new URL(gameURL).origin; } catch { return false; }
  });
  if (matches.length !== 1) throw new Error(`Expected one matching local page, found ${matches.length}; open only dedicated test tab`);
  const tab = matches[0];
  localURL(tab.webSocketDebuggerUrl);
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.close(); reject(new Error('CDP connection timeout')); }, 5000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const events = [];
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const key = ++id;
      const timer = setTimeout(() => { pending.delete(key); reject(new Error(`CDP timeout: ${method}`)); }, 120000);
      pending.set(key, { resolve, reject, timer });
      try { ws.send(JSON.stringify({ id: key, method, params })); }
      catch (error) { clearTimeout(timer); pending.delete(key); reject(error); }
    });
  }
  ws.addEventListener('close', () => {
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('CDP disconnected')); }
    pending.clear();
  });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const p = pending.get(message.id);
      if (!p) return;
      clearTimeout(p.timer); pending.delete(message.id);
      if (message.error) p.reject(new Error(JSON.stringify(message.error))); else p.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      const allowed = new URL(request.url).origin === new URL(gameURL).origin;
      if (!allowed) events.push({ method: 'Tool.externalRequestBlocked', params: { url: request.url } });
      void call(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? { requestId } : { requestId, errorReason: 'BlockedByClient' })
        .catch(error => events.push({ method: 'Tool.networkGuardError', params: { message: error.message } }));
    } else if (['Runtime.exceptionThrown', 'Runtime.consoleAPICalled', 'Log.entryAdded', 'Network.loadingFailed', 'Network.responseReceived'].includes(message.method)) events.push(message);
  });
  async function evaluate(expression, extra = {}) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, ...extra });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  const keys = { KeyW: ['w', 87], KeyS: ['s', 83], KeyA: ['a', 65], KeyD: ['d', 68], KeyQ: ['q', 81], KeyJ: ['j', 74], KeyR: ['r', 82], KeyF: ['f', 70], ShiftLeft: ['Shift', 16], Escape: ['Escape', 27] };
  const held = new Set();
  async function down(code) {
    const [key, windowsVirtualKeyCode] = keys[code];
    await call('Input.dispatchKeyEvent', { type: 'keyDown', code, key, windowsVirtualKeyCode }); held.add(code);
  }
  async function up(code) {
    const [key, windowsVirtualKeyCode] = keys[code];
    await call('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode }); held.delete(code);
  }
  async function tap(code) { await down(code); await up(code); }
  async function clickText(text) {
    if (await evaluate('!!document.pointerLockElement')) throw new Error('Release pointer lock before DOM click');
    const point = await evaluate(`(()=>{const b=[...(document.querySelector('dialog[open]')??document).querySelectorAll('button,a')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Button unavailable');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await call('Input.dispatchMouseEvent', { type, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1, ...point });
  }
  async function state() {
    return evaluate(`(()=>{const c=document.querySelector('canvas'),s=${rootExpression},actors=[];s?.scene.traverse(o=>{if(o.isMesh&&o.geometry?.type==='CapsuleGeometry'&&o.geometry.parameters.radius===.27){const p=o.getWorldPosition(o.position.clone());actors.push({x:p.x,y:p.y,z:p.z})}});const gl=c?.getContext('webgl2');return{url:location.href,timeOrigin:performance.timeOrigin,actors,text:document.body.innerText,locked:!!c&&document.pointerLockElement===c,visibility:document.visibilityState,focus:document.hasFocus(),dimensions:c?[c.width,c.height]:null,lost:gl?.isContextLost(),webgl:gl?.getParameter(gl.VERSION),calls:s?.gl.info.render.calls,triangles:s?.gl.info.render.triangles,memory:s?.gl.info.memory,dialog:document.querySelector('dialog')?.open,camera:s?.camera.position.toArray(),heap:performance.memory?.usedJSHeapSize}})()`);
  }
  async function until(read, accept, label, timeout = 20000) {
    const end = Date.now() + timeout;
    do { const value = await read(); if (accept(value)) return value; await wait(100); } while (Date.now() < end);
    throw new Error(`Timed out: ${label}`);
  }
  const ready = () => until(state, s => s.actors.length === 2 && s.text.includes('Gerbang:'), 'scene ready');
  async function release() {
    if ((await state()).locked) await tap('Escape');
    await until(state, s => !s.locked, 'pointer lock released', 3000);
  }
  async function activate() {
    await clickText('Aktifkan kontrol');
    await until(state, s => s.locked, 'pointer lock active', 3000);
  }
  async function fresh(url = gameURL) {
    if (localURL(url).origin !== new URL(gameURL).origin) throw new Error('Navigation outside game origin');
    await release(); await call('Page.navigate', { url });
    await until(() => evaluate('location.href'), value => value === url, 'navigation');
    return ready();
  }
  async function move(axis, target) {
    const p = (await state()).actors[0];
    if (!p) throw new Error('Player missing');
    const positive = target > p[axis];
    const code = axis === 'z' ? (positive ? 'KeyW' : 'KeyS') : (positive ? 'KeyA' : 'KeyD');
    await down(code);
    try {
      await until(state, s => {
        if (!s.locked || !s.actors[0]) throw new Error('Movement controls lost');
        return positive ? s.actors[0][axis] >= target - .12 : s.actors[0][axis] <= target + .12;
      }, `movement ${axis}=${target}`);
    } finally { await up(code); }
  }
  async function close() {
    for (const code of held) await up(code).catch(() => {});
    await release().catch(() => {});
    await call('Fetch.disable').catch(() => {});
    await call('Emulation.clearDeviceMetricsOverride').catch(() => {});
    await call('Emulation.setFocusEmulationEnabled', { enabled: false }).catch(() => {});
    ws.close();
  }
  try {
    for (const domain of ['Runtime', 'Log', 'Page', 'Network']) await call(`${domain}.enable`);
    // Only local game-origin HTTP resources may leave this tab while tool attached.
    await call('Fetch.enable', { patterns: [{ urlPattern: 'http://*' }, { urlPattern: 'https://*' }] });
    await call('Page.bringToFront');
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
  } catch (error) { await close(); throw error; }
  return { call, evaluate, events, tab: { id: tab.id, url: tab.url }, state, ready, until, fresh, release, activate, clickText, tap, down, up, move, close };
}
export function errors(events) {
  return events.filter(e => e.method === 'Runtime.exceptionThrown' ||
    e.method.startsWith('Tool.') || e.method === 'Network.loadingFailed' && !e.params.canceled ||
    e.method === 'Network.responseReceived' && e.params.response.status >= 400 ||
    e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error' ||
    e.method === 'Log.entryAdded' && e.params.entry.level === 'error');
}
export function warnings(events) {
  return events.filter(e => e.method === 'Runtime.consoleAPICalled' && e.params.type === 'warning' ||
    e.method === 'Log.entryAdded' && e.params.entry.level === 'warning').map(event => {
    const text = JSON.stringify(event.params);
    const classification = /THREE\.Clock|THREE\.THREE\.Clock/.test(text) ? 'three-clock-deprecation' :
      /deprecated parameters.*initialization|using deprecated parameters/.test(text) ? 'rapier-initialization-deprecation' : 'unclassified';
    return { classification, event };
  });
}
