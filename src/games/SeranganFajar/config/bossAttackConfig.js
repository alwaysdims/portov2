// Shared by boss telegraphs, collision checks, and headless math tests.
export const BOSS_ATTACKS = {
  breath: { windupMs: 1000, activeMs: 650, range: 300, rageRange: 340, halfWidth: 90, rageHalfWidth: 110, damage: 24, rageDamage: 34 },
  slash: { windupMs: 850, activeMs: 180, radius: 85, rageRadius: 105, damage: 20, rageDamage: 30 },
  spread: { windupMs: 900, activeMs: 220, count: 3, rageCount: 5, damage: 12, rageDamage: 16, spacing: 14 * Math.PI / 180 },
  summon: { windupMs: 1000, activeMs: 250, count: 1, rageCount: 1, maxActive: 2, distance: 70 },
};

// Triangle matches rendered mouth/tip geometry exactly; no invisible rear hitbox.
export function isPointInBreath(x, y, originX, originY, angle, range, halfWidth) {
  if (![x, y, originX, originY, angle, range, halfWidth].every(Number.isFinite) || range <= 0 || halfWidth < 0) return false;
  const dx = x - originX;
  const dy = y - originY;
  const forward = dx * Math.cos(angle) + dy * Math.sin(angle);
  const side = -dx * Math.sin(angle) + dy * Math.cos(angle);
  const epsilon = 1e-7;
  return forward >= -epsilon && forward <= range + epsilon && Math.abs(side) <= halfWidth * Math.max(0, forward) / range + epsilon;
}
