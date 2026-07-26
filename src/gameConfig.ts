/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Skill, DebtorClass, Monster, Weather, Teammate, Buff, Equipment, Quest } from './types';

export const PROLOGUE_CLASSES: Record<string, {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  weapon: string;
  armor: string;
  skills: { id: string; name: string; desc: string; mult?: number; extra: string }[];
}> = {
  warrior: {
    id: "warrior", name: "戰士", hp: 150, atk: 20, def: 15,
    weapon: "傳說巨劍", armor: "龍鱗重鎧",
    skills: [
      { id: "war_slam",   name: "戰爭踐踏", desc: "2.5倍傷害，暈眩1回合", mult: 2.5, extra: "stun" },
      { id: "shield_wall", name: "盾牆", desc: "防禦+50%，持續1回合", extra: "def_up" },
      { id: "fury_swing", name: "狂怒揮砍", desc: "3倍傷害，自身扣血10%", mult: 3.0, extra: "self_damage" }
    ]
  },
  mage: {
    id: "mage", name: "法師", hp: 80, atk: 35, def: 5,
    weapon: "奧術法杖", armor: "魔力長袍",
    skills: [
      { id: "firestorm",  name: "炎爆術", desc: "3.5倍傷害，附帶燃燒", mult: 3.5, extra: "burn" },
      { id: "ice_comet",  name: "冰霜彗星", desc: "2倍傷害，冰凍2回合", mult: 2.0, extra: "freeze" },
      { id: "arcane_blast", name: "奧術衝擊", desc: "全體2倍傷害", mult: 2.0, extra: "aoe" }
    ]
  },
  assassin: {
    id: "assassin", name: "刺客", hp: 100, atk: 25, def: 10,
    weapon: "暗影匕首", armor: "皮甲",
    skills: [
      { id: "assassinate", name: "暗殺", desc: "5倍傷害，低機率即死", mult: 5.0, extra: "instant_kill" },
      { id: "venom_strike", name: "毒刃", desc: "1.8倍傷害，中毒3回合", mult: 1.8, extra: "poison" },
      { id: "shadow_step", name: "暗影步", desc: "閃避下一次攻擊", extra: "dodge" }
    ]
  }
};

export const CLASS_SKILLS: Record<string, Skill[]> = {
  warrior: [
    { id: "heavy_blow", name: "重擊", desc: "2.0 倍傷害", cost: 30, type: "attack", mult: 2.0 },
    { id: "shield_bash", name: "護盾猛擊", desc: "1.5 倍 + 護盾", cost: 40, type: "attack_shield", mult: 1.5 },
    { id: "war_cry", name: "戰吼", desc: "全隊攻擊 +20%（3回合）", cost: 25, type: "buff", mult: 1.2 }
  ],
  mage: [
    { id: "fireball", name: "火球術", desc: "2.5 倍傷害", cost: 45, type: "attack", mult: 2.5 },
    { id: "freeze", name: "冰凍術", desc: "1.5 倍 + 冰凍", cost: 35, type: "attack_freeze", mult: 1.5 },
    { id: "lightning", name: "雷電風暴", desc: "全體 2.0 倍", cost: 60, type: "attack_aoe", mult: 2.0 }
  ],
  assassin: [
    { id: "assassinate", name: "暗殺", desc: "3.0 倍（機率秒殺）", cost: 50, type: "attack_assassinate", mult: 3.0 },
    { id: "poison_blade", name: "毒刃", desc: "1.5 倍 + 中毒", cost: 30, type: "attack_poison", mult: 1.5 },
    { id: "dodge_skill", name: "閃避", desc: "本回合完全閃避", cost: 20, type: "dodge", mult: 0 }
  ]
};

