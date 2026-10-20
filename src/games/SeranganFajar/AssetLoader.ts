import Phaser from 'phaser';

export const ASSET_KEYS = {
  HEROES: {
    MULYONO: 'hero_mulyono',
    WOWO: 'hero_wowo',
    FUFU_FAFA: 'hero_fufu_fafa',
  },
  ENEMIES: {
    TIM_AMPLOP: 'enemy_tim_amplop',
    BOT_KAMPANYE: 'enemy_bot_kampanye',
    PENYEBAR_HOAKS: 'enemy_penyebar_hoaks',
    MASSA_KAMPANYE: 'enemy_massa_kampanye',
    PENGAWAL_POLITIK: 'enemy_pengawal_politik',
  },
  VFX: {
    // Mulyono
    SOUNDWAVE: 'vfx_soundwave',
    BATU_PROYEK: 'vfx_batu_proyek',
    BANSOS_BAG: 'vfx_bansos_bag',
    BANSOS_IMPACT: 'vfx_bansos_impact',
    TEMBOK_PROYEK: 'vfx_tembok_proyek',
    BLUSUKAN_TORNADO: 'vfx_blusukan_tornado',
    // Wowo
    SLASH_DOUBLE: 'vfx_slash_double',
    SURAT_SUARA_BULLET: 'vfx_surat_suara_bullet',
    SHOCKWAVE_GEMOY: 'vfx_shockwave_gemoy',
    KUBAH_SERANGAN_FAJAR: 'vfx_kubah_serangan_fajar',
    // Fufu Fafa
    CYBER_PING: 'vfx_cyber_ping',
    CHAT_BURST: 'vfx_chat_burst',
    TEMBOK_ALGORITMA: 'vfx_tembok_algoritma',
    BADAI_SIBER: 'vfx_badai_siber',
    // Enemy
    HOAKS_BULLET: 'vfx_hoaks_bullet',
  },
  COLLECTIBLES: {
    SURAT_SUARA: 'item_surat_suara',
    KOIN_RP: 'item_koin_rp',
    HATI: 'item_hati',
    POTION_BIRU: 'item_potion_biru',
    BOLA_EMAS: 'item_bola_emas',
    MAGNET: 'item_magnet',
    SHIELD_BIRU: 'item_shield_biru',
    SEPATU_SPEED: 'item_sepatu_speed',
  },
  ENVIRONMENT: {
    TILEMAP: 'map_arena',
    TILESET: 'tileset_ground',
    PROP_TENDA_TPS: 'prop_tenda_tps',
    PROP_BALIHO: 'prop_baliho',
    PROP_SPANDUK: 'prop_spanduk',
    PROP_POSKO: 'prop_posko',
    PROP_MOBIL_KAMPANYE: 'prop_mobil_kampanye',
    PROP_RUMAH: 'prop_rumah',
    PROP_POHON: 'prop_pohon',
    PROP_PAGAR: 'prop_pagar',
  },
  UI: {
    // Icons 64x64
    ICON_MULYONO_BASIC: 'icon_mulyono_basic',
    ICON_MULYONO_SKILL1: 'icon_mulyono_skill1',
    ICON_MULYONO_SKILL2: 'icon_mulyono_skill2',
    ICON_MULYONO_ULTI: 'icon_mulyono_ulti',
    ICON_WOWO_BASIC: 'icon_wowo_basic',
    ICON_WOWO_SKILL1: 'icon_wowo_skill1',
    ICON_WOWO_SKILL2: 'icon_wowo_skill2',
    ICON_WOWO_ULTI: 'icon_wowo_ulti',
    ICON_FUFU_BASIC: 'icon_fufu_basic',
    ICON_FUFU_SKILL1: 'icon_fufu_skill1',
    ICON_FUFU_SKILL2: 'icon_fufu_skill2',
    ICON_FUFU_ULTI: 'icon_fufu_ulti',
    // HUD Bars & Controls
    AVATAR_FRAME: 'ui_avatar_frame',
    BAR_FRAME: 'ui_bar_frame',
    BAR_HP: 'ui_bar_hp',
    BAR_MANA: 'ui_bar_mana',
    BAR_ENERGY: 'ui_bar_energy',
    JOYSTICK_BASE: 'ui_joystick_base',
    JOYSTICK_THUMB: 'ui_joystick_thumb',
    BTN_ACTION: 'ui_btn_action',
    BANNER_LEVELUP: 'ui_banner_levelup',
    BANNER_GAMEOVER: 'ui_banner_gameover',
  },
} as const;

export class AssetLoaderScene extends Phaser.Scene {
  constructor() {
    super('AssetLoaderScene');
  }

