# Tahap 20 — Character & Boss Visual Overhaul + Medium Difficulty

Status: **COMPLETED**
Date: 2026-10-21
Branch: main (uncommitted)
Verified: tests 48/48, ESLint clean, build success, browser preview 4173

## Summary

Tahap 20 delivers animated character sprites, procedural VFX, a four-pattern telegraphed boss AI, and Medium difficulty baseline — while preserving all Tahap 18/18.1/19 systems (upgrades, objectives, achievements, leaderboard, boss milestones).

## 1. Character Visual Overhaul (Wowo)

### Spritesheet
- `assets/characters/wowo/wowo-action-sheet.png`: 64×64 per frame, 8 columns, RGBA
- Original code-drawn pixel art (Pillow), not cropped from concept references
- Safari khaki/hat/mustache/cane identity preserved
- Rows: idle(6f@8fps), walk(8f@12fps), run(8f@16fps), attack(6f@18fps), skillQ(6f@16fps), skillE(6f@16fps), skillR(8f@16fps), hurt(4f@16fps), death(8f@12fps)
- Binary alpha (0 or 255), all frames unique per row, transparent padding verified

### Animation System
- `ActorAnimator.js`: FSM-based animation controller
- State priority: death > hurt > skillR > skillE > skillQ > attack > run > walk > idle
- One-shot states (attack, hurt, skills) auto-recover to movement state
- Direction flip via scaleX; pause freezes current frame
- `pendingShot` pattern: attack animation plays 110ms before projectile fires

## 2. VFX Upgrade

### Procedural Effects (VFXManager)
- `weaponSwing(x,y,angle,evolved)`: warm gold arc trail
- `impactRing(x,y)`: orange ring on pierce/split impact
- `energyLink(x1,y1,x2,y2)`: Q chain visual between targets
- `projectileTrail(x,y,angle,skill)`: sampled orange/gold trails, 8/update cap
- `castPulse(x,y)`: anticipation pulse at cast origin
- `shockwave(x,y,radius,color,big)`: E orange ring, R gold double ring
- `ultimateBlast(x,y,radius,evolved)`: R gold + evolution secondary pale-gold rays

### Quality Tiers
- Low: 24 active particles max
- Medium (default): 48 active particles max
- High: 60 active particles max
- UI dropdown in React for runtime switching
- Damage text cap: 35 instances

### Safety
- All tweens killed on recycle/clear
- Generation guard rejects stale callbacks
- Effects depth below hostile telegraphs
- Camera shake clamped 180ms / 0.006 intensity

## 3. Boss AI Overhaul (Naga Fajar)

### Four Learnable Patterns (fixed order, cycling)
1. **Directional Fire Breath** (1000ms telegraph): triangular hitbox, locked aim
2. **Circle Slash** (850ms telegraph): radius-based AoE at locked center
3. **Paper Spread** (900ms telegraph): fan of owner-tagged projectiles
4. **Capped Minion Summon** (1000ms telegraph): spawns at warned positions, 2-minion cap

### AI Improvements
- Active-delta state machine (freezes during pause)
- Death: body disabled immediately, rewards once, emits real enemyId + instanceId
- `isDead` set after `super.die()` (was before — blocked cleanup)
- Rage phase at 45% HP: visual transition, speed/interval boost, pattern preserved
- Owner-tagged projectiles cleaned on death/gameover/shutdown
- Reduced camera shakes from overlarge values
- `visualState` + `visualStateElapsed` exposed for animator integration

### Roster Preserved
- Boss milestones at levels 3, 6, 9, 12 unchanged
- HP/damage scaling from bossConfig unchanged
- Reward pickups unchanged

## 4. Medium Difficulty

### Config (`difficultyConfig.js`)
- 1x stat multipliers (baseline)
- Enemy cap, spawn pacing, boss milestone levels defined
- Three-level boss milestones preserved

