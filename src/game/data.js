export const SAVE_KEY = "vahsi-bahce-3d-save-v1";
export const WATER_UNLOCK_LEVEL = 5;
export const MAX_BUILDING_LEVEL = 5;
export const GRID_COLS = 8;
export const GRID_ROWS = 6;
export const CELL = 2.4;

export const BUILDING_DEFS = {
  hq: {
    id: "hq",
    name: "Bahçe Merkezi",
    icon: "🏛️",
    desc: "Bahçenin kalbi. Yükseltince daha fazla bina ve turist kapasitesi.",
    max: 1,
    baseCost: 0,
    color: 0xd9a12e,
    effects: (lv) => ({
      maxBuildings: 4 + lv * 2,
      touristCap: 5 + lv * 4,
      xpBonus: lv * 0.05,
    }),
    effectText: (lv) => `Bina limiti ${4 + lv * 2}, turist kapasitesi ${5 + lv * 4}`,
  },
  ticket: {
    id: "ticket",
    name: "Bilet Gişesi",
    icon: "🎫",
    desc: "Turist giriş ücretini ve geliş hızını artırır.",
    max: 2,
    baseCost: 80,
    color: 0xe8b84a,
    effects: (lv) => ({
      ticketPay: 4 + lv * 3,
      spawnBonus: 0.08 * lv,
    }),
    effectText: (lv) => `Bilet +${4 + lv * 3} 🪙, turist gelişi +${Math.round(lv * 8)}%`,
  },
  landHabitat: {
    id: "landHabitat",
    name: "Kara Habitatı",
    icon: "🌲",
    desc: "Kara canlıları için yaşam alanı.",
    habitat: "land",
    max: 6,
    baseCost: 120,
    color: 0x3f8a4e,
    effects: (lv) => ({
      slots: lv,
      appeal: 8 + lv * 6,
    }),
    effectText: (lv) => `${lv} hayvan yuvası, çekicilik +${8 + lv * 6}`,
  },
  aquarium: {
    id: "aquarium",
    name: "Akvaryum",
    icon: "🐋",
    desc: "Su canlıları için. Seviye 5’te açılır.",
    habitat: "water",
    unlockLevel: WATER_UNLOCK_LEVEL,
    max: 4,
    baseCost: 450,
    color: 0x2a7f9e,
    effects: (lv) => ({
      slots: lv,
      appeal: 14 + lv * 9,
    }),
    effectText: (lv) => `${lv} su yuvası, çekicilik +${14 + lv * 9}`,
  },
  snack: {
    id: "snack",
    name: "Atıştırmalık Standı",
    icon: "🍿",
    desc: "Turistler buraya uğrayıp ekstra harcama yapar.",
    max: 3,
    baseCost: 150,
    color: 0xc45c48,
    effects: (lv) => ({
      spend: 3 + lv * 4,
      spendChance: 0.15 + lv * 0.05,
    }),
    effectText: (lv) =>
      `Harcama +${3 + lv * 4} 🪙, uğme şansı %${Math.round((0.15 + lv * 0.05) * 100)}`,
  },
  gift: {
    id: "gift",
    name: "Hediyelik Dükkan",
    icon: "🎁",
    desc: "Turist harcamalarını ve XP kazancını artırır.",
    max: 2,
    baseCost: 220,
    color: 0x9b6b3b,
    effects: (lv) => ({
      spend: 6 + lv * 5,
      spendChance: 0.1 + lv * 0.04,
      xpOnSpend: 1 + lv,
    }),
    effectText: (lv) => `Hediye +${6 + lv * 5} 🪙, XP +${1 + lv}`,
  },
};

export const ANIMAL_DEFS = [
  { id: "rabbit", name: "Tavşan", icon: "🐰", type: "land", unlockLevel: 1, cost: 60, appeal: 6, rarity: "yaygın", color: 0xe8d5c4 },
  { id: "chicken", name: "Tavuk", icon: "🐔", type: "land", unlockLevel: 1, cost: 50, appeal: 5, rarity: "yaygın", color: 0xf2d08b },
  { id: "goat", name: "Keçi", icon: "🐐", type: "land", unlockLevel: 2, cost: 120, appeal: 10, rarity: "yaygın", color: 0xd9c4a5 },
  { id: "fox", name: "Tilki", icon: "🦊", type: "land", unlockLevel: 3, cost: 220, appeal: 16, rarity: "nadir", color: 0xd9783a },
  { id: "deer", name: "Geyik", icon: "🦌", type: "land", unlockLevel: 4, cost: 350, appeal: 22, rarity: "nadir", color: 0xb8875a },
  { id: "wolf", name: "Kurt", icon: "🐺", type: "land", unlockLevel: 6, cost: 520, appeal: 30, rarity: "epik", color: 0x8a93a0 },
  { id: "lion", name: "Aslan", icon: "🦁", type: "land", unlockLevel: 8, cost: 900, appeal: 48, rarity: "epik", color: 0xe0a64a },
  { id: "elephant", name: "Fil", icon: "🐘", type: "land", unlockLevel: 10, cost: 1500, appeal: 70, rarity: "efsane", color: 0x9aa3ad },
  { id: "fish", name: "Balık", icon: "🐟", type: "water", unlockLevel: 5, cost: 180, appeal: 12, rarity: "yaygın", color: 0x4db6c8 },
  { id: "turtle", name: "Kaplumbağa", icon: "🐢", type: "water", unlockLevel: 5, cost: 260, appeal: 18, rarity: "yaygın", color: 0x5f8f4e },
  { id: "seal", name: "Fok", icon: "🦭", type: "water", unlockLevel: 7, cost: 480, appeal: 28, rarity: "nadir", color: 0x7d8793 },
  { id: "dolphin", name: "Yunus", icon: "🐬", type: "water", unlockLevel: 9, cost: 850, appeal: 45, rarity: "epik", color: 0x6aa7c2 },
  { id: "shark", name: "Köpekbalığı", icon: "🦈", type: "water", unlockLevel: 11, cost: 1400, appeal: 65, rarity: "efsane", color: 0x6b7c8c },
  { id: "whale", name: "Balina", icon: "🐳", type: "water", unlockLevel: 13, cost: 2200, appeal: 95, rarity: "efsane", color: 0x3f6f8f },
];

export const XP_FOR_LEVEL = (level) =>
  Math.floor(40 + (level - 1) * 35 + (level - 1) ** 1.6 * 8);

export function buildingCost(def, ownedCount) {
  return Math.floor(def.baseCost * (1 + ownedCount * 0.65));
}

export function upgradeCost(building) {
  const def = BUILDING_DEFS[building.type];
  return Math.floor(60 * building.level ** 1.7 + def.baseCost * 0.35 * building.level);
}

export function gridToWorld(gx, gy) {
  return {
    x: (gx - (GRID_COLS - 1) / 2) * CELL,
    z: (gy - (GRID_ROWS - 1) / 2) * CELL,
  };
}