export const DEBTOR_CLASSES: Record<string, DebtorClass> = {
  standard: { id: "standard", name: "債務勇者", title: "標準型", hp: 100, gold: 50, coins: 0, debt: 0, credit: 1000, equip: 2, rage: 40, atkBonus: 0, unlocked: true },
  clerk: { id: "clerk", name: "破產行員", title: "精算型", hp: 82, gold: 50, coins: 0, debt: 0, credit: 1000, equip: 1, rage: 25, atkBonus: -1, unlocked: false },
  dancer: { id: "dancer", name: "羞恥舞者", title: "控制型", hp: 92, gold: 50, coins: 0, debt: 0, credit: 1000, equip: 1, rage: 65, atkBonus: 0, unlocked: false },
  miner: { id: "miner", name: "地下礦工", title: "資源型", hp: 115, gold: 50, coins: 0, debt: 0, credit: 1000, equip: 0, rage: 30, atkBonus: -2, unlocked: false }
};

export const MONSTERS: Monster[] = [
  { name: "貪婪史萊姆", desc: "軟爛、好欺負", hp: 15, maxHp: 15, atk: 3, reward: 25 },
  { name: "催繳蝙蝠", desc: "吵死了，一巴掌拍死", hp: 12, maxHp: 12, atk: 4, reward: 20 },
  { name: "破產野豬", desc: "比你還窮，所以特別憤怒", hp: 18, maxHp: 18, atk: 4, reward: 30 },
  { name: "信用不良狼", desc: "銀行不借錢給他", hp: 14, maxHp: 14, atk: 3, reward: 28 },
  { name: "違約獵犬", desc: "被銀行追殺的可憐蟲", hp: 16, maxHp: 16, atk: 4, reward: 25 },
  { name: "高利貸幽靈", desc: "死後還在算利息", hp: 20, maxHp: 20, atk: 5, reward: 35 },
  { name: "抵押品巨人", desc: "扛著房貸走得很慢", hp: 25, maxHp: 25, atk: 6, reward: 45 },
  { name: "透支法師", desc: "連火球術都付不起錢", hp: 22, maxHp: 22, atk: 6, reward: 40 },
  { name: "債務騎士", desc: "盔甲是租的，劍是借的", hp: 28, maxHp: 28, atk: 7, reward: 50 },
  { name: "違約國王", desc: "管不住錢包的前統治者", hp: 32, maxHp: 32, atk: 8, reward: 60 }
];

export const WEATHERS: Weather[] = [
  { name: "一般陰天", desc: "天空像沒繳費的螢幕。", cost: 1, reward: 1, interest: 1 },
  { name: "高利晴空", desc: "$ 符號像太陽一樣刺眼。", cost: 1.2, reward: 1, interest: 1.6 },
  { name: "催繳暴雨", desc: "帳單像雨一樣落下。", cost: 1, reward: 1, interest: 1.2 },
  { name: "清算迷霧", desc: "白霧吞掉道路。", cost: 1, reward: 1, interest: 1 },
  { name: "極度寒流", desc: "硬幣凍住了。", cost: 1.4, reward: 1, interest: 1 },
  { name: "債務風暴", desc: "紫色閃電劈開天空。", cost: 1.3, reward: 1.5, interest: 1.4 }
];

export const CONTRACTS: Record<string, { id: string; name: string; desc: string; apply: string }> = {
  blood: { id: "blood", name: "血債血償", desc: "攻擊吸血 12%", apply: "你的血也是抵押品。" },
  shield: { id: "shield", name: "破產防禦", desc: "受傷 -25%", apply: "我們保護債權。" },
  overdraft: { id: "overdraft", name: "惡意透支", desc: "傷害 +20%，受傷加債", apply: "這才是自由。" }
};