### Integration
- EnemySpawner respects Medium cap limits
- RangedEnemy burst timing: visible 900ms, pause-aware, locked aim
- Difficulty label shown in UI header

## 5. Files Changed

### New Files
- `game/systems/ActorAnimator.js` — animation FSM
- `config/bossAttackConfig.js` — boss attack geometry/math
- `config/difficultyConfig.js` — Medium difficulty config
- `assets/characters/wowo/wowo-action-sheet.png` — Wowo spritesheet
- `assets/boss/naga-fajar-action-sheet.png` — Naga Fajar spritesheet
- `assets/visual-manifest.json` — asset metadata
- `tools/generate_visual_assets.py` — spritesheet generator with self-tests
- `docs/art/visual-contact-sheet.png` — visual review artifact
- `tests/animation.test.js` — animator unit tests
- `tests/boss_attack_math.test.js` — boss pattern/math tests (10 tests)
- `tests/difficulty.test.js` — difficulty scaling tests
- `tests/vfx.test.js` — VFX pool/skill/trail tests (8 tests)

### Modified Files
- `config/assetRegistry.js` — new texture keys
- `game/scenes/BootScene.js` — spritesheet loading + animation registration
- `game/scenes/SurvivalScene.js` — visual pause, animator, kill dedup
- `game/systems/PlayerAttackSystem.js` — pendingShot deferred fire
- `game/systems/PlayerSkillSystem.js` — skill cast animation triggers, gameover guards
- `game/systems/ProjectileSystem.js` — trail sampling, tween cleanup
- `game/systems/VFXManager.js` — procedural effects, quality tiers, pool caps
- `entities/enemies/EnemyBase.js` — TintMode FILL/MULTIPLY, flash timer
- `entities/enemies/NagaFajarBoss.js` — four-pattern AI, visualState, death fix
- `entities/enemies/EnemySpawner.js` — cap enforcement
- `entities/enemies/RangedEnemy.js` — burst timing
- `game/systems/RunDirector.js` — fairness guards
- `game/systems/UpgradeSystem.js` — lifecycle
- `SeranganFajar.jsx` — VFX quality dropdown, difficulty label

## 6. Verification

### Automated
- 48/48 unit tests pass (node --test)
- ESLint: 0 errors, 0 warnings
- Vite build: success (208KB game chunk gzipped 55KB)

### Browser (production preview :4173)
- Canvas active, 0 console errors
- FPS: 43-61 (varies with enemy count, stable)
- Wowo animation states: idle/walk/attack/hurt verified
- Boss spawn: HP 4500 at level 3, visualState transitions idle→move→phase
- Boss rage: triggers at 45% HP, isRage=true
- Boss death: isDead=true, body disabled, activeBoss cleared, rewards once
- Pause/unpause: isPaused + time.paused sync correctly
- Restart: clean state (level 1, score 0, no boss)
- VFX quality dropdown: Low/Medium/High functional
- localStorage: achievements persist, leaderboard untouched

### Not Tested
- Physical mobile device
- Real-time 10-minute continuous playtest
- Memory leak profiling over extended session
- Network/offline scenarios

## 7. Known Issues

- Art is provisional (code-drawn Pillow shapes); production pixel art would improve visual quality
- FPS can dip to ~40 during high enemy + VFX density; acceptable for Medium
- Boss attack visual feedback relies on telegraphs (graphics primitives); spritesheet animation integration is wired but art-dependent
- `wowo.png` and `naga fajar.png` in references/ are concept only, never used as runtime textures

## 8. Preserved Systems (Tahap 18/18.1/19)

All verified intact:
- Upgrade system (12 upgrades, evolusi)
- Boss milestone roster (3/6/9/12)
- Objective system (Bersihkan Hoaks, Amankan Kotak)
- Achievement service (persistent localStorage)
- Leaderboard (backward-compatible votesCollected)
- RunDirector arena events
- Combo system
- Audio manager (BGM, SFX)
- Benteng Fajar emergency shield
- Mobile joystick + touch controls
