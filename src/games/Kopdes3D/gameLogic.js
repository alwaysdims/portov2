// ponytail: one flat prototype arena; add level data when another layout is playable.
export const WORLD_BOXES = [
  { position: [0, -0.2, 0], size: [24, 0.4, 24], color: '#87a768' },
  { position: [0, 1.5, -11.75], size: [24, 3, 0.5], color: '#b6a582' },
  { position: [0, 1.5, 11.75], size: [24, 3, 0.5], color: '#b6a582' },
  { position: [-11.75, 1.5, 0], size: [0.5, 3, 24], color: '#b6a582' },
  { position: [11.75, 1.5, 0], size: [0.5, 3, 24], color: '#b6a582' },
  { position: [-6, 1.5, -5], size: [0.4, 3, 4.4], color: '#d4bc91' },
  { position: [-2, 1.5, -5], size: [0.4, 3, 4.4], color: '#d4bc91' },
  { position: [-4, 1.5, -7], size: [4.4, 3, 0.4], color: '#d4bc91' },
  { position: [-5.6, 1.5, -3], size: [1.2, 3, 0.4], color: '#d4bc91' },
  { position: [-2.4, 1.5, -3], size: [1.2, 3, 0.4], color: '#d4bc91' },
  { position: [-4, 2.7, -3], size: [2, 0.6, 0.4], color: '#bd3d32' },
];

export function movementDelta(keys, yaw, dt) {
  const right = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  const length = Math.hypot(right, forward) || 1;
  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 6 : 3.5;
  return {
    x: (right * Math.cos(yaw) - forward * Math.sin(yaw)) / length * speed * dt || 0,
    y: 0,
    z: (-right * Math.sin(yaw) - forward * Math.cos(yaw)) / length * speed * dt || 0,
  };
}

export function createController(world) {
  const controller = world.createCharacterController(0.02);
  controller.enableAutostep(0.25, 0.2, false);
  controller.enableSnapToGround(0.2);
  controller.setMaxSlopeClimbAngle(Math.PI / 4);
  controller.setMinSlopeSlideAngle(Math.PI / 4);
  return controller;
}

export function stepPlayer(world, rapier, body, controller, keys, yaw, state) {
  return stepMotion(world, rapier, body, controller, movementDelta(keys, yaw, world.timestep), state);
}

export function stepMotion(world, rapier, body, controller, delta, state) {
  delta = { ...delta };
  state.verticalSpeed = Math.max(state.verticalSpeed - 20 * world.timestep, -30);
  delta.y = state.verticalSpeed * world.timestep;
  controller.computeColliderMovement(body.collider(0), delta, rapier.QueryFilterFlags.EXCLUDE_SENSORS);
  const movement = controller.computedMovement();
  const position = body.translation();
  body.setNextKinematicTranslation({ x: position.x + movement.x, y: position.y + movement.y, z: position.z + movement.z });
  if (controller.computedGrounded()) state.verticalSpeed = 0;
  return delta;
}

export function cameraPosition(world, rapier, body, target, desired) {
  const offset = { x: desired.x - target.x, y: desired.y - target.y, z: desired.z - target.z };
  const distance = Math.hypot(offset.x, offset.y, offset.z);
  if (distance === 0) return { ...target };
  const direction = { x: offset.x / distance, y: offset.y / distance, z: offset.z / distance };
  const hit = world.castShape(target, { x: 0, y: 0, z: 0, w: 1 }, direction, new rapier.Ball(0.22), 0, distance, true,
    rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, body);
  const safeDistance = hit ? Math.max(0, hit.time_of_impact - 0.03) : distance;
  return { x: target.x + direction.x * safeDistance, y: target.y + direction.y * safeDistance, z: target.z + direction.z * safeDistance };
}