export const TEAMMATES: Teammate[] = [
  { id: "accountant", name: "會計師", prefix: "逃稅的", nickname: "精算師", desc: "透支 -15%", cost: 220, type: "搞笑", unlocked: true, atkMin: 3, atkMax: 6 },
  { id: "bard", name: "吟遊詩人", prefix: "催繳的", nickname: "帳單歌者", desc: "開場 +12 怒氣", cost: 260, type: "搞笑", unlocked: true, atkMin: 2, atkMax: 5 },
  { id: "guard", name: "盾衛", prefix: "失業的", nickname: "擋箭牌", desc: "受傷 -10%", cost: 300, type: "搞笑", unlocked: true, atkMin: 3, atkMax: 7 },
  { id: "miner", name: "礦工", prefix: "兼職的", nickname: "挖礦機", desc: "獎勵 +12%", cost: 280, type: "搞笑", unlocked: true, atkMin: 4, atkMax: 8 },
  { id: "intern", name: "實習法師", prefix: "無薪的", nickname: "學徒", desc: "攻擊 +3", cost: 180, type: "搞笑", unlocked: true, atkMin: 2, atkMax: 4 },
  { id: "warrior", name: "戰士", prefix: "落魄的", nickname: "鐵壁", desc: "攻擊 10~18，嘲諷", cost: 550, type: "勇者小隊", unlocked: false, atkMin: 10, atkMax: 18, defChance: 40 },
  { id: "mage", name: "法師", prefix: "破產的", nickname: "餘燼", desc: "攻擊 14~24，範圍傷害", cost: 600, type: "勇者小隊", unlocked: false, atkMin: 14, atkMax: 24, defChance: 20 },
  { id: "assassin", name: "刺客", prefix: "負債的", nickname: "殘影", desc: "攻擊 12~20，暴擊", cost: 580, type: "勇者小隊", unlocked: false, atkMin: 12, atkMax: 20, defChance: 10 },
  { id: "priest", name: "暴躁牧師", prefix: "聖光的", nickname: "數鈔員", desc: "攻擊 11~19，聖光治癒與護盾", cost: 500, type: "勇者小隊", unlocked: false, atkMin: 11, atkMax: 19, defChance: 30 }
];

export const BUFFS: Buff[] = [
  { id: "sharp", name: "鋒利", desc: "攻擊力 +10%", effect: "atk", value: 10 },
  { id: "sturdy", name: "堅固", desc: "防禦力 +10%", effect: "def", value: 10 },
  { id: "lucky", name: "幸運", desc: "金幣掉落 +20%", effect: "gold", value: 20 },
  { id: "rage", name: "狂暴", desc: "怒氣獲取 +20%", effect: "rage", value: 20 },
  { id: "vampire", name: "吸血", desc: "攻擊吸血 +5%", effect: "lifesteal", value: 5 },
  { id: "tough", name: "強韌", desc: "最大 HP +15%", effect: "hp", value: 15 }
];

