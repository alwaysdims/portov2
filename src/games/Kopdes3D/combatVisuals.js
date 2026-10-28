export function cagePhase(tick, stunUntil) {
  if (!stunUntil || tick < stunUntil - 120 || tick >= stunUntil + 12) return 'hidden';
  if (tick < stunUntil - 112) return 'grow';
  return tick < stunUntil - 12 ? 'hold' : 'break';
}

// Player-center impacts identify ultimate; prison/stun events target the guard instead.
export function latestSkillImpact(sim) {
  for (let i = sim.events.length - 1; i >= 0; i--) {
    const event = sim.events[i];
    if (event.type === 'skill-impact' && event.targetId === sim.player.id) return event;
  }
  return null;
}

export function impactProgress(sim, event = latestSkillImpact(sim)) {
  if (sim.player.hp <= 0 || sim.player.state === 'DEAD' || !event) return -1;
  const age = sim.tick - event.tick;
  return age >= 0 && age < 24 ? age / 24 : -1;
}

export function skillShake(sim, reducedMotion = false) {
  const progress = impactProgress(sim);
  if (reducedMotion || progress < 0 || progress >= 0.5) return { x: 0, y: 0, z: 0 };
  const amplitude = 0.014 * (1 - progress * 2);
  return { x: Math.sin(sim.tick * 2.3) * amplitude,
    y: Math.sin(sim.tick * 3.1) * amplitude, z: Math.sin(sim.tick * 2.7) * amplitude };
}

// Ultimate lifts the tray behind the shoulder, then slams forward exactly on activation.
export function castPose(cast) {
  if (!cast || cast.age === 0) return 0;
  if (cast.kind === 'ultimate' && cast.age < cast.spec.windup) return -cast.age / cast.spec.windup;
  return attackExtension(cast);
}

// Presentation only: fully extend at the active marker, then retract during recovery.
export function attackExtension(attack) {
  if (!attack) return 0;
  const { windup, active, recovery } = attack.spec;
  if (attack.age < windup) return attack.age / windup;
  if (attack.age < windup + active) return 1;
  return Math.max(0, 1 - (attack.age - windup - active) / recovery);
}
