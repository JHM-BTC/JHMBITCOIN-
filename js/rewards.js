
import { getRandomElement, getRandomInt, formatRupiah } from './utils.js';

export const ISLAND_PRIZES = {
  A: {
    name: 'Mystery Box',
    prizes: [2000, 3000, 5000, 8000, 10000],
    display: [
      { nominal: "Rp 5.000.000", logo: "🏅" },
      { nominal: "Rp 1.000.000", logo: "🥇" },
      { nominal: "Rp 100.000", logo: "💷" },
      { nominal: "Rp 20.000", logo: "💳" },
      { nominal: "Rp 10.000", logo: "🤑" },
      { nominal: "Rp 8.000", logo: "🪙" },
      { nominal: "Rp 5.000", logo: "💵" },
      { nominal: "Rp 3.000", logo: "🪙" },
      { nominal: "Rp 2.000", logo: "💰" }
    ]
  },
  B: {
    name: 'Slot Machine',
    prizes: [1000, 2500, 5000, 10000, 25000, 50000],
    symbols: ['🍒', '🍋', '🍊', '⭐', '💎', '7️⃣'],
    combinations: {
      '7️⃣7️⃣7️⃣': 50000,
      '💎💎💎': 25000,
      '⭐⭐⭐': 10000,
      '🍊🍊🍊': 5000,
      '🍋🍋🍋': 2500,
      '🍒🍒🍒': 1000
    }
  },
  C: {
    name: 'Wheel of Fortune',
    prizes: [500, 1000, 2000, 5000, 10000, 15000, 25000],
    segments: [
      { label: 'Rp 500', value: 500, color: '#ff6b6b' },
      { label: 'Rp 1.000', value: 1000, color: '#4ecdc4' },
      { label: 'Rp 2.000', value: 2000, color: '#45b7d1' },
      { label: 'Rp 5.000', value: 5000, color: '#96ceb4' },
      { label: 'Rp 10.000', value: 10000, color: '#feca57' },
      { label: 'Rp 15.000', value: 15000, color: '#ff9ff3' },
      { label: 'Rp 25.000', value: 25000, color: '#54a0ff' },
      { label: 'JACKPOT!', value: 25000, color: '#ffd700' }
    ]
  },
  D: {
    name: 'Treasure Chest',
    prizes: [3000, 5000, 10000, 20000, 50000, 100000],
    keys: ['🗝️', '🔑', '🗝️'],
    chestLevels: [
      { level: 1, prize: [3000, 5000], keys: 1 },
      { level: 2, prize: [10000, 20000], keys: 2 },
      { level: 3, prize: [50000, 100000], keys: 3 }
    ]
  }
};

export class MysteryBoxReward {
  constructor() {
    this.prizes = ISLAND_PRIZES.A.prizes;
    this.display = ISLAND_PRIZES.A.display;
  }

  generatePrize() {
    return getRandomElement(this.prizes);
  }

  getDisplayPrizes() {
    return this.display;
  }

  formatPrizeResult(prize, userId) {
    return {
      island: 'A',
      type: 'mystery_box',
      prize: prize,
      message: `Selamat ${userId}! Kamu mendapatkan ${formatRupiah(prize)}`,
      display: this.display
    };
  }
}

export class SlotMachineReward {
  constructor() {
    this.symbols = ISLAND_PRIZES.B.symbols;
    this.combinations = ISLAND_PRIZES.B.combinations;
    this.prizes = ISLAND_PRIZES.B.prizes;
  }

  spin() {
    return [
      getRandomElement(this.symbols),
      getRandomElement(this.symbols),
      getRandomElement(this.symbols)
    ];
  }

  calculatePrize(combination) {
    const key = combination.join('');
    return this.combinations[key] || 0;
  }

  generatePrize() {
    const combination = this.spin();
    const prize = this.calculatePrize(combination);
    
    const finalPrize = prize > 0 ? prize : getRandomElement([500, 1000]);
    
    return {
      combination,
      prize: finalPrize,
      isWinning: prize > 0
    };
  }

