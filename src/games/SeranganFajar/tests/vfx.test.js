import assert from "node:assert/strict";
import { test } from "node:test";
import { VFXManager, VFX_CONFIG } from "../game/systems/VFXManager.js";
import { PlayerSkillSystem, SKILL_CONFIG } from "../game/systems/PlayerSkillSystem.js";
import { ProjectileSystem } from "../game/systems/ProjectileSystem.js";
import { UPGRADE_BALANCE } from "../config/upgradeConfig.js";

function mockScene() {
  const objects = [];
  const tweens = new Set();
  const killed = [];
  const make = (x = 0, y = 0) => {
    const object = { x, y, active: true, visible: true, alpha: 1,
      setDepth(value) { this.depth = value; return this; },
      setOrigin() { return this; },
      setPosition(x, y) { this.x = x; this.y = y; return this; },
      setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; },
      setRotation(value) { this.rotation = value; return this; },
      setAlpha(value) { this.alpha = value; return this; },
      setActive(value) { this.active = value; return this; },
      setVisible(value) { this.visible = value; return this; },
      clear() { return this; }, lineStyle() { return this; },
      strokeCircle() { return this; }, fillStyle() { return this; },
      fillCircle() { return this; }, fillRect() { return this; },
      lineBetween() { return this; },
      destroy() { this.active = false; this.destroyed = true; },
    };
    objects.push(object);
    return object;
  };
  return { objects, killed, time: { now: 1000 },
    add: { graphics: () => make(), circle: make, rectangle: make, text: make },
    tweens: {
      add(config) { tweens.add(config); return config; },
      killTweensOf(target) {
        killed.push(target);
        for (const tween of tweens) if (tween.targets === target) tweens.delete(tween);
      },
    },
    finish() {
      for (const tween of [...tweens]) {
        tweens.delete(tween);
        tween.onComplete?.();
      }
    },
    cameras: { main: { shake(duration, intensity) { this.lastShake = { duration, intensity }; } } },
  };
}

test("procedural skills share pool, medium default, lower warning depth, clamped shake", () => {
  const scene = mockScene();
  const vfx = new VFXManager(scene);
  assert.equal(vfx.quality, "medium");
  for (let i = 0; i < 100; i++) {
    vfx.weaponSwing(0, 0, 0, true);
    vfx.impactRing(0, 0);
    vfx.energyLink(0, 0, 100, 100);
    vfx.projectileTrail(0, 0, 0, true);
    vfx.castPulse(0, 0);
    vfx.shockwave(0, 0, 180, 0xf97316, true);
    vfx.ultimateBlast(0, 0, 500, true);
  }
  assert.ok(vfx.activeParticles.length <= 48);
  assert.ok(vfx.activeParticles.every((item) => item.depth < 14));
  assert.equal(vfx.setQuality("low"), true);
  assert.ok(vfx.activeParticles.length <= 24);
  assert.equal(vfx.setQuality("invalid"), false);
  vfx.setQuality("high");
  vfx.shakeCamera(999, 1);
  assert.deepEqual(scene.cameras.main.lastShake, { duration: 180, intensity: 0.006 });
});

function skillFixture() {
  const scene = mockScene();
  const animations = [];
  scene.stats = { mana: 200, energy: 100, isAlive: () => true,
    behaviorUpgrades: { orasiMembara: true, fajarBangkit: true },
    consumeMana(cost) { this.mana -= cost; return true; },
    consumeEnergy(cost) { this.energy -= cost; return true; },
  };
  scene.vfxManager = new VFXManager(scene);
  scene.player = { x: 0, y: 0, active: true };
  scene.playerAnimator = { trigger(state) { animations.push(state); } };
  const damage = [];
  const enemy = { x: 100, y: 0, hp: 10000, active: true, takeDamage(value) { damage.push(value); } };
  const group = { getChildren: () => [enemy] };
  return { scene, animations, damage, group, skills: new PlayerSkillSystem(scene) };
}

