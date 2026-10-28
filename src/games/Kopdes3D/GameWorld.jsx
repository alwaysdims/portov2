import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAfterPhysicsStep, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { cameraPosition, createController, stepMotion } from './gameLogic.js';
import { createCombat, prepareCombat, resolveCombat, combatSnapshot } from './combat.js';
import { combatContact } from './combatPhysics.js';
import { attachCombatInput, createCombatInput, consumeCombatInput } from './combatInput.js';
import CombatActors from './CombatActors.jsx';
import Environment from './environment/Environment.jsx';
import { CHECKPOINTS } from './environment/config.js';

export default function GameWorld({ onLockChange, onCombatChange }) {
  const simulation = useRef(createCombat());
  const [snapshot, setSnapshot] = useState(() => combatSnapshot(createCombat()));
  const playerBody = useRef(null);
  const guardBody = useRef(null);
  const controllers = useRef([]);
  const input = useRef(createCombatInput(CHECKPOINTS.home.yaw));
  const primed = useRef(false);
  const movement = useRef([{ verticalSpeed: 0 }, { verticalSpeed: 0 }]);
  const { world, rapier, step } = useRapier();
  const { camera, gl } = useThree();

  // Release before Physics' passive cleanup frees and resets its lazy world proxy.
  useLayoutEffect(() => {
    const characters = [createController(world), createController(world)];
    controllers.current = characters;
    return () => {
      controllers.current = [];
      for (const character of characters) world.removeCharacterController(character);
    };
  }, [world]);
  useEffect(() => attachCombatInput(gl.domElement, onLockChange, input.current), [gl, onLockChange]);

  function synchronize() {
    const sim = simulation.current;
    sim.player.body = playerBody.current;
    sim.guard.body = guardBody.current;
    for (const actor of [sim.player, sim.guard]) if (actor.body) actor.position = actor.body.translation();
  }
  const contact = (a, b, spec) => combatContact(world, rapier, a, b, spec);
  useBeforePhysicsStep(() => {
    if (!playerBody.current || !guardBody.current || controllers.current.length !== 2) return;
    if (!primed.current) return;
    synchronize();
    const sim = simulation.current;
    const delta = prepareCombat(sim, consumeCombatInput(input.current), contact);
    [sim.player, sim.guard].forEach((actor, index) => {
      if (actor.state !== 'DEAD') stepMotion(world, rapier, actor.body, controllers.current[index], index ? delta.guard : delta.player, movement.current[index]);
      else actor.body.setNextKinematicTranslation(actor.body.translation());
    });
  });
  useAfterPhysicsStep(() => {
    if (!primed.current) return;
    synchronize();
    const sim = simulation.current;
    resolveCombat(sim, contact);
    // Corpses are visual only; leave no solid capsule blocking the route.
    for (const actor of [sim.player, sim.guard]) actor.body?.collider(0).setSensor(actor.state === 'DEAD');
    if (sim.tick % 6 === 0 || sim.events.at(-1)?.tick === sim.tick) {
      const next = combatSnapshot(sim);
      setSnapshot(next);
      onCombatChange(next);
    }
  });

  // Explicit fixed-step clock caps catch-up at five ticks and freezes combat on unlock/blur.
  useFrame((_, dt) => {
    if (!primed.current && playerBody.current && guardBody.current) {
      step(1 / 60); // Populate Rapier queries before the first camera sweep; no combat tick.
      primed.current = true;
    } else if (input.current.locked) step(Math.min(dt, 5 / 60));
  }, -50);
  useFrame((_, dt) => {
    if (!playerBody.current) return;
    const controls = input.current;
    const position = playerBody.current.translation();
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
    const safe = cameraPosition(world, rapier, playerBody.current, target, candidate);
    camera.position.set(safe.x, safe.y, safe.z);
    camera.lookAt(target.x, target.y, target.z);
    controls.cameraReady = true;
  });
  return <>
    <Environment />
    <CombatActors simulation={simulation} playerBody={playerBody} guardBody={guardBody} snapshot={snapshot} />
  </>;
}