  preload(): void {
    this.createProgressBar();

    // 1. Heroes - Atlas JSON (64x64 frame unit, TexturePacker format)
    // ponytail: atlas JSON path statis; ganti dynamic manifest loader saat remote modding aktif.
    const heroPath = '/assets/games/serangan-fajar/heroes/';
    this.load.atlas(ASSET_KEYS.HEROES.MULYONO, `${heroPath}mulyono.png`, `${heroPath}mulyono.json`);
    this.load.atlas(ASSET_KEYS.HEROES.WOWO, `${heroPath}wowo.png`, `${heroPath}wowo.json`);
    this.load.atlas(ASSET_KEYS.HEROES.FUFU_FAFA, `${heroPath}fufu_fafa.png`, `${heroPath}fufu_fafa.json`);

    // 2. Enemies - Atlas JSON (64x64 frame unit)
    const enemyPath = '/assets/games/serangan-fajar/enemies/';
    this.load.atlas(ASSET_KEYS.ENEMIES.TIM_AMPLOP, `${enemyPath}tim_amplop.png`, `${enemyPath}tim_amplop.json`);
    this.load.atlas(ASSET_KEYS.ENEMIES.BOT_KAMPANYE, `${enemyPath}bot_kampanye.png`, `${enemyPath}bot_kampanye.json`);
    this.load.atlas(ASSET_KEYS.ENEMIES.PENYEBAR_HOAKS, `${enemyPath}penyebar_hoaks.png`, `${enemyPath}penyebar_hoaks.json`);
    this.load.atlas(ASSET_KEYS.ENEMIES.MASSA_KAMPANYE, `${enemyPath}massa_kampanye.png`, `${enemyPath}massa_kampanye.json`);
    this.load.atlas(ASSET_KEYS.ENEMIES.PENGAWAL_POLITIK, `${enemyPath}pengawal_politik.png`, `${enemyPath}pengawal_politik.json`);

    // 3. Projectiles & VFX Spritesheets
    const vfxPath = '/assets/games/serangan-fajar/vfx/';
    // Projectiles 32x32
    this.load.spritesheet(ASSET_KEYS.VFX.SOUNDWAVE, `${vfxPath}soundwave.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.image(ASSET_KEYS.VFX.BATU_PROYEK, `${vfxPath}batu_proyek.png`);
    this.load.image(ASSET_KEYS.VFX.BANSOS_BAG, `${vfxPath}bansos_bag.png`);
    this.load.spritesheet(ASSET_KEYS.VFX.SURAT_SUARA_BULLET, `${vfxPath}surat_suara_bullet.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(ASSET_KEYS.VFX.CYBER_PING, `${vfxPath}cyber_ping.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet(ASSET_KEYS.VFX.HOAKS_BULLET, `${vfxPath}hoaks_bullet.png`, { frameWidth: 32, frameHeight: 32 });

    // Medium VFX 64x64 - 128x128
    this.load.spritesheet(ASSET_KEYS.VFX.SLASH_DOUBLE, `${vfxPath}slash_double.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet(ASSET_KEYS.VFX.BANSOS_IMPACT, `${vfxPath}bansos_impact.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet(ASSET_KEYS.VFX.TEMBOK_PROYEK, `${vfxPath}tembok_proyek.png`, { frameWidth: 64, frameHeight: 128 });
    this.load.spritesheet(ASSET_KEYS.VFX.SHOCKWAVE_GEMOY, `${vfxPath}shockwave_gemoy.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet(ASSET_KEYS.VFX.CHAT_BURST, `${vfxPath}chat_burst.png`, { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet(ASSET_KEYS.VFX.TEMBOK_ALGORITMA, `${vfxPath}tembok_algoritma.png`, { frameWidth: 128, frameHeight: 64 });

    // Ultimate VFX 256x256
    this.load.spritesheet(ASSET_KEYS.VFX.BLUSUKAN_TORNADO, `${vfxPath}blusukan_tornado.png`, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet(ASSET_KEYS.VFX.KUBAH_SERANGAN_FAJAR, `${vfxPath}kubah_serangan_fajar.png`, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet(ASSET_KEYS.VFX.BADAI_SIBER, `${vfxPath}badai_siber.png`, { frameWidth: 256, frameHeight: 256 });

    // 4. Collectibles (32x32 px, 4 frames idle glow)
    const itemPath = '/assets/games/serangan-fajar/collectibles/';
    Object.values(ASSET_KEYS.COLLECTIBLES).forEach((key) => {
      this.load.spritesheet(key, `${itemPath}${key.replace('item_', '')}.png`, { frameWidth: 32, frameHeight: 32 });
    });

    // 5. Environment Tileset & Props
    const envPath = '/assets/games/serangan-fajar/environment/';
    this.load.image(ASSET_KEYS.ENVIRONMENT.TILESET, `${envPath}tileset_ground.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_TENDA_TPS, `${envPath}prop_tenda_tps.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_BALIHO, `${envPath}prop_baliho.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_SPANDUK, `${envPath}prop_spanduk.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_POSKO, `${envPath}prop_posko.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_MOBIL_KAMPANYE, `${envPath}prop_mobil_kampanye.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_RUMAH, `${envPath}prop_rumah.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_POHON, `${envPath}prop_pohon.png`);
    this.load.image(ASSET_KEYS.ENVIRONMENT.PROP_PAGAR, `${envPath}prop_pagar.png`);

    // 6. UI & HUD (64x64 skill icons & UI widgets)
    const uiPath = '/assets/games/serangan-fajar/ui/';
    Object.values(ASSET_KEYS.UI).forEach((key) => {
      this.load.image(key, `${uiPath}${key.replace('ui_', '').replace('icon_', '')}.png`);
    });
  }

  create(): void {
    this.createCharacterAnimations();
    this.createCollectibleAnimations();
    this.createVFXAnimations();

    this.scene.start('GameScene');
  }

  private createProgressBar(): void {
    const { width, height } = this.cameras.main;
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x111111, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const txt = this.add.text(width / 2, height / 2 - 35, 'MEMUAT ASET SERANGAN FAJAR...', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffcc00',
    }).setOrigin(0.5);

    this.load.on('progress', (val: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xe53935, 1);
      progressBar.fillRect(width / 2 - 156, height / 2 - 11, 312 * val, 22);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      txt.destroy();
    });
  }

  private createCharacterAnimations(): void {
    const characters = [
      ...Object.values(ASSET_KEYS.HEROES),
      ...Object.values(ASSET_KEYS.ENEMIES),
    ];

    const heroAnims = ['idle', 'walk', 'attack', 'skill1', 'skill2', 'ultimate', 'hurt', 'death'];
    const enemyAnims = ['idle', 'walk', 'attack', 'hurt', 'death'];

    characters.forEach((charKey) => {
      const isHero = Object.values(ASSET_KEYS.HEROES).includes(charKey as any);
      const actions = isHero ? heroAnims : enemyAnims;

      actions.forEach((action) => {
        const animKey = `${charKey}_${action}`;
        if (!this.anims.exists(animKey)) {
          // Frame names pattern: hero_mulyono_walk_01.png
          const frameNames = this.anims.generateFrameNames(charKey, {
            prefix: `${charKey}_${action}_`,
            start: 1,
            end: action === 'death' ? 6 : 4,
            zeroPad: 2,
            suffix: '.png',
          });

          this.anims.create({
            key: animKey,
            frames: frameNames,
            frameRate: action === 'walk' ? 10 : action === 'attack' ? 12 : 8,
            repeat: ['idle', 'walk'].includes(action) ? -1 : 0,
          });
        }
      });
    });
  }

  private createCollectibleAnimations(): void {
    Object.values(ASSET_KEYS.COLLECTIBLES).forEach((itemKey) => {
      const animKey = `${itemKey}_glow`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(itemKey, { start: 0, end: 3 }),
          frameRate: 6,
          repeat: -1,
        });
      }
    });
  }

  private createVFXAnimations(): void {
    // Ultimate loops & one-shot impacts
    const vfxConfigs = [
      { key: ASSET_KEYS.VFX.BLUSUKAN_TORNADO, end: 5, rate: 12, loop: -1 },
      { key: ASSET_KEYS.VFX.KUBAH_SERANGAN_FAJAR, end: 5, rate: 10, loop: 0 },
      { key: ASSET_KEYS.VFX.BADAI_SIBER, end: 5, rate: 12, loop: -1 },
      { key: ASSET_KEYS.VFX.BANSOS_IMPACT, end: 3, rate: 10, loop: 0 },
      { key: ASSET_KEYS.VFX.SHOCKWAVE_GEMOY, end: 3, rate: 12, loop: 0 },
      { key: ASSET_KEYS.VFX.CHAT_BURST, end: 3, rate: 10, loop: 0 },
      { key: ASSET_KEYS.VFX.TEMBOK_PROYEK, end: 3, rate: 8, loop: 0 },
      { key: ASSET_KEYS.VFX.TEMBOK_ALGORITMA, end: 3, rate: 8, loop: -1 },
      { key: ASSET_KEYS.VFX.SLASH_DOUBLE, end: 3, rate: 14, loop: 0 },
    ];

    vfxConfigs.forEach((cfg) => {
      if (!this.anims.exists(cfg.key)) {
        this.anims.create({
          key: cfg.key,
          frames: this.anims.generateFrameNumbers(cfg.key, { start: 0, end: cfg.end }),
          frameRate: cfg.rate,
          repeat: cfg.loop,
        });
      }
    });
  }
}
