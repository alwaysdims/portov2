// Presentation only: fully extend at the active marker, then retract during recovery.
export function attackExtension(attack) {
  if (!attack) return 0;
  const { windup, active, recovery } = attack.spec;
  if (attack.age < windup) return attack.age / windup;
  if (attack.age < windup + active) return 1;
  return Math.max(0, 1 - (attack.age - windup - active) / recovery);
}