  formatPrizeResult(result, userId) {
    return {
      island: 'B',
      type: 'slot_machine',
      combination: result.combination,
      prize: result.prize,
      isWinning: result.isWinning,
      message: result.isWinning 
        ? `Jackpot! ${userId} mendapatkan ${formatRupiah(result.prize)}!`
        : `${userId} mendapatkan hadiah hiburan ${formatRupiah(result.prize)}`
    };
  }
}

export class WheelOfFortuneReward {
  constructor() {
    this.segments = ISLAND_PRIZES.C.segments;
    this.totalSegments = this.segments.length;
  }

  spin() {
    const randomIndex = getRandomInt(0, this.totalSegments - 1);
    const selectedSegment = this.segments[randomIndex];
    const rotation = (360 / this.totalSegments) * randomIndex + getRandomInt(0, 360 / this.totalSegments);
    
    return {
      segment: selectedSegment,
      rotation: rotation,
      index: randomIndex
    };
  }

  generatePrize() {
    return this.spin();
  }

  formatPrizeResult(result, userId) {
    return {
      island: 'C',
      type: 'wheel_of_fortune',
      segment: result.segment,
      rotation: result.rotation,
      prize: result.segment.value,
      message: result.segment.label === 'JACKPOT!' 
        ? `JACKPOT! ${userId} memenangkan ${formatRupiah(result.segment.value)}!`
        : `${userId} mendapatkan ${result.segment.label}!`
    };
  }

  getSegments() {
    return this.segments;
  }
}

export class TreasureChestReward {
  constructor() {
    this.chestLevels = ISLAND_PRIZES.D.chestLevels;
    this.keys = ISLAND_PRIZES.D.keys;
    this.collectedKeys = 0;
    this.maxKeys = 3;
  }

  reset() {
    this.collectedKeys = 0;
  }

  collectKey() {
    if (this.collectedKeys < this.maxKeys) {
      this.collectedKeys++;
      return true;
    }
    return false;
  }

  canOpenChest() {
    return this.collectedKeys >= 1;
  }

  generatePrize() {
    const level = Math.min(this.collectedKeys, 3);
    const chestLevel = this.chestLevels[level - 1];
    const prizeRange = chestLevel.prize;
    const prize = getRandomInt(prizeRange[0], prizeRange[1]);
    
    return {
      level: level,
      keysUsed: this.collectedKeys,
      prize: prize,
      chestLevel: chestLevel
    };
  }

  formatPrizeResult(result, userId) {
    return {
      island: 'D',
      type: 'treasure_chest',
      level: result.level,
      keysUsed: result.keysUsed,
      prize: result.prize,
      message: `${userId} membuka peti level ${result.level} dengan ${result.keysUsed} kunci dan mendapatkan ${formatRupiah(result.prize)}!`
    };
  }

  getKeyProgress() {
    return {
      collected: this.collectedKeys,
      total: this.maxKeys,
      percentage: (this.collectedKeys / this.maxKeys) * 100
    };
  }
}

export class RewardManager {
  constructor() {
    this.systems = {
      A: new MysteryBoxReward(),
      B: new SlotMachineReward(),
      C: new WheelOfFortuneReward(),
      D: new TreasureChestReward()
    };
  }

  getRewardSystem(island) {
    return this.systems[island];
  }

  generatePrize(island, userId) {
    const system = this.getRewardSystem(island);
    if (!system) {
      throw new Error(`Invalid island: ${island}`);
    }

    const result = system.generatePrize();
    return system.formatPrizeResult(result, userId);
  }

  getIslandInfo(island) {
    return ISLAND_PRIZES[island];
  }

  getAllIslands() {
    return Object.keys(ISLAND_PRIZES);
  }
}

const rewardManager = new RewardManager();

export default rewardManager;
