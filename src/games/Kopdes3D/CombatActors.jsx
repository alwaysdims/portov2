import { useRef, useState } from 'react';
import { createCombat } from './combat.js';
import { attackExtension } from './combatVisuals.js';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { Sign } from './environment/Props.jsx';

function Actor({ simulation, actorId, body, enemy = false }) {
  const [initial] = useState(() => createCombat()[actorId]);
  const model = useRef(null);
  const left = useRef(null);
  const right = useRef(null);
  const torso = useRef(null);
  const trail = useRef(null);
  const tray = useRef(null);
  useFrame(() => {
    const sim = simulation.current;
    const actor = sim[actorId];
    const attack = actor.attack;
    const pulse = attackExtension(attack);
    model.current.rotation.set(actor.state === 'DEAD' ? Math.PI / 2 : actor.dash ? -0.3 : 0, actor.yaw, 0);
    model.current.position.y = actor.state === 'DEAD' ? -0.5 : 0;
    left.current.rotation.x = pulse * (attack?.index === 1 ? 2 : 0.6);
    right.current.rotation.x = pulse * (attack?.index === 1 ? 0.6 : 2);
    torso.current.color.set(actor.flashUntil > sim.tick ? '#fff1a5' : enemy ? '#202328' : '#bd3d32');
    tray.current.visible = !enemy && actor.stance === 'tray';
    trail.current.visible = Boolean(actor.dash);
  });
  return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[initial.position.x, initial.position.y, initial.position.z]} enabledRotations={[false, false, false]}>
    <CapsuleCollider args={[0.5, 0.35]}  />
    <group ref={model}>
      <mesh castShadow><capsuleGeometry args={[0.27, 0.45, 4, 8]} /><meshStandardMaterial ref={torso} color={enemy ? '#202328' : '#bd3d32'} /></mesh>
      <mesh castShadow position={[0, 0.62, 0]}><sphereGeometry args={[0.23, 12, 8]} /><meshStandardMaterial color="#d8a77e" /></mesh>
      <mesh position={[0, 0.62, -0.21]}><sphereGeometry args={[0.06, 8, 6]} /><meshStandardMaterial color="#9a654d" /></mesh>
      {enemy && <>
        <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.23, 0.23, 0.22, 8]} /><meshStandardMaterial color="#15181b" /></mesh>
        <mesh position={[0, 0.17, -0.25]}><boxGeometry args={[0.24, 0.44, 0.04]} /><meshStandardMaterial color="#f5f0e6" /></mesh>
        <mesh position={[0, 0.16, -0.28]}><boxGeometry args={[0.07, 0.34, 0.03]} /><meshStandardMaterial color="#c43d35" /></mesh>
      </>}
      {[-1, 1].map(side => <mesh key={side} castShadow position={[side * 0.14, -0.53, 0]}><capsuleGeometry args={[0.1, 0.25, 4, 8]} /><meshStandardMaterial color="#233d40" /></mesh>)}
      {[-1, 1].map(side => <group key={side} ref={side < 0 ? left : right} position={[side * 0.35, 0.2, 0]}>
        <mesh position={[0, -0.15, 0]}><capsuleGeometry args={[0.08, 0.3, 4, 8]} /><meshStandardMaterial color={enemy ? '#202328' : '#d8a77e'} /></mesh>
        {side > 0 && <mesh ref={tray} position={[0, -0.4, -0.1]}><boxGeometry args={[0.48, 0.08, 0.65]} /><meshStandardMaterial color="#aab7b9" metalness={0.4} roughness={0.35} /></mesh>}
      </group>)}
      <mesh ref={trail} position={[0, -0.3, 0.7]}><boxGeometry args={[0.6, 0.5, 1.3]} /><meshBasicMaterial color="#f5d286" transparent opacity={0.4} depthWrite={false} /></mesh>
    </group>
  </RigidBody>;
}

function DamageNumber({ event }) {
  const group = useRef(null);
  useFrame(({ camera }) => { group.current.quaternion.copy(camera.quaternion); });
  return <group ref={group} position={[event.position.x, event.position.y + 1.6, event.position.z]}>
    <Sign text={`−${event.damage}`} position={[0, 0, 0]} width={0.8} height={0.3} rotation={[0, 0, 0]} />
  </group>;
}

export default function CombatActors({ simulation, playerBody, guardBody, snapshot }) {
  // Presentation reads live ticks; it never applies damage or changes combat state.
  return <>
    <Actor simulation={simulation} actorId="player" body={playerBody} />
    <Actor simulation={simulation} actorId="guard" body={guardBody} enemy />
    {snapshot.events.filter(event => event.type === 'hit' && snapshot.tick - event.tick < 45).map(event => <DamageNumber key={event.id} event={event} />)}
  </>;
}