test("successful casts synchronize anticipation, damage, cooldowns and evolution delay", () => {
  const { scene, animations, damage, group, skills } = skillFixture();
  const spreads = [];
  assert.equal(skills.castSkill1(scene.player, group, { fireEnvelopeSpread: (...args) => spreads.push(args) }).success, true);
  assert.deepEqual(spreads[0].slice(4), [3, 18, 80, 450, 500]);
  assert.equal(skills.skill1Cooldown, SKILL_CONFIG.SKILL1.COOLDOWN);
  assert.equal(skills.castSkill1(scene.player, group, {}).success, false);
  assert.equal(skills.castSkill2(scene.player, group).pending, true);
  assert.equal(skills.skill2Cooldown, SKILL_CONFIG.SKILL2.COOLDOWN);
  assert.equal(skills.castUltimate(scene.player, group).pending, true);
  assert.deepEqual(damage, []);
  skills.update(0.124);
  assert.deepEqual(damage, []);
  skills.update(0.001);
  assert.deepEqual(damage, [150]);
  skills.update(0.0625);
  assert.deepEqual(damage, [150, 500]);
  assert.deepEqual(animations, ["skillQ", "skillE", "skillR"]);
  skills.update((UPGRADE_BALANCE.followupDelay - 63.5) / 1000);
  assert.equal(damage.length, 2);
  skills.update(0.065);
  assert.deepEqual(damage.slice(2).sort((a, b) => a - b),
    [150, 500].map((amount) => Math.round(amount * UPGRADE_BALANCE.followupDamageRatio)));
});

test("gameover discards followups even while paused; destroyed skills cannot cast", () => {
  const { scene, damage, group, skills } = skillFixture();
  skills.castSkill2(scene.player, group);
  scene.isGameOver = true;
  skills.update(10, true);
  assert.equal(skills.pendingFollowups.length, 0);
  scene.isGameOver = false;
  skills.update(10);
  assert.deepEqual(damage, []);
  skills.destroy();
  assert.equal(skills.canCastSkill1(), false);
  assert.equal(skills.canCastSkill2(), false);
  assert.equal(skills.canCastUltimate(), false);
});

test("projectile trails sample once per interval, bounded per update, recycle kills tweens", () => {
  const scene = mockScene();
  scene.vfxManager = new VFXManager(scene);
  scene.stats = { behaviorUpgrades: {} };
  const children = Array.from({ length: 30 }, () => ({ active: true, x: 20, y: 20,
    startX: 0, startY: 0, maxDistance: 500, rotation: 0, spawnTime: 0,
    body: { velocity: { x: 400, y: 0 }, setVelocity() {} },
    setActive(value) { this.active = value; }, setVisible() {},
  }));
  const system = Object.create(ProjectileSystem.prototype);
  system.scene = scene;
  system.voteProjectiles = { getChildren: () => children };
  system.update(1000);
  assert.ok(scene.vfxManager.activeParticles.length <= 8);
  const count = scene.vfxManager.activeParticles.length;
  system.update(1001);
  assert.equal(scene.vfxManager.activeParticles.length, count);
  assert.ok(count > 0);
  system.recycleProjectile(children[0]);
  assert.ok(scene.killed.includes(children[0]));
});

