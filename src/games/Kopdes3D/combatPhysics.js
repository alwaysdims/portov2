// Only static world geometry occludes attacks; actors and sensors are not walls.
export function combatContact(world, rapier, attacker, target, spec) {
  if (!attacker.body || !target.body) return false;
  const from = attacker.body.translation();
  const to = target.body.translation();
  const offset = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const distance = Math.hypot(offset.x, offset.y, offset.z);
  if (spec) {
    let overlaps = false;
    world.intersectionsWithShape(from, { x: 0, y: 0, z: 0, w: 1 }, new rapier.Ball(spec.range), collider => {
      if (collider.handle === target.body.collider(0).handle) overlaps = true;
      return true;
    }, rapier.QueryFilterFlags.EXCLUDE_SENSORS);
    if (!overlaps) return false;
  }
  if (!distance) return true;
  const direction = { x: offset.x / distance, y: offset.y / distance, z: offset.z / distance };
  return !world.castRay(new rapier.Ray(from, direction), distance, true,
    rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, undefined,
    collider => !collider.parent() || collider.parent().isFixed());
}
