import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { WORLD_BOXES, cameraPosition, createController, stepPlayer } from './gameLogic.js';

function Owi({ onLockChange }) {
  const body = useRef(null);
  const model = useRef(null);
  const cameraTarget = useRef(new Vector3());
  const controller = useRef(null);
  const input = useRef({ keys: new Set(), yaw: 0, pitch: 0.35, verticalSpeed: 0, cameraReady: false });
  const { world, rapier } = useRapier();
  const { camera, gl } = useThree();

  // Release before Physics' passive cleanup frees and resets its lazy world proxy.
  useLayoutEffect(() => {
    const character = createController(world);
    controller.current = character;
    input.current.verticalSpeed = 0;
    input.current.cameraReady = false;
    return () => {
      controller.current = null;
      world.removeCharacterController(character);
    };
  }, [world]);

  useEffect(() => {
    const canvas = gl.domElement;
    const controls = input.current;
    const codes = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight']);
    function clear() { controls.keys.clear(); }
    function release() {
      clear();
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    }
    function lockChanged() {
      clear();
      onLockChange(document.pointerLockElement === canvas);
    }
    function keyDown(event) {
      if (document.pointerLockElement !== canvas || !codes.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      controls.keys.add(event.code);
    }
    function keyUp(event) { controls.keys.delete(event.code); }
    function mouseMove(event) {
      if (document.pointerLockElement !== canvas || !Number.isFinite(event.movementX) || !Number.isFinite(event.movementY)) return;
      controls.yaw = (controls.yaw - Math.max(-1000, Math.min(1000, event.movementX)) * 0.002) % (Math.PI * 2);
      controls.pitch = Math.max(-0.1, Math.min(1.05, controls.pitch + Math.max(-1000, Math.min(1000, event.movementY)) * 0.002));
    }
    function visibilityChanged() { if (document.hidden) release(); }
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', release);
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('pointerlockchange', lockChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', release);
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('pointerlockchange', lockChanged);
      document.removeEventListener('visibilitychange', visibilityChanged);
      release();
    };
  }, [gl, onLockChange]);

  useBeforePhysicsStep(() => {
    if (!body.current || !controller.current) return;
    const controls = input.current;
    const delta = stepPlayer(world, rapier, body.current, controller.current, controls.keys, controls.yaw, controls);
    if (model.current && Math.hypot(delta.x, delta.z) > 0) {
      const angle = Math.atan2(-delta.x, -delta.z);
      const difference = Math.atan2(Math.sin(angle - model.current.rotation.y), Math.cos(angle - model.current.rotation.y));
      model.current.rotation.y += difference * (1 - Math.exp(-12 * world.timestep));
    }
  });

  useFrame((_, dt) => {
    if (!body.current || !model.current) return;
    const controls = input.current;
    const position = model.current.getWorldPosition(cameraTarget.current);
    const target = { x: position.x, y: position.y + 0.45, z: position.z };
    const distance = 5;
    const desired = {
      x: target.x + Math.sin(controls.yaw) * Math.cos(controls.pitch) * distance,
      y: target.y + Math.sin(controls.pitch) * distance,
      z: target.z + Math.cos(controls.yaw) * Math.cos(controls.pitch) * distance,
    };
    const alpha = controls.cameraReady ? 1 - Math.exp(-8 * Math.min(dt, 0.1)) : 1;
    const candidate = {
      x: camera.position.x + (desired.x - camera.position.x) * alpha,
      y: camera.position.y + (desired.y - camera.position.y) * alpha,
      z: camera.position.z + (desired.z - camera.position.z) * alpha,
    };
    // Clamp after smoothing so camera lag cannot carry the near plane through walls.
    const safe = cameraPosition(world, rapier, body.current, target, candidate);
    camera.position.set(safe.x, safe.y, safe.z);
    camera.lookAt(target.x, target.y, target.z);
    controls.cameraReady = true;
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[0, 2, 0]} enabledRotations={[false, false, false]}>
      <CapsuleCollider args={[0.5, 0.35]} />
      <group ref={model}>
        <mesh castShadow><capsuleGeometry args={[0.27, 0.45, 4, 8]} /><meshStandardMaterial color="#bd3d32" /></mesh>
        <mesh castShadow position={[0, 0.62, 0]}><sphereGeometry args={[0.23, 12, 8]} /><meshStandardMaterial color="#d8a77e" /></mesh>
        <mesh position={[0, 0.62, -0.21]}><sphereGeometry args={[0.06, 8, 6]} /><meshStandardMaterial color="#9a654d" /></mesh>
        {[-1, 1].map(side => (
          <group key={side}>
            <mesh castShadow position={[side * 0.14, -0.53, 0]}><capsuleGeometry args={[0.1, 0.25, 4, 8]} /><meshStandardMaterial color="#233d40" /></mesh>
            <mesh castShadow position={[side * 0.35, 0.05, 0]}><capsuleGeometry args={[0.08, 0.3, 4, 8]} /><meshStandardMaterial color="#d8a77e" /></mesh>
          </group>
        ))}
      </group>
    </RigidBody>
  );
}

export default function GameWorld({ onLockChange }) {
  return (
    <>
      {WORLD_BOXES.map(({ position, size, color }, index) => (
        <RigidBody key={index} type="fixed" position={position}>
          <mesh receiveShadow castShadow={index > 0}><boxGeometry args={size} /><meshStandardMaterial color={color} /></mesh>
        </RigidBody>
      ))}
      <Owi onLockChange={onLockChange} />
    </>
  );
}