test("pierce and split rings keep original damage counts; Q chain hits once and links endpoints", () => {
  const scene = mockScene();
  scene.vfxManager = new VFXManager(scene);
  scene.stats = { addEnergy() {} };
  const damage = [];
  const enemy = { x: 100, y: 80, active: true, takeDamage(value) { damage.push(value); } };
  const nearbyDamage = [];
  const nearby = { x: 120, y: 90, active: true, takeDamage(value) { nearbyDamage.push(value); } };
  scene.enemySpawner = { enemies: { getChildren: () => [enemy, nearby] } };
  const system = Object.create(ProjectileSystem.prototype);
  system.scene = scene;
  const splits = [];
  system.fireVoteProjectile = (...args) => { const next = { args }; splits.push(next); return next; };
  const projectile = { active: true, damage: 25, remainingHits: 3, splitOnHit: true,
    hitEnemies: new Set(), body: { velocity: { x: 400, y: 0 } } };
  system.handleVoteHitEnemy(projectile, enemy);
  system.handleVoteHitEnemy(projectile, enemy);
  assert.deepEqual(damage, [25]);
  assert.equal(projectile.remainingHits, 2);
  assert.equal(splits.length, 2);
  assert.ok(splits.every((next) => next.remainingHits === 1 && next.splitOnHit === false));
  assert.ok(scene.vfxManager.activeParticles.length > 0);
  const links = [];
  scene.vfxManager.energyLink = (...args) => links.push(args);
  const envelope = { active: true, damage: 80, chainOnHit: true,
    setActive(value) { this.active = value; }, setVisible() {} };
  system.handleEnvelopeHitEnemy(envelope, enemy);
  system.handleEnvelopeHitEnemy(envelope, enemy);
  assert.deepEqual(damage, [25, 80]);
  assert.deepEqual(nearbyDamage, [Math.round(80 * UPGRADE_BALANCE.splitDamageRatio)]);
  assert.deepEqual(links, [[100, 80, 120, 90]]);
});

test("death and inactive scene clear followups; pause freezes their remaining delay", () => {
  const { scene, skills, group, damage } = skillFixture();
  skills.castSkill2(scene.player, group);
  const delay = skills.pendingFollowups[0].remaining;
  scene.isLevelUpPaused = true;
  skills.update(10);
  assert.equal(skills.pendingFollowups[0].remaining, delay);
  scene.isLevelUpPaused = false;
  scene.sys = { isActive: () => false };
  skills.update(10);
  assert.equal(skills.pendingFollowups.length, 0);
  assert.equal(skills.canCastUltimate(), false);
  assert.deepEqual(damage, []);
  scene.sys.isActive = () => true;
  skills.reset();
  skills.castSkill2(scene.player, group);
  scene.stats.isAlive = () => false;
  skills.update(10);
  assert.equal(skills.pendingFollowups.length, 0);
});

test("stale recycled completion cannot hide a replacement; damage text tweens killed on clear", () => {
  const scene = mockScene();
  const configs = [];
  const add = scene.tweens.add;
  scene.tweens.add = (config) => { configs.push(config); return add(config); };
  const vfx = new VFXManager(scene);
  const original = vfx.impactRing(0, 0);
  const stale = configs[0].onComplete;
  vfx.clearAll();
  const replacement = vfx.weaponSwing(10, 10, 0);
  assert.equal(original, replacement);
  stale();
  assert.equal(replacement.active, true);
  for (let i = 0; i < 50; i++) vfx.showDamageNumber(0, 0, i);
  assert.equal(vfx.activeDamageTexts.length, VFX_CONFIG.MAX_DAMAGE_TEXTS);
  const texts = [...vfx.activeDamageTexts];
  vfx.clearAll();
  assert.ok(texts.every((text) => text.destroyed && scene.killed.includes(text)));
});

test("all transient VFX stay capped, recycle without tween leaks, clear safely", () => {
  const scene = mockScene();
  const vfx = new VFXManager(scene);
  for (let i = 0; i < 100; i++) {
    vfx.spawnHitSparks(i, i);
    vfx.spawnEnemyDeathDebris(i, i);
    vfx.spawnLevelUpAura(i, i);
  }
  assert.ok(vfx.activeParticles.length <= VFX_CONFIG.MAX_ACTIVE_PARTICLES);
  assert.ok(scene.objects.length <= VFX_CONFIG.MAX_ACTIVE_PARTICLES);
  assert.ok(scene.killed.length > 0);
  scene.finish();
  const allocated = scene.objects.length;
  vfx.spawnHitSparks(0, 0);
  assert.equal(scene.objects.length, allocated);
  vfx.clearAll();
  assert.equal(vfx.activeParticles.length, 0);
  assert.ok(scene.objects.every((object) => !object.visible || object.destroyed));
  vfx.destroy();
  assert.ok(scene.objects.every((object) => object.destroyed));
});
