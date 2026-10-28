import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import GameWorld from './GameWorld.jsx';
import Lighting from './environment/Lighting.jsx';
import './Kopdes3D.css';

export default function Kopdes3D() {
  const stage = useRef(null);
  const [locked, setLocked] = useState(false);
  const [combat, setCombat] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [controlError, setControlError] = useState('');

  useEffect(() => {
    function failed() {
      setControlError('Pointer lock ditolak. Aktifkan kontrol lagi melalui tombol di atas.');
    }
    document.addEventListener('pointerlockerror', failed);
    return () => document.removeEventListener('pointerlockerror', failed);
  }, []);

  async function toggleControls() {
    const canvas = stage.current?.querySelector('canvas');
    if (!canvas) return;
    if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
      return;
    }
    try {
      if (!canvas.requestPointerLock) throw new Error('Pointer lock unavailable');
      setControlError('');
      canvas.focus();
      await canvas.requestPointerLock();
    } catch {
      setControlError('Kontrol mouse tidak tersedia. Izinkan pointer lock lalu coba lagi di browser desktop.');
    }
  }

  return (
    <main className="kopdes">
      <header className="kopdes-top"><a href="/games">Kembali ke game</a><h1>KOPDES <b>3D</b></h1><span>LEVEL 01 · PROTOTYPE</span></header>
      <section className="kopdes-controls" aria-label="Kontrol Owi">
        <button type="button" onClick={toggleControls}>{locked ? 'Lepas kontrol' : 'Aktifkan kontrol'}</button>
        <p role="status">{locked ? 'Kontrol aktif' : 'Kontrol dijeda'} · WASD gerak · Shift sprint · Klik/J serang · Q senjata · 1/Space dash · E ambil produk · Mouse kamera · Esc jeda</p>
        {controlError && <p role="alert">{controlError}</p>}
      </section>
      <div className="kopdes-stage" ref={stage}>
        <Suspense fallback={<p role="status">Memuat dunia 3D dan fisika...</p>}>
          <Canvas shadows="percentage" camera={{ position: [0, 3, 5], fov: 60, near: 0.1 }} dpr={[1, 1.5]} onCreated={({ gl }) => {
            gl.domElement.tabIndex = 0;
            gl.domElement.setAttribute('aria-label', 'Dunia KOPDES 3D. Aktifkan tombol kontrol untuk bergerak.');
          }} fallback={<p role="alert">Browser ini tidak mendukung WebGL.</p>}>
            <Lighting />
            <Physics key={attempt} paused timeStep={1 / 60} gravity={[0, -20, 0]} updatePriority={-50}>
              <GameWorld onLockChange={setLocked} onCombatChange={setCombat} />
            </Physics>
          </Canvas>
        </Suspense>
      {combat && <section className="kopdes-hud" aria-label="Status pertarungan">
        <label>Owi <meter min="0" max="100" value={combat.playerHP} /> {combat.playerHP}/100</label>
        <label>Pasukan Jas Hitam <meter min="0" max="50" value={combat.enemyHP} /> {combat.enemyHP}/50</label>
        <span>Senjata: {combat.stance === 'tray' ? 'Ompreng MBG' : 'Tinju'}{combat.pendingStance ? ' (pergantian diantrekan)' : ''} · Combo {combat.combo}</span>
        <span>Dash: {combat.dashCooldown ? `${(combat.dashCooldown / 60).toFixed(1)} s` : 'siap'}{combat.invulnerable ? ' · KEBAL' : ''} · {combat.enemyState}</span>
        <p role="status">{combat.playerHP === 0 ? 'Owi tumbang. Ulangi latihan.' : combat.cleared ? 'Penjaga dikalahkan. Lanjutkan menuju KOPDES.' : 'Hadapi penjaga di jalan menuju KOPDES.'}</p>
        {combat.objective && <>
          <p role="status">{combat.objective.label} · Penjaga tersisa: {combat.objective.remaining} · Gerbang: {combat.objective.gate}</p>
          {combat.objective.notification && <strong role="status">Gerbang KOPDES terbuka!</strong>}
          {combat.objective.prompt && <strong>Tekan E · Beras 1kg · Rp14.000 · Stok {combat.objective.stock}</strong>}
          <span>Keranjang sementara: BR × {combat.objective.cart.quantity} · Rp{combat.objective.cart.total.toLocaleString('id-ID')} · Stok beras {combat.objective.stock}</span>
        </>}
        <button type="button" onClick={() => { document.exitPointerLock?.(); setCombat(null); setAttempt(value => value + 1); }}>Ulangi latihan</button>
      </section>}
      </div>
      <footer className="kopdes-bottom">Lawan, Belanja, Bangun Desa <span>Blockout placeholder · bukan aset final</span></footer>
    </main>
  );
}
