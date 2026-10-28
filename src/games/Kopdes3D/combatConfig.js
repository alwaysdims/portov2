const weapons = {
  fist: [[10, 8, 4, 10, 1.2, 35], [12, 7, 4, 10, 1.2, 35], [16, 10, 5, 16, 1.3, 40]],
  tray: [[22, 14, 6, 18, 1.8, 60], [28, 18, 6, 24, 1.9, 65]],
};
for (const stance of Object.keys(weapons)) weapons[stance] = Object.freeze(weapons[stance].map(
  ([damage, windup, active, recovery, range, halfAngle]) => Object.freeze({ damage, windup, active, recovery, range, halfAngle, heightTolerance: 1 })));

export const BALANCE = Object.freeze({
  playerHP: 100, enemyHP: 50, walkSpeed: 3.5, sprintSpeed: 6,
  hurtTicks: 12, invulnerableTicks: 24, flashTicks: 6, feedbackTicks: 120,
  weapons: Object.freeze(weapons),
  dash: Object.freeze({ ticks: 12, distance: 2.8, cooldown: 120, iframeStart: 2, iframeEnd: 8 }),
  enemy: Object.freeze({ speed: 2.4, detectTicks: 12, unseenTicks: 180, leashRange: 14,
    attack: Object.freeze({ damage: 10, windup: 36, active: 6, recovery: 42, range: 1.3, halfAngle: 45, heightTolerance: 1 }),
    detection: Object.freeze({ range: 8, halfAngle: 180, heightTolerance: 2 }),
  }),
});

export const SKILLS = Object.freeze({
  prison: Object.freeze({ windup: 18, active: 1, recovery: 18, cooldown: 720,
    range: 5, halfAngle: 75, heightTolerance: 1, stunTicks: 120 }),
  ultimate: Object.freeze({ windup: 39, active: 3, recovery: 36, cooldown: 1500,
    damage: 66, range: 3, halfAngle: 180, heightTolerance: 1, knockback: 1.2, knockbackTicks: 12 }),
});
