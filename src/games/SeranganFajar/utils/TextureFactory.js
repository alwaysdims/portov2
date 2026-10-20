import { ASSET_KEYS } from "../config/assetRegistry.js";

export class TextureFactory {
  /**
   * Generates all procedural pixel-art textures in-memory with pure alpha transparency.
   * @param {Phaser.Scene} scene
   */
  static createAll(scene) {
    this.createPlayerWowo(scene);
    this.createPlayerWowoWalk(scene);
    this.createPlayerWowoHurt(scene);
    this.createPlayerWowoDeath(scene);
    this.createArenaGround(scene);
    this.createArenaBorder(scene);
    this.createArenaRoad(scene);
    this.createPropTree(scene);
    this.createPropTent(scene);
    this.createPropBaliho(scene);
    this.createEnemyTimAmplop(scene);
    this.createEnemyBotKampanye(scene);
    this.createEnemyPenyebarHoaks(scene);
    this.createProjectileHoaks(scene);
    this.createProjectileSuratSuara(scene);
    this.createProjectileAmplop(scene);
    this.createCollectibleSuara(scene);
    this.createCollectibleDana(scene);
    this.createCollectibleHealth(scene);
    this.createCollectibleMana(scene);
    this.createCollectibleFajarEnergy(scene);
    this.createBossNagaFajar(scene);
    this.createBossNagaKecil(scene);
    this.createBossProyektilKertas(scene);
    this.createBossIcon(scene);
  }

  static createPlayerWowo(scene) {
    const key = ASSET_KEYS.PLAYER_WOWO_IDLE;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 48, 48);
    const ctx = canvas.getContext();

    // Clear alpha
    ctx.clearRect(0, 0, 48, 48);

    // Drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(24, 44, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet / Shoes (y: 39-44)
    ctx.fillStyle = "#271c19";
    ctx.fillRect(16, 40, 6, 4);
    ctx.fillRect(26, 40, 6, 4);

    // Trousers / Khaki pants (y: 33-40)
    ctx.fillStyle = "#8d704b";
    ctx.fillRect(16, 33, 7, 8);
    ctx.fillRect(25, 33, 7, 8);
    ctx.fillStyle = "#6d5232";
    ctx.fillRect(23, 34, 2, 7); // Inseam shadow

    // Belt (y: 31-33)
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(14, 31, 20, 3);
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(22, 31, 4, 3); // Gold buckle

    // Torso / Safari Shirt (y: 20-31)
    ctx.fillStyle = "#d8c4a5"; // Light khaki
    ctx.fillRect(13, 20, 22, 11);
    ctx.fillStyle = "#bba382"; // Shirt shadow
    ctx.fillRect(13, 29, 22, 2);
    ctx.fillRect(15, 24, 5, 4); // Left pocket
    ctx.fillRect(28, 24, 5, 4); // Right pocket
    ctx.fillStyle = "#8d704b";
    ctx.fillRect(23, 20, 2, 11); // Placket buttons line

    // Arms & Hands (y: 21-32)
    ctx.fillStyle = "#d8c4a5";
    ctx.fillRect(10, 21, 4, 8); // Left sleeve
    ctx.fillRect(34, 21, 4, 8); // Right sleeve
    ctx.fillStyle = "#ffd1a4"; // Skin
    ctx.fillRect(10, 29, 4, 3); // Left hand
    ctx.fillRect(34, 29, 4, 3); // Right hand

    // Head / Face (y: 9-20)
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(14, 9, 20, 12);
    // Cheeks rosy gemoy
    ctx.fillStyle = "#fca5a5";
    ctx.fillRect(15, 16, 3, 2);
    ctx.fillRect(30, 16, 3, 2);
    // Eyes
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(18, 13, 3, 3);
    ctx.fillRect(27, 13, 3, 3);
    // Eye highlights
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(18, 13, 1, 1);
    ctx.fillRect(27, 13, 1, 1);
    // Smile
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(22, 18, 4, 1);

    // Safari Hat (y: 3-10)
    ctx.fillStyle = "#b48c58";
    ctx.fillRect(8, 9, 32, 3); // Wide brim
    ctx.fillStyle = "#946f3d";
    ctx.fillRect(12, 4, 24, 6); // Hat crown
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(12, 8, 24, 2); // Dark hat band
    ctx.fillStyle = "#cbb185";
    ctx.fillRect(14, 4, 20, 2); // Crown highlight

