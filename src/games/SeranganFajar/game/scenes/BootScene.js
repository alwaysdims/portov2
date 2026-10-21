import Phaser from "phaser";
import { ASSET_KEYS } from "../../config/assetRegistry.js";
import { TextureFactory } from "../../utils/TextureFactory.js";
import { registerActorAnimations, WOWO_ANIMATIONS, NAGA_ANIMATIONS } from "../systems/ActorAnimator.js";
import wowoActionSheet from "../../assets/characters/wowo/wowo-action-sheet.png";
import nagaActionSheet from "../../assets/boss/naga-fajar-action-sheet.png";

// Wowo character state sprites
import wowoIdlePng from "../../assets/characters/wowo/wowo-idle.png";
import wowoWalkPng from "../../assets/characters/wowo/wowo-walk.png";
import wowoHurtPng from "../../assets/characters/wowo/wowo-hurt.png";
import wowoDeathPng from "../../assets/characters/wowo/wowo-death.png";

// Environment sprites
import grassTilePng from "../../assets/environment/grass-tile.png";
import roadTilePng from "../../assets/environment/road-tile.png";
import tpsTentPng from "../../assets/environment/tps-tent.png";
import treePng from "../../assets/environment/tree.png";
import balihoPng from "../../assets/environment/baliho.png";
import borderTilePng from "../../assets/environment/border-tile.png";

// Enemy & Projectile sprites (Tahap 4)
import timAmplopPng from "../../assets/enemies/tim-amplop.png";
import botKampanyePng from "../../assets/enemies/bot-kampanye.png";
import penyebarHoaksPng from "../../assets/enemies/penyebar-hoaks.png";
import hoaxBulletPng from "../../assets/projectiles/hoax-bullet.png";
import voteProjectilePng from "../../assets/projectiles/vote-projectile.png";
import envelopeProjectilePng from "../../assets/projectiles/envelope-projectile.png";

// Collectibles sprites (Tahap 7)
import suaraPng from "../../assets/collectibles/suara.png";
import danaPng from "../../assets/collectibles/dana.png";
import healthPng from "../../assets/collectibles/health.png";
import manaPng from "../../assets/collectibles/mana.png";
import fajarEnergyPng from "../../assets/collectibles/fajar-energy.png";

// Boss Naga Fajar sprites (Update Fitur Boss Level Up)
import bossNagaIdlePng from "../../assets/boss/naga-fajar-idle.png";
import bossNagaWalkPng from "../../assets/boss/naga-fajar-walk.png";
import bossNagaAttackPng from "../../assets/boss/naga-fajar-attack.png";
import bossNagaHurtPng from "../../assets/boss/naga-fajar-hurt.png";
import bossNagaDeathPng from "../../assets/boss/naga-fajar-death.png";
import bossNagaRagePng from "../../assets/boss/naga-fajar-rage.png";
import bossNagaKecilPng from "../../assets/boss/naga-kecil.png";
import bossProyektilKertasPng from "../../assets/boss/proyektil-kertas.png";
import bossIconPng from "../../assets/boss/boss-icon.png";

export default class BootScene extends Phaser.Scene {
  constructor(gameEvents = {}) {
    super("BootScene");
    this.gameEvents = gameEvents;
  }

  init(data) {
    if (data && Object.keys(data).length > 0) {
      this.gameEvents = data;
    }
  }

  preload() {
    this.load.on("loaderror", (fileObj) => {
      console.warn(`[BootScene] Gagal memuat aset fisik: ${fileObj.key}. Fallback procedural akan digunakan.`);
    });

    this.load.spritesheet(ASSET_KEYS.PLAYER_WOWO_ACTION, wowoActionSheet, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet(ASSET_KEYS.BOSS_NAGA_ACTION, nagaActionSheet, { frameWidth: 128, frameHeight: 128 });

    // Load physical PNG sprites with true alpha
    this.load.image(ASSET_KEYS.PLAYER_WOWO_IDLE, wowoIdlePng);
    this.load.image(ASSET_KEYS.PLAYER_WOWO_WALK, wowoWalkPng);
    this.load.image(ASSET_KEYS.PLAYER_WOWO_HURT, wowoHurtPng);
    this.load.image(ASSET_KEYS.PLAYER_WOWO_DEATH, wowoDeathPng);

    this.load.image(ASSET_KEYS.ARENA_GROUND, grassTilePng);
    this.load.image(ASSET_KEYS.ARENA_ROAD, roadTilePng);
    this.load.image(ASSET_KEYS.ARENA_BORDER, borderTilePng);
    this.load.image(ASSET_KEYS.PROP_TENT, tpsTentPng);
    this.load.image(ASSET_KEYS.PROP_TREE, treePng);
    this.load.image(ASSET_KEYS.PROP_BALIHO, balihoPng);

    // Load physical enemy and projectile PNG sprites
    this.load.image(ASSET_KEYS.ENEMY_TIM_AMPLOP, timAmplopPng);
    this.load.image(ASSET_KEYS.ENEMY_BOT_KAMPANYE, botKampanyePng);
    this.load.image(ASSET_KEYS.ENEMY_PENYEBAR_HOAKS, penyebarHoaksPng);
    this.load.image(ASSET_KEYS.PROJECTILE_HOAKS, hoaxBulletPng);
    this.load.image(ASSET_KEYS.PROJECTILE_SURAT_SUARA, voteProjectilePng);
    this.load.image(ASSET_KEYS.PROJECTILE_AMPLOP, envelopeProjectilePng);

    // Load physical collectible PNG sprites
    this.load.image(ASSET_KEYS.ITEM_SUARA, suaraPng);
    this.load.image(ASSET_KEYS.ITEM_DANA, danaPng);
    this.load.image(ASSET_KEYS.ITEM_HEALTH, healthPng);
    this.load.image(ASSET_KEYS.ITEM_MANA, manaPng);
    this.load.image(ASSET_KEYS.ITEM_FAJAR_ENERGY, fajarEnergyPng);

    // Load physical boss Naga Fajar PNG sprites
    this.load.image(ASSET_KEYS.BOSS_NAGA_IDLE, bossNagaIdlePng);
    this.load.image(ASSET_KEYS.BOSS_NAGA_WALK, bossNagaWalkPng);
    this.load.image(ASSET_KEYS.BOSS_NAGA_ATTACK, bossNagaAttackPng);
    this.load.image(ASSET_KEYS.BOSS_NAGA_HURT, bossNagaHurtPng);
    this.load.image(ASSET_KEYS.BOSS_NAGA_DEATH, bossNagaDeathPng);
    this.load.image(ASSET_KEYS.BOSS_NAGA_RAGE, bossNagaRagePng);
    this.load.image(ASSET_KEYS.BOSS_NAGA_KECIL, bossNagaKecilPng);
    this.load.image(ASSET_KEYS.BOSS_PROYEKTIL_KERTAS, bossProyektilKertasPng);
    this.load.image(ASSET_KEYS.BOSS_ICON, bossIconPng);
  }

  create() {
    // Generate procedural runtime textures with true alpha fallback
    TextureFactory.createAll(this);
    registerActorAnimations(this, ASSET_KEYS.PLAYER_WOWO_ACTION, WOWO_ANIMATIONS);
    registerActorAnimations(this, ASSET_KEYS.BOSS_NAGA_ACTION, NAGA_ANIMATIONS);

    // Proceed directly to the main survival game scene
    this.scene.start("SurvivalScene", this.gameEvents);
  }
}
