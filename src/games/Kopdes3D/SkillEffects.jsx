import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { cagePhase, impactProgress, latestSkillImpact } from './combatVisuals.js';

const bars = Array.from({ length: 8 }, (_, index) => index * Math.PI / 4);

export default function SkillEffects({ simulation }) {
  const root = useRef(null);
  const cage = useRef(null);
  const metal = useRef(null);
  const duration = useRef(null);
  const wave = useRef(null);
  const ring = useRef(null);
  const lastStun = useRef({ sim: null, tick: 0, end: 0, x: 0, y: 0, z: 0 });
  useFrame(() => {
    const sim = simulation.current;
    const { guard, player, tick } = sim;
    const memory = lastStun.current;
    if (memory.sim !== sim || tick < memory.tick) memory.end = 0;
    memory.sim = sim;
    memory.tick = tick;
    root.current.visible = player.hp > 0 && player.state !== 'DEAD';
    if (!root.current.visible) return;

    const alive = guard.hp > 0 && guard.state !== 'DEAD';
    if (alive && guard.stunUntil > tick) {
      memory.end = guard.stunUntil;
      memory.x = guard.position.x;
      memory.y = guard.position.y - 0.85;
      memory.z = guard.position.z;
    }
    // ponytail: one guard, one cage; add slots only when combat owns more targets.
    const phase = cagePhase(tick, memory.end);
    cage.current.visible = alive && phase !== 'hidden';
    if (cage.current.visible) {
      const grow = Math.min(1, (tick - memory.end + 121) / 8);
      const tail = Math.max(0, (tick - memory.end) / 12);
      cage.current.position.set(memory.x, memory.y, memory.z);
      cage.current.scale.set(1 + tail * 0.5, Math.max(0.01, grow), 1 + tail * 0.5);
      const opacity = tick < memory.end ? 1 - Math.max(0, (tick - memory.end + 12) / 12) * 0.35 : (1 - tail) * 0.65;
      for (const mesh of metal.current.children) mesh.material.opacity = opacity;
      for (let index = 0; index < 8; index++) {
        metal.current.children[index].rotation.z = Math.cos(bars[index]) * tail * 0.65;
        metal.current.children[index].rotation.x = -Math.sin(bars[index]) * tail * 0.65;
      }
      const remaining = Math.max(0, Math.min(1, (memory.end - tick) / 120));
      duration.current.visible = remaining > 0;
      duration.current.scale.x = Math.max(0.001, remaining);
      duration.current.position.x = -0.7 * (1 - remaining);
    }

    const event = latestSkillImpact(sim);
    const progress = impactProgress(sim, event);
    wave.current.visible = progress >= 0;
    if (progress >= 0) {
      wave.current.position.set(event.position.x, event.position.y - 0.79, event.position.z);
      const radius = 0.35 + progress * 3.2;
      wave.current.scale.set(radius, radius, 1);
      ring.current.material.opacity = (1 - progress) * 0.85;
    }
  });
  return <group ref={root} name="skill-effects" visible={false}>
    <group ref={cage} name="prison-cage" visible={false}>
      <group ref={metal} name="prison-bars">
        {bars.map((angle, index) => <mesh key={index} position={[Math.cos(angle) * 0.75, 1.05, Math.sin(angle) * 0.75]}>
          <boxGeometry args={[0.07, 2.1, 0.07]} />
          <meshStandardMaterial color="#abc4cc" metalness={0.85} roughness={0.26} emissive="#287e91" emissiveIntensity={0.4} transparent />
        </mesh>)}
        {[0.12, 2.02].map(y => <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.75, 0.055, 4, 16]} />
          <meshStandardMaterial color="#abc4cc" metalness={0.85} roughness={0.26} emissive="#287e91" emissiveIntensity={0.4} transparent />
        </mesh>)}
      </group>
      <mesh ref={duration} name="prison-duration" position={[0, 2.25, 0]}>
        <boxGeometry args={[1.4, 0.08, 0.08]} /><meshBasicMaterial color="#66e5ff" />
      </mesh>
    </group>
    <group ref={wave} name="ultimate-shockwave" rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <mesh ref={ring} name="ultimate-ground-ring">
        <ringGeometry args={[0.86, 1, 48]} /><meshBasicMaterial color="#ffe29c" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  </group>;
}