    canvas.refresh();
  }

  static createPlayerWowoWalk(scene) {
    const key = ASSET_KEYS.PLAYER_WOWO_WALK;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 48, 48);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 48, 48);

    // Drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(24, 44, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Striding feet / Shoes
    ctx.fillStyle = "#271c19";
    ctx.fillRect(14, 41, 6, 4);
    ctx.fillRect(28, 39, 6, 4);

    // Pants with stride split
    ctx.fillStyle = "#8d704b";
    ctx.fillRect(15, 33, 7, 9);
    ctx.fillRect(27, 33, 7, 7);
    ctx.fillStyle = "#6d5232";
    ctx.fillRect(22, 34, 5, 4);

    // Belt
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(14, 31, 20, 3);
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(22, 31, 4, 3);

    // Safari Shirt
    ctx.fillStyle = "#d8c4a5";
    ctx.fillRect(13, 20, 22, 11);
    ctx.fillStyle = "#bba382";
    ctx.fillRect(13, 29, 22, 2);
    ctx.fillRect(15, 24, 5, 4);
    ctx.fillRect(28, 24, 5, 4);
    ctx.fillStyle = "#8d704b";
    ctx.fillRect(23, 20, 2, 11);

    // Swinging arms
    ctx.fillStyle = "#d8c4a5";
    ctx.fillRect(9, 23, 4, 7);
    ctx.fillRect(35, 19, 4, 7);
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(9, 30, 4, 3);
    ctx.fillRect(35, 26, 4, 3);

    // Head
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(14, 9, 20, 12);
    ctx.fillStyle = "#fca5a5";
    ctx.fillRect(15, 16, 3, 2);
    ctx.fillRect(30, 16, 3, 2);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(18, 13, 3, 3);
    ctx.fillRect(27, 13, 3, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(18, 13, 1, 1);
    ctx.fillRect(27, 13, 1, 1);
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(22, 18, 4, 2);

    // Hat
    ctx.fillStyle = "#b48c58";
    ctx.fillRect(8, 9, 32, 3);
    ctx.fillStyle = "#946f3d";
    ctx.fillRect(12, 4, 24, 6);
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(12, 8, 24, 2);
    ctx.fillStyle = "#cbb185";
    ctx.fillRect(14, 4, 20, 2);

    canvas.refresh();
  }

  static createPlayerWowoHurt(scene) {
    const key = ASSET_KEYS.PLAYER_WOWO_HURT;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 48, 48);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 48, 48);

    // Drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(24, 44, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoes
    ctx.fillStyle = "#271c19";
    ctx.fillRect(15, 40, 6, 4);
    ctx.fillRect(27, 40, 6, 4);

    // Pants
    ctx.fillStyle = "#8d704b";
    ctx.fillRect(15, 33, 7, 8);
    ctx.fillRect(26, 33, 7, 8);

    // Belt
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(14, 31, 20, 3);

    // Torso with hurt red tint
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(13, 20, 22, 11);
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(13, 29, 22, 2);

    // Arms
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(13, 23, 6, 6);
    ctx.fillRect(29, 23, 6, 6);

    // Face
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(14, 9, 20, 12);
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(18, 14, 4, 1);
    ctx.fillRect(26, 14, 4, 1);
    ctx.fillRect(21, 18, 6, 2);

    // Hat askew
    ctx.fillStyle = "#b48c58";
    ctx.fillRect(7, 8, 32, 3);
    ctx.fillStyle = "#946f3d";
    ctx.fillRect(11, 3, 24, 6);

    canvas.refresh();
  }

  static createPlayerWowoDeath(scene) {
    const key = ASSET_KEYS.PLAYER_WOWO_DEATH;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 48, 48);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 48, 48);

    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(24, 38, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fallen figure
    ctx.fillStyle = "#271c19";
    ctx.fillRect(4, 33, 5, 6);
    ctx.fillStyle = "#8d704b";
    ctx.fillRect(9, 32, 10, 7);
    ctx.fillStyle = "#d8c4a5";
    ctx.fillRect(19, 30, 12, 9);
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(31, 29, 10, 10);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(34, 32, 2, 2);
    ctx.fillRect(38, 32, 2, 2);

    // Hat beside
    ctx.fillStyle = "#b48c58";
    ctx.fillRect(28, 20, 14, 3);
    ctx.fillStyle = "#946f3d";
    ctx.fillRect(31, 16, 8, 5);

    // Dizzy stars
    ctx.fillStyle = "#facc15";
    ctx.fillRect(34, 12, 2, 2);
    ctx.fillRect(41, 14, 2, 2);

    canvas.refresh();
  }

  static createArenaGround(scene) {
    const key = ASSET_KEYS.ARENA_GROUND;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 64, 64);
    const ctx = canvas.getContext();

    // Base grass color
    ctx.fillStyle = "#2d5a3f";
    ctx.fillRect(0, 0, 64, 64);

    // Grid variation
    ctx.fillStyle = "#264e36";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);

    // Grass blade details
    const blades = [
      [6, 8, "#387350"], [18, 24, "#41845c"], [42, 10, "#41845c"], [54, 22, "#387350"],
      [12, 44, "#41845c"], [26, 52, "#387350"], [38, 38, "#41845c"], [50, 56, "#41845c"],
      [8, 28, "#21422f"], [30, 8, "#21422f"], [48, 46, "#21422f"], [22, 40, "#21422f"]
    ];

    blades.forEach(([x, y, color]) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 2, 4);
      ctx.fillRect(x + 2, y - 1, 2, 3);
    });

    canvas.refresh();
  }

  static createArenaBorder(scene) {
    const key = ASSET_KEYS.ARENA_BORDER;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 32, 32);
    const ctx = canvas.getContext();

    // Stone barrier
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#475569";
    ctx.fillRect(2, 2, 28, 28);
    // Hazard stripe (satir red-white)
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(4, 12, 10, 8);
    ctx.fillRect(18, 12, 10, 8);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(14, 12, 4, 8);

    canvas.refresh();
  }

  static createPropTree(scene) {
    const key = ASSET_KEYS.PROP_TREE;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 64, 80);
    const ctx = canvas.getContext();

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(32, 74, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = "#5c3317";
    ctx.fillRect(26, 46, 12, 28);
    ctx.fillStyle = "#3b1e09";
    ctx.fillRect(26, 46, 3, 28);

    // Leaves / Foliage
    ctx.fillStyle = "#14532d"; // Dark green shadow
    ctx.beginPath();
    ctx.arc(32, 34, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#16a34a"; // Mid green
    ctx.beginPath();
    ctx.arc(30, 30, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4ade80"; // Highlight
    ctx.beginPath();
    ctx.arc(26, 22, 14, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  static createPropTent(scene) {
    const key = ASSET_KEYS.PROP_TENT;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 96, 64);
    const ctx = canvas.getContext();

    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(6, 48, 84, 12);

    // Poles
    ctx.fillStyle = "#64748b";
    ctx.fillRect(8, 20, 4, 36);
    ctx.fillRect(84, 20, 4, 36);
    ctx.fillRect(26, 20, 3, 36);
    ctx.fillRect(66, 20, 3, 36);

    // Striped Canopy
    const stripeWidth = 12;
    for (let x = 6; x < 90; x += stripeWidth) {
      ctx.fillStyle = Math.floor(x / stripeWidth) % 2 === 0 ? "#dc2626" : "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.lineTo(x + stripeWidth, 24);
      ctx.lineTo(x + stripeWidth - 3, 4);
      ctx.lineTo(x + 3, 4);
      ctx.closePath();
      ctx.fill();
    }

    // TPS Sign board
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(32, 26, 32, 14);
    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 26, 32, 14);
    ctx.fillStyle = "#b91c1c";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("TPS 01", 48, 37);

    canvas.refresh();
  }

  static createArenaRoad(scene) {
    const key = ASSET_KEYS.ARENA_ROAD;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 64, 64);
    const ctx = canvas.getContext();

    // Base paving color
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 0, 64, 64);

    // Stone cobble grid
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    for (let r = 0; r < 4; r++) {
      const y = r * 16;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(64, y);
      ctx.stroke();

      const offset = (r % 2) * 16;
      for (let c = 0; c < 3; c++) {
        const x = c * 32 + offset;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 16);
        ctx.stroke();
      }
    }

    // Cobble highlights
    ctx.fillStyle = "#64748b";
    ctx.fillRect(4, 3, 22, 3);
    ctx.fillRect(36, 19, 22, 3);
    ctx.fillRect(20, 35, 22, 3);
    ctx.fillRect(52, 51, 8, 3);

    canvas.refresh();
  }

  static createPropBaliho(scene) {
    const key = ASSET_KEYS.PROP_BALIHO;
    if (scene.textures.exists(key)) return;

    const canvas = scene.textures.createCanvas(key, 80, 100);
    const ctx = canvas.getContext();

    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(14, 92, 52, 6);

    // Wooden Support Poles
    ctx.fillStyle = "#78350f";
    ctx.fillRect(18, 50, 6, 45);
    ctx.fillRect(56, 50, 6, 45);

    // Diagonal brace
    ctx.strokeStyle = "#5a2707";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(21, 80);
    ctx.lineTo(59, 56);
    ctx.stroke();

    // Billboard Panel
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(8, 4, 64, 52);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 4, 64, 52);

    // Header Red Bar
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(9, 5, 62, 12);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("COBLOS NO. 02", 40, 14);

    // Yellow Poster Card
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(12, 19, 56, 34);

    // Avatar caricature
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(26, 34, 8, 0, Math.PI * 2);
    ctx.fill();

    // Slogan Text
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 7px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("WOWO", 38, 30);
    ctx.fillText("MENANG!", 38, 40);

    canvas.refresh();
  }

  static createEnemyTimAmplop(scene) {
    const key = ASSET_KEYS.ENEMY_TIM_AMPLOP;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 36, 36);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 36, 36);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(18, 32, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red polo body & white envelope
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(10, 13, 16, 11);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(25, 17, 8, 6);
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(11, 6, 14, 8);
    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(10, 4, 16, 4);

    canvas.refresh();
  }

  static createEnemyBotKampanye(scene) {
    const key = ASSET_KEYS.ENEMY_BOT_KAMPANYE;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 48, 48);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 48, 48);

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(24, 43, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy slate armor & glowing visor
    ctx.fillStyle = "#334155";
    ctx.fillRect(11, 18, 26, 20);
    ctx.fillStyle = "#475569";
    ctx.fillRect(14, 7, 20, 11);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(17, 11, 14, 3); // Red visor

    canvas.refresh();
  }

  static createEnemyPenyebarHoaks(scene) {
    const key = ASSET_KEYS.ENEMY_PENYEBAR_HOAKS;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 36, 36);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 36, 36);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(18, 32, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Purple coat & red megaphone
    ctx.fillStyle = "#6b21a8";
    ctx.fillRect(10, 13, 16, 12);
    ctx.fillStyle = "#ffd1a4";
    ctx.fillRect(11, 5, 14, 8);
    ctx.fillStyle = "#18181b";
    ctx.fillRect(12, 8, 12, 3); // Sunglasses
    ctx.fillStyle = "#e11d48";
    ctx.fillRect(23, 16, 9, 6); // Megaphone

    canvas.refresh();
  }

  static createProjectileHoaks(scene) {
    const key = ASSET_KEYS.PROJECTILE_HOAKS;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 16, 16);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 16, 16);

    ctx.fillStyle = "rgba(147, 51, 234, 0.7)";
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.arc(8, 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(8, 8, 1.5, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  static createProjectileSuratSuara(scene) {
    const key = ASSET_KEYS.PROJECTILE_SURAT_SUARA;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 20, 20);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 20, 20);

    // Ballot paper
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(3, 2, 14, 14);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 2, 14, 14);

    // Red banner
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(4, 3, 12, 4);

    // Ballot markings
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(5, 9, 4, 3);
    ctx.fillRect(11, 9, 4, 3);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(11, 13, 4, 2);

    canvas.refresh();
  }

  static createProjectileAmplop(scene) {
    const key = ASSET_KEYS.PROJECTILE_AMPLOP;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 24, 16);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 24, 16);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(2, 2, 20, 12);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, 20, 12);

    // Diagonal fold lines
    ctx.strokeStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(3, 3);
    ctx.lineTo(12, 8);
    ctx.lineTo(21, 3);
    ctx.stroke();

    // Red seal
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(12, 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  static createCollectibleSuara(scene) {
    const key = ASSET_KEYS.ITEM_SUARA;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 18, 18);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 18, 18);

    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(2, 1, 14, 16);
    ctx.strokeStyle = "#166534";
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 1, 14, 16);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(3, 2, 12, 3);

    ctx.fillStyle = "#15803d";
    ctx.fillRect(7, 8, 4, 3);

    canvas.refresh();
  }

  static createCollectibleDana(scene) {
    const key = ASSET_KEYS.ITEM_DANA;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 18, 18);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 18, 18);

    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.arc(9, 9, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#854d0e";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(7, 7, 2, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  static createCollectibleHealth(scene) {
    const key = ASSET_KEYS.ITEM_HEALTH;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 20, 20);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 20, 20);

    ctx.fillStyle = "#b45309";
    ctx.fillRect(8, 1, 4, 3);

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(10, 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#991b1b";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(8, 9, 4, 6);
    ctx.fillRect(6, 10, 8, 4);

    canvas.refresh();
  }

  static createCollectibleMana(scene) {
    const key = ASSET_KEYS.ITEM_MANA;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 18, 22);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 18, 22);

    ctx.fillStyle = "#b45309";
    ctx.fillRect(7, 1, 4, 3);

    ctx.fillStyle = "#0ea5e9";
    ctx.beginPath();
    ctx.arc(9, 13, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0369a1";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(6, 10, 2, 2);

    canvas.refresh();
  }

  static createCollectibleFajarEnergy(scene) {
    const key = ASSET_KEYS.ITEM_FAJAR_ENERGY;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 20, 20);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 20, 20);

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(10, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.fillRect(9, 2, 2, 16);
    ctx.fillRect(2, 9, 16, 2);

    canvas.refresh();
  }

  static createBossNagaFajar(scene) {
    const keys = [
      ASSET_KEYS.BOSS_NAGA_IDLE,
      ASSET_KEYS.BOSS_NAGA_WALK,
      ASSET_KEYS.BOSS_NAGA_ATTACK,
      ASSET_KEYS.BOSS_NAGA_HURT,
      ASSET_KEYS.BOSS_NAGA_DEATH,
      ASSET_KEYS.BOSS_NAGA_RAGE,
    ];

    keys.forEach((key) => {
      if (scene.textures.exists(key)) return;
      const canvas = scene.textures.createCanvas(key, 96, 96);
      const ctx = canvas.getContext();
      ctx.clearRect(0, 0, 96, 96);

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(48, 88, 32, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dragon body (serpentine curves)
      ctx.fillStyle = key === ASSET_KEYS.BOSS_NAGA_RAGE ? "#ef4444" : "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(48, 48, 30, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red mane and horns
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(35, 25);
      ctx.lineTo(45, 10);
      ctx.lineTo(55, 25);
      ctx.fill();

      // Gold underbelly
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.ellipse(48, 56, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(60, 36, 4, 4);

      canvas.refresh();
    });
  }

  static createBossNagaKecil(scene) {
    const key = ASSET_KEYS.BOSS_NAGA_KECIL;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 40, 40);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 40, 40);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(20, 36, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.ellipse(20, 20, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dc2626";
    ctx.fillRect(16, 8, 8, 8);

    canvas.refresh();
  }

  static createBossProyektilKertas(scene) {
    const key = ASSET_KEYS.BOSS_PROYEKTIL_KERTAS;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 24, 14);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 24, 14);

    ctx.fillStyle = "#fef08a";
    ctx.fillRect(2, 2, 20, 10);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(6, 4, 12, 6);

    canvas.refresh();
  }

  static createBossIcon(scene) {
    const key = ASSET_KEYS.BOSS_ICON;
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 48, 48);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 48, 48);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 48, 48);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 44, 44);

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(24, 24, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dc2626";
    ctx.fillRect(18, 12, 12, 8);

    canvas.refresh();
  }
}