export const EQUIPMENT: {
  weapons: Equipment[];
  armors: Equipment[];
  accessories: Equipment[];
} = {
  weapons: [
    { id: "broken_sword", name: "斷劍", atk: 1, type: "武器", rarity: "破爛", color: "#888888", baseCost: 0 },
    { id: "iron_sword", name: "鐵劍", atk: 5, type: "武器", rarity: "普通", color: "#ffffff", baseCost: 200 },
    { id: "steel_greatsword", name: "鋼鐵大劍", atk: 10, type: "武器", rarity: "精良", color: "#4488ff", baseCost: 450 },
    { id: "obsidian_blade", name: "黑曜石刃", atk: 18, type: "武器", rarity: "稀有", color: "#aa44ff", baseCost: 0 },
    { id: "legendary_sword", name: "傳說聖劍", atk: 30, type: "武器", rarity: "傳說", color: "#ffd700", baseCost: 0 },
    { id: "golden_knife", name: "黃金菜刀", atk: 8, type: "武器", rarity: "精良", color: "#4488ff", baseCost: 0 },
    { id: "shadow_dagger", name: "暗影匕首", atk: 12, type: "武器", rarity: "稀有", color: "#aa44ff", baseCost: 0 },
    { id: "crystal_staff", name: "水晶法杖", atk: 14, type: "武器", rarity: "稀有", color: "#aa44ff", baseCost: 0 },
    { id: "dragon_axe", name: "屠龍巨斧", atk: 22, type: "武器", rarity: "稀有", color: "#aa44ff", baseCost: 0 },
    { id: "sinner_hammer", name: "罪人之錘", atk: 25, type: "武器", rarity: "傳說", color: "#ffd700", baseCost: 0 }
  ],
  armors: [
    { id: "cloth_armor", name: "布衣", def: 1, type: "鎧甲", rarity: "破爛", color: "#888888", baseCost: 0 },
    { id: "leather_armor", name: "皮革甲", def: 4, type: "鎧甲", rarity: "普通", color: "#ffffff", baseCost: 300 },
    { id: "steel_armor", name: "鋼鐵鎧甲", def: 8, type: "鎧甲", rarity: "精良", color: "#4488ff", baseCost: 500 },
    { id: "dragon_armor", name: "龍鱗重鎧", def: 15, type: "鎧甲", rarity: "傳說", color: "#ffd700", baseCost: 0 },
    { id: "shadow_cloak", name: "暗影斗篷", def: 6, type: "鎧甲", rarity: "精良", color: "#4488ff", baseCost: 0 },
    { id: "thorn_armor", name: "荊棘甲", def: 10, type: "鎧甲", rarity: "稀有", color: "#aa44ff", baseCost: 0 }
  ],
  accessories: [
    { id: "lucky_charm", name: "幸運護符", type: "飾品", rarity: "精良", color: "#4488ff", baseCost: 400 },
    { id: "rage_ring", name: "狂怒戒指", type: "飾品", rarity: "精良", color: "#4488ff", baseCost: 450 },
    { id: "vampire_pendant", name: "吸血吊墜", type: "飾品", rarity: "稀有", color: "#aa44ff", baseCost: 0 },
    { id: "tough_amulet", name: "堅韌護符", type: "飾品", rarity: "精良", color: "#4488ff", baseCost: 0 },
    { id: "shadow_stone", name: "暗影之石", type: "飾品", rarity: "稀有", color: "#aa44ff", baseCost: 0 },
    { id: "reflect_mirror", name: "反射鏡", type: "飾品", rarity: "稀有", color: "#aa44ff", baseCost: 0 },
    { id: "rebirth_badge", name: "重生徽章", type: "飾品", rarity: "傳說", color: "#ffd700", baseCost: 0 },
    { id: "cursed_eye", name: "詛咒之眼", type: "飾品", rarity: "稀有", color: "#aa44ff", baseCost: 0 }
  ]
};

export const MAIN_QUESTS: Record<string, Quest> = {
  M1: { id: "M1", name: "債務證明", desc: "擊敗 5 隻怪物", need: 5, reward: { credit: 200, gold: 50 }, unlock: null },
  M2: { id: "M2", name: "銀行的邀請", desc: "償還至少 $100 負債", need: 100, reward: { unlock: "deposit" }, unlock: "M1" },
  M3: { id: "M3", name: "教堂的祝福", desc: "在教堂祈禱 3 次", need: 3, reward: { unlock: "identify" }, unlock: "M2" },
  M4: { id: "M4", name: "魔王的線索", desc: "擊敗『信用不良騎士』", need: 1, reward: { unlock: "week2" }, unlock: "M3" },
  M5: { id: "M5", name: "最終清算", desc: "負債歸零", need: 1, reward: { ending: true }, unlock: "M4" }
};

export const DEFAULT_GAME_CONFIG = {
  careers: [
    {
      name: "負債勇者",
      desc: "起步背負鉅額高利貸，必須依靠開源與冒險才能翻身。",
      startCash: 100,
      startDebt: 50000,
      creditScore: 350,
      baseIncome: 50,
      baseExpenses: 30
    }
  ],
  events: [],
  actions: []
};

