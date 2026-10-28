import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import GameWorld from './GameWorld.jsx';
import './Kopdes3D.css';

export default function Kopdes3D() {
  const stage = useRef(null);
  const [locked, setLocked] = useState(false);
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
        <p role="status">{locked ? 'Kontrol aktif' : 'Kontrol dijeda'} · WASD bergerak · Shift sprint · Mouse kamera · Esc lepas kontrol</p>
        {controlError && <p role="alert">{controlError}</p>}
      </section>
      <div className="kopdes-stage" ref={stage}>
        <Suspense fallback={<p role="status">Memuat dunia 3D dan fisika...</p>}>
          <Canvas shadows camera={{ position: [0, 3, 5], fov: 60, near: 0.1 }} dpr={[1, 1.5]} onCreated={({ gl }) => {
            gl.domElement.tabIndex = 0;
            gl.domElement.setAttribute('aria-label', 'Dunia KOPDES 3D. Aktifkan tombol kontrol untuk bergerak.');
          }} fallback={<p role="alert">Browser ini tidak mendukung WebGL.</p>}>
            <color attach="background" args={['#b5d8de']} />
            <ambientLight intensity={1.4} />
            <directionalLight position={[6, 12, -4]} intensity={2} castShadow />
            <Physics timeStep={1 / 60} gravity={[0, -20, 0]} updatePriority={-50}>
              <GameWorld onLockChange={setLocked} />
            </Physics>
          </Canvas>
        </Suspense>
      </div>
      <footer className="kopdes-bottom">Lawan, Belanja, Bangun Desa <span>Blockout placeholder · bukan aset final</span></footer>
    </main>
  );
}
