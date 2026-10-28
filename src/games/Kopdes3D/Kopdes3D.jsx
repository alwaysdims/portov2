import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import './Kopdes3D.css';

export default function Kopdes3D() {
  return (
    <main className="kopdes">
      <header className="kopdes-top"><a href="/games">Kembali ke game</a><h1>KOPDES <b>3D</b></h1><span>LEVEL 01 · PROTOTYPE</span></header>
      <div className="kopdes-stage">
        <Suspense fallback={<p role="status">Memuat dunia 3D dan fisika...</p>}>
          <Canvas shadows camera={{ position: [5, 5, -7], fov: 60 }} dpr={[1, 1.5]} fallback={<p role="alert">Browser ini tidak mendukung WebGL.</p>}>
            <color attach="background" args={['#b5d8de']} />
            <ambientLight intensity={1.4} />
            <directionalLight position={[6, 12, -4]} intensity={2} castShadow />
            <Physics timeStep={1 / 60}>
              <RigidBody type="fixed"><mesh receiveShadow position={[0, -0.2, 0]}><boxGeometry args={[24, 0.4, 24]} /><meshStandardMaterial color="#87a768" /></mesh></RigidBody>
              <RigidBody position={[0, 2, 0]}><mesh castShadow><boxGeometry /><meshStandardMaterial color="#e7e5dc" /></mesh></RigidBody>
            </Physics>
          </Canvas>
        </Suspense>
      </div>
      <footer className="kopdes-bottom">Lawan, Belanja, Bangun Desa <span>Blockout placeholder · bukan aset final</span></footer>
    </main>
  );
}
