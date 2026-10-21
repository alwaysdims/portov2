// Tahap 18: capped effects; projectiles, skills and survival use existing systems.
export const UPGRADE_BALANCE = {
  splitDamageRatio: 0.4,
  splitAngle: Math.PI / 7,
  pierceHits: 2,
  stormShots: 3,
  followupDamageRatio: 0.35,
  followupDelay: 350,
  shieldAmount: 60,
  shieldDuration: 2,
  criticalShieldAmount: 150,
  criticalShieldDuration: 3,
  criticalShieldCooldown: 30,
  speedBonus: 45,
  speedDuration: 2,
};

const basic = [
  { id: "damage", name: "Kekuatan Opini", description: "+15% damage semua serangan.", effect: "+15% damage", category: "OFFENSE", rarity: "common", maxStacks: 5, icon: "⚔️" },
  { id: "attackSpeed", name: "Cepat Coblos", description: "+12% frekuensi basic attack.", effect: "+12% kecepatan serang", category: "OFFENSE", rarity: "common", maxStacks: 5, icon: "⚡" },
  { id: "maxHp", name: "Rompi Tebal", description: "+150 HP maksimum dan pulihkan 150 HP.", effect: "+150 HP", category: "DEFENSE", rarity: "common", maxStacks: 5, icon: "❤️" },
  { id: "speed", name: "Gerak Blusukan", description: "+25 kecepatan gerak.", effect: "+25 kecepatan", category: "UTILITY", rarity: "common", maxStacks: 5, icon: "👟" },
  { id: "manaRegen", name: "Kopi Stamina", description: "+2 mana/detik.", effect: "+2 mana/detik", category: "UTILITY", rarity: "common", maxStacks: 5, icon: "☕" },
  { id: "cooldownReduction", name: "Relasi Efisien", description: "-8% cooldown skill Q/E (maks. 40%).", effect: "-8% cooldown", category: "SKILL", rarity: "common", maxStacks: 5, icon: "⏱️" },
];

const behaviors = [
  { id: "suratPecah", name: "Surat Suara Pecah", description: "Hit basic memecah menjadi 2 peluru lemah; tidak membelah ulang.", effect: "2 pecahan 40% damage", category: "PROJECTILE", rarity: "rare", maxStacks: 1, icon: "✉️" },
  { id: "tembusBarisan", name: "Tembus Barisan", description: "Basic attack menembus 2 target berbeda.", effect: "2 target/peluru", category: "PROJECTILE", rarity: "rare", maxStacks: 1, icon: "🏹" },
  { id: "badaiSurat", name: "Badai Surat Suara", description: "Evolusi: tembak 3 surat tiap serangan.", effect: "3 peluru basic", category: "PROJECTILE", rarity: "legendary", maxStacks: 1, prerequisite: { suratPecah: 1, tembusBarisan: 1 }, icon: "🌪️" },
  { id: "orasiMembara", name: "Orasi Membara", description: "Orasi E memicu gelombang susulan 350ms kemudian.", effect: "Gelombang kedua 35% damage", category: "SKILL", rarity: "rare", maxStacks: 1, prerequisite: { cooldownReduction: 1 }, icon: "🔥" },
  { id: "amplopBerantai", name: "Amplop Berantai", description: "Amplop Q yang mengenai musuh memantul sekali ke target dekat.", effect: "1 pantulan 40% damage", category: "SKILL", rarity: "rare", maxStacks: 1, icon: "💌" },
  { id: "fajarBangkit", name: "Fajar Bangkit", description: "Evolusi: ultimate R memicu gelombang susulan.", effect: "Gelombang kedua 35% damage", category: "SKILL", rarity: "legendary", maxStacks: 1, prerequisite: { orasiMembara: 1, cooldownReduction: 1 }, icon: "☀️" },
  { id: "pantangMundur", name: "Pantang Mundur", description: "Saat terkena damage, dapat shield 60 selama 2 detik.", effect: "Shield 60 / 2 detik", category: "DEFENSE", rarity: "rare", maxStacks: 1, icon: "🛡️" },
  { id: "magnetDemokrasi", name: "Magnet Demokrasi", description: "Radius pickup dan magnet bertambah.", effect: "+25 pickup / +80 magnet", category: "UTILITY", rarity: "rare", maxStacks: 1, icon: "🧲" },
  { id: "langkahCepat", name: "Langkah Cepat", description: "Setelah skill, kecepatan +45 selama 2 detik.", effect: "+45 speed / 2 detik", category: "UTILITY", rarity: "rare", maxStacks: 1, icon: "💨" },
  { id: "bentengFajar", name: "Benteng Fajar", description: "Evolusi: ketika HP kritis dan terkena hit, shield 150 selama 3 detik; cooldown 30 detik.", effect: "Shield 150 / 30 detik", category: "DEFENSE", rarity: "legendary", maxStacks: 1, prerequisite: { pantangMundur: 1, langkahCepat: 1 }, icon: "🏰" },
];

export const UPGRADE_DEFINITIONS = [...basic, ...behaviors];

export function eligibleUpgrades(levels, definitions = UPGRADE_DEFINITIONS) {
  return definitions.filter(({ id, maxStacks, prerequisite = {} }) =>
    (levels[id] || 0) < maxStacks &&
    Object.entries(prerequisite).every(([key, required]) => (levels[key] || 0) >= required)
  );
}
