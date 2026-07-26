/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Sparkles, AlertCircle, Heart, Trophy, RefreshCw, 
  Coins, Map as MapIcon, HelpCircle, Save, Trash2, Shield, Flame, Snowflake, 
  Wind, Droplets, Swords, UserCheck, Skull, Compass, Home, Coffee, Landmark, Settings, Lock
} from 'lucide-react';
import { GameState, Skill, DebtorClass, Monster, Weather, Teammate, Buff, Equipment, SaveData, ROOM_TYPES, RoomTypeInfo, SideQuest, WantedQuest } from '../types';
import { 
  PROLOGUE_CLASSES, CLASS_SKILLS, DEBTOR_CLASSES, MONSTERS, 
  WEATHERS, CONTRACTS, TEAMMATES, BUFFS, EQUIPMENT, MAIN_QUESTS 
} from '../gameConfig';

const BEGGAR_LOCATIONS = [
  "公告欄的街道旁",
  "公園的長椅",
  "噴水池旁的草叢",
  "前往帝國皇宮必經之路",
  "平民區與村莊市集的交換點",
  "教堂窗戶旁邊",
  "冒險者公會的戶外牆角",
  "銀行門外的欄杆",
  "鐵匠舖的招牌下",
  "道具店外樓梯旁",
  "酒館門口",
  "旅館對面的路燈下"
];

const DIRECTION_TERRAINS: Record<string, { name: string; monsters: { name: string; desc: string; reward: number; drops: string[] }[] }> = {
  east: {
    name: "東出口 - 落石岩地",
    monsters: [
      { name: "貪婪史萊姆", desc: "常吞下路過旅人的硬幣與財物", reward: 50, drops: ["低級生命藥水", "鐵劍"] },
      { name: "催繳蝙蝠", desc: "尖叫發出高頻催繳雜音，極其煩人", reward: 60, drops: ["幸運護符", "布衣"] },
      { name: "破產野豬", desc: "橫衝直撞破壞農地與路標", reward: 80, drops: ["皮革甲", "狂怒戒指"] }
    ]
  },
  south: {
    name: "南出口 - 狂風平原",
    monsters: [
      { name: "信用不良狼", desc: "成群結隊襲擊商隊", reward: 90, drops: ["鋼鐵大劍", "皮革甲"] },
      { name: "違約獵犬", desc: "撕咬任何試圖逃債的冒險者", reward: 100, drops: ["中級生命藥水", "鋼鐵鎧甲"] },
      { name: "高利貸幽靈", desc: "夜間出沒索求無度利息", reward: 130, drops: ["黑曜石刃", "暗影斗篷"] }
    ]
  },
  west: {
    name: "西出口 - 幽暗森林",
    monsters: [
      { name: "抵押品巨人", desc: "盤踞森林要道，強索過路費", reward: 150, drops: ["荊棘甲", "黃金菜刀"] },
      { name: "透支法師", desc: "濫用黑魔法製造混亂", reward: 180, drops: ["水晶法杖", "吸血吊墜"] },
      { name: "債務騎士", desc: "背負巨債的墮落騎士", reward: 220, drops: ["屠龍巨斧", "龍鱗重鎧"] }
    ]
  },
  north: {
    name: "北出口 - 寒冷山脈",
    monsters: [
      { name: "違約國王", desc: "前王國昏君，招募亡靈守護國庫", reward: 280, drops: ["傳說聖劍", "堅韌護符"] },
      { name: "信用不良騎士", desc: "冰封山脈的狂暴巡邏者", reward: 240, drops: ["罪人之錘", "龍鱗重鎧"] },
      { name: "高利貸魔王", desc: "山頂冰窟內的債務化身", reward: 320, drops: ["傳說聖劍", "龍鱗重鎧"] }
    ]
  }
};

export interface BeggarDialogueOption {
  category: "💧 悲情裝可憐" | "🌀 胡言亂語瘋癲" | "🎭 碰瓷與耍賴" | "🔥 發飆恐嚇";
  text: string;
  minCoin: number;
  maxCoin: number;
  guardRisk: number;
}

export const BEGGAR_DIALOGUE_POOL: BeggarDialogueOption[] = [
  // 2-1 💧 【悲情裝可憐系列】
  { category: "💧 悲情裝可憐", text: "行行好啊！勇者大人……不對，我以前也是勇者，只是利息太高才變成這樣的……", minCoin: 3, maxCoin: 15, guardRisk: 0.03 },
  { category: "💧 悲情裝可憐", text: "三天沒吃麵包了，各位大發慈悲，給個銅板讓小的買塊乾糧吧！", minCoin: 2, maxCoin: 12, guardRisk: 0.03 },
  { category: "💧 悲情裝可憐", text: "想當年我也是拔出過聖劍的人啊！結果聖劍被當鋪收走了……嗚嗚……", minCoin: 4, maxCoin: 18, guardRisk: 0.03 },
  { category: "💧 悲情裝可憐", text: "求求路過的大哥大姐，順手捐助負債重組基金，感激不盡！", minCoin: 5, maxCoin: 20, guardRisk: 0.04 },
  { category: "💧 悲情裝可憐", text: "冷啊！餓啊！這世界的通膨比魔王還可怕啊！", minCoin: 3, maxCoin: 16, guardRisk: 0.03 },

  // 2-2 🌀 【胡言亂語與瘋癲系列】
  { category: "🌀 胡言亂語瘋癲", text: "天機不可洩漏！我看你印堂發黑，但只要給我 5 塊錢，我告訴你哪裡有寶箱！", minCoin: 1, maxCoin: 35, guardRisk: 0.06 },
  { category: "🌀 胡言亂語瘋癲", text: "聽見了嗎？那是債主在唱歌的聲音……他們來了！他們拿著帳單來了！", minCoin: 2, maxCoin: 28, guardRisk: 0.05 },
  { category: "🌀 胡言亂語瘋癲", text: "不要問我我是誰，我只是這條街上無處安放的靈魂……順便借個火跟兩個銅板。", minCoin: 1, maxCoin: 25, guardRisk: 0.05 },
  { category: "🌀 胡言亂語瘋癲", text: "我剛才夢見魔王在找我借錢，這局勢連魔王都在喊窮啊！", minCoin: 3, maxCoin: 30, guardRisk: 0.06 },
  { category: "🌀 胡言亂語瘋癲", text: "巴比倫的風吹過我的破斗篷，吹亂了我的負債清單……", minCoin: 2, maxCoin: 32, guardRisk: 0.05 },

  // 2-3 🎭 【碰瓷與耍賴系列】
  { category: "🎭 碰瓷與耍賴", text: "哎呀！你走路沒長眼啊！踩到我尊貴的破木碗了！不賠個十塊錢這事沒完！", minCoin: 10, maxCoin: 50, guardRisk: 0.12 },
  { category: "🎭 碰瓷與耍賴", text: "別走！我看你這身裝備價值不菲，分我一點花花，不然我就賴在你腳邊不走了！", minCoin: 8, maxCoin: 45, guardRisk: 0.11 },
  { category: "🎭 碰瓷與耍賴", text: "好心的大爺，您掉了一塊金幣……啊，其實是我掉的，但現在是您的了，所以請施捨給我吧！", minCoin: 6, maxCoin: 40, guardRisk: 0.09 },
  { category: "🎭 碰瓷與耍賴", text: "我這根木棍可是上古神器「打狗棒」（雖然看起來像撿來的），買斷只要九塊九！", minCoin: 9, maxCoin: 38, guardRisk: 0.08 },
  { category: "🎭 碰瓷與耍賴", text: "別看我現在是個乞丐，等我手上的木棍熔煉到九九八十級，我就是這座城的主人！", minCoin: 12, maxCoin: 60, guardRisk: 0.12 },

  // 2-4 🔥 【發飆恐嚇（反向乞討）系列】
  { category: "🔥 發飆恐嚇", text: "看屁啊！沒看過帥氣的乞丐嗎？給錢！不然我用木棍戳你鞋子！", minCoin: 10, maxCoin: 45, guardRisk: 0.10 },
  { category: "🔥 發飆恐嚇", text: "今天不給我錢，我就在這裡唱一整晚的催債悲歌，誰也別想睡！", minCoin: 12, maxCoin: 50, guardRisk: 0.11 },
  { category: "🔥 發飆恐嚇", text: "信不信我把這根破木棍揮給你看？很痛的（指心靈傷害）！", minCoin: 8, maxCoin: 40, guardRisk: 0.09 }
];

function generateWantedQuestsList(currentDay: number, existingQuests: WantedQuest[] = [], lastRefreshDay: number = 0): { quests: WantedQuest[]; refreshDay: number } {
  const needsRefresh = !existingQuests || existingQuests.length === 0 || lastRefreshDay === 0 || (currentDay - lastRefreshDay >= 3);
  if (!needsRefresh) {
    return { quests: existingQuests, refreshDay: lastRefreshDay };
  }

  const activeAccepted = (existingQuests || []).filter(q => q.isAccepted && !q.isSubmitted);
  const totalTargetCount = Math.floor(Math.random() * 10) + 3; // 3 ~ 12
  const newSlotsNeeded = Math.max(1, totalTargetCount - activeAccepted.length);

  const dirKeys = ["east", "south", "west", "north"];
  const newQuests: WantedQuest[] = [];

  for (let i = 0; i < newSlotsNeeded; i++) {
    const dirKey = dirKeys[Math.floor(Math.random() * dirKeys.length)];
    const terrain = DIRECTION_TERRAINS[dirKey];
    const m = terrain.monsters[Math.floor(Math.random() * terrain.monsters.length)];

    newQuests.push({
      id: "wanted_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 6),
      targetName: m.name,
      targetTitle: `【通緝犯】${m.name}`,
      terrainKey: dirKey,
      terrainName: terrain.name,
      desc: m.desc,
      needKills: 1,
      currentKills: 0,
      rewardCoins: m.reward + Math.floor(Math.random() * 25),
      deposit: 3,
      potentialDrops: m.drops,
      isAccepted: false,
      isCompleted: false,
      isSubmitted: false
    });
  }

  return {
    quests: [...activeAccepted, ...newQuests],
    refreshDay: currentDay
  };
}

function getMainQuestLocation(questId: string | null): string {
  if (!questId) return "已無主線任務";
  switch (questId) {
    case "M1": return "東出口 - 落石岩地（擊敗任意魔物即可累積進度）";
    case "M2": return "村莊 - 信用銀行（償還第一筆債務即可）";
    case "M3": return "南出口 - 狂風平原 / 西出口 - 幽暗森林";
    case "M4": return "南出口 - 狂風平原（尋找並擊敗信用不良騎士）";
    case "M5": return "北出口 - 寒冷山脈（決戰債務魔王）";
    default: return "各主要探索區域";
  }
}

function getSideQuestLocation(sideQuest: SideQuest | null): string {
  if (!sideQuest) return "無";
  if (sideQuest.target.includes("史萊姆") || sideQuest.target.includes("野豬")) return "東出口 - 落石岩地";
  if (sideQuest.target.includes("狼") || sideQuest.target.includes("獵犬") || sideQuest.target.includes("幽靈")) return "南出口 - 狂風平原";
  if (sideQuest.target.includes("巨人") || sideQuest.target.includes("法師") || sideQuest.target.includes("騎士")) return "西出口 - 幽暗森林";
  if (sideQuest.target.includes("國王") || sideQuest.target.includes("魔王")) return "北出口 - 寒冷山脈";
  return "各野外出口地區";
}

export interface MasterSkill {
  id: string;
  name: string;
  category: "warrior" | "mage" | "assassin" | "priest";
  type: "active" | "passive";
  cost: number;
  debtCost?: number;
  multiplier?: number;
  desc: string;
  icon: string;
  requiredAdv?: string;
  reqLevel?: number;
  unimplemented?: boolean;
}

export const MASTER_SKILLS: MasterSkill[] = [
  // 戰士 (Warrior)
  { id: "heavy_strike", name: "重擊", category: "warrior", type: "active", cost: 200, debtCost: 8, multiplier: 1.8, desc: "【主動】預支 $8 | 造成 1.8 倍物理打擊，30% 機率使魔物暈眩。", icon: "💥" },
  { id: "hold_ground", name: "堅守陣地", category: "warrior", type: "passive", cost: 250, desc: "【被動】當 HP < 30% 時，防禦力提升 50%，受傷減半。", icon: "🛡️" },
  { id: "berserk_roar", name: "狂戰怒吼", category: "warrior", type: "active", cost: 300, debtCost: 8, multiplier: 1.3, desc: "【主動】預支 $8 | 嘲諷魔物，使自身攻擊力提升 30%（持續 2 回合）。", icon: "🦁" },
  { id: "slash", name: "斬擊", category: "warrior", type: "active", cost: 250, debtCost: 8, multiplier: 1.5, desc: "【主動】預支 $8 | 揮舞利刃快速劈砍，造成扎實物理打擊。", icon: "🗡️" },

  // 法師 (Mage)
  { id: "fireball", name: "火焰彈", category: "mage", type: "active", cost: 200, debtCost: 10, multiplier: 1.6, desc: "【主動】預支 $10 | 造成 1.6 倍火元素傷害，附加持續灼燒。", icon: "🔥" },
  { id: "mana_surge", name: "魔力回湧", category: "mage", type: "passive", cost: 250, desc: "【被動】每當擊殺魔物或戰鬥勝利時，自動恢復 15 點 HP。", icon: "🌊" },
  { id: "frost_nova", name: "冰霜新星", category: "mage", type: "active", cost: 300, debtCost: 12, multiplier: 1.5, desc: "【主動】預支 $12 | 凍結魔物 1 回合，降低其行動攻速。", icon: "❄️" },
  { id: "earth_spike", name: "地裂芒刺", category: "mage", type: "active", cost: 280, debtCost: 10, multiplier: 1.8, desc: "【主動】預支 $10 | 地底召喚岩石尖錐突襲，造成地屬性魔法傷害。", icon: "🪨" },
  { id: "wind_blade", name: "風刃", category: "mage", type: "active", cost: 220, debtCost: 8, multiplier: 1.6, desc: "【主動】預支 $8 | 凝聚高壓氣流，造成銳利的風元素切割傷害。", icon: "🌪️" },

  // 刺客 (Assassin)
  { id: "combo_strike", name: "致命連擊", category: "assassin", type: "active", cost: 200, debtCost: 10, multiplier: 1.5, desc: "【主動】預支 $10 | 快速發動 2 次連續物理打擊（共 1.5 倍物傷）。", icon: "⚔️" },
  { id: "shadow_step", name: "影之步", category: "assassin", type: "passive", cost: 250, desc: "【被動】戰鬥中常駐獲得 15% 額外閃避率。", icon: "💨" },
  { id: "loot_master", name: "搜刮強化", category: "assassin", type: "passive", cost: 300, desc: "【被動】戰鬥結束後獲得的金幣量提升 25%。", icon: "💰" },
  { id: "shadow_kill", name: "殘影瞬殺", category: "assassin", type: "active", cost: 350, debtCost: 14, multiplier: 2.2, desc: "【主動】預支 $14 | 穿梭至敵方盲區給予致命一擊，並附加流血效果。", icon: "👤" },

  // 牧師 / 聖職 (Priest)
  { id: "heal_light", name: "治癒術", category: "priest", type: "active", cost: 200, debtCost: 8, multiplier: 1.0, desc: "【主動】預支 $8 | 聖水滋潤，為自身恢復 45 點生命值。", icon: "✨" },
  { id: "mass_blessing", name: "群體祈福", category: "priest", type: "active", cost: 250, debtCost: 12, multiplier: 1.0, desc: "【主動】預支 $12 | 清除自身負面狀態，並獲得防禦加成。", icon: "🕊️" },
  { id: "holy_sanctuary", name: "聖光庇護", category: "priest", type: "passive", cost: 300, desc: "【被動】HP < 25% 時，自動套上一層可吸收 40 點傷害的護盾。", icon: "⛪" },
  { id: "holy_spear", name: "光矛聖罰", category: "priest", type: "active", cost: 350, debtCost: 14, multiplier: 2.0, desc: "【主動】預支 $14 | 凝聚聖光審判之矛，造成高額神聖傷害。", icon: "🔱" },
  { id: "holy_sword", name: "神聖之劍", category: "priest", type: "active", cost: 450, debtCost: 18, multiplier: 2.5, desc: "【主動】預支 $18 | 召喚巨大神聖光劍降臨，造成群體神聖傷害。", icon: "🗡️✨" },

  // === 進階：狂戰士 (Berserker) ===
  { id: "berserk_blood_strike", name: "狂暴血擊", category: "warrior", type: "active", cost: 500, debtCost: 15, multiplier: 3.0, requiredAdv: "berserker", reqLevel: 20, desc: "【主動】預支 $15 | 以自身血量為代價，造成毀滅性的近戰物理傷害。", icon: "🩸" },
  { id: "bloodlust_rage", name: "嗜血狂怒", category: "warrior", type: "passive", cost: 600, requiredAdv: "berserker", reqLevel: 20, desc: "【被動】每次擊殺敵人後，短時間內大幅提升攻擊速度。", icon: "😡" },
  { id: "devastating_strike", name: "毀滅重擊", category: "warrior", type: "active", cost: 750, debtCost: 20, multiplier: 2.8, requiredAdv: "berserker", reqLevel: 20, desc: "【主動】預支 $20 | 重擊地面砸裂大地，對全體敵人造成大量傷害。", icon: "🌋" },

  // === 進階：聖騎士 (Paladin) ===
  { id: "holy_judgment", name: "神聖審判", category: "warrior", type: "active", cost: 500, debtCost: 16, multiplier: 2.2, requiredAdv: "paladin", reqLevel: 20, desc: "【主動】預支 $16 | 召喚聖光審判罪惡，造成傷害並恢復部分血量。", icon: "⚖️" },
  { id: "consecrated_barrier", name: "奉獻壁壘", category: "warrior", type: "passive", cost: 600, requiredAdv: "paladin", reqLevel: 20, desc: "【被動】展開神聖光環，降低受到的全屬性傷害。", icon: "🛡️✨" },
  { id: "guardian_of_fate", name: "命運守護", category: "priest", type: "passive", cost: 750, requiredAdv: "paladin", reqLevel: 20, desc: "【被動】遭受致命傷害時免死一次並恢復 20% 生命（每場限一次）。", icon: "💫" },

  // === 進階：大魔導士 (Archmage) ===
  { id: "meteor_storm", name: "隕石風暴", category: "mage", type: "active", cost: 600, debtCost: 22, multiplier: 3.2, requiredAdv: "archmage", reqLevel: 20, desc: "【主動】預支 $22 | 呼喚天外隕石砸向戰場，造成毀滅性魔法傷害。", icon: "☄️" },
  { id: "time_lock", name: "時空禁錮", category: "mage", type: "active", cost: 700, debtCost: 25, multiplier: 1.5, requiredAdv: "archmage", reqLevel: 20, desc: "【主動】預支 $25 | 將目標封印在時空間隙中無法行動 2 回合。", icon: "⏳" },
  { id: "elemental_overload", name: "元素超載", category: "mage", type: "passive", cost: 850, requiredAdv: "archmage", reqLevel: 20, desc: "【被動】施放法術時有機會觸發雙重詠唱。", icon: "⚡🔥" },

  // === 進階：幻術師 (Illusionist) ===
  { id: "mirror_clone", name: "鏡像分身", category: "mage", type: "active", cost: 550, debtCost: 16, multiplier: 1.8, requiredAdv: "illusionist", reqLevel: 20, desc: "【主動】預支 $16 | 製造幻影分身，幫忙分擔敵人攻擊與干擾。", icon: "🪞", unimplemented: true },
  { id: "charm_mind", name: "魅惑心智", category: "mage", type: "active", cost: 650, debtCost: 18, multiplier: 1.0, requiredAdv: "illusionist", reqLevel: 20, desc: "【主動】預支 $18 | 干擾敵方心智，使其陷入混亂失控。", icon: "🌀", unimplemented: true },
  { id: "phantom_strike", name: "幻影突襲", category: "mage", type: "active", cost: 800, debtCost: 22, multiplier: 2.8, requiredAdv: "illusionist", reqLevel: 20, desc: "【主動】預支 $22 | 與分身同時瞬移至敵後方進行致命夾擊。", icon: "👥", unimplemented: true },

  // === 進階：暗影刺客 (Shadow Assassin) ===
  { id: "shadow_walk", name: "暗影步", category: "assassin", type: "active", cost: 550, debtCost: 15, multiplier: 1.5, requiredAdv: "shadow_assassin", reqLevel: 20, desc: "【主動】預支 $15 | 融入陰影之中，大幅提升下次攻擊的回避與爆擊。", icon: "🌑" },
  { id: "instant_hell_kill", name: "瞬獄殺", category: "assassin", type: "active", cost: 700, debtCost: 24, multiplier: 3.5, requiredAdv: "shadow_assassin", reqLevel: 20, desc: "【主動】預支 $24 | 極快速度閃至敵後發動 5 連擊致命瞬殺。", icon: "⚡🗡️" },
  { id: "poison_edge", name: "毒刃淬毒", category: "assassin", type: "passive", cost: 800, requiredAdv: "shadow_assassin", reqLevel: 20, desc: "【被動】攻擊附帶劇毒效果，使目標每回合持續流血。", icon: "🧪" }
];

export function getPlayerBaseCategory(state: Partial<GameState | SaveData>): "warrior" | "mage" | "assassin" | "priest" {
  const prologue = (state.prologueClass || "").toLowerCase();
  if (prologue === "mage") return "mage";
  if (prologue === "assassin") return "assassin";
  if (prologue === "priest") return "priest";
  if (prologue === "warrior") return "warrior";

  const cls = (state.debtorClass || "").toLowerCase();
  const name = state.debtorClassName || "";

  if (cls.includes("mage") || cls.includes("clerk") || name.includes("法師") || name.includes("行員")) {
    return "mage";
  }
  if (cls.includes("assassin") || cls.includes("dancer") || name.includes("刺客") || name.includes("舞者")) {
    return "assassin";
  }
  if (cls.includes("priest") || name.includes("牧師") || name.includes("聖職")) {
    return "priest";
  }
  return "warrior";
}

export function getPlayerBaseClassName(state: Partial<GameState | SaveData>): string {
  const baseCat = getPlayerBaseCategory(state);
  switch (baseCat) {
    case "mage": return "法師";
    case "assassin": return "刺客";
    case "priest": return "聖職/牧師";
    case "warrior": default: return "戰士";
  }
}

export function getPlayerFullClassName(state: Partial<GameState | SaveData>): string {
  const baseName = getPlayerBaseClassName(state);
  if (state.advancedClass) {
    const advName = getAdvClassName(state.advancedClass);
    return `${baseName} (${advName})`;
  }
  if (state.debtorClassName && state.debtorClassName !== "冒險者" && state.debtorClassName !== "破產勇者" && state.debtorClassName !== "債務勇者") {
    return `${baseName} (${state.debtorClassName})`;
  }
  return baseName;
}

export function isAdvClassCompatibleWithBase(baseCat: string, advId: string | null | undefined): boolean {
  if (!advId) return true;
  switch (baseCat) {
    case "warrior":
      return advId === "berserker" || advId === "paladin";
    case "mage":
      return advId === "archmage" || advId === "illusionist";
    case "assassin":
      return advId === "shadow_assassin";
    case "priest":
      return advId === "paladin";
    default:
      return false;
  }
}

export function getAllowableSkillCategories(state: Partial<GameState | SaveData>): string[] {
  const allowed = new Set<string>();
  const baseCat = getPlayerBaseCategory(state);
  allowed.add(baseCat);

  const adv = state.advancedClass;
  if (adv === "paladin" && isAdvClassCompatibleWithBase(baseCat, adv)) {
    allowed.add("warrior");
    allowed.add("priest");
  }

  return Array.from(allowed);
}

export function isSkillAllowedForPlayer(skillCategory: string, state: Partial<GameState>): boolean {
  const allowed = getAllowableSkillCategories(state);
  return allowed.includes(skillCategory);
}

export function getCategoryLabel(cat: string): string {
  switch (cat) {
    case "warrior": return "戰士系";
    case "mage": return "法師系";
    case "assassin": return "刺客系";
    case "priest": return "聖職/牧師系";
    default: return "通用";
  }
}

export function getAdvClassName(advId: string): string {
  switch (advId) {
    case "berserker": return "狂戰士";
    case "paladin": return "聖騎士";
    case "archmage": return "大魔導士";
    case "illusionist": return "幻術師";
    case "shadow_assassin": return "暗影刺客";
    default: return advId;
  }
}

export function checkSkillsAndApplyPunishment(data: Partial<SaveData | GameState>): {
  cleanedSkills: string[];
  correctedAdvClass: string | null;
  hasPunishment: boolean;
} {
  const baseCat = getPlayerBaseCategory(data);
  const currentAdvClass = data.advancedClass || null;

  const isAdvValid = isAdvClassCompatibleWithBase(baseCat, currentAdvClass);
  const correctedAdvClass = isAdvValid ? currentAdvClass : null;

  const tempState = { ...data, advancedClass: correctedAdvClass };
  const allowedCats = getAllowableSkillCategories(tempState);
  const currentSkills = data.learnedSkills || [];

  const illegalSkills = currentSkills.filter(skId => {
    const master = MASTER_SKILLS.find(m => m.id === skId);
    if (!master) return false;
    if (!allowedCats.includes(master.category)) return true;
    if (master.requiredAdv && correctedAdvClass !== master.requiredAdv) return true;
    return false;
  });

  const cleanedSkills = currentSkills.filter(skId => !illegalSkills.includes(skId));
  const hasPunishment = (illegalSkills.length > 0) || (!isAdvValid && currentAdvClass !== null);

  return {
    cleanedSkills,
    correctedAdvClass,
    hasPunishment
  };
}

interface GameBoardProps {
  onResetGame?: () => void;
  onSyncWithCloud?: (saveData: SaveData) => void;
}

interface CharacterOption {
  id: string;
  prefix: string;
  cls: string;
  name: string;
  baseHp: number;
  hp: number;
  gold: number;
  debt: number;
  savings: number;
  rage: number;
  atkBonus: number;
  credit: number;
  debtLimit: number;
  strength: number;
  agility: number;
  commerce: number;
  stamina: number;
  buff: {
    id: string;
    name: string;
    type: "代價型" | "贖罪型";
    desc: string;
    triggerDesc: string;
    penaltyDesc: string;
  };
}

const PREFIXES = [
  { name: "精算型", hpMod: -10, str: -2, agi: 0, com: 4, sta: 0, gold: 100, debt: 0, rage: 0, savings: 0, atk: 0, debtLimitMod: 0 },
  { name: "負債型", hpMod: 15, str: 0, agi: 0, com: -2, sta: 4, gold: 0, debt: 200, rage: 0, savings: 0, atk: 0, debtLimitMod: 0 },
  { name: "狂暴型", hpMod: -5, str: 5, agi: 1, com: 0, sta: 0, gold: 0, debt: 0, rage: 30, savings: 0, atk: 0, debtLimitMod: 0 },
  { name: "受詛咒的", hpMod: -20, str: 0, agi: 6, com: 0, sta: -3, gold: 0, debt: 0, rage: 0, savings: 0, atk: 3, debtLimitMod: 0 },
  { name: "冷靜的", hpMod: 0, str: 1, agi: 1, com: 0, sta: 2, gold: 0, debt: 0, rage: 0, savings: 0, atk: 0, debtLimitMod: 300 },
  { name: "破產型", hpMod: -5, str: 0, agi: 0, com: 3, sta: 1, gold: 0, debt: 0, rage: 0, savings: 50, atk: 0, debtLimitMod: 0 },
  { name: "恥辱型", hpMod: 0, str: 2, agi: 2, com: 0, sta: 0, gold: 0, debt: 0, rage: 20, savings: 0, atk: 0, debtLimitMod: 0 },
  { name: "覺醒型", hpMod: 5, str: 1, agi: 1, com: 1, sta: 1, gold: 0, debt: 0, rage: 0, savings: 0, atk: 0, debtLimitMod: 0 }
];

const CLASSES = [
  { name: "商人", hp: 95, str: 8, agi: 9, com: 14, sta: 9 },
  { name: "礦工", hp: 110, str: 13, agi: 7, com: 10, sta: 12 },
  { name: "戰士", hp: 100, str: 12, agi: 9, com: 8, sta: 11 },
  { name: "刺客", hp: 85, str: 10, agi: 13, com: 9, sta: 8 },
  { name: "法師", hp: 80, str: 7, agi: 11, com: 11, sta: 9 },
  { name: "行員", hp: 82, str: 9, agi: 10, com: 12, sta: 9 },
  { name: "舞者", hp: 92, str: 9, agi: 12, com: 9, sta: 10 },
  { name: "勇者", hp: 100, str: 10, agi: 10, com: 10, sta: 10 }
];

const BUFF_DATABASE = [
  {
    id: "vampire_debt",
    name: "吸血鬼的債務契約",
    type: "代價型" as const,
    desc: "攻擊時回復 20% 傷害為 HP | HP 上限 -15%；戰鬥後額外欠債 +3",
    triggerDesc: "攻擊時回復 20% 傷害為 HP",
    penaltyDesc: "HP 上限 -15%；戰鬥後額外欠債 +3"
  },
  {
    id: "loan_parasite",
    name: "高利貸寄生",
    type: "代價型" as const,
    desc: "戰鬥金塊獲取量 x2 | 每回合結算時，債務利息 +10%",
    triggerDesc: "戰鬥金塊獲取量 x2",
    penaltyDesc: "每回合結算時，債務利息 +10%"
  },
  {
    id: "desperate_rise",
    name: "絕望的奮起",
    type: "代價型" as const,
    desc: "生命低於 20% 時，攻擊力 x2 | 戰鬥失敗時，支付額外違約金",
    triggerDesc: "生命低於 20% 時，攻擊力 x2",
    penaltyDesc: "戰鬥失敗時，支付額外違約金"
  },
  {
    id: "demon_contract",
    name: "魔王的契約",
    type: "代價型" as const,
    desc: "獲得「魔王之劍」(高攻擊) | HP 上限 -30%；且無法以任何方式補血",
    triggerDesc: "獲得「魔王之劍」(高攻擊)",
    penaltyDesc: "HP 上限 -30%；且無法以任何方式補血"
  },
  {
    id: "worker_soul",
    name: "勞工之魂",
    type: "贖罪型" as const,
    desc: "戰鬥體力消耗 -50% | 戰鬥獲取的經驗值 -20%",
    triggerDesc: "戰鬥體力消耗 -50%",
    penaltyDesc: "戰鬥獲取的經驗值 -20%"
  },
  {
    id: "overdraft_user",
    name: "信用透支者",
    type: "贖罪型" as const,
    desc: "允許債務超過上限 20% | 債務超過原上限時，無法恢復體力",
    triggerDesc: "允許債務超過上限 20%",
    penaltyDesc: "債務超過原上限時，無法恢復體力"
  }
];

function generateCharacter(id: string): CharacterOption {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
  const buff = BUFF_DATABASE[Math.floor(Math.random() * BUFF_DATABASE.length)];

  const name = prefix.name + cls.name;
  
  const hp = Math.max(20, cls.hp + prefix.hpMod);
  const gold = Math.max(10, 50 + prefix.gold);
  const debt = 1500 + prefix.debt;
  const savings = prefix.savings;
  const rage = Math.max(0, 40 + prefix.rage);
  const atkBonus = prefix.atk;
  const debtLimit = 1500 + prefix.debtLimitMod;

  const strength = Math.max(1, cls.str + prefix.str);
  const agility = Math.max(1, cls.agi + prefix.agi);
  const commerce = Math.max(1, cls.com + prefix.com);
  const stamina = Math.max(1, cls.sta + prefix.sta);

  return {
    id,
    prefix: prefix.name,
    cls: cls.name,
    name,
    baseHp: hp,
    hp,
    gold,
    debt,
    savings,
    rage,
    atkBonus,
    credit: 1000,
    debtLimit,
    strength,
    agility,
    commerce,
    stamina,
    buff
  };
}

const INITIAL_STATE: GameState = {
  isBeggarMode: false,
  beggarStickLevel: 0,
  beggarCount: 0,
  beggarLocation: "公告欄的街道旁",
  depositStartMapProgress: 0,
  prologueDone: false,
  prologueClass: null,
  bossHp: 200,
  bossMaxHp: 200,
  bossAtk: 25,
  bossDef: 10,
  battleTurn: 0,
  defBonus: false,
  debtorClass: "standard",
  debtorPrefix: null,
  debtorClassName: null,
  debtorInherentBuff: null,
  debtorBuffName: null,
  debtorBuffDesc: null,
  baseHp: null,
  hp: 100,
  maxHp: 100,
  gold: 50,
  coins: 0,
  savings: 0,
  deposit: 0,
  depositMax: 500,
  depositBattles: 0,
  depositInterest: 0,
  debt: 0,
  credit: 1000,
  rage: 40,
  equip: 2,
  kills: 0,
  contract: null,
  teammates: [],
  teammateEquip: {},
  tavernTeammates: [],
  villageVisits: 0,
  churchRerollsInVisit: 0,
  churchRerollLockedVisits: 0,
  terrainProgress: {},
  verified: false,
  hasCampGear: false,
  bump: false,
  gameCleared: false,
  enemy: null,
  stunned: 0,
  weather: WEATHERS[0],
  battleCount: 0,
  quest: null,
  questProgress: 0,
  mainQuest: null,
  mainQuestProgress: 0,
  sideQuest: null,
  sideQuestProgress: 0,
  alive: true,
  gameOver: false,
  deathCount: 0,
  inflation: 1.0,
  maxInflation: 1.5,
  weapon: null,
  armor: null,
  accessory: null,
  helmet: null,
  necklace: null,
  belt: null,
  greaves: null,
  boots: null,
  bagSize: 40,
  inventory: [],
  churchHealing: false,
  campProgress: 0,
  isCamping: false,
  exploreProgress: 0,
  isExploring: false,
  exploreType: null,
  nightBuff: false,
  skillName: "負債一擊",
  playerSkills: [],
  skillPoints: 0,
  attributePoints: 0,
  defenseBonus: 0,
  isPlayerTurn: true,
  isAllyTurn: false,
  isEnemyTurn: false,
  turnPhase: "player",
  attackBuff: 1.0,
  attackBuffTurns: 0,
  poisonTurns: 0,
  dodgeTurn: false,
  isProcessing: false,
  rageActive: false,
  rageBonus: null,
  hangoverActive: false,
  hangoverTurns: 0,
  forcedReturn: false,
  fireCharges: 0,
  iceCharges: 0,
  poisonCharges: 0,
  windCharges: 0,
  earthCharges: 0,
  earthShieldPercent: 0,
  earthShieldActive: false,
  reviveCharges: 0,
  enemyFrozen: false,
  enemyAtkReduced: 0,
  enemyDefReduced: 0,
  forgedItems: [],
  inDungeon: false,
  dungeonType: null,
  dungeonMultiplier: 1,
  dungeonRewardMult: 1,
  statusTab: 0,
  difficultyLevel: 1,
  mapProgress: 0,
  mapMaxProgress: 100,
  currentTerrain: null,
  terrainModifier: 1,
  terrainReward: 1,
  forgeTarget: null,
  shopTarget: null,
  confirmData: null,
  currentDirection: null,
  checkpointCampMet: [false, false, false],
  hasRepaidSinceLastConfession: false,
  confessionBuff: null,
  creditExp: 0,
  creditLevel: 1,
  totalCreditExp: 0,
  extraCreditLimit: 0,
  playerGauge: 0,
  enemyGauge: 0,
  allyGauges: {},
  activeTurnOwner: null,
  strength: 10,
  agility: 10,
  commerce: 10,
  stamina: 10,
  luck: 10,
  willpower: 10,
  debtLimit: 1500,
  veteranTeammates: [],
  summonPityCount: 0,
  day: 1,
  actionCount: 0,
  totalActions: 0,
  innRoomType: "micro_studio",
  hotelVault: [],
  isVaultFrozen: false,
  overdueRent: 0,
  learnedSkills: [],
  churchDonation: 0,
  holyAegisBattles: 0,
  freeSideQuestRefreshes: 2,
  wantedQuests: [],
  wantedLastRefreshDay: 0
};

const SHOP_ITEMS = [
  { id: "healing_potion", name: "治療藥水", desc: "大口喝下！在戰鬥中或背包中可以回復 50 點生命值。", cost: 15 },
  { id: "camp_fire", name: "露營營火", desc: "過夜用的防魔火把，使你在野外露營時 100% 安全，免遭魔物侵擾。", cost: 40 },
  { id: "teleport_compass", name: "傳送指南針", desc: "極其稀有昂貴的神聖地理指南針。使用後可發動空間轉移：選擇回到復活點、回到野外(當前地圖區塊)、或回到村莊。", cost: 799 }
];

export default function GameBoard({ onResetGame, onSyncWithCloud }: GameBoardProps) {
  const [S, setS] = useState<GameState>(INITIAL_STATE);
  const [statusSubTab, setStatusSubTab] = useState<"attributes" | "skills" | "quests" | "ledger" | "inventory" | "teammates">("attributes");
  const [questBoardSubTab, setQuestBoardSubTab] = useState<"available" | "accepted">("available");
  const [selectedBagIdx, setSelectedBagIdx] = useState<number | null>(null);
  const [battleMenuState, setBattleMenuState] = useState<"root" | "attack" | "item" | "escape">("root");
  const [view, setView] = useState<string>("main_title_menu");
  const [prevView, setPrevView] = useState<string>("main_title_menu");
  const currentViewRef = useRef<string>(view);

  const [teleportCompassModal, setTeleportCompassModal] = useState<{ invIndex?: number } | null>(null);
  const [priestReviveStep, setPriestReviveStep] = useState<number | null>(null);
  const [pendingReviveCost, setPendingReviveCost] = useState<number>(0);

  const [lastActionResult, setLastActionResult] = useState<{
    actionTitle: string;
    actionDetail: string;
    resultTitle: string;
    resultDetail: string;
    costInfo?: string;
    timestamp?: string;
    badgeType?: "success" | "warning" | "battle" | "camp" | "info";
  } | null>(null);

  useEffect(() => {
    if (currentViewRef.current !== view) {
      setPrevView(currentViewRef.current);
      currentViewRef.current = view;
    }
  }, [view]);
  const [palaceKickedModal, setPalaceKickedModal] = useState<boolean>(false);
  const [creditLimitModal, setCreditLimitModal] = useState<boolean>(false);

  // 4-3 貧民區隨機獎勵池與動態刷新機制
  const SHARD_POOL = ["鑰匙碎片", "水晶碎片"];
  const FOOD_POOL = ["鮮美清湯", "精燉濃湯", "水果", "雜糧面包", "蔬果沙拉", "脆皮臘肉", "秘醃醬菜"];

  const generateRandomSlumReward = () => ({
    shardItem: SHARD_POOL[Math.floor(Math.random() * SHARD_POOL.length)],
    shardCount: Math.floor(Math.random() * 3) + 1,
    foodItem: FOOD_POOL[Math.floor(Math.random() * FOOD_POOL.length)],
    foodCount: Math.floor(Math.random() * 3) + 1,
    coinReward: Math.floor(Math.random() * 10) + 5
  });

  const [slumRewardsMap, setSlumRewardsMap] = useState<Record<string, ReturnType<typeof generateRandomSlumReward>>>({
    youth: generateRandomSlumReward(),
    child: generateRandomSlumReward(),
    couple: generateRandomSlumReward(),
    elder: generateRandomSlumReward(),
    coins_small: generateRandomSlumReward(),
    coins_large: generateRandomSlumReward(),
    potion: generateRandomSlumReward(),
    campfire: generateRandomSlumReward()
  });

  const refreshSlumRewards = () => {
    setSlumRewardsMap({
      youth: generateRandomSlumReward(),
      child: generateRandomSlumReward(),
      couple: generateRandomSlumReward(),
      elder: generateRandomSlumReward(),
      coins_small: generateRandomSlumReward(),
      coins_large: generateRandomSlumReward(),
      potion: generateRandomSlumReward(),
      campfire: generateRandomSlumReward()
    });
  };
  const [divinePunishmentModal, setDivinePunishmentModal] = useState<boolean>(false);
  const [toss50PercentWarningModal, setToss50PercentWarningModal] = useState<string | null>(null);
  const [battleTossAccumulated, setBattleTossAccumulated] = useState<number>(0);
  const [battleStartGold, setBattleStartGold] = useState<number>(0);

  useEffect(() => {
    if (S.prologueDone) {
      const { cleanedSkills, correctedAdvClass, hasPunishment } = checkSkillsAndApplyPunishment(S);
      if (hasPunishment) {
        setS(prev => ({
          ...prev,
          advancedClass: correctedAdvClass,
          learnedSkills: cleanedSkills,
          hp: Math.min(prev.hp, 1)
        }));
        setDivinePunishmentModal(true);
        setView("inn");
        addLog("⚡ [檢測到主職業與基礎職業不符或含有跨職業技能，天罰降臨！主職業已自動修正，不符職業技能已全數移除]");
      }
    }
  }, [S.debtorClass, S.prologueClass, S.advancedClass, S.learnedSkills]);
  const [beggarArrestModal, setBeggarArrestModal] = useState<boolean>(false);
  const [beggarArrestDetails, setBeggarArrestDetails] = useState<{ paidCoins: number; paidSavings: number; addedDebt: number } | null>(null);
  const [beggarChoices, setBeggarChoices] = useState<BeggarDialogueOption[]>([]);

  const getRandomBeggarChoices = (): BeggarDialogueOption[] => {
    const shuffled = [...BEGGAR_DIALOGUE_POOL].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };
  const [residentTaskDone, setResidentTaskDone] = useState<Record<string, boolean>>({});
  const [selectedStackSubMenu, setSelectedStackSubMenu] = useState<{ itemKey: string; displayName: string } | null>(null);

  // 隊友裝備贈與與永久鎖定系統 State (Teammate Equipment Gift System)
  const [giftTeammateId, setGiftTeammateId] = useState<string | null>(null);
  const [draftTeammateEquip, setDraftTeammateEquip] = useState<{ weapon: string | null; armor: string | null; accessory: string | null }>({ weapon: null, armor: null, accessory: null });
  const [draftInventory, setDraftInventory] = useState<string[]>([]);

  const openTeammateGiftModal = (id: string) => {
    setGiftTeammateId(id);
    const currentEquip = S.teammateEquip?.[id] || { weapon: null, armor: null, accessory: null };
    setDraftTeammateEquip({
      weapon: currentEquip.weapon || null,
      armor: currentEquip.armor || null,
      accessory: currentEquip.accessory || null,
    });
    setDraftInventory([...(S.inventory || [])]);
  };

  const handleDraftEquip = (itemKey: string, invIdx: number) => {
    const wp = EQUIPMENT.weapons.find(w => w.id === itemKey || w.name === itemKey);
    const ar = EQUIPMENT.armors.find(a => a.id === itemKey || a.name === itemKey);
    const ac = EQUIPMENT.accessories.find(a => a.id === itemKey || a.name === itemKey);

    let targetSlot: "weapon" | "armor" | "accessory" | null = null;
    let canonicalName = itemKey;
    if (wp) {
      targetSlot = "weapon";
      canonicalName = wp.name;
    } else if (ar) {
      targetSlot = "armor";
      canonicalName = ar.name;
    } else if (ac) {
      targetSlot = "accessory";
      canonicalName = ac.name;
    }

    if (!targetSlot) return;

    const nextInv = [...draftInventory];
    nextInv.splice(invIdx, 1);

    setDraftTeammateEquip(prev => ({
      ...prev,
      [targetSlot]: canonicalName
    }));
    setDraftInventory(nextInv);
  };

  const handleDraftUnequip = (slot: "weapon" | "armor" | "accessory") => {
    if (!giftTeammateId) return;
    const currentItemInSlot = draftTeammateEquip[slot];
    if (!currentItemInSlot) return;

    const originalEquip = S.teammateEquip?.[giftTeammateId] || {};
    const wasOriginallyEquipped = originalEquip[slot] === currentItemInSlot;

    if (!wasOriginallyEquipped) {
      setDraftInventory(prev => [...prev, currentItemInSlot]);
    }

    setDraftTeammateEquip(prev => ({
      ...prev,
      [slot]: null
    }));
  };

  const handleConfirmGiftEquip = () => {
    if (!giftTeammateId) return;
    const tm = getTeammateData(giftTeammateId);
    if (!tm) return;

    const originalEquip = S.teammateEquip?.[giftTeammateId] || {};
    const newEquip = draftTeammateEquip;

    const overwrittenItems: string[] = [];
    (["weapon", "armor", "accessory"] as const).forEach(slot => {
      if (originalEquip[slot] && newEquip[slot] && originalEquip[slot] !== newEquip[slot]) {
        overwrittenItems.push(originalEquip[slot]!);
      }
    });

    let overwriteWarning = "";
    if (overwrittenItems.length > 0) {
      overwriteWarning = `其中原有的 【${overwrittenItems.join("、")}】 將被覆蓋銷毀無法取回！`;
    }

    setConfirmModal({
      title: "⚠️ 隊友裝備永久贈與確認",
      message: `給予隊友裝備等同於永久贈與，確認後裝備將從您的背包中徹底消失並轉移至【${tm.name}】名下。${overwriteWarning}確認後將無法收回，是否繼續？`,
      confirmText: "確定贈與 (永久鎖定)",
      cancelText: "再考慮一下",
      confirmStyle: "rose",
      onConfirm: () => {
        setS(prev => ({
          ...prev,
          inventory: draftInventory,
          teammateEquip: {
            ...(prev.teammateEquip || {}),
            [giftTeammateId]: { ...draftTeammateEquip }
          }
        }));
        addLog(`🎁 【隊友裝備贈與】你成功將裝備贈與並永久鎖定給了 【${tm.name}】！舊同欄位裝備已覆蓋銷毀，新裝備標示為 [隊友專屬]。`);
        setGiftTeammateId(null);
      }
    });
  };
  const [conflictSaves, setConflictSaves] = useState<{ manual: SaveData, auto: SaveData } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmStyle?: "rose" | "amber" | "emerald";
    onConfirm: () => void;
  } | null>(null);
  const [saveVersion, setSaveVersion] = useState<number>(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const getLocalSaves = (): (SaveData | null)[] => {
    try {
      const raw = localStorage.getItem("debtHeroSaves");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.error("Failed to parse local saves:", e);
      return [];
    }
  };
  const [logLines, setLogLines] = useState<string[]>([
    "勇者小隊站在魔王面前。",
    "這是決定世界命運的一戰。",
    "但你不知道的是，勝利才是真正的開始。"
  ]);
  const [equipBuffMap, setEquipBuffMap] = useState<Record<string, Buff>>({});
  const [damagedTarget, setDamagedTarget] = useState<string | null>(null);
  const [levelDropProgress, setLevelDropProgress] = useState<number>(0);
  const [levelDropText, setLevelDropText] = useState<string>("LV.MAX");
  const logTopRef = useRef<HTMLDivElement>(null);

  // Wild camping states
  const [wildCampStatus, setWildCampStatus] = useState<'idle' | 'safe' | 'ambushed'>('idle');
  const [wildCampMonster, setWildCampMonster] = useState<Monster | null>(null);

  // Debtor lottery states
  const [isRollingDebtor, setIsRollingDebtor] = useState(false);
  const [rollHighlightIndex, setRollHighlightIndex] = useState(0);
  const [rolledDebtorId, setRolledDebtorId] = useState<string | null>(null);
  const [debtorOptions, setDebtorOptions] = useState<CharacterOption[]>([]);
  const [exchangeSliderAmount, setExchangeSliderAmount] = useState<number>(1);
  const [depositSliderAmount, setDepositSliderAmount] = useState<number>(50);
  const [pureSavingsDepositAmount, setPureSavingsDepositAmount] = useState<number>(50);
  const [pureSavingsWithdrawAmount, setPureSavingsWithdrawAmount] = useState<number>(50);
  const [dismissedQuote, setDismissedQuote] = useState<{ name: string; text: string } | null>(null);
  const [confessionSuccessMsg, setConfessionSuccessMsg] = useState<string | null>(null);
  const [innSubTab, setInnSubTab] = useState<'rest' | 'vault' | 'coins'>('rest');
  const [guildTab, setGuildTab] = useState<'skills' | 'quests' | 'sell'>('skills');
  const [shopSubTab, setShopSubTab] = useState<'buy' | 'sell'>('buy');
  const [forgeSubTab, setForgeSubTab] = useState<'craft' | 'sell'>('craft');
  const [forgeCraftSubPage, setForgeCraftSubPage] = useState<boolean>(false);
  const [forgeSubPageMode, setForgeSubPageMode] = useState<'new' | 'existing'>('new');
  const [unforgedForgePage, setUnforgedForgePage] = useState<number>(1);
  const [guildClassFilter, setGuildClassFilter] = useState<'all' | 'warrior' | 'mage' | 'assassin' | 'priest'>('all');
  const [churchAppraisalPage, setChurchAppraisalPage] = useState<number>(1);
  const [churchAppraisalTab, setChurchAppraisalTab] = useState<'unappraised' | 'appraised' | 'all'>('unappraised');

  // Church Prayer / Soul Samsara states
  const HERO_QUOTES = [
    "「唉～天上的日子，好～～～不快樂，額不……是快活無比！好久好久沒活動筋骨了，看在生靈塗炭的世界和大天使的份上……勉強讓我來吧！」",
    "「有一首歌的歌詞：『輕輕敲醒沉睡的心靈，慢慢張開你的眼睛...』而我現在看看這個世界……只想拿榔頭敲你！」\n（一個英雄的靈魂出現，手上拿著透明的榔頭看著你渾身顫抖。而你只是尷尬地朝他笑一笑，試圖安撫這位英靈。）",
    "「牛頓當年被蘋果砸到發現萬有引力，不知道拿塊地磚砸你，會發現什麼...，會不會發現你腦袋裡裝的全部都是銀行貸款？」",
    "「我生前打過九頭蛇、魔王、甚至還拯救過世界……結果死了以後還要被你用保底機制『特招』加班？勞基法有規定靈魂不能週休七日嗎？！」",
    "「我在天堂的墓園風景優美、鄰居也很有禮貌，風水好到我都快定居了……你到底是有多無聊，非要把我從土裡挖起來幫你扛銀行貸款？」",
    "「剛才大天使把我叫過去，語重心長地跟我說人間有一位『絕世天才』需要幫助……我看著你這串銀行貸款數字，現在申請原地圓寂還來得及嗎？」"
  ];
  const [summonedHeroId, setSummonedHeroId] = useState<string | null>(null);
  const [summonHeroQuote, setSummonHeroQuote] = useState<string>("");
  const [summonDialogueOpen, setSummonDialogueOpen] = useState<boolean>(false);
  const [summonStatus, setSummonStatus] = useState<'success' | 'swap_pending' | null>(null);
  const [swapSelectedTeammateId, setSwapSelectedTeammateId] = useState<string | null>(null);
  const [soulTucaoMsg, setSoulTucaoMsg] = useState<string | null>(null);
  const [isPrayingEffect, setIsPrayingEffect] = useState<boolean>(false);
  const [isPitySummon, setIsPitySummon] = useState<boolean>(false);
  const [praySliderCount, setPraySliderCount] = useState<number>(1);
  const [lastDrawBatchCount, setLastDrawBatchCount] = useState<number>(1);
  const [activeMapIndex, setActiveMapIndex] = useState<number>(0);
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});

  const generateNewOptions = () => {
    const options = [
      generateCharacter("opt_0"),
      generateCharacter("opt_1"),
      generateCharacter("opt_2"),
      generateCharacter("opt_3")
    ];
    setDebtorOptions(options);
    setRolledDebtorId(null);
    setRollHighlightIndex(0);
    addLog("🎲 已重新調度四大審計資產與宿命 Buff 組合！");
  };

  useEffect(() => {
    setConfessionSuccessMsg(null);
    if (view === "debtor_select") {
      setRolledDebtorId(null);
      setIsRollingDebtor(false);
      setRollHighlightIndex(0);
      const options = [
        generateCharacter("opt_0"),
        generateCharacter("opt_1"),
        generateCharacter("opt_2"),
        generateCharacter("opt_3")
      ];
      setDebtorOptions(options);
    }
    if (view === "forced_return") {
      performSave(0, true);
    }
  }, [view]);

  // Auto Scroll Log
  useEffect(() => {
    if (logTopRef.current) {
      logTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logLines]);

  // Utility helpers
  const activePrologue = () => S.prologueClass ? PROLOGUE_CLASSES[S.prologueClass] : null;
  const activeDebtor = () => {
    if (S.debtorClassName) {
      return {
        id: S.debtorClass,
        name: S.debtorClassName,
        title: S.debtorPrefix || "標準型",
        hp: S.baseHp || 100,
        gold: 50,
        coins: 0,
        debt: 0,
        credit: 1000,
        equip: 1,
        rage: 40,
        atkBonus: 0,
        unlocked: true
      };
    }
    return DEBTOR_CLASSES[S.debtorClass] || DEBTOR_CLASSES.standard;
  };
  const hasTeammate = (id: string) => S.teammates.includes(id);
  const getTeammateData = (id: string) => TEAMMATES.find(t => t.id === id);
  const getTeammateMaxHp = (id: string) => {
    if (id === "warrior") return 120;
    if (id === "mage") return 80;
    if (id === "assassin") return 100;
    if (id === "guard") return 110;
    if (id === "miner") return 100;
    if (id === "bard") return 80;
    if (id === "accountant") return 80;
    if (id === "intern") return 70;
    return 100;
  };
  const renderProgressBarHTML = (percentage: number, isActive: boolean) => {
    const labelText = isActive ? "⚡ 準備就緒" : `🕒 蓄能中 (${Math.round(percentage)}%)`;
    const bgClass = isActive ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" : "bg-gradient-to-r from-emerald-500 to-teal-400";
    return (
      <div className={`flex flex-col w-full select-none text-[10px] my-1 py-1 px-2 rounded-lg transition-all ${isActive ? "bg-amber-500/10 text-amber-300 font-extrabold font-sans" : "text-slate-400 bg-slate-900/40"}`}>
        <div className="flex justify-between items-center mb-1 text-[8px] uppercase tracking-wider font-sans">
          <span className="text-slate-500 font-bold">{labelText}</span>
        </div>
        <div className="w-full bg-slate-950 border border-slate-800 h-1.5 rounded-full overflow-hidden relative">
          <div 
            className={`${bgClass} h-full transition-all duration-300 ease-out rounded-full relative`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    );
  };
  const getEquippedWeapon = () => {
    if (S.isBeggarMode) {
      const lvl = S.beggarStickLevel || 0;
      return {
        id: "beggar_stick",
        name: `乞丐專用木棍 (+${lvl})`,
        atk: 5 + lvl * 8,
        type: "武器" as const,
        rarity: "🪵",
        color: "#f59e0b",
        baseCost: 0
      };
    }
    return S.weapon ? EQUIPMENT.weapons.find(w => w.id === S.weapon) : null;
  };
  const getEquippedArmor = () => S.isBeggarMode ? null : (S.armor ? EQUIPMENT.armors.find(a => a.id === S.armor) : null);
  const getEquippedAccessory = () => S.isBeggarMode ? null : (S.accessory ? EQUIPMENT.accessories.find(a => a.id === S.accessory) : null);
  const getEquippedHelmet = () => S.isBeggarMode ? null : (S.helmet ? EQUIPMENT.armors.find(a => a.id === S.helmet) : null);
  const getEquippedNecklace = () => S.isBeggarMode ? null : (S.necklace ? EQUIPMENT.accessories.find(a => a.id === S.necklace) : null);
  const getEquippedBelt = () => S.isBeggarMode ? null : (S.belt ? EQUIPMENT.accessories.find(a => a.id === S.belt) : null);
  const getEquippedGreaves = () => S.isBeggarMode ? null : (S.greaves ? EQUIPMENT.armors.find(a => a.id === S.greaves) : null);
  const getEquippedBoots = () => S.isBeggarMode ? null : (S.boots ? EQUIPMENT.armors.find(a => a.id === S.boots) : null);

  const getUnforgedEquipmentList = () => {
    const forgedSet = new Set(S.forgedItems || []);
    const allEquipmentList = [...EQUIPMENT.weapons, ...EQUIPMENT.armors, ...EQUIPMENT.accessories];

    const equippedList = [
      { slotName: "主手武器", item: getEquippedWeapon() },
      { slotName: "胸甲防具", item: getEquippedArmor() },
      { slotName: "佩戴飾品", item: getEquippedAccessory() },
      { slotName: "頭盔部位", item: getEquippedHelmet() },
      { slotName: "項鍊部位", item: getEquippedNecklace() },
      { slotName: "腰帶部位", item: getEquippedBelt() },
      { slotName: "護脛部位", item: getEquippedGreaves() },
      { slotName: "靴子部位", item: getEquippedBoots() },
    ].filter((e): e is { slotName: string; item: Equipment } => 
      e.item !== null && e.item !== undefined && e.item.id !== "beggar_stick"
    );

    const equippedItemIds = new Set(equippedList.map(e => e.item.id));

    const inventoryEquipmentDict: Record<string, { item: Equipment; count: number }> = {};
    (S.inventory || []).forEach(itemKey => {
      const matchedEq = allEquipmentList.find(e => e.id === itemKey || e.name === itemKey);
      if (matchedEq && matchedEq.id !== "beggar_stick") {
        if (inventoryEquipmentDict[matchedEq.id]) {
          inventoryEquipmentDict[matchedEq.id].count += 1;
        } else {
          inventoryEquipmentDict[matchedEq.id] = { item: matchedEq, count: 1 };
        }
      }
    });

    const inventoryEquipmentList = Object.values(inventoryEquipmentDict)
      .filter(({ item }) => !equippedItemIds.has(item.id));

    const list: {
      id: string;
      name: string;
      rarity: string;
      color: string;
      type: string;
      location: string;
      count?: number;
    }[] = [];

    equippedList.forEach(({ slotName, item }) => {
      const isForged = forgedSet.has(item.id) || forgedSet.has(item.name);
      if (!isForged) {
        list.push({
          id: item.id,
          name: item.name,
          rarity: item.rarity,
          color: item.color,
          type: item.type || "裝備",
          location: `${slotName} (已裝備)`
        });
      }
    });

    inventoryEquipmentList.forEach(({ item, count }) => {
      const isForged = forgedSet.has(item.id) || forgedSet.has(item.name);
      if (!isForged) {
        list.push({
          id: item.id,
          name: item.name,
          rarity: item.rarity,
          color: item.color,
          type: item.type || "裝備",
          location: `🎒 背包物品`,
          count
        });
      }
    });

    return list;
  };

  const refreshTavernTeammates = () => {
    const shuffled = [...TEAMMATES].sort(() => 0.5 - Math.random());
    const nextTavernTeammates = shuffled.slice(0, 4).map(t => t.id);
    setS(prev => ({
      ...prev,
      villageVisits: 0,
      tavernTeammates: nextTavernTeammates
    }));
  };

  const enterVillage = () => {
    setS(prev => {
      const nextVisits = (prev.villageVisits || 0) + 1;
      let nextTavernTeammates = prev.tavernTeammates || [];
      const nextRerollLockedVisits = Math.max(0, (prev.churchRerollLockedVisits || 0) - 1);
      
      if (nextVisits >= 3 || nextTavernTeammates.length === 0) {
        const shuffled = [...TEAMMATES].sort(() => 0.5 - Math.random());
        nextTavernTeammates = shuffled.slice(0, 4).map(t => t.id);
        
        return {
          ...prev,
          villageVisits: 0,
          tavernTeammates: nextTavernTeammates,
          churchRerollsInVisit: 0,
          churchRerollLockedVisits: nextRerollLockedVisits
        };
      }
      
      return {
        ...prev,
        villageVisits: nextVisits,
        churchRerollsInVisit: 0,
        churchRerollLockedVisits: nextRerollLockedVisits
      };
    });
    setView("village");
  };

  const getWeaponBuff = () => {
    const w = getEquippedWeapon();
    return (w && equipBuffMap[w.id]) ? equipBuffMap[w.id] : null;
  };
  const getArmorBuff = () => {
    const a = getEquippedArmor();
    return (a && equipBuffMap[a.id]) ? equipBuffMap[a.id] : null;
  };
  const getAccessoryBuff = () => {
    const a = getEquippedAccessory();
    return (a && equipBuffMap[a.id]) ? equipBuffMap[a.id] : null;
  };
  const getHelmetBuff = () => {
    const item = getEquippedHelmet();
    return (item && equipBuffMap[item.id]) ? equipBuffMap[item.id] : null;
  };
  const getNecklaceBuff = () => {
    const item = getEquippedNecklace();
    return (item && equipBuffMap[item.id]) ? equipBuffMap[item.id] : null;
  };
  const getBeltBuff = () => {
    const item = getEquippedBelt();
    return (item && equipBuffMap[item.id]) ? equipBuffMap[item.id] : null;
  };
  const getGreavesBuff = () => {
    const item = getEquippedGreaves();
    return (item && equipBuffMap[item.id]) ? equipBuffMap[item.id] : null;
  };
  const getBootsBuff = () => {
    const item = getEquippedBoots();
    return (item && equipBuffMap[item.id]) ? equipBuffMap[item.id] : null;
  };

  const getTotalBuff = (effect: string) => {
    let t = 0;
    const wBuff = getWeaponBuff();
    const aBuff = getArmorBuff();
    const acBuff = getAccessoryBuff();
    const hBuff = getHelmetBuff();
    const nBuff = getNecklaceBuff();
    const bBuff = getBeltBuff();
    const gBuff = getGreavesBuff();
    const boBuff = getBootsBuff();
    if (wBuff && wBuff.effect === effect) t += wBuff.value;
    if (aBuff && aBuff.effect === effect) t += aBuff.value;
    if (acBuff && acBuff.effect === effect) t += acBuff.value;
    if (hBuff && hBuff.effect === effect) t += hBuff.value;
    if (nBuff && nBuff.effect === effect) t += nBuff.value;
    if (bBuff && bBuff.effect === effect) t += bBuff.value;
    if (gBuff && gBuff.effect === effect) t += gBuff.value;
    if (boBuff && boBuff.effect === effect) t += boBuff.value;
    return t;
  };

  const backToMainMenu = () => setView("menu");

  const money = (n: number) => {
    return "$" + Math.max(0, Math.round(n)).toLocaleString();
  };

  const formatDebt = (debt: number, limit: number, level: number) => {
    const dVal = Math.max(0, Math.round(debt || 0)).toLocaleString();
    const lVal = Math.max(0, Math.round(limit || 1500)).toLocaleString();
    const lvl = level || 1;
    return `-Lv.${lvl} $ ${dVal} / $ ${lVal}`;
  };

  const formatCredit = (creditExp: number, creditLimit: number) => {
    const cExp = Math.max(0, Math.round(creditExp || 0)).toLocaleString();
    const cLim = Math.max(0, Math.round(creditLimit || 1600)).toLocaleString();
    return `$ ${cExp} / ${cLim}`;
  };

  const renderTextBar = (percentage: number, colorClass: string = "text-emerald-500", segments: number = 10) => {
    let bgClass = "bg-gradient-to-r from-emerald-500 to-teal-400";
    if (colorClass.includes("rose") || colorClass.includes("red")) {
      bgClass = "bg-gradient-to-r from-rose-500 to-red-500";
    } else if (colorClass.includes("amber") || colorClass.includes("yellow") || colorClass.includes("orange")) {
      bgClass = "bg-gradient-to-r from-amber-500 to-orange-500";
    } else if (colorClass.includes("blue") || colorClass.includes("sky")) {
      bgClass = "bg-gradient-to-r from-sky-400 to-blue-500";
    } else if (colorClass.includes("purple") || colorClass.includes("fuchsia")) {
      bgClass = "bg-gradient-to-r from-purple-500 to-fuchsia-500";
    }

    const pct = Math.max(0, Math.min(100, Math.round(percentage)));

    return (
      <div className="w-full inline-block min-w-[120px] bg-slate-950 border border-slate-800/80 h-3 rounded-full overflow-hidden relative shadow-inner align-middle">
        <div 
          className={`${bgClass} h-full transition-all duration-300 ease-out rounded-full relative`}
          style={{ width: `${pct}%` }}
        >
          {/* Top highlight shine line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20 rounded-full" />
        </div>
      </div>
    );
  };

  const allocateAttribute = (attr: 'strength' | 'agility' | 'commerce' | 'stamina' | 'luck' | 'willpower') => {
    if ((S.attributePoints || 0) <= 0) return;
    setS(prev => {
      const nextPoints = (prev.attributePoints || 0) - 1;
      const nextVal = (prev[attr] || 10) + 1;
      
      let nextHp = prev.hp;
      if (attr === 'stamina') {
        nextHp += 5;
      }

      addLog(`📋 【審計資產分配】將 1 點審計額度配置於 [${
        attr === 'strength' ? '力量' :
        attr === 'agility' ? '敏捷' :
        attr === 'commerce' ? '經商' :
        attr === 'stamina' ? '體力' :
        attr === 'luck' ? '幸運' : '意志'
      }] (當前：${nextVal} 點)`);

      return {
        ...prev,
        [attr]: nextVal,
        hp: nextHp,
        attributePoints: nextPoints
      };
    });
  };

  const equipItem = (itemKey: string, index: number) => {
    const weaponItem = EQUIPMENT.weapons.find(w => w.id === itemKey || w.name === itemKey);
    const armorItem = EQUIPMENT.armors.find(a => a.id === itemKey || a.name === itemKey);
    const accessoryItem = EQUIPMENT.accessories.find(ac => ac.id === itemKey || ac.name === itemKey);

    setS(prev => {
      let nextInventory = [...prev.inventory];
      nextInventory.splice(index, 1);

      if (weaponItem) {
        if (prev.weapon) {
          nextInventory.push(prev.weapon);
        }
        addLog(`⚔️ 裝備了武器：${weaponItem.name}。`);
        return {
          ...prev,
          weapon: weaponItem.id,
          inventory: nextInventory
        };
      } else if (armorItem) {
        if (prev.armor) {
          nextInventory.push(prev.armor);
        }
        addLog(`🛡️ 裝備了鎧甲：${armorItem.name}。`);
        return {
          ...prev,
          armor: armorItem.id,
          inventory: nextInventory
        };
      } else if (accessoryItem) {
        if (prev.accessory) {
          nextInventory.push(prev.accessory);
        }
        addLog(`💍 裝備了飾品：${accessoryItem.name}。`);
        return {
          ...prev,
          accessory: accessoryItem.id,
          inventory: nextInventory
        };
      }
      return prev;
    });
  };

  const unequipItem = (slot: "weapon" | "armor" | "accessory") => {
    setS(prev => {
      const itemId = prev[slot];
      if (!itemId) return prev;

      const nextInventory = [...prev.inventory];
      nextInventory.push(itemId);

      let itemName = "";
      if (slot === "weapon") itemName = EQUIPMENT.weapons.find(w => w.id === itemId)?.name || itemId;
      if (slot === "armor") itemName = EQUIPMENT.armors.find(a => a.id === itemId)?.name || itemId;
      if (slot === "accessory") itemName = EQUIPMENT.accessories.find(a => a.id === itemId)?.name || itemId;

      addLog(`🎒 卸下了裝備：${itemName}，已放入背包。`);
      return {
        ...prev,
        [slot]: null,
        inventory: nextInventory
      };
    });
  };

  const usePotionFromStatus = (index: number) => {
    setS(prev => {
      const maxHp = getTotalMaxHp();
      if (prev.hp >= maxHp) {
        addLog("❌ 生命值已滿，不需要飲用治療藥水！");
        return prev;
      }
      const nextInventory = [...prev.inventory];
      nextInventory.splice(index, 1);
      const healedHp = Math.min(maxHp, prev.hp + 50);
      addLog(`🧴 飲用了治療藥水！回復了 50 點生命值（${prev.hp} → ${healedHp}）。`);
      return {
        ...prev,
        hp: healedHp,
        inventory: nextInventory
      };
    });
  };

  const gatherResources = () => {
    const terrain = S.currentTerrain || "rocky";
    let previewItem = "落石晶石";
    if (terrain === "plains") previewItem = "狂風蒲公英";
    else if (terrain === "forest") previewItem = "幽暗迷幻菇";
    else if (terrain === "mountains") previewItem = "萬年玄冰";

    if (!canAddItemToInventory(S.inventory, previewItem, S.bagSize || 40)) {
      addLog("❌ 背包一般空間已滿，裝不下新種類的採集資源了！請先清出空間或賣出舊物品。");
      return;
    }

    setS(prev => {
      const terrain = prev.currentTerrain || "rocky";
      const luckBonus = (prev.luck || 10) - 10;
      const laborCost = 5; 
      const nextDebt = prev.debt + laborCost;

      let gatheredItem = "落石晶石";
      if (terrain === "rocky") {
        gatheredItem = "落石晶石";
      } else if (terrain === "plains") {
        gatheredItem = "狂風蒲公英";
      } else if (terrain === "forest") {
        gatheredItem = "幽暗迷幻菇";
      } else if (terrain === "mountains") {
        gatheredItem = "萬年玄冰";
      }

      const roll = Math.random() * 100 + luckBonus;
      if (roll > 85) {
        gatheredItem = "治療藥水";
      } else if (roll > 75) {
        gatheredItem = "露營營火";
      }

      const nextInventory = [...prev.inventory, gatheredItem];
      
      setTimeout(() => {
        addLog(`🌿 【野外採集】你揮汗如雨地在四周採集，消耗了體力（負債 +$${laborCost}），成功獲得了：【${gatheredItem}】！`);
        recordEffectiveAction("野外採集與搜刮");
        const terrainNameMap: Record<string, string> = {
          rocky: "落石岩地",
          plains: "狂風平原",
          forest: "幽暗森林",
          mountains: "寒冷山脈"
        };
        const tName = terrainNameMap[terrain] || "野外荒野";
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastActionResult({
          actionTitle: "【野外資源採集】",
          actionDetail: `在【${tName}】仔細搜刮地表產物與珍稀植物資源。`,
          resultTitle: `🌿 採集成功`,
          resultDetail: `揮汗採集完成，成功獲得【${gatheredItem}】並放入背包！`,
          costInfo: `負債 +$${laborCost} (採集勞勤支出)`,
          timestamp: nowTime,
          badgeType: "success"
        });
      }, 50);

      return {
        ...prev,
        debt: nextDebt,
        inventory: nextInventory
      };
    });
  };

  const sellItemFromStatus = (item: string, index: number) => {
    let price = 10;
    if (item === "落石晶石") price = 30;
    else if (item === "狂風蒲公英") price = 40;
    else if (item === "幽暗迷幻菇") price = 60;
    else if (item === "萬年玄冰") price = 100;
    else if (item === "治療藥水") price = 10;
    else if (item === "露營營火") price = 20;

    setS(prev => {
      const nextInventory = [...prev.inventory];
      nextInventory.splice(index, 1);
      const nextCoins = prev.coins + price;
      
      addLog(`💰 【物資變賣】你以 $${price} 金幣的價格售出了【${item}】！`);
      return {
        ...prev,
        coins: nextCoins,
        inventory: nextInventory
      };
    });
  };

  const useMushroomFromStatus = (index: number) => {
    setS(prev => {
      const nextInventory = [...prev.inventory];
      nextInventory.splice(index, 1);
      const nextRage = Math.min(100, prev.rage + 30);
      addLog(`🍄 【食用迷幻菇】你嚼了嚼吃下了幽暗迷幻菇，感覺整個人都嗨起來了！暴怒值提升 +30%（當前暴怒：${nextRage}%）！`);
      return {
        ...prev,
        rage: nextRage,
        inventory: nextInventory
      };
    });
  };

  const useFoodFromStatus = (index: number, itemName: string) => {
    setS(prev => {
      const maxHp = getTotalMaxHp();
      const nextInventory = [...prev.inventory];
      nextInventory.splice(index, 1);
      const healVal = itemName.includes("濃湯") || itemName.includes("臘肉") ? 45 : 30;
      const healedHp = Math.min(maxHp, prev.hp + healVal);
      addLog(`🍱 【品嚐美食】你享用了美食【${itemName}】！味蕾受到極致享受，恢復了 ${healVal} 點生命值（${prev.hp} → ${healedHp} HP）！`);
      return {
        ...prev,
        hp: healedHp,
        inventory: nextInventory
      };
    });
  };

  const debtText = () => {
    return "-LV " + money(S.debt);
  };

  const getDifficultyDisplay = (level: number = S.difficultyLevel) => {
    if (level <= 0) return "Lv1";
    const numPart = ((level - 1) % 100) + 1;
    const groupIndex = Math.floor((level - 1) / 100);
    if (groupIndex === 0) {
      return `Lv${numPart}`;
    }
    const letterGroup = groupIndex - 1;
    const letterIndex = letterGroup % 26;
    const plusCount = Math.floor(letterGroup / 26);
    const letter = String.fromCharCode(65 + letterIndex);
    const pluses = "+".repeat(plusCount);
    return `Lv${numPart}${letter}${pluses}`;
  };

  const getAtkBonus = () => {
    if (S.isBeggarMode) {
      return 5 + (S.beggarStickLevel || 0) * 8;
    }
    let b = 0;
    const d = activeDebtor();
    if (d && d.atkBonus) b += d.atkBonus;
    const w = getEquippedWeapon();
    if (w) b += w.atk || 0;
    if (hasTeammate("intern")) b += 3;
    if (S.debtorInherentBuff === "demon_contract") b += 15;
    const bv = getTotalBuff("atk");
    if (bv > 0) b = Math.floor(b * (1 + bv / 100));
    if (S.hangoverActive) b = Math.floor(b * 0.8);
    return b;
  };

  const getDefBonus = () => {
    if (S.isBeggarMode) return 0;
    let b = 0;
    const a = getEquippedArmor();
    if (a) b += a.def || 0;
    const h = getEquippedHelmet();
    if (h) b += h.def || 0;
    const g = getEquippedGreaves();
    if (g) b += g.def || 0;
    const bo = getEquippedBoots();
    if (bo) b += bo.def || 0;
    const bv = getTotalBuff("def");
    if (bv > 0) b = Math.floor(b * (1 + bv / 100));
    b += S.defenseBonus || 0;
    return b;
  };

  const getMaxHpBonus = () => {
    let b = 0;
    const bv = getTotalBuff("hp");
    if (bv > 0) {
      const base = activeDebtor().hp || 100;
      b = Math.floor(base * bv / 100);
    }
    return b;
  };

  const canHeal = (silent: boolean = false) => {
    if (S.debtorInherentBuff === "demon_contract") {
      if (!silent) {
        setTimeout(() => {
          addLog("😈 【魔王的契約】禁止了任何形式的生命恢復！");
        }, 10);
      }
      return false;
    }
    // 大教堂聖所內的操作不受負債影響
    const isChurch = view && view.startsWith("church_");
    if (!isChurch && S.debtorInherentBuff === "overdraft_user" && S.debt > (S.debtLimit || 1500)) {
      if (!silent) {
        setTimeout(() => {
          addLog("🧱 【信用透支者】當前負債已超載，在去銀行還清欠款前無法恢復體力！");
        }, 10);
      }
      return false;
    }
    return true;
  };

  const triggerCombatKineticHeal = (actionName: string) => {
    if (S.debtorInherentBuff === "demon_contract") {
      const healAmount = 15;
      setS(prev => {
        const nextHp = Math.min(getTotalMaxHp(), prev.hp + healAmount);
        return {
          ...prev,
          hp: nextHp
        };
      });
      addLog(`⚡ 【戰鬥動能回血】發動攻擊/行動 (${actionName})，注入動能，恢復了 ${healAmount} 點 HP！`);
    }
  };

  const getTotalMaxHp = () => {
    const base = activeDebtor().hp || 100;
    const staminaBonus = ((S.stamina || 10) - 10) * 5;
    let total = base + getMaxHpBonus() + staminaBonus;
    if (S.debtorInherentBuff === "vampire_debt") {
      total = Math.ceil(total * 0.85);
    }
    if (S.debtorInherentBuff === "demon_contract") {
      total = Math.ceil(total * 0.70);
    }
    if (S.holyAegisBattles && S.holyAegisBattles > 0) {
      total = Math.ceil(total * 1.13);
    }
    return total;
  };

  const getGoldBonus = () => getTotalBuff("gold");
  const getRageBonus = () => getTotalBuff("rage");
  const getLifestealBonus = () => {
    let b = getTotalBuff("lifesteal");
    if (S.contract === "blood") b += 12;
    return b;
  };

  const getRewardMult = () => {
    let m = 1 + (getGoldBonus() / 100);
    if (hasTeammate("miner")) m *= 1.12;
    if (S.weather.reward) m *= S.weather.reward;
    if (S.inDungeon) m *= S.dungeonRewardMult;
    const strengthBonus = ((S.strength || 10) - 10) * 0.02;
    return m * (1 + strengthBonus);
  };

  const addLog = (text: string) => {
    setLogLines(prev => [text, ...prev].slice(0, 50));
  };

  // 信用經驗值系統
  const gainCreditExp = (amount: number) => {
    let actualAmount = amount;
    if (S.debtorInherentBuff === "worker_soul") {
      actualAmount = Math.ceil(amount * 0.8);
    }
    setS(prev => {
      const nextExp = prev.creditExp + actualAmount;
      const limit = prev.credit || 1000;
      if (nextExp >= limit) {
        setCreditLimitModal(true);
      }
      return {
        ...prev,
        creditExp: nextExp
      };
    });
  };

  // 手動信用等級提升 & 審計解凍
  const triggerCreditLevelUp = () => {
    setS(prev => {
      const limit = prev.credit || 1000;
      if (prev.creditExp < limit) return prev;

      let nextExp = prev.creditExp;
      let nextLevel = prev.creditLevel;
      let nextSkillPoints = prev.skillPoints || 0;
      let nextAttrPoints = prev.attributePoints || 0;
      let nextCreditLimit = prev.credit || 1000;
      let nextDebtLimit = prev.debtLimit || 1500;

      while (nextExp >= nextCreditLimit) {
        nextExp -= nextCreditLimit;
        nextLevel += 1;
        nextSkillPoints += 3;
        nextAttrPoints += 5;
        
        // 擴大當前欠款上限與信用額度上限
        const creditIncrease = 200;
        const debtLimitIncrease = 400;
        nextCreditLimit += creditIncrease;
        nextDebtLimit += debtLimitIncrease;
      }

      const finalLvl = nextLevel;
      const finalCred = nextCreditLimit;
      const finalDebt = nextDebtLimit;

      setTimeout(() => {
        addLog(`📈 【信用等級提升 & 審計解凍！】Level ${prev.creditLevel} → Level ${finalLvl}！`);
        addLog(`💳 信用額度上限已擴大至：${finalCred} EXP！`);
        addLog(`🛡️ 當前欠款上限已擴大至：${money(finalDebt)}！`);
        addLog(`⭐ 獲得 3 技能點、5 屬性點！`);
      }, 50);

      return {
        ...prev,
        creditExp: nextExp,
        creditLevel: finalLvl,
        credit: nextCreditLimit,
        debtLimit: nextDebtLimit,
        skillPoints: nextSkillPoints,
        attributePoints: nextAttrPoints
      };
    });
  };

  // 獲取戰鬥中各角色速度
  const getBattleSpeeds = (state: GameState) => {
    let pSpeed = 12;
    if (state.prologueClass === "mage") pSpeed = 10;
    if (state.prologueClass === "assassin") pSpeed = 17;
    
    const agilityBonus = ((state.agility || 10) - 10) * 0.4;
    pSpeed += agilityBonus;

    if (state.hangoverActive) pSpeed = Math.floor(pSpeed * 0.85);
    if (state.currentTerrain === "mountain") pSpeed = Math.max(6, pSpeed - 3);

    let eSpeed = 11;
    if (state.enemy) {
      if (state.enemy.name.includes("史萊姆")) eSpeed = 7;
      if (state.enemy.name.includes("哥布林")) eSpeed = 15;
      if (state.enemy.name.includes("騎士")) eSpeed = 12;
    }
    if (state.enemyFrozen) eSpeed = Math.floor(eSpeed * 0.5);

    const getAllySpeed = (id: string) => {
      if (id === "warrior") return 8;
      if (id === "mage") return 9;
      if (id === "assassin") return 15;
      return 11;
    };

    return { pSpeed, eSpeed, getAllySpeed };
  };

  // 回合制行動控制 (Turn-Based Action controller)
  const advanceATB = (currentState: GameState = S) => {
    setS(prev => {
      if (!prev.enemy || prev.enemy.hp <= 0 || prev.hp <= 0) return prev;

      const { pSpeed, eSpeed, getAllySpeed } = getBattleSpeeds(prev);

      // 篩選出上場的主動隊友（包括搞笑隊友與勇者小隊）
      const activeTeammates = prev.teammates.filter(id => {
        const t = getTeammateData(id);
        return t && t.atkMin > 0;
      });

      let nextOwner = prev.activeTurnOwner;
      let isP = prev.isPlayerTurn;
      let isA = prev.isAllyTurn;
      let isE = prev.isEnemyTurn;

      let pGauge = prev.playerGauge;
      let eGauge = prev.enemyGauge;
      const aGauges = { ...prev.allyGauges };

      // 情況一：玩家剛執行完其行動 (playerGauge 已被重置為 0，且 turnPhase 剛過)
      if (prev.playerGauge === 0 && (prev.activeTurnOwner === null || prev.activeTurnOwner === "player")) {
        // 進入隊友回合，或者如果沒有隊友，則直接進入敵方回合
        if (activeTeammates.length > 0) {
          const firstTm = activeTeammates[0];
          nextOwner = firstTm;
          isP = false;
          isA = true;
          isE = false;

          pGauge = Math.max(30, Math.min(80, Math.round((pSpeed / (pSpeed + eSpeed)) * 100)));
          eGauge = Math.max(30, Math.min(85, Math.round((eSpeed / pSpeed) * 80)));
          activeTeammates.forEach(id => {
            aGauges[id] = id === firstTm ? 100 : Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
          });

          setTimeout(() => {
            performAllyAttack(firstTm);
          }, 600);
        } else {
          // 直接進入敵方回合
          nextOwner = "enemy";
          isP = false;
          isA = false;
          isE = true;

          pGauge = Math.max(30, Math.min(80, Math.round((pSpeed / (pSpeed + eSpeed)) * 100)));
          eGauge = 100;
          activeTeammates.forEach(id => {
            aGauges[id] = Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
          });

          setTimeout(() => {
            performEnemyAttack();
          }, 600);
        }

        return {
          ...prev,
          activeTurnOwner: nextOwner,
          isPlayerTurn: isP,
          isAllyTurn: isA,
          isEnemyTurn: isE,
          playerGauge: pGauge,
          enemyGauge: eGauge,
          allyGauges: aGauges
        };
      }

      // 情況二：主動隊友剛執行完其行動
      if (prev.isAllyTurn && prev.activeTurnOwner && activeTeammates.includes(prev.activeTurnOwner)) {
        const currentTmIdx = activeTeammates.indexOf(prev.activeTurnOwner);
        if (currentTmIdx > -1 && currentTmIdx < activeTeammates.length - 1) {
          // 還有下一位隊友需要行動
          const nextTm = activeTeammates[currentTmIdx + 1];
          nextOwner = nextTm;
          isP = false;
          isA = true;
          isE = false;

          pGauge = Math.max(30, Math.min(80, Math.round((pSpeed / (pSpeed + eSpeed)) * 100)));
          eGauge = Math.max(30, Math.min(85, Math.round((eSpeed / pSpeed) * 80)));
          activeTeammates.forEach(id => {
            aGauges[id] = id === nextTm ? 100 : Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
          });

          setTimeout(() => {
            performAllyAttack(nextTm);
          }, 600);
        } else {
          // 所有隊友都行動完畢，輪到敵方行動
          nextOwner = "enemy";
          isP = false;
          isA = false;
          isE = true;

          pGauge = Math.max(30, Math.min(80, Math.round((pSpeed / (pSpeed + eSpeed)) * 100)));
          eGauge = 100;
          activeTeammates.forEach(id => {
            aGauges[id] = Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
          });

          setTimeout(() => {
            performEnemyAttack();
          }, 600);
        }

        return {
          ...prev,
          activeTurnOwner: nextOwner,
          isPlayerTurn: isP,
          isAllyTurn: isA,
          isEnemyTurn: isE,
          playerGauge: pGauge,
          enemyGauge: eGauge,
          allyGauges: aGauges
        };
      }

      // 情況三：敵方剛執行完行動，進入下一個行動週期 (Round)
      if (prev.isEnemyTurn || prev.activeTurnOwner === "enemy") {
        nextOwner = "player";
        isP = true;
        isA = false;
        isE = false;

        pGauge = 100; // 玩家準備就緒
        eGauge = Math.max(30, Math.min(85, Math.round((eSpeed / pSpeed) * 80)));
        activeTeammates.forEach(id => {
          aGauges[id] = Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
        });

        let nextDebt = prev.debt;
        if (prev.debtorInherentBuff === "loan_parasite" && prev.debt > 0) {
          const interest = Math.max(1, Math.ceil(prev.debt * 0.10));
          nextDebt += interest;
          setTimeout(() => {
            addLog(`💸 【高利貸寄生】行動結算：債務產生 10% 的高額滾動利息 +$${interest}！`);
          }, 50);
        }

        return {
          ...prev,
          activeTurnOwner: "player",
          isPlayerTurn: true,
          isAllyTurn: false,
          isEnemyTurn: false,
          playerGauge: 100,
          enemyGauge: eGauge,
          allyGauges: aGauges,
          debt: nextDebt
        };
      }

      // 默認 fallback 或初始狀態
      pGauge = 100;
      eGauge = Math.max(30, Math.min(85, Math.round((eSpeed / pSpeed) * 80)));
      activeTeammates.forEach(id => {
        aGauges[id] = Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
      });

      return {
        ...prev,
        activeTurnOwner: "player",
        isPlayerTurn: true,
        isAllyTurn: false,
        isEnemyTurn: false,
        playerGauge: 100,
        enemyGauge: eGauge,
        allyGauges: aGauges
      };
    });
  };

  // 隊友自動攻擊
  const performAllyAttack = (allyId: string) => {
    setDamagedTarget("enemy");
    setTimeout(() => {
      setDamagedTarget(null);
    }, 600);
    setS(prev => {
      if (!prev.enemy || prev.enemy.hp <= 0 || prev.hp <= 0) return prev;

      const t = getTeammateData(allyId);
      if (!t) return prev;

      const tmEq = prev.teammateEquip?.[allyId];
      let bonusAtk = 0;
      if (tmEq?.weapon) {
        const wp = EQUIPMENT.weapons.find(w => w.id === tmEq.weapon || w.name === tmEq.weapon);
        if (wp) bonusAtk += wp.atk;
      }
      if (tmEq?.accessory) {
        const ac = EQUIPMENT.accessories.find(a => a.id === tmEq.accessory || a.name === tmEq.accessory);
        if (ac) bonusAtk += Math.floor((ac.effectValue || 0) * 0.5);
      }

      const effectiveAtkMin = t.atkMin + bonusAtk;
      const effectiveAtkMax = t.atkMax + bonusAtk;

      let dmg = effectiveAtkMin + Math.floor(Math.random() * (effectiveAtkMax - effectiveAtkMin + 1));
      if (prev.attackBuffTurns > 0) dmg = Math.floor(dmg * prev.attackBuff);
      
      let actionMsg = " 發動【普通打擊】！";
      let skillName = "【普通打擊】";
      if (t.id === "assassin") {
        if (Math.random() < 0.35) {
          dmg = Math.floor(dmg * 2.2);
          skillName = "【幻影背刺】";
          actionMsg = " 施展【幻影背刺】致命暴擊破防！";
        } else {
          skillName = "【匕首疾風斬】";
          actionMsg = " 揮舞雙匕首劃出一道冷冽寒光發動【匕首疾風斬】！";
        }
      } else if (t.id === "warrior") {
        if (Math.random() < 0.3) {
          skillName = "【旋風重斬】";
          dmg = Math.floor(dmg * 1.5);
          actionMsg = " 施展【旋風重斬】斬開敵防！";
        } else {
          skillName = "【鋼鐵劈砍】";
          actionMsg = " 揮舞鋼鐵巨劍發動【鋼鐵劈砍】全力一擊！";
        }
      } else if (t.id === "mage") {
        if (Math.random() < 0.3) {
          skillName = "【奧術雷擊】";
          dmg = Math.floor(dmg * 1.6);
          actionMsg = " 唱誦毀滅雷霆降下【奧術雷擊】！";
        } else {
          skillName = "【奧術飛彈】";
          actionMsg = " 揮動法杖凝聚魔力發動【奧術飛彈】！";
        }
      } else if (t.id === "accountant") {
        dmg = Math.ceil(dmg * 1.2);
        skillName = "【算盤精算】";
        actionMsg = " 揮動金算盤精算敵方弱點與稅務漏洞發動【算盤精算】！";
      } else if (t.id === "bard") {
        skillName = "【催繳高音波】";
        actionMsg = " 狂彈豎琴大聲唱誦發動【催繳高音波】精神衝擊！";
      } else if (t.id === "guard") {
        dmg = Math.ceil(dmg * 1.1);
        skillName = "【盾擊衝撞】";
        actionMsg = " 揮舞斑駁重盾突進發動【盾擊衝撞】！";
      } else if (t.id === "miner") {
        dmg = Math.ceil(dmg * 1.3);
        skillName = "【無情重刨】";
        actionMsg = " 掄起沉重十字鎬發動【無情重刨】狠刨弱點！";
      } else if (t.id === "intern") {
        skillName = "【小火球術】";
        actionMsg = " 顫抖著吟唱出了快要炸開的【小火球術】！";
      }

      // 地形對傷害微調
      if (prev.currentTerrain === "plain") dmg = Math.ceil(dmg * 1.1);

      const nextEnemyHp = Math.max(0, prev.enemy.hp - dmg);
      addLog(`⚔️ 【隊友行動】${t.prefix}「${t.nickname}」${t.name} 使用技能 ${skillName} (${actionMsg.trim()})，造成 ${dmg} 點傷害！`);

      if (nextEnemyHp <= 0) {
        setTimeout(() => {
          winBattle(prev.enemy!);
        }, 300);
        return {
          ...prev,
          enemy: { ...prev.enemy, hp: 0 }
        };
      }

      setTimeout(() => {
        advanceATB();
      }, 500);

      return {
        ...prev,
        enemy: { ...prev.enemy, hp: nextEnemyHp }
      };
    });
  };

  // 敵方攻擊
  const performEnemyAttack = () => {
    setS(prev => {
      if (!prev.enemy || prev.enemy.hp <= 0 || prev.hp <= 0) return prev;

      if (prev.stunned > 0) {
        addLog(`💫 敵方行動：${prev.enemy.name} 被暈眩中，無法動彈！（剩餘 ${prev.stunned - 1} 回合）`);
        setTimeout(() => {
          advanceATB();
        }, 500);
        return {
          ...prev,
          stunned: prev.stunned - 1
        };
      }

      let nextEnemyHp = prev.enemy.hp;
      let nextPoisonTurns = prev.poisonTurns;
      if (prev.poisonTurns > 0) {
        const poisonDmg = Math.ceil(prev.enemy.maxHp * 0.08);
        nextEnemyHp = Math.max(0, nextEnemyHp - poisonDmg);
        nextPoisonTurns--;
        addLog(`💀 劇毒發作！${prev.enemy.name} 受到 ${poisonDmg} 點毒素流血傷！（剩餘 ${nextPoisonTurns} 回合）`);
      }

      if (nextEnemyHp <= 0) {
        setTimeout(() => {
          winBattle(prev.enemy!);
        }, 300);
        return {
          ...prev,
          enemy: { ...prev.enemy, hp: 0 }
        };
      }

      // Enemy skill selection based on monster type
      let enemySkill = "普通強擊";
      const eName = prev.enemy.name || "";
      if (eName.includes("混沌惡魔") || eName.includes("魔王")) {
        enemySkill = Math.random() < 0.5 ? "【虛空黑洞死光】" : "【暗黑撕裂爪】";
      } else if (eName.includes("騎士")) {
        enemySkill = Math.random() < 0.5 ? "【高利貸破產斬】" : "【鋼鐵衝撞】";
      } else if (eName.includes("哥布林")) {
        enemySkill = Math.random() < 0.5 ? "【毒飛鏢】" : "【陰險木棒猛擊】";
      } else if (eName.includes("巨魔")) {
        enemySkill = Math.random() < 0.5 ? "【狂暴重錘】" : "【地裂巨石】";
      } else if (eName.includes("狼") || eName.includes("犬")) {
        enemySkill = Math.random() < 0.5 ? "【狂暴獠牙撕咬】" : "【疾風爪擊】";
      } else {
        const genericSkills = ["【魔力衝擊波】", "【野蠻爪擊】", "【利齒撕咬】", "【邪惡打擊】"];
        enemySkill = genericSkills[Math.floor(Math.random() * genericSkills.length)];
      }

      if (prev.dodgeTurn) {
        addLog(`👾 【敵方行動】${prev.enemy.name} 施展技能 ${enemySkill} 發動猛攻，但你神乎其技地一閃，避開了魔物的所有攻勢！`);
        setTimeout(() => {
          advanceATB();
        }, 500);
        return {
          ...prev,
          dodgeTurn: false
        };
      }

      let dmg = prev.enemy.atk;
      
      // 天候/地形對敵攻加成
      if (prev.currentTerrain === "mountain") {
        dmg = Math.ceil(dmg * 1.15); // 山脈高難度
      } else if (prev.currentTerrain === "plain") {
        dmg = Math.ceil(dmg * 0.9); // 平原最簡單
      }

      let actionDesc = "";
      if (prev.enemyFrozen) {
        dmg = Math.max(1, dmg - Math.floor(dmg * 0.3));
        actionDesc += " (冰霜緩速減傷30%)";
      }

      if (prev.confessionBuff === "shield") {
        dmg = Math.ceil(dmg * 0.15);
        actionDesc += " (神恩絕對防禦吸收85%)";
      } else if (prev.defBonus) {
        dmg = Math.ceil(dmg * 0.5);
        actionDesc += " (格擋姿態受傷減半)";
      }

      let warriorDmg = 0;
      const hasWarrior = prev.teammates.includes("warrior");
      if (hasWarrior && Math.random() < 0.4) {
        warriorDmg = Math.ceil(dmg * 0.6);
        dmg = Math.ceil(dmg * 0.4);
        addLog(`👾 【敵方行動】${prev.enemy.name} 施展技能 ${enemySkill}${actionDesc} 發動猛攻！戰士勇者使用【守護嘲諷】替你檔下部分傷害，戰士承受 ${warriorDmg} 點，你承受 ${dmg} 點傷害！`);
        
        setTimeout(() => {
          setDamagedTarget("warrior");
          setTimeout(() => {
            setDamagedTarget(null);
          }, 600);
        }, 50);
      } else {
        addLog(`👾 【敵方行動】${prev.enemy.name} 施展技能 ${enemySkill}${actionDesc} 發動猛攻，對你造成 ${dmg} 點傷害！`);
        setTimeout(() => {
          setDamagedTarget("player");
          setTimeout(() => {
            setDamagedTarget(null);
          }, 600);
        }, 50);
      }

      setTimeout(() => {
        takeDamage(dmg);
        advanceATB();
      }, 100);

      return {
        ...prev,
        enemy: { ...prev.enemy, hp: nextEnemyHp },
        defBonus: false,
        attackBuffTurns: prev.attackBuffTurns > 0 ? prev.attackBuffTurns - 1 : 0
      };
    });
  };

  // Inflation & Expenses
  const applyInflation = (rate: number) => {
    const nr = S.inflation * rate;
    const finalInflation = nr > S.maxInflation ? S.maxInflation : nr;
    setS(prev => ({ ...prev, inflation: finalInflation }));
    return finalInflation;
  };

  const spend = (amount: number, reason: string, displayName?: string): boolean => {
    if (amount <= 0) return true;
    let baseAmount = amount;
    if (S.debtorInherentBuff === "worker_soul" && (reason === "普通攻擊" || reason === "戰鬥消耗" || reason === "技能消耗" || displayName === "戰鬥消耗" || view === "battle")) {
      baseAmount = Math.ceil(amount * 0.5);
    }
    // 大教堂聖所內的所有操作不受負債（含信用膨脹）影響
    const isChurch = (view && view.startsWith("church_")) || displayName === "教堂" || (reason && (reason.includes("教堂") || reason.includes("鑑定") || reason.includes("重洗")));
    const cost = isChurch ? baseAmount : Math.ceil(baseAmount * S.inflation);

    const isWildernessSpending = view === "battle_main" || view === "prologue_battle" || 
                                 view === "explore_map" || view === "wild_camp" || view === "camp_site" ||
                                 reason === "普通攻擊" || reason === "戰鬥消耗" || reason === "技能消耗" || reason === "逃跑" || 
                                 reason === "野外開拓" || reason === "探索步" || reason === "野外露營" || reason === "露營" ||
                                 displayName === "逃跑" || displayName === "戰鬥消耗";

    if (isWildernessSpending) {
      const limit = S.debtLimit || 1500;
      const maxLimit = S.debtorInherentBuff === "overdraft_user" ? Math.ceil(limit * 1.2) : limit;
      
      if (S.debt + cost > maxLimit) {
        addLog(`⚠️ 欠款額度不足！${displayName || reason} 需要 ${money(cost)}，剩餘可欠款額度 ${money(maxLimit - S.debt)}`);
        setCreditLimitModal(true);
        return false;
      }
      setS(prev => {
        const nextDebt = prev.debt + cost;
        const limitVal = prev.debtLimit || 1500;
        const maxLimitVal = prev.debtorInherentBuff === "overdraft_user" ? Math.ceil(limitVal * 1.2) : limitVal;
        const isLimitReached = nextDebt >= maxLimitVal;
        let nextView = view;
        if (isLimitReached) {
          addLog(`🏦 當前欠款已達最高上限！-LV ${money(nextDebt)} / ${money(maxLimitVal)}`);
          addLog(`冒險中斷！你被銀行強制召回。`);
          setCreditLimitModal(true);
          nextView = "forced_return";
        }
        return {
          ...prev,
          debt: nextDebt,
          forcedReturn: isLimitReached ? true : prev.forcedReturn,
          enemy: isLimitReached ? null : prev.enemy,
          view: nextView
        };
      });
      addLog(`💰 ${displayName || reason}：預支 ${money(cost)}（負債 +${money(cost)}）`);
      return true;
    } else {
      if (S.coins < cost) {
        addLog(`⚠️ 金幣不足！${displayName || reason} 需要金幣 ${money(cost)}，當前持有 ${money(S.coins)}`);
        return false;
      }
      setS(prev => ({
        ...prev,
        coins: prev.coins - cost,
        depositBattles: prev.deposit > 0 ? prev.depositBattles + 1 : prev.depositBattles
      }));
      addLog(`🪙 ${displayName || reason}：支付金幣 ${money(cost)}`);
      return true;
    }
  };

  const addDebt = (amount: number, reason: string) => {
    if (amount <= 0) return;
    const limit = S.debtLimit || 1500;
    const maxLimit = S.debtorInherentBuff === "overdraft_user" ? Math.ceil(limit * 1.2) : limit;
    if (S.debt + amount > maxLimit) {
      addLog(`⚠️ 欠款額度不足！${reason} 需要 ${money(amount)}，剩餘可欠款額度 ${money(maxLimit - S.debt)}`);
      setCreditLimitModal(true);
      return;
    }
    setS(prev => {
      const nextDebt = prev.debt + amount;
      if (nextDebt >= maxLimit) {
        setCreditLimitModal(true);
      }
      return {
        ...prev,
        debt: nextDebt
      };
    });
    addLog(`${reason}：負債 +${money(amount)}`);
  };

  const takeDamage = (amount: number) => {
    let dmg = amount;
    if (S.holyAegisBattles && S.holyAegisBattles > 0) {
      addLog("✨ 【聖光防護】大教堂神聖結界發動！完全吸收了本次受到的傷害！");
      dmg = 0;
    }
    if (dmg > 0 && S.learnedSkills?.includes("shadow_step") && Math.random() < 0.15) {
      addLog("💨 【影之步】你身法飄逸，完全閃避了本次傷害！");
      dmg = 0;
    }
    if (dmg > 0 && S.learnedSkills?.includes("hold_ground") && (S.hp / getTotalMaxHp()) < 0.3) {
      dmg = Math.ceil(dmg * 0.5);
      addLog("🛡️ 【堅守陣地】殘血防禦意志爆發，受傷減半！");
    }
    if (S.contract === "shield") dmg = Math.ceil(dmg * 0.72);
    if (hasTeammate("guard")) dmg = Math.ceil(dmg * 0.9);
    
    setS(prev => {
      const nextHp = Math.max(0, prev.hp - dmg);
      let penaltyDebt = 0;
      if (prev.contract === "overdraft") {
        penaltyDebt = Math.ceil(dmg * 8);
        addLog(`惡意透支：負債 +${money(penaltyDebt)}`);
      }
      const actualDebt = prev.debt + penaltyDebt;
      
      if (nextHp <= 0) {
        if (prev.reviveCharges > 0) {
          const resurrectedHp = Math.ceil((prev.hp + getMaxHpBonus() + (DEBTOR_CLASSES[prev.debtorClass]?.hp || 100)) * 0.5);
          addLog(`🪙 復活硬幣發動！剩餘 ${prev.reviveCharges - 1} 次。`);
          return {
            ...prev,
            hp: resurrectedHp,
            reviveCharges: prev.reviveCharges - 1,
            debt: actualDebt
          };
        }
        addLog("💀 你倒下了。");
        // Trigger death log robbery
        setTimeout(() => {
          triggerDeathRobbery();
        }, 100);
        setView("death");
        return {
          ...prev,
          hp: 0,
          alive: false,
          debt: actualDebt
        };
      }
      return {
        ...prev,
        hp: nextHp,
        debt: actualDebt
      };
    });
  };

  const triggerDeathRobbery = () => {
    const enemyName = S.enemy?.name || "魔物";
    
    // 檢查是不是真的窮光蛋
    if (S.gold <= 0 && S.coins <= 0 && S.inventory.length === 0) {
      addLog(`💀 【打劫事件】${enemyName} 翻了翻發現眼前的人窮得連石頭都不如，吐了口水離開。`);
      return;
    }
    
    // 機率打劫：拿走金幣、金塊，或是包包裡的裝備/道具
    setS(prev => {
      let g = prev.gold;
      let c = prev.coins;
      let inv = [...prev.inventory];
      let robbedMsg = "";

      // 優先偷道具
      if (inv.length > 0 && Math.random() < 0.5) {
        const stolenItem = inv.pop();
        robbedMsg = `💀 【打劫事件】${enemyName} 翻了翻口袋發現拿走了你身上的【${stolenItem}】罵罵咧咧地走了。`;
      } else {
        // 否則偷金幣
        if (c > 0) {
          const robAmt = Math.min(c, 25 + Math.floor(Math.random() * 25));
          c -= robAmt;
          robbedMsg = `💀 【打劫事件】${enemyName} 翻了翻口袋發現拿走了你身上的 $${robAmt} 金幣，吐了口水離開。`;
        } else if (g > 0) {
          g -= 1;
          robbedMsg = `💀 【打劫事件】${enemyName} 翻了翻口袋發現拿走了你身上的 1 塊金塊，吐了口水離開。`;
        } else {
          robbedMsg = `💀 【打劫事件】${enemyName} 翻了翻發現眼前的人窮得連石頭都不如，吐了口水離開。`;
        }
      }

      addLog(robbedMsg);
      let nextDebt = prev.debt;
      if (prev.debtorInherentBuff === "desperate_rise") {
        nextDebt += 100;
        setTimeout(() => {
          addLog("💀 【絕望的奮起】因開拓失敗，被帝國追討違約金 $100！");
        }, 30);
      }
      return {
        ...prev,
        gold: g,
        coins: c,
        inventory: inv,
        debt: nextDebt
      };
    });
  };

  // Prologue setup
  const startPrologueBattle = () => {
    setS(prev => ({
      ...prev,
      prologueDone: false,
      prologueClass: null,
      bossHp: 200,
      bossMaxHp: 200,
      bossAtk: 25,
      bossDef: 10,
      battleTurn: 0
    }));
    setView("prologue_class");
    addLog("勇者小隊站在魔王面前。請選擇你的角色。");
  };

  const choosePrologueClass = (cls: string) => {
    const c = PROLOGUE_CLASSES[cls];
    setS(prev => ({
      ...prev,
      prologueClass: cls,
      hp: c.hp,
      maxHp: c.hp,
      playerSkills: CLASS_SKILLS[cls] ? CLASS_SKILLS[cls].map(s => ({ ...s, level: 1 })) : []
    }));
    addLog(`你選擇了 ${c.name}。開始魔王戰！`);
    setView("prologue_battle");
  };

  const prologueAfterPlayerAction = (playerActed: boolean, dmg: number, text: string) => {
    const c = activePrologue();
    if (!c) return;

    let currentBossHp = S.bossHp;
    if (playerActed && dmg > 0) {
      currentBossHp -= dmg;
      addLog(`${text} 造成 ${dmg} 點傷害！`);
    } else if (text) {
      addLog(text);
    }

    if (currentBossHp <= 0) {
      addLog("🎉 魔王倒下！你贏了！");
      addLog("你興奮地將武器往魔王的遺骸扔去——但武器反彈回來！鏘！");
      addLog("你的腦袋被自己的武器砸中！（頭上腫了一個大包...）");
      setS(prev => ({ ...prev, bossHp: 0, bump: true }));
      setView("prologue_curse");
      return;
    }

    // Teammate Attacks
    const allies = [
      { name: "戰士", dmgMin: 8, dmgMax: 15 },
      { name: "法師", dmgMin: 12, dmgMax: 22 },
      { name: "刺客", dmgMin: 10, dmgMax: 18 }
    ];
    const clsMap: Record<string, number> = { warrior: 0, mage: 1, assassin: 2 };
    const allyList = allies.filter((_, i) => i !== clsMap[S.prologueClass || ""]);
    
    for (const ally of allyList) {
      if (currentBossHp <= 0) break;
      let allyDmg = ally.dmgMin + Math.floor(Math.random() * (ally.dmgMax - ally.dmgMin + 1));
      let msg = `${ally.name} 發動攻擊！`;
      if (ally.name === "刺客" && Math.random() < 0.3) {
        allyDmg = Math.floor(allyDmg * 2);
        msg = `${ally.name} 暴擊！`;
      }
      currentBossHp -= allyDmg;
      addLog(`${msg} 造成 ${allyDmg} 點傷害！`);
    }

    if (currentBossHp <= 0) {
      addLog("🎉 魔王倒下！你贏了！");
      addLog("你興奮地將武器往魔王的遺骸扔去——但武器反彈回來！鏘！");
      addLog("你的腦袋被自己的武器砸中！（頭上腫了一個大包...）");
      setS(prev => ({ ...prev, bossHp: 0, bump: true }));
      setView("prologue_curse");
      return;
    }

    // Boss retaliation
    let bossDmg = S.bossAtk + Math.floor(Math.random() * 8) - Math.floor(c.def / 2);
    bossDmg = Math.max(1, bossDmg);
    let nextDefBonus = false;
    if (S.defBonus) {
      bossDmg = Math.floor(bossDmg / 2);
      addLog("你成功格擋！");
      nextDefBonus = false;
    }
    const nextHp = S.hp - bossDmg;
    addLog(`魔王造成 ${bossDmg} 點傷害！`);

    if (nextHp <= 0) {
      addLog("💀 你倒下了...");
      setView("gameover");
      setS(prev => ({ ...prev, hp: 0, bossHp: currentBossHp }));
      return;
    }

    setS(prev => ({
      ...prev,
      hp: nextHp,
      bossHp: currentBossHp,
      battleTurn: prev.battleTurn + 1,
      defBonus: nextDefBonus
    }));
  };

  const prologueAttackNormal = () => {
    const c = activePrologue();
    if (!c) return;
    let dmg = c.atk + Math.floor(Math.random() * 10) - Math.floor(S.bossDef / 2);
    dmg = Math.max(1, dmg);
    prologueAfterPlayerAction(true, dmg, `你揮出 ${c.weapon}！`);
  };

  const prologueAttackHeavy = () => {
    const c = activePrologue();
    if (!c) return;
    let dmg = Math.floor((c.atk + Math.floor(Math.random() * 10)) * 1.5) - Math.floor(S.bossDef / 2);
    dmg = Math.max(1, dmg);
    setS(prev => ({ ...prev, hp: Math.max(1, prev.hp - 10) }));
    prologueAfterPlayerAction(true, dmg, "你爆發出全力一擊！但反作用力讓你 -10 HP！");
  };

  const prologueAttackDefend = () => {
    setS(prev => ({ ...prev, defBonus: true }));
    prologueAfterPlayerAction(false, 0, "你舉起武器，進入防禦姿態。");
  };

  const prologueUseSkill = (idx: number) => {
    const c = activePrologue();
    if (!c) return;
    const skill = c.skills[idx];
    if (!skill) return;

    let dmg = 0;
    let extraMsg = "";
    if (skill.mult) {
      dmg = Math.floor((c.atk + Math.random() * 10) * skill.mult) - Math.floor(S.bossDef / 2);
      dmg = Math.max(1, dmg);
    }

    if (skill.extra === "stun") extraMsg = " 魔王被暈眩！";
    else if (skill.extra === "def_up") {
      setS(prev => ({ ...prev, defBonus: true }));
      extraMsg = " 防禦力提升！";
    }
    else if (skill.extra === "self_damage") {
      setS(prev => ({ ...prev, hp: Math.max(1, prev.hp - Math.floor(prev.maxHp * 0.1)) }));
      extraMsg = " 自身受到反噬！";
    }
    else if (skill.extra === "burn") extraMsg = " 魔王被燃燒！";
    else if (skill.extra === "freeze") extraMsg = " 魔王被冰凍！";
    else if (skill.extra === "aoe") extraMsg = " 範圍傷害！";
    else if (skill.extra === "instant_kill") {
      if (Math.random() < 0.1) {
        setS(prev => ({ ...prev, bossHp: 0 }));
        addLog(`你使出「${skill.name}」！一擊必殺！`);
        setView("prologue_curse");
        return;
      }
      extraMsg = " 秒殺失敗！";
    }

    prologueAfterPlayerAction(true, dmg, `你使出「${skill.name}」！`);
  };

  // Interactive Curse sequence
  const triggerCurse = () => {
    setView("level_drop");
    const levelStages = [
      "LV.MAX", "LV.999", "LV.800", "LV.500", "LV.300", "LV.100",
      "LV.80", "LV.50", "LV.30", "LV.10", "LV.5", "LV.1",
      "-LV $ 0", "-LV $ 5", "-LV $ 10", "-LV $ 25", "-LV $ 50",
      "-LV $ 80", "-LV $ 100", "-LV $ 150", "-LV $ 200", "-LV $ 300",
      "-LV $ 400", "-LV $ 500", "-LV $ 600", "-LV $ 700", "-LV $ 800",
      "-LV $ 900", "-LV $ 950", "-LV $ 990", "-LV $ 0"
    ];
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = Math.min(100, Math.round((step / levelStages.length) * 100));
      const currentLevel = levelStages[Math.min(step, levelStages.length - 1)];
      setLevelDropProgress(progress);
      setLevelDropText(currentLevel);
      
      if (step >= levelStages.length) {
        clearInterval(interval);
        setTimeout(() => {
          setS(prev => ({
            ...prev,
            prologueDone: true,
            debt: 0,
            credit: 0,
            creditExp: 0,
            creditLevel: 1,
            totalCreditExp: 0,
            extraCreditLimit: 0,
            gold: 50,
            coins: 0,
            savings: 0,
            deposit: 0,
            depositMax: 500,
            depositInterest: 0,
            depositBattles: 0,
            hp: 50,
            maxHp: 50,
            equip: 0,
            rage: 10,
            alive: true,
            bump: true,
            weapon: "broken_sword",
            armor: "cloth_armor",
            accessory: null,
            inventory: []
          }));
          setView("prologue_archangel");
          addLog("👼 溫暖的聖光灑落，大天使降臨了...");
        }, 600);
      }
    }, 150);
  };

  // Debtor selection lottery roll
  const startDebtorRoll = () => {
    if (isRollingDebtor || debtorOptions.length < 4) return;
    setIsRollingDebtor(true);
    setRolledDebtorId(null);
    addLog("🎰 啟動清算命運輪盤！宿命之光在組合卡片上飛速閃爍...");

    const rollableIds = debtorOptions.map(opt => opt.id);
    const finalWinnerId = rollableIds[Math.floor(Math.random() * rollableIds.length)];
    
    const winnerIndex = rollableIds.indexOf(finalWinnerId);
    const steps: number[] = [];
    let curIndex = rollHighlightIndex;
    for (let i = 0; i < 18; i++) {
      curIndex = (curIndex + 1) % rollableIds.length;
      steps.push(curIndex);
    }
    // ensure last is winner
    steps.push(winnerIndex);

    let accumulatedDelay = 0;
    steps.forEach((indexAtStep, stepIdx) => {
      // deceleration formula
      const delay = 50 + Math.pow(stepIdx, 2) * 2.5;
      accumulatedDelay += delay;

      setTimeout(() => {
        setRollHighlightIndex(indexAtStep);
        
        if (stepIdx === steps.length - 1) {
          // Final landing!
          setRolledDebtorId(finalWinnerId);
          setIsRollingDebtor(false);
          const winnerOpt = debtorOptions.find(o => o.id === finalWinnerId);
          if (winnerOpt) {
            addLog(`🎉 叮咚！輪盤停止。恭喜抽中宿命職業：【${winnerOpt.name}】！`);
            addLog(`📜 獲得天生特質：【${winnerOpt.buff.name}】`);
          }
        }
      }, accumulatedDelay);
    });
  };

  // Debtor selection
  const selectDebtorClass = (id: string) => {
    const opt = debtorOptions.find(o => o.id === id);
    if (!opt) return;
    setS(prev => ({
      ...prev,
      debtorClass: opt.cls,
      debtorPrefix: opt.prefix,
      debtorClassName: opt.name,
      debtorInherentBuff: opt.buff.id,
      debtorBuffName: opt.buff.name,
      debtorBuffDesc: opt.buff.desc,
      baseHp: opt.hp,
      hp: opt.hp,
      maxHp: opt.hp,
      gold: opt.gold,
      coins: 0,
      savings: opt.savings,
      deposit: 0,
      debt: opt.debt,
      credit: 1000,
      creditExp: 0,
      creditLevel: 1,
      totalCreditExp: 0,
      extraCreditLimit: 0,
      strength: opt.strength,
      agility: opt.agility,
      commerce: opt.commerce,
      stamina: opt.stamina,
      debtLimit: opt.debtLimit,
      attributePoints: 0,
      skillPoints: 0,
      equip: 1,
      rage: opt.rage,
      mainQuest: "M1",
      mainQuestProgress: 0
    }));

    try {
      localStorage.setItem("debtHero_selectedChar", JSON.stringify({
        hp: opt.hp,
        gold: opt.gold,
        debt: opt.debt,
        savings: opt.savings,
        name: opt.name,
        prefix: opt.prefix,
        cls: opt.cls,
        buffId: opt.buff.id,
        strength: opt.strength,
        agility: opt.agility,
        commerce: opt.commerce,
        stamina: opt.stamina,
        debtLimit: opt.debtLimit
      }));
    } catch (e) {
      console.error(e);
    }

    addLog(`你選擇了【${opt.name}】。攜帶著天生特質【${opt.buff.name}】，負債人生正式開始。`);
    setView("menu");
  };

  const recruitTeammate = (id: string) => {
    const tm = getTeammateData(id);
    if (!tm) return;
    if (S.teammates.includes(id)) {
      addLog("你隊伍中已經有此夥伴了！");
      return;
    }
    if (S.teammates.length >= 2) {
      addLog("❌ 冒險隊伍已滿編 (上限 2 人)！請先至「破產者小酒館」解雇現有成員，或在「大教堂」進行向大天使禱告靈魂輪迴。");
      return;
    }

    const isVeteran = S.veteranTeammates?.includes(id);
    if (isVeteran) {
      setS(prev => ({
        ...prev,
        teammates: [...prev.teammates, id],
        tavernTeammates: (prev.tavernTeammates || ["accountant", "bard", "guard", "miner"]).filter(t => t !== id)
      }));
      addLog(`🤝 前輩勇者歸隊！【${tm.prefix}${tm.name}】無代價重新加入了您的冒險小隊！`);
    } else {
      const cost = Math.ceil(tm.cost * S.inflation);
      if (!spend(cost, `招募${tm.name}`, "小酒館")) return;
      setS(prev => ({
        ...prev,
        teammates: [...prev.teammates, id],
        tavernTeammates: (prev.tavernTeammates || ["accountant", "bard", "guard", "miner"]).filter(t => t !== id)
      }));
      addLog(`🍻 招募成功！【${tm.prefix}${tm.name}】已加入您的債務冒險小隊！`);
    }
  };

  const prayToArchangel = (count: number = 1) => {
    const validCount = Math.max(1, count);
    const totalCost = validCount * 10;
    if (S.coins < totalCost) {
      addLog(`❌ 大教堂牧師鄙視：『向大天使獻上 ${validCount} 次連抽禱告至少需要 ${totalCost} 金幣！』`);
      return;
    }

    setIsPrayingEffect(true);
    setLastDrawBatchCount(validCount);

    setTimeout(() => {
      setIsPrayingEffect(false);

      const PITY_THRESHOLD = 10;
      let currentPity = S.summonPityCount || 0;

      const heroes = ["warrior", "mage", "assassin"];
      const normals = ["accountant", "bard", "guard", "miner", "intern"];

      let rolledId = "";
      let isHeroic = false;
      let triggerPity = false;
      let drawsExecuted = 0;

      for (let i = 0; i < validCount; i++) {
        drawsExecuted++;
        currentPity++;

        let isHeroRoll = Math.random() < 0.35;
        if (currentPity >= PITY_THRESHOLD) {
          isHeroRoll = true;
          triggerPity = true;
        }

        if (isHeroRoll) {
          rolledId = heroes[Math.floor(Math.random() * heroes.length)];
          if (rolledId === S.debtorClass) {
            const backupList = TEAMMATES.map(t => t.id).filter(id => id !== S.debtorClass);
            rolledId = backupList[Math.floor(Math.random() * backupList.length)] || "warrior";
          }
          isHeroic = true;
          currentPity = 0; // Reset pity upon reaching hero stage
          break; // Stop loop upon hero draw to reserve remaining budget
        } else {
          rolledId = normals[Math.floor(Math.random() * normals.length)];
          if (rolledId === S.debtorClass) {
            const backupList = normals.filter(id => id !== S.debtorClass);
            rolledId = backupList[Math.floor(Math.random() * backupList.length)] || "bard";
          }
        }
      }

      const rolledTm = getTeammateData(rolledId);
      if (!rolledTm) return;

      const randQuote = HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)];
      setSummonHeroQuote(randQuote);

      const actualCost = drawsExecuted * 10;
      setS(prev => ({
        ...prev,
        coins: prev.coins - actualCost,
        summonPityCount: currentPity,
        depositBattles: prev.deposit > 0 ? (prev.depositBattles || 0) + drawsExecuted : (prev.depositBattles || 0)
      }));

      recordEffectiveAction("教堂聖壇禱告");
      if (drawsExecuted > 1) {
        addLog(`🪙 支付金幣 ${actualCost}，向大天使進行 ${drawsExecuted} 次連續祈禱！`);
      } else {
        addLog(`🪙 支付金幣 10，向大天使聖壇虔誠祈禱...`);
      }

      setIsPitySummon(triggerPity);
      setSummonedHeroId(rolledId);
      setSwapSelectedTeammateId(null);
      setSoulTucaoMsg(null);
      setSummonDialogueOpen(true);

      if (S.teammates.length < 2) {
        setS(prev => {
          const currentTms = prev.teammates || [];
          if (currentTms.includes(rolledId)) {
            return prev;
          }
          return {
            ...prev,
            teammates: [...currentTms, rolledId],
            tavernTeammates: (prev.tavernTeammates || ["accountant", "bard", "guard", "miner"]).filter(t => t !== rolledId)
          };
        });
        setSummonStatus('success');
        if (triggerPity) {
          addLog(`👼 大天使忍不住捧腹大笑嘲笑你：『哈哈哈～你是臉多黑，黑到連一個地縛靈都不理你。』大天使的慈善救濟觸發！保底喚醒了英雄【${rolledTm.name}】！`);
        } else if (isHeroic) {
          addLog(`👼 大天使感應到了你的虔誠！一個偉大的冒險者靈魂被招入現世，直接加入你的小隊！`);
        } else {
          addLog(`👼 大天使灑下微光：【${rolledTm.name}】的凡人靈魂被召喚了出來，直接加入你的小隊！`);
        }
      } else {
        setSummonStatus('swap_pending');
        if (triggerPity) {
          addLog(`👼 大天使忍不住捧腹大笑嘲笑你：『哈哈哈～你是臉多黑，黑到連一個地縛靈都不理你。』大天使的慈善救濟觸發！保底強制召喚了【${rolledTm.name}】！但隊伍已滿編，需要交接置換。`);
        } else {
          addLog(`👼 大天使召喚了【${rolledTm.name}】的靈魂！但你的小隊已滿編，必須指定一名舊成員前往酒館歸位交接。`);
        }
      }
    }, 800);
  };

  const confirmHeroReplacement = () => {
    if (!summonedHeroId) return;
    if (!swapSelectedTeammateId || !S.teammates.includes(swapSelectedTeammateId)) {
      setSoulTucaoMsg("一個充滿光輝的靈魂出現，默默地看著你說......『你沒事叫我出來幹嘛？圖開心啊？乖~小朋友不可以亂玩唷!』");
      return;
    }

    const newHero = getTeammateData(summonedHeroId);
    const oldTm = getTeammateData(swapSelectedTeammateId);
    if (!newHero || !oldTm) return;

    setS(prev => {
      const nextTeammates = prev.teammates.filter(t => t !== swapSelectedTeammateId);
      if (!nextTeammates.includes(summonedHeroId)) {
        nextTeammates.push(summonedHeroId);
      }
      
      const updatedTavern = prev.tavernTeammates && prev.tavernTeammates.length > 0
        ? [...prev.tavernTeammates]
        : ["accountant", "bard", "guard", "miner"];
      if (!updatedTavern.includes(swapSelectedTeammateId)) {
        updatedTavern.push(swapSelectedTeammateId);
      }
      const finalTavern = updatedTavern.filter(t => t !== summonedHeroId);

      const nextVeterans = prev.veteranTeammates ? [...prev.veteranTeammates] : [];
      if (!nextVeterans.includes(swapSelectedTeammateId)) {
        nextVeterans.push(swapSelectedTeammateId);
      }

      return {
        ...prev,
        teammates: nextTeammates,
        tavernTeammates: finalTavern,
        veteranTeammates: nextVeterans
      };
    });

    addLog(`🔄 靈魂輪迴交接完畢！【${newHero.name}】踏上旅程，【${oldTm.name}】正式卸下職務，前往酒館喝悶酒歸位。`);
    setSummonDialogueOpen(false);
    setSummonedHeroId(null);
    setSwapSelectedTeammateId(null);
    setSummonStatus(null);
    setSoulTucaoMsg(null);
  };

  const dismissTeammate = (id: string) => {
    const tm = getTeammateData(id);
    if (!tm) return;
    
    const quotes = [
      "「呵，嫌我沒用？你也不看看你那張在皇家銀行黑名單上的信用報告。」",
      "「要我走？可以啊，記得把上個月欠我的冒險津貼結清，喔我忘了，你連飯都吃不起了。」",
      "「沒關係，反正跟著一個天天被高利貸追殺的債務勇者，我也覺得挺丟臉的。」",
      "「好聚好散？免了吧。祝你早日死在荒野，這樣銀行就能直接拍賣你的遺體了。」"
    ];
    const randQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setDismissedQuote({ name: `${tm.prefix}${tm.name}`, text: randQuote });
    
    setS(prev => {
      const updatedTavern = prev.tavernTeammates && prev.tavernTeammates.length > 0
        ? [...prev.tavernTeammates]
        : ["accountant", "bard", "guard", "miner"];
      if (!updatedTavern.includes(id)) {
        updatedTavern.push(id);
      }
      const updatedVeterans = prev.veteranTeammates ? [...prev.veteranTeammates] : [];
      if (!updatedVeterans.includes(id)) {
        updatedVeterans.push(id);
      }
      return {
        ...prev,
        teammates: prev.teammates.filter(t => t !== id),
        tavernTeammates: updatedTavern,
        veteranTeammates: updatedVeterans
      };
    });
    addLog(`👋 你狠下心將 【${tm.name}】 踢出隊伍！他頭也不回地前往酒館歸位，留下一句惡毒的咒罵...`);
  };

  const doUnrequitedChurchDonation = () => {
    const randCost = Math.floor(Math.random() * 60) + 20;
    if (S.coins < randCost) {
      addLog(`⚠️ 教堂暴躁牧師冷冷地說：『聖母不收賒帳！這次無償捐獻要求 $${randCost} G，但你身上的金幣不足！』`);
      return;
    }
    setS(prev => ({
      ...prev,
      coins: prev.coins - randCost,
      churchRerollLockedVisits: 0,
      churchRerollsInVisit: 0
    }));
    addLog(`⛪ 【無償捐獻解鎖】你向大教堂無償捐獻了隨機金額 $${randCost} G 金幣！暴躁牧師平息了怒火，聖水重鑄與魔力注入封鎖已成功解鎖！`);
  };

  const rerollWeaponBuff = () => {
    if (S.creditExp >= S.credit) {
      addLog("❌ 【信用凍結】大教堂聖物閃爍出警示紅光！你的信用額度已耗盡，請先在「能力值」或狀態介面點擊「💳 提升信用評等 (審計升等)」進行解凍！");
      return;
    }

    if (!S.weapon) {
      addLog("❌ 大教堂牧師鄙視：你手上根本沒拿武器，要我重鑄個寂寞？先去裝備武器！");
      return;
    }
    
    if (S.churchRerollLockedVisits && S.churchRerollLockedVisits > 0) {
      addLog(`❌ 【重鑄被拒】牧師怒吼：『我說過，不准再來套利！去外面給我進出冒險野外村莊再造訪 ${S.churchRerollLockedVisits} 次後才准解鎖！』`);
      return;
    }

    const currentRerollCount = S.churchRerollsInVisit || 0;
    if (currentRerollCount >= 5) {
      setS(prev => ({
        ...prev,
        churchRerollLockedVisits: 2,
        churchRerollsInVisit: 0
      }));
      addLog("🚨 【神罰與濫用鎖定】大教堂聖器閃爍出不祥的紅光！「貪得無厭！你以為神明是你的免費老虎機嗎？！滾出去！接下來 2 次進村期間，教堂拒絕再為你提供服務！」");
      return;
    }

    // Cost to reroll: 15 gold
    const cost = 15;
    if (!spend(cost, "重鑄武器屬性", "教堂")) {
      return;
    }

    const rolledBuff = BUFFS[Math.floor(Math.random() * BUFFS.length)];
    setEquipBuffMap(prev => ({ ...prev, [S.weapon!]: rolledBuff }));
    setS(prev => ({
      ...prev,
      churchRerollsInVisit: (prev.churchRerollsInVisit || 0) + 1
    }));
    gainCreditExp(300);
    addLog(`🔮 【聖光重鑄】你花了 $15，牧師用聖水洗淨了你的【${getEquippedWeapon()?.name}】，賦予其全新神恩屬性：【${rolledBuff.name}】（${rolledBuff.desc}）！（信用消耗 +300）`);
  };

  const appraiseSelectedGear = (target: "weapon" | "armor" | "accessory" | { itemId: string; itemName: string }) => {
    let itemId = "";
    let itemName = "";
    if (typeof target === "object") {
      itemId = target.itemId;
      itemName = target.itemName;
    } else if (target === "weapon") {
      itemId = S.weapon || "";
      itemName = getEquippedWeapon()?.name || "";
    } else if (target === "armor") {
      itemId = S.armor || "";
      itemName = getEquippedArmor()?.name || "";
    } else {
      itemId = S.accessory || "";
      itemName = getEquippedAccessory()?.name || "";
    }

    if (!itemId) {
      addLog(`❌ 大教堂牧師鄙視：你並未選擇或裝備有效裝備，無法進行鑑定！`);
      return;
    }

    const isForged = (S.forgedItems || []).includes(itemId) || (S.forgedItems || []).includes(itemName);
    if (!isForged) {
      addLog(`❌ 【未熔煉】這件【${itemName}】尚未在鐵匠鋪完成過熔煉，前置解鎖條件未達成！必須先在鐵匠鋪完成熔煉後，才能進行聖光鑑定。`);
      return;
    }

    if (equipBuffMap[itemId]) {
      addLog(`❌ 【已鑑定】這件【${itemName}】已經有附加神恩屬性了，不需重複鑑定！如果要重洗屬性，請使用「重新注入魔力」功能。`);
      return;
    }

    // Cost to appraise: 5 gold
    const cost = 5;
    if (!spend(cost, `鑑定${itemName}`, "教堂")) {
      return;
    }

    const rolledBuff = BUFFS[Math.floor(Math.random() * BUFFS.length)];
    setEquipBuffMap(prev => ({ ...prev, [itemId]: rolledBuff }));
    gainCreditExp(100);
    addLog(`🔮 【聖光鑑定】你花了 $5 金幣，大教堂的溫暖聖光拂去【${itemName}】表面的塵埃，成功鑑定出其隱藏屬性：【${rolledBuff.name}】（${rolledBuff.desc}）！（信用消耗 +100）`);
    recordEffectiveAction("教堂聖光鑑定");
  };

  const rerollSelectedGear = (target: "weapon" | "armor" | "accessory" | { itemId: string; itemName: string }) => {
    let itemId = "";
    let itemName = "";
    if (typeof target === "object") {
      itemId = target.itemId;
      itemName = target.itemName;
    } else if (target === "weapon") {
      itemId = S.weapon || "";
      itemName = getEquippedWeapon()?.name || "";
    } else if (target === "armor") {
      itemId = S.armor || "";
      itemName = getEquippedArmor()?.name || "";
    } else {
      itemId = S.accessory || "";
      itemName = getEquippedAccessory()?.name || "";
    }

    if (!itemId) {
      addLog(`❌ 大教堂牧師：你並未選擇或裝備有效裝備，無法進行重鑄！`);
      return;
    }

    if (!equipBuffMap[itemId]) {
      addLog(`❌ 【未鑑定】這件【${itemName}】尚未進行聖光鑑定，無法重洗！請先對它進行「聖光鑑定」解開屬性後才能重洗！`);
      return;
    }

    if (S.churchRerollLockedVisits && S.churchRerollLockedVisits > 0) {
      addLog(`❌ 【重鑄被拒】牧師怒吼：『我說過，不准再來套利！去外面給我進出冒險野外村莊再造訪 ${S.churchRerollLockedVisits} 次後才准解鎖！』`);
      return;
    }

    const currentRerollCount = S.churchRerollsInVisit || 0;
    if (currentRerollCount >= 5) {
      setS(prev => ({
        ...prev,
        churchRerollLockedVisits: 2,
        churchRerollsInVisit: 0
      }));
      addLog("🚨 【神罰與濫用鎖定】大教堂聖器閃爍出不祥的紅光！「貪得無厭！你以為神明是你的免費老虎機嗎？！滾出去！接下來 2 次進村期間，教堂拒絕再為你提供服務！」");
      return;
    }

    // Cost to reroll: 15 gold
    const cost = 15;
    if (!spend(cost, `重洗${itemName}屬性`, "教堂")) {
      return;
    }

    const rolledBuff = BUFFS[Math.floor(Math.random() * BUFFS.length)];
    setEquipBuffMap(prev => ({ ...prev, [itemId]: rolledBuff }));
    setS(prev => ({
      ...prev,
      churchRerollsInVisit: (prev.churchRerollsInVisit || 0) + 1
    }));
    gainCreditExp(300);
    addLog(`🔮 【重新注入魔力】你花了 $15，牧師用聖水洗淨了你的【${itemName}】，賦予其全新神恩屬性：【${rolledBuff.name}】（${rolledBuff.desc}）！（信用消耗 +300）`);
    recordEffectiveAction("教堂屬性重洗");
  };

  // Quest Tracker
  const completeMainQuest = (questId: string) => {
    const q = MAIN_QUESTS[questId];
    if (!q) return;
    addLog(`⭐ 主線任務完成：${q.name}！`);
    setS(prev => {
      let nextGold = prev.gold;
      let nextCleared = prev.gameCleared;
      let nextExtraCreditLimit = prev.extraCreditLimit || 0;
      if (q.reward.credit) nextExtraCreditLimit += q.reward.credit;
      if (q.reward.gold) nextGold += q.reward.gold;
      if (q.reward.unlock === "week2") nextCleared = true;
      if (q.reward.ending) {
        setView("ending");
      }
      
      const nextTotalExp = prev.totalCreditExp || 0;
      const nextCredit = Math.floor(nextTotalExp * 12) + nextExtraCreditLimit;
      
      const keys = Object.keys(MAIN_QUESTS);
      const currentIndex = keys.indexOf(questId);
      const nextQuestId = currentIndex < keys.length - 1 ? keys[currentIndex + 1] : null;
      if (nextQuestId) addLog(`⭐ 新主線任務：${MAIN_QUESTS[nextQuestId].name}`);
      
      return {
        ...prev,
        extraCreditLimit: nextExtraCreditLimit,
        credit: nextCredit,
        gold: nextGold,
        gameCleared: nextCleared,
        mainQuest: nextQuestId,
        mainQuestProgress: 0
      };
    });
  };

  const updateMainQuest = (amount: number) => {
    if (!S.mainQuest) return;
    const q = MAIN_QUESTS[S.mainQuest];
    if (!q) return;
    const nextProgress = (S.mainQuestProgress || 0) + amount;
    if (nextProgress >= q.need) {
      completeMainQuest(S.mainQuest);
    } else {
      setS(prev => ({ ...prev, mainQuestProgress: nextProgress }));
    }
  };

  // Side Quests
  const acceptSideQuest = () => {
    if (S.sideQuest) {
      addLog("你已經有一個非主線任務了。");
      return;
    }
    const sideQuests = [
      { type: "hunt", target: "史萊姆", need: 3, label: "消滅 3 隻史萊姆", reward: { coins: 40, gold: 10 } },
      { type: "hunt", target: "哥布林", need: 2, label: "獵殺 2 隻哥布林", reward: { coins: 60, gold: 15 } },
      { type: "hunt", target: "騎士", need: 2, label: "討伐 2 隻騎士", reward: { coins: 80, gold: 20 } },
      { type: "collect", target: "鐵礦石", need: 5, label: "收集 5 個鐵礦石", reward: { coins: 50, gold: 10 } }
    ];
    const picked = sideQuests[Math.floor(Math.random() * sideQuests.length)];
    setS(prev => ({
      ...prev,
      sideQuest: picked,
      sideQuestProgress: 0
    }));
    addLog(`○ 接受任務：${picked.label}`);
    setView("menu");
  };

  const completeSideQuest = () => {
    if (!S.sideQuest) return;
    const q = S.sideQuest;
    addLog(`○ 非主線任務完成：${q.label}！`);
    setS(prev => {
      let nextCoins = prev.coins;
      let nextGold = prev.gold;
      if (q.reward.coins) nextCoins += q.reward.coins;
      if (q.reward.gold) nextGold += q.reward.gold;
      return {
        ...prev,
        coins: nextCoins,
        gold: nextGold,
        sideQuest: null,
        sideQuestProgress: 0
      };
    });
  };

  // Wanted Quests (通緝任務系統)
  const acceptWantedQuest = (questId: string) => {
    if (S.gold < 3) {
      addLog("❌ 【接取失敗】你的金幣不足 $3 G，無法支付通緝任務保證金！");
      return;
    }

    setS(prev => {
      let targetName = "";
      const updated = (prev.wantedQuests || []).map(q => {
        if (q.id === questId) {
          targetName = q.targetName;
          return {
            ...q,
            isAccepted: true
          };
        }
        return q;
      });

      addLog(`📜 【通緝公告】你預付了 $3 G 保證金，正式接取對「${targetName}」的通緝任務！完成討伐後可全額領回保證金與懸賞金。`);
      return {
        ...prev,
        gold: prev.gold - 3,
        wantedQuests: updated
      };
    });
  };

  const completeWantedQuest = (questId: string) => {
    setS(prev => {
      let reward = 0;
      let targetName = "";
      const updated = (prev.wantedQuests || []).map(q => {
        if (q.id === questId) {
          reward = q.rewardCoins;
          targetName = q.targetName;
          return {
            ...q,
            isSubmitted: true
          };
        }
        return q;
      });

      const totalReturn = reward + 3;
      addLog(`💰 【通緝懸賞結算】成功交付對「${targetName}」的通緝任務！獲得懸賞金額 $${reward} G，並全額領回 $3 G 保證金！`);

      return {
        ...prev,
        gold: prev.gold + totalReturn,
        wantedQuests: updated
      };
    });
  };

  useEffect(() => {
    if (view === "questBoard") {
      setS(prev => {
        const { quests, refreshDay } = generateWantedQuestsList(prev.day || 1, prev.wantedQuests || [], prev.wantedLastRefreshDay || 0);
        if (quests !== prev.wantedQuests || refreshDay !== prev.wantedLastRefreshDay) {
          return {
            ...prev,
            wantedQuests: quests,
            wantedLastRefreshDay: refreshDay
          };
        }
        return prev;
      });
    }
  }, [view]);

  // Bank Functions
  const exchangeGold = (overrideAmount?: number) => {
    const amt = overrideAmount !== undefined ? overrideAmount : exchangeSliderAmount;
    if (S.gold <= 0) {
      addLog("銀行行員：你連一塊金塊都沒有，拿什麼兌換？");
      return;
    }
    if (amt <= 0 || amt > S.gold) {
      addLog(`銀行行員：請輸入正確的兌換數量 (1 ~ ${S.gold})。`);
      return;
    }

    const commBonusEach = Math.floor(((S.commerce || 10) - 10) * 0.2);
    const goldToCoins = amt * 10;
    const commBonusTotal = amt * commBonusEach;
    
    // 15% transaction fee (causing asset value to shrink)
    const feeCoins = Math.ceil(goldToCoins * 0.15);
    const totalCoinsGained = goldToCoins + commBonusTotal - feeCoins;

    setS(prev => ({
      ...prev,
      gold: prev.gold - amt,
      coins: prev.coins + totalCoinsGained,
      depositBattles: prev.deposit > 0 ? prev.depositBattles + 1 : prev.depositBattles
    }));

    if (commBonusTotal > 0) {
      addLog(`🏦 兌換成功！已將 ${amt} 金塊兌換為 ${totalCoinsGained} 金幣 (含經商加成：多得 ${commBonusTotal} 金幣，扣除 15% 手續費：-${feeCoins} 金幣，淨得 ${totalCoinsGained} 金幣)`);
    } else {
      addLog(`🏦 兌換成功！已將 ${amt} 金塊兌換為 ${totalCoinsGained} 金幣 (扣除 15% 手續費：-${feeCoins} 金幣，淨得 ${totalCoinsGained} 金幣)`);
    }
    setExchangeSliderAmount(1);
  };

  const repayDebt = () => {
    if (S.coins <= 0) {
      addLog("銀行行員：你連一塊金幣都沒有，拿什麼還債？");
      return;
    }
    const amount = Math.min(S.coins, S.debt);
    if (amount <= 0) {
      addLog("銀行行員：你已經沒有債務了，想借更多錢嗎？");
      return;
    }
    
    setS(prev => {
      const nextCoins = prev.coins - amount;
      const nextDebt = prev.debt - amount;
      
      addLog(`✅ 成功償還 ${money(amount)} 負債。`);
      
      // 還債能賺取信用經驗值！1 金幣 = 2 信用 EXP
      setTimeout(() => {
        gainCreditExp(amount * 2);
        addLog("⛪ 牧師傳來口信：『聽說你還債了？算你還有點良心。有空來教堂告解吧，主會給你點新鮮的契約加持。』");
      }, 50);

      if (nextDebt <= 0) {
        setView("contract");
        addLog("🎉 債務歸零！新的信用契約已經放在你面前。");
      }
      return {
        ...prev,
        coins: nextCoins,
        debt: Math.max(0, nextDebt),
        hasRepaidSinceLastConfession: true, // 標記已還款，可在教堂進行告解更換 Buff
        depositBattles: prev.deposit > 0 ? prev.depositBattles + 1 : prev.depositBattles
      };
    });
  };

  const makeTimeDeposit = (amount: number) => {
    if (amount <= 0 || amount > S.coins) {
      addLog("銀行行員：存入金額不正確，或已超過您的持有金幣上限！");
      return;
    }
    setS(prev => ({
      ...prev,
      coins: prev.coins - amount,
      deposit: amount,
      depositBattles: 0,
      depositStartMapProgress: prev.mapProgress || 0
    }));
    addLog(`🏦 【定存契約立約】您成功存入了 ${money(amount)} 金幣！定存合約成立，當前解鎖進度：0%。`);
  };

  const withdrawTimeDeposit = () => {
    const mapEarned = Math.max(0, (S.mapProgress || 0) - (S.depositStartMapProgress || 0));
    const P = Math.min(100, Math.floor((S.depositBattles || 0) / 2 + mapEarned * 2));
    if (S.deposit <= 0) {
      addLog("銀行行員：您當前沒有任何定存單。");
      return;
    }

    if (P >= 100) {
      const reward = Math.round(S.deposit * 1.05);
      setS(prev => ({
        ...prev,
        coins: prev.coins + reward,
        deposit: 0,
        depositBattles: 0,
        depositStartMapProgress: 0
      }));
      addLog(`🎉 【定存到期提領】恭喜！定存合約已完全解鎖成熟。您提領了本金 ${money(S.deposit)} 及 5% 的利潤，共獲得 ${money(reward)} 金幣！週期已重算。`);
    } else {
      const refund = Math.round(S.deposit * 0.90);
      const lost = S.deposit - refund;
      setS(prev => ({
        ...prev,
        coins: prev.coins + refund,
        deposit: 0,
        depositBattles: 0,
        depositStartMapProgress: 0
      }));
      addLog(`⚠️ 【定存提前提領】因未到期提前支取，扣除 10% 本金作為違約金 (-${money(lost)})，實際退回 ${money(refund)} 金幣。週期已重算。`);
    }
  };

  const depositPureSavings = (amount: number) => {
    if (amount <= 0 || amount > S.coins) {
      addLog("保險箱服務員：存入金額不正確，或您的持有金幣不足！");
      return;
    }
    setS(prev => ({
      ...prev,
      coins: prev.coins - amount,
      savings: (prev.savings || 0) + amount,
      depositBattles: prev.deposit > 0 ? (prev.depositBattles || 0) + 1 : (prev.depositBattles || 0)
    }));
    addLog(`🔐 【活期純儲存】成功存入 ${money(amount)} 金幣到保險箱！當前保管總額：${money((S.savings || 0) + amount)}（無手續費、0%違約罰則，隨存隨取）。`);
  };

  const withdrawPureSavings = (amount: number) => {
    const currentSavings = S.savings || 0;
    if (amount <= 0 || amount > currentSavings) {
      addLog("保險箱服務員：提領金額不正確，或保險箱餘額不足！");
      return;
    }
    setS(prev => ({
      ...prev,
      coins: prev.coins + amount,
      savings: currentSavings - amount,
      depositBattles: prev.deposit > 0 ? (prev.depositBattles || 0) + 1 : (prev.depositBattles || 0)
    }));
    addLog(`🔐 【活期純儲存】成功從保險箱提領 ${money(amount)} 金幣！當前保管總額：${money(currentSavings - amount)}。`);
  };

  const removeItemsFromInventory = (itemName: string, count: number) => {
    setS(prev => {
      const nextInv = [...prev.inventory];
      let removed = 0;
      for (let i = nextInv.length - 1; i >= 0; i--) {
        if (nextInv[i] === itemName && removed < count) {
          nextInv.splice(i, 1);
          removed++;
        }
      }
      return { ...prev, inventory: nextInv };
    });
  };

  const getItemDisplayName = (itemId: string) => {
    if (itemId === "healing_potion") return "🧪 治療藥水";
    if (itemId === "camp_fire") return "🔥 露營營火";
    if (itemId === "落石晶石") return "🪨 落石晶石";
    if (itemId === "狂風蒲公英") return "🌾 狂風蒲公英";
    if (itemId === "幽暗迷幻菇") return "🍄 幽暗迷幻菇";
    if (itemId === "萬年玄冰") return "❄️ 萬年玄冰";
    if (itemId === "鑰匙的碎片") return "🗝️ 鑰匙的碎片";
    if (itemId === "水晶的碎片") return "🔮 水晶的碎片";
    if (itemId === "散發異樣光芒的鑰匙") return "🔑 散發異樣光芒的鑰匙";
    if (itemId === "富含魔力的水晶") return "💎 富含魔力的水晶";
    const allEq = [...EQUIPMENT.weapons, ...EQUIPMENT.armors, ...EQUIPMENT.accessories];
    const eq = allEq.find(e => e.id === itemId || e.name === itemId);
    if (eq) return `${eq.rarity || "⚔️"} ${eq.name}`;
    return itemId;
  };

  const isQuestItem = (itemKey: string): boolean => {
    if (!itemKey) return false;
    if (
      itemKey === "鑰匙的碎片" ||
      itemKey === "水晶的碎片" ||
      itemKey === "散發異樣光芒的鑰匙" ||
      itemKey === "富含魔力的水晶" ||
      itemKey.includes("鑰匙") ||
      itemKey.includes("水晶") ||
      itemKey.includes("碎片") ||
      itemKey.includes("任務")
    ) {
      return true;
    }
    return false;
  };

  const groupInventoryItems = (inventory: string[] = []) => {
    const map: Record<string, { count: number; firstIndex: number }> = {};
    const order: string[] = [];

    inventory.forEach((itemKey, idx) => {
      if (!itemKey) return;
      if (!map[itemKey]) {
        map[itemKey] = { count: 0, firstIndex: idx };
        order.push(itemKey);
      }
      map[itemKey].count += 1;
    });

    return order.map(itemKey => {
      const { count, firstIndex } = map[itemKey];
      const isQuest = isQuestItem(itemKey);

      const wp = EQUIPMENT.weapons.find(w => w.id === itemKey || w.name === itemKey);
      const ar = EQUIPMENT.armors.find(a => a.id === itemKey || a.name === itemKey);
      const ac = EQUIPMENT.accessories.find(a => a.id === itemKey || a.name === itemKey);

      const isEquip = !!(wp || ar || ac);
      let displayName = getItemDisplayName(itemKey);
      let color = wp?.color || ar?.color || ac?.color || (isQuest ? "#f59e0b" : "#e2e8f0");
      let rarity = wp?.rarity || ar?.rarity || ac?.rarity;
      let typeLabel = "一般物品";

      if (isQuest) {
        typeLabel = "✨ 任務道具 (動態佔格)";
      } else if (wp) {
        typeLabel = "⚔️ 武器";
      } else if (ar) {
        typeLabel = "🛡️ 鎧甲";
      } else if (ac) {
        typeLabel = "💍 飾品";
      } else if (itemKey === "治療藥水" || itemKey === "healing_potion" || itemKey === "幽暗迷幻菇") {
        typeLabel = "🧪 消耗品";
      } else if (itemKey === "露營營火" || itemKey === "camp_fire") {
        typeLabel = "🔥 露營道具";
      } else {
        typeLabel = "📦 刷怪素材";
      }

      return {
        itemKey,
        displayName,
        count,
        isQuest,
        isEquip,
        color,
        rarity,
        typeLabel,
        firstIndex
      };
    });
  };

  const getBagCapacityInfo = (inventory: string[] = [], baseBagSize: number = 40) => {
    const grouped = groupInventoryItems(inventory);
    
    const standardItems = grouped.filter(g => !g.isQuest);
    const questItems = grouped.filter(g => g.isQuest);

    const standardSlotsUsed = standardItems.length;
    const questSlotsUsed = questItems.length;

    const totalSlotsUsed = standardSlotsUsed + questSlotsUsed;
    const effectiveBagSize = baseBagSize + questSlotsUsed;

    return {
      grouped,
      standardItems,
      questItems,
      standardSlotsUsed,
      questSlotsUsed,
      totalSlotsUsed,
      baseBagSize,
      effectiveBagSize,
      isStandardFull: standardSlotsUsed >= baseBagSize
    };
  };

  const canAddItemToInventory = (inventory: string[] = [], newItemKey: string, baseBagSize: number = 40): boolean => {
    if (!newItemKey) return true;

    // Quest items dynamically create an extra temporary slot upon acquisition
    if (isQuestItem(newItemKey)) {
      return true;
    }

    // Stacking onto existing item slot
    if (inventory.includes(newItemKey)) {
      return true;
    }

    const info = getBagCapacityInfo(inventory, baseBagSize);
    return info.standardSlotsUsed < baseBagSize;
  };

  // 記錄一次有效行動 (AP + 1)，累積滿 10 次推進一天 (Day + 1) 並進行每日結算 (扣除房租/計算欠債)
  const recordEffectiveAction = (actionDesc?: string) => {
    setS(prev => {
      const nextActionCount = (prev.actionCount || 0) + 1;
      const nextTotalActions = (prev.totalActions || 0) + 1;
      const nextDepositBattles = (prev.depositBattles || 0) + 1; // 推進銀行定存成熟度 P

      if (nextActionCount >= 10) {
        const nextDay = (prev.day || 1) + 1;
        const currentRoomId = prev.innRoomType || "micro_studio";
        const roomInfo = ROOM_TYPES[currentRoomId] || ROOM_TYPES.micro_studio;
        const rentCost = Math.ceil(roomInfo.dailyRent * (prev.inflation || 1.0));

        let newCoins = prev.coins;
        let newDebt = prev.debt;
        let newIsVaultFrozen = prev.isVaultFrozen || false;
        let newOverdueRent = prev.overdueRent || 0;

        if (newCoins >= rentCost) {
          newCoins -= rentCost;
          if (newOverdueRent === 0) {
            newIsVaultFrozen = false;
          }
          addLog(`📅 【第 ${nextDay} 天開始】白晝交替 (累積滿 10 次有效行動)。每日結算：自動扣除【${roomInfo.name}】每日房租 $${rentCost} G。`);
        } else {
          const unpaid = rentCost - newCoins;
          newCoins = 0;
          newDebt += unpaid;
          newOverdueRent += unpaid;
          newIsVaultFrozen = true;
          addLog(`🚨 【第 ${nextDay} 天開始】每日結算：持有金幣不足以支付【${roomInfo.name}】房租 $${rentCost} G！產生拖欠負債 (+$${unpaid} G)，【旅館魔法保險箱】已被凍結上鎖！`);
        }

        return {
          ...prev,
          day: nextDay,
          actionCount: 0,
          totalActions: nextTotalActions,
          depositBattles: nextDepositBattles,
          coins: newCoins,
          debt: newDebt,
          overdueRent: newOverdueRent,
          isVaultFrozen: newIsVaultFrozen
        };
      } else {
        if (actionDesc) {
          addLog(`⏳ 行動點數 +1 (${nextActionCount}/10 AP)。${actionDesc}`);
        }
        return {
          ...prev,
          actionCount: nextActionCount,
          totalActions: nextTotalActions,
          depositBattles: nextDepositBattles
        };
      }
    });
  };

  const payOverdueRent = () => {
    const overdue = S.overdueRent || 0;
    if (overdue <= 0) {
      addLog("客棧掌櫃：您目前沒有拖欠任何房租！");
      return;
    }
    if (S.coins < overdue) {
      addLog(`❌ 現金不足！補繳拖欠房租需要 ${money(overdue)} 金幣，您目前只有 ${money(S.coins)} 金幣。`);
      return;
    }
    setS(prev => ({
      ...prev,
      coins: prev.coins - overdue,
      overdueRent: 0,
      isVaultFrozen: false
    }));
    addLog(`✅ 成功付清拖欠房租欠款 ${money(overdue)} 金幣！【旅館魔法保險箱】已解除凍結，恢復正常存取！`);
  };

  const changeInnRoomType = (newRoomId: string) => {
    const targetRoom = ROOM_TYPES[newRoomId];
    if (!targetRoom) return;
    const currentVaultCount = S.hotelVault?.length || 0;
    if (currentVaultCount > targetRoom.vaultCapacity) {
      addLog(`⚠️ 保險箱現有物品數 (${currentVaultCount} 件) 超出【${targetRoom.name}】容量上限 (${targetRoom.vaultCapacity} 格)！請先取回部分物品後再變更房型。`);
      return;
    }
    setS(prev => ({
      ...prev,
      innRoomType: newRoomId
    }));
    addLog(`🏠 入住房型變更為【${targetRoom.name}】！每日房租：$${targetRoom.dailyRent} G/天，魔法保險箱容量：${targetRoom.vaultCapacity} 格。`);
  };

  const depositToVault = (itemIndex: number) => {
    if (S.isVaultFrozen) {
      addLog("🚨 旅館房租拖欠中，魔法保險箱已被凍結上鎖！請先補繳欠款房租。");
      return;
    }
    const currentRoom = ROOM_TYPES[S.innRoomType || "micro_studio"] || ROOM_TYPES.micro_studio;
    const currentVault = S.hotelVault || [];
    if (currentVault.length >= currentRoom.vaultCapacity) {
      addLog(`❌ 魔法保險箱空間已滿 (${currentVault.length}/${currentRoom.vaultCapacity} 格)！請升級客棧房型以擴充保險箱容量。`);
      return;
    }
    if (itemIndex < 0 || itemIndex >= S.inventory.length) return;

    const itemToDeposit = S.inventory[itemIndex];
    const newInventory = [...S.inventory];
    newInventory.splice(itemIndex, 1);
    const newVault = [...currentVault, itemToDeposit];

    setS(prev => ({
      ...prev,
      inventory: newInventory,
      hotelVault: newVault
    }));
    addLog(`📥 成功將【${getItemDisplayName(itemToDeposit)}】存入魔法保險箱 (${newVault.length}/${currentRoom.vaultCapacity} 格)。`);
  };

  const depositAllOfItemToVault = (itemKey: string) => {
    if (S.isVaultFrozen) {
      addLog("🚨 旅館房租拖欠中，魔法保險箱已被凍結上鎖！請先補繳欠款房租。");
      return;
    }
    const currentRoom = ROOM_TYPES[S.innRoomType || "micro_studio"] || ROOM_TYPES.micro_studio;
    const currentVault = [...(S.hotelVault || [])];
    const currentInv = [...S.inventory];

    let count = 0;
    for (let i = currentInv.length - 1; i >= 0; i--) {
      if (currentInv[i] === itemKey) {
        if (currentVault.length >= currentRoom.vaultCapacity) {
          break;
        }
        currentVault.push(currentInv[i]);
        currentInv.splice(i, 1);
        count++;
      }
    }

    if (count === 0) {
      if (currentVault.length >= currentRoom.vaultCapacity) {
        addLog("❌ 魔法保險箱空間已滿，無法存入更多物品！");
      } else {
        addLog("隨身背包內沒有該項物品可存入。");
      }
      return;
    }

    setS(prev => ({
      ...prev,
      inventory: currentInv,
      hotelVault: currentVault
    }));
    addLog(`📥 批次存入 ${count} 個【${getItemDisplayName(itemKey)}】至魔法保險箱 (${currentVault.length}/${currentRoom.vaultCapacity} 格)。`);
  };

  const withdrawFromVault = (vaultIndex: number) => {
    if (S.isVaultFrozen) {
      addLog("🚨 旅館房租拖欠中，魔法保險箱已被凍結上鎖！請先補繳欠款房租。");
      return;
    }
    const currentVault = S.hotelVault || [];
    if (vaultIndex < 0 || vaultIndex >= currentVault.length) return;

    const itemToWithdraw = currentVault[vaultIndex];
    if (!canAddItemToInventory(S.inventory, itemToWithdraw, S.bagSize || 40)) {
      addLog(`❌ 隨身背包一般空間已滿，無法取出新種類物品【${getItemDisplayName(itemToWithdraw)}】！`);
      return;
    }

    const newVault = [...currentVault];
    newVault.splice(vaultIndex, 1);
    const newInventory = [...S.inventory, itemToWithdraw];

    const capInfo = getBagCapacityInfo(newInventory, S.bagSize || 40);

    setS(prev => ({
      ...prev,
      inventory: newInventory,
      hotelVault: newVault
    }));
    addLog(`📤 成功從魔法保險箱取出【${getItemDisplayName(itemToWithdraw)}】至隨身背包 (${capInfo.totalSlotsUsed}/${capInfo.effectiveBagSize} 格)。`);
  };

  const depositAllToVault = () => {
    if (S.isVaultFrozen) {
      addLog("🚨 旅館房租拖欠中，魔法保險箱已被凍結上鎖！請先補繳欠款房租。");
      return;
    }
    const currentRoom = ROOM_TYPES[S.innRoomType || "micro_studio"] || ROOM_TYPES.micro_studio;
    const currentVault = [...(S.hotelVault || [])];
    const currentInv = [...S.inventory];

    let count = 0;
    while (currentInv.length > 0 && currentVault.length < currentRoom.vaultCapacity) {
      const item = currentInv.pop()!;
      currentVault.push(item);
      count++;
    }

    if (count === 0) {
      if (currentVault.length >= currentRoom.vaultCapacity) {
        addLog("❌ 魔法保險箱空間已滿，無法存入更多物品！");
      } else {
        addLog("隨身背包內沒有物品可存入。");
      }
      return;
    }

    setS(prev => ({
      ...prev,
      inventory: currentInv,
      hotelVault: currentVault
    }));
    addLog(`📥 批次存入 ${count} 件物品至魔法保險箱 (現有容量：${currentVault.length}/${currentRoom.vaultCapacity} 格)。`);
  };

  const withdrawAllFromVault = () => {
    if (S.isVaultFrozen) {
      addLog("🚨 旅館房租拖欠中，魔法保險箱已被凍結上鎖！請先補繳欠款房租。");
      return;
    }
    const currentVault = [...(S.hotelVault || [])];
    const currentInv = [...S.inventory];
    const bagCapacity = S.bagSize || 40;

    let count = 0;
    for (let i = currentVault.length - 1; i >= 0; i--) {
      const peekItem = currentVault[i];
      if (!canAddItemToInventory(currentInv, peekItem, bagCapacity)) {
        continue;
      }
      currentVault.splice(i, 1);
      currentInv.push(peekItem);
      count++;
    }

    if (count === 0) {
      if (currentVault.length > 0) {
        addLog("❌ 隨身背包一般空間已滿，無法取出更多新種類物品！");
      } else {
        addLog("魔法保險箱內沒有物品可取出。");
      }
      return;
    }

    const capInfo = getBagCapacityInfo(currentInv, bagCapacity);

    setS(prev => ({
      ...prev,
      inventory: currentInv,
      hotelVault: currentVault
    }));
    addLog(`📤 批次從魔法保險箱取出 ${count} 件物品至隨身背包 (現有背包：${capInfo.totalSlotsUsed}/${capInfo.effectiveBagSize} 格)。`);
  };

  // 行動條戰鬥主入口 (Start Battle with ATB)
  const startBattle = (overrideWeather?: Weather, overrideMonster?: Monster, forceEnemyFirst: boolean = false) => {
    setSkillCooldowns({});
    setBattleTossAccumulated(0);
    setBattleStartGold(S.coins + S.savings);
    setToss50PercentWarningModal(null);
    if (S.debt >= S.debtLimit) {
      addLog("⚠️ 欠款額度已滿！無法戰鬥。");
      setView("forced_return");
      return;
    }
    const weather = overrideWeather || WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
    let base = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    if (overrideMonster) {
      base = overrideMonster;
    }
    
    // 根據目前的關卡難度進行等比縮放
    const diffBonus = 1 + (S.difficultyLevel - 1) * 0.12;

    const drawnMonster: Monster = {
      name: base.name,
      desc: base.desc,
      hp: Math.ceil(base.hp * diffBonus),
      maxHp: Math.ceil(base.hp * diffBonus),
      atk: Math.ceil(base.atk * diffBonus),
      reward: Math.ceil(base.reward * getRewardMult())
    };

    setS(prev => {
      let nextRage = prev.rage;
      if (hasTeammate("bard")) {
        nextRage = Math.min(100, nextRage + 15);
        addLog("🎵 吟遊詩人奏起熱血戰歌，全隊初始怒氣 +15！");
      }

      // 隨機初始化行動條，或者強行讓敵人先滿
      const { pSpeed, eSpeed, getAllySpeed } = getBattleSpeeds(prev);
      const activeTeammates = prev.teammates.filter(id => {
        const t = getTeammateData(id);
        return t && t.atkMin > 0;
      });

      const initAllyGauges: Record<string, number> = {};
      
      let initPlayerGauge = 0;
      let initEnemyGauge = 0;
      let isP = false;
      let isE = false;
      let activeTurnOwner: string | null = null;

      if (forceEnemyFirst) {
        initPlayerGauge = Math.max(30, Math.min(80, Math.round((pSpeed / (pSpeed + eSpeed)) * 100)));
        initEnemyGauge = 100;
        activeTeammates.forEach(id => {
          initAllyGauges[id] = Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
        });
        isE = true;
        activeTurnOwner = "enemy";
      } else {
        initPlayerGauge = 100;
        initEnemyGauge = Math.max(30, Math.min(85, Math.round((eSpeed / pSpeed) * 80)));
        activeTeammates.forEach(id => {
          initAllyGauges[id] = Math.max(20, Math.min(90, Math.round((getAllySpeed(id) / pSpeed) * 80)));
        });
        isP = true;
        activeTurnOwner = "player";
      }

      return {
        ...prev,
        enemy: drawnMonster,
        weather: weather,
        rage: nextRage,
        stunned: 0,
        enemyFrozen: false,
        enemyAtkReduced: 0,
        enemyDefReduced: 0,
        defBonus: false,
        dodgeTurn: false,
        poisonTurns: 0,
        attackBuff: 1.0,
        attackBuffTurns: 0,
        isPlayerTurn: isP,
        isAllyTurn: false,
        isEnemyTurn: isE,
        turnPhase: "atb_loop",
        isProcessing: false,
        playerGauge: initPlayerGauge,
        enemyGauge: initEnemyGauge,
        allyGauges: initAllyGauges,
        activeTurnOwner: activeTurnOwner
      };
    });

    addLog(`⚔️ 遇到野外怪獸！${drawnMonster.name} 出現了。${drawnMonster.desc}`);
    if (forceEnemyFirst) {
      addLog("⚠️ 突襲警告！魔物發現了你的行蹤，對你發動了先制奇襲攻擊！");
    }
    setView("battle_main");

    // 啟動時間滾動！
    if (forceEnemyFirst) {
      setTimeout(() => {
        performEnemyAttack();
      }, 600);
    } else {
      setTimeout(() => {
        advanceATB();
      }, 150);
    }
  };

  // 玩家普通攻擊
  const doPlayerAttack = (mult: number, name: string, flavorText: string) => {
    if (!spend(3, "普通攻擊", "戰鬥消耗")) return;
    triggerCombatKineticHeal("普通攻擊");
    setDamagedTarget("enemy");
    setTimeout(() => {
      setDamagedTarget(null);
    }, 600);
    let dmg = Math.floor((5 + S.equip + getAtkBonus() + Math.floor(S.debt / 350)) * mult);
    if (S.attackBuffTurns > 0) dmg = Math.floor(dmg * S.attackBuff);
    if (S.contract === "overdraft") dmg = Math.ceil(dmg * 1.2);
    if (S.nightBuff) dmg = Math.ceil(dmg * 1.1);
    if (S.rageActive && S.rageBonus) dmg = Math.floor(dmg * S.rageBonus.dmg);

    if (S.debtorInherentBuff === "desperate_rise" && S.hp / getTotalMaxHp() < 0.2) {
      dmg = Math.floor(dmg * 2.0);
      addLog("🔥 【絕望的奮起】絕望之力爆發，攻擊力翻倍！");
    }

    if (S.fireCharges > 0) {
      dmg += 5;
      addLog("🔥 附魔火焰燃燒！額外造成 +5 點火元素傷害！");
    }

    let lifesteal = getLifestealBonus() + (S.confessionBuff === "leech" ? 15 : 0);
    if (S.debtorInherentBuff === "vampire_debt") {
      lifesteal += 20;
    }

    setS(prev => {
      if (!prev.enemy) return prev;
      const nextHp = Math.max(0, prev.enemy.hp - dmg);
      let heal = 0;
      if (lifesteal > 0 && canHeal(true)) {
        heal = Math.ceil(dmg * lifesteal / 100);
      }
      const finalHp = Math.min(getTotalMaxHp(), prev.hp + heal);
      if (heal > 0) {
        if (S.debtorInherentBuff === "vampire_debt") {
          addLog(`🩸 【吸血鬼的債務契約】恢復了 ${heal} 點 HP！`);
        } else {
          addLog(`🩸 【契約吸血】恢復了 ${heal} 點 HP！`);
        }
      }

      if (nextHp <= 0) {
        setTimeout(() => {
          winBattle(prev.enemy!);
        }, 300);
        return {
          ...prev,
          hp: finalHp,
          enemy: { ...prev.enemy, hp: 0 }
        };
      }

      // 玩家行動完畢，清空玩家 Gauge，推動下一輪輪轉
      setTimeout(() => {
        advanceATB();
      }, 500);

      return {
        ...prev,
        hp: finalHp,
        enemy: { ...prev.enemy, hp: nextHp },
        playerGauge: 0,
        activeTurnOwner: null,
        isPlayerTurn: false
      };
    });
    addLog(`⚔️ ${flavorText}造成 ${dmg} 點傷害！`);
  };

  // 玩家專屬主動神恩：惡意撒幣 (Gold Toss)
  const doPlayerCastTossSkill = () => {
    triggerCombatKineticHeal("惡意撒幣");
    setDamagedTarget("enemy");
    setTimeout(() => {
      setDamagedTarget(null);
    }, 600);

    const totalAllCoins = S.coins + S.savings;
    let tossCoins = 0;

    if (totalAllCoins <= 0) {
      addLog("💸 【惡意撒幣】你在遊戲內已無任何金幣資產（身上與保險櫃皆為 $0），空手揮舞灑出 0 金幣！造成 50 點基礎神聖傷害！");
    } else {
      const maxToss = Math.max(1, Math.floor(totalAllCoins * 0.35));
      tossCoins = Math.floor(Math.random() * maxToss) + 1;
      tossCoins = Math.min(totalAllCoins, tossCoins);
    }

    let coinsDeducted = 0;
    let savingsDeducted = 0;
    if (tossCoins > 0) {
      coinsDeducted = Math.min(S.coins, tossCoins);
      savingsDeducted = tossCoins - coinsDeducted;
    }

    const mult = S.confessionVal || 2.0;
    let dmg = Math.floor(80 + tossCoins * mult);
    if (S.attackBuffTurns > 0) dmg = Math.floor(dmg * S.attackBuff);
    if (S.contract === "overdraft") dmg = Math.ceil(dmg * 1.2);

    const nextAccum = battleTossAccumulated + tossCoins;
    setBattleTossAccumulated(nextAccum);

    const initGold = Math.max(1, battleStartGold || totalAllCoins);
    const isOver50Percent = (nextAccum >= initGold * 0.5) && initGold > 0 && tossCoins > 0;

    if (isOver50Percent) {
      const warningMsg = `⚠️【高額揮霍警告】本次戰鬥已累積撒出金幣 $${nextAccum}，佔戰鬥開始時全遊戲總資產 ($${initGold}) 之 50% 以上！`;
      addLog(warningMsg);
      setToss50PercentWarningModal(`⚠️ 警告！本次戰鬥撒幣累積消耗已達到全遊戲總資產 (身上+保險櫃) 之 50% 以上！\n(已累積撒出 $${nextAccum} / 戰鬥起初總資產 $${initGold})`);
    }

    setS(prev => {
      if (!prev.enemy) return prev;
      const nextEnemyHp = Math.max(0, prev.enemy.hp - dmg);
      
      addLog(`💸 【惡意撒幣】傾瀉遊戲內金幣資產（身上 -$${coinsDeducted}，保險櫃 -$${savingsDeducted}），隨機爆發撒出 $${tossCoins} 金幣！造成 ${dmg} 點神聖真實傷害！`);

      if (nextEnemyHp <= 0) {
        setTimeout(() => {
          winBattle(prev.enemy!);
        }, 300);
        return {
          ...prev,
          coins: Math.max(0, prev.coins - coinsDeducted),
          savings: Math.max(0, prev.savings - savingsDeducted),
          enemy: { ...prev.enemy, hp: 0 }
        };
      }

      setTimeout(() => {
        advanceATB();
      }, 500);

      return {
        ...prev,
        coins: Math.max(0, prev.coins - coinsDeducted),
        savings: Math.max(0, prev.savings - savingsDeducted),
        enemy: { ...prev.enemy, hp: nextEnemyHp }
      };
    });
  };

  // 玩家施展專屬主動技能
  const doPlayerCastSkill = (skillId: string, costAmount: number, dmgMult: number, skillName: string) => {
    if (skillId === "confession_toss") {
      doPlayerCastTossSkill();
      return;
    }
    triggerCombatKineticHeal(skillName);
    setDamagedTarget("enemy");
    setTimeout(() => {
      setDamagedTarget(null);
    }, 600);
    // 特殊處理：如果是惡意撒幣(confession_toss)，此技能不消耗已有金幣，但是「增加你的欠款/負債」！而且它是高額真實傷害！
    let displayCost = `負債 +$${costAmount}`;
    if (skillId === "confession_toss") {
      // 這裡直接判斷是否能預支
      const cost = Math.ceil(costAmount * S.inflation);
      if (S.debt + cost > S.credit) {
        addLog(`⚠️ 信用額度不足！無法預支額外負債來撒幣攻擊！`);
        return;
      }
      // 直接把負債塞進去
      setS(prev => ({ ...prev, debt: prev.debt + cost }));
      addLog(`💸 契約神蹟：你大喝一聲，從虛空中借貸了 $${costAmount} 漫天撒幣！(不消耗現有金幣)`);
    } else {
      if (!spend(costAmount, skillId, skillName)) return;
    }

    let dmg = Math.floor((8 + S.equip + getAtkBonus() + Math.floor(S.debt / 300)) * dmgMult);
    if (S.attackBuffTurns > 0) dmg = Math.floor(dmg * S.attackBuff);
    if (S.contract === "overdraft") dmg = Math.ceil(dmg * 1.2);
    if (S.nightBuff) dmg = Math.ceil(dmg * 1.1);
    
    if (S.debtorInherentBuff === "desperate_rise" && S.hp / getTotalMaxHp() < 0.2 && skillId !== "confession_toss") {
      dmg = Math.floor(dmg * 2.0);
      addLog("🔥 【絕望的奮起】絕望之力爆發，技能傷害翻倍！");
    }
    
    let lifesteal = getLifestealBonus() + (S.confessionBuff === "leech" ? 15 : 0);
    if (S.debtorInherentBuff === "vampire_debt") {
      lifesteal += 20;
    }

    setS(prev => {
      if (!prev.enemy) return prev;
      
      let nextEnemyHp = prev.enemy.hp;
      let nextStunned = prev.stunned;
      let nextFrozen = prev.enemyFrozen;
      let nextPoison = prev.poisonTurns;
      let nextDodge = prev.dodgeTurn;
      let nextEnemyAtkRed = prev.enemyAtkReduced;
      let nextEnemyDefRed = prev.enemyDefReduced;
      let nextHp = prev.hp;

      if (skillId === "warrior_shield" || skillId === "shield_bash" || skillId === "dodge_skill") {
        nextDodge = true; // 盾牆防護：下回合高機率格擋 (等同閃避)
        addLog("🛡️ 你舉起鐵壁聖盾！下回合將獲得 100% 完美招架防禦！");
      } else if (skillId === "warrior_stomp" || skillId === "heavy_blow" || skillId === "heavy_strike" || skillId === "warrior_heavy") {
        if (Math.random() < 0.6) {
          nextStunned = 1;
          addLog("💥 震波猛烈！魔物被震得眼冒金星，陷入暈眩 1 回合！");
        } else {
          addLog("💥 踐踏重擊！但魔物意志堅定，並未陷入暈眩。");
        }
      } else if (skillId === "warrior_armor_break") {
        nextEnemyDefRed = 8;
        addLog("⚔️ 裂甲重擊！魔物的護甲被砸出裂痕，防禦力大幅降低！");
      } else if (skillId === "mage_pyro") {
        nextHp = Math.max(1, prev.hp - 10);
        addLog("🔥 魔力逆流！極致的奧術炎爆使你自身生命值流失了 10 點！");
      } else if (skillId === "mage_ice" || skillId === "freeze" || skillId === "frost_nova" || skillId === "mage_frost_nova") {
        nextFrozen = true;
        addLog("❄️ 絕對凍結！徹骨的寒冰把魔物徹底凍僵，無法動彈！");
      } else if (skillId === "mage_thunder" || skillId === "lightning") {
        nextEnemyAtkRed = 6;
        addLog("⚡ 怒雷震懾！高壓電弧削弱了魔物的力量，其攻擊力減輕！");
      } else if (skillId === "assassin_backstab" || skillId === "assassinate") {
        if (Math.random() < 0.7) {
          dmg = Math.floor(dmg * 2.5);
          addLog("🎯 暴擊大成功！你閃身切入魔物背後要害，造成 2.5 倍致命傷害！");
        } else {
          addLog("🎯 背刺突襲！角度稍微偏移，造成一般傷害。");
        }
      } else if (skillId === "assassin_poison" || skillId === "poison_blade") {
        nextPoison = 3;
        addLog("💀 劇毒入骨！魔物被匕首上的腐蝕毒素感染，每回合流失大量生命！");
      } else if (skillId === "assassin_smoke") {
        nextDodge = true;
        addLog("💨 煙幕遁影！你朝地面扔下煙霧彈，使下回合獲得 100% 絕對閃避！");
      } else if (skillId === "berserk_roar" || skillId === "warrior_roar" || skillId === "war_cry") {
        addLog("🦁 狂戰怒吼！發出撼動戰場的咆哮，攻擊力提升 30%（持續 2 回合）！");
      } else if (skillId === "fireball" || skillId === "mage_fireball") {
        nextPoison = 2;
        addLog("🔥 火焰彈爆炸！熾熱火焰灼燒魔物，持續造成連帶傷害！");
      } else if (skillId === "combo_strike" || skillId === "assassin_combo") {
        addLog("⚔️ 致命連擊！快速發動雙重電光閃擊！");
      } else if (skillId === "heal_light" || skillId === "priest_heal") {
        nextHp = Math.min(getTotalMaxHp(), nextHp + 45);
        addLog("✨ 治癒術！聖水注入肌體，恢復了 45 點 HP！");
      } else if (skillId === "mass_blessing" || skillId === "priest_group_bless") {
        nextPoison = 0;
        addLog("🕊️ 群體祈福！洗淨體內毒素與詛咒，防禦力提升！");
      } else if (skillId === "confession_toss") {
        dmg = 120; // 惡意撒幣為固定真傷
        addLog("💸 毀滅撒幣！金光燦爛、富貴逼人，高壓硬幣雨造成了 120 點真實神聖傷害！");
      } else if (skillId === "miner_collapse") {
        if (Math.random() < 0.4) nextStunned = 1;
        addLog("⛏️ 礦脈爆破！落石轟擊魔物造成重創，並造成 1 回合暈眩！");
      } else if (skillId === "miner_forge") {
        nextDodge = true;
        addLog("💎 熔岩防護！高熱礦渣形成堅固護盾，下回合獲得 100% 格擋！");
      }

      // 計算吸血
      let heal = 0;
      if (lifesteal > 0 && skillId !== "confession_toss" && canHeal(true)) {
        heal = Math.ceil(dmg * lifesteal / 100);
      }
      nextHp = Math.min(getTotalMaxHp(), nextHp + heal);
      if (heal > 0) {
        if (S.debtorInherentBuff === "vampire_debt") {
          addLog(`🩸 【吸血鬼的債務契約】吸血恢復了 ${heal} 點生命值！`);
        } else {
          addLog(`🩸 【契約吸血】恢復了 ${heal} 點生命值！`);
        }
      }

      nextEnemyHp = Math.max(0, nextEnemyHp - dmg);

      if (nextEnemyHp <= 0) {
        setTimeout(() => {
          winBattle(prev.enemy!);
        }, 300);
        return {
          ...prev,
          hp: nextHp,
          enemy: { ...prev.enemy, hp: 0 }
        };
      }

      setTimeout(() => {
        advanceATB();
      }, 500);

      return {
        ...prev,
        hp: nextHp,
        enemy: { ...prev.enemy, hp: nextEnemyHp },
        stunned: nextStunned,
        enemyFrozen: nextFrozen,
        poisonTurns: nextPoison,
        dodgeTurn: nextDodge,
        enemyAtkReduced: nextEnemyAtkRed,
        enemyDefReduced: nextEnemyDefRed,
        playerGauge: 0,
        activeTurnOwner: null,
        isPlayerTurn: false
      };
    });

    addLog(`✨ 你施展了職業絕技【${skillName}】！`);
  };

  const winBattle = (m: Monster) => {
    let reward = m.reward;
    if (S.debtorInherentBuff === "loan_parasite") {
      reward = reward * 2;
      addLog("💰 【高利貸寄生】戰鬥金塊獲取量雙倍增幅！");
    }
    if (S.learnedSkills?.includes("loot_master")) {
      reward = Math.ceil(reward * 1.25);
      addLog("💰 【搜刮強化】公會掠奪技巧發動，戰利品額外 +25%！");
    }
    if (S.learnedSkills?.includes("mana_surge")) {
      addLog("🌊 【魔力回湧】戰鬥勝利，奧術靈氣滋潤恢復 15 點 HP！");
    }
    addLog(`💀 你擊敗 ${m.name}，獲得 ${reward} 金塊！`);
    recordEffectiveAction("完成一場野外戰鬥");
    
    // 獲取信用經驗值！一般怪 40，精英/王更高
    const expGained = m.name.includes("王") || m.name.includes("騎士") ? 60 : 35;
    gainCreditExp(expGained);

    if (S.debtorInherentBuff === "vampire_debt") {
      addDebt(3, "【吸血鬼的債務契約】戰後代價額外欠債");
    }

    setS(prev => {
      const nextKills = prev.kills + 1;
      let nextRage = Math.min(100, prev.rage + 10);
      let nextInventory = [...prev.inventory];
      let nextHp = prev.hp;
      if (prev.learnedSkills?.includes("mana_surge")) {
        nextHp = Math.min(getTotalMaxHp(), nextHp + 15);
      }
      let nextHolyAegis = prev.holyAegisBattles || 0;
      if (nextHolyAegis > 0) {
        nextHolyAegis -= 1;
      }
      
      // 主線任務進度
      let nextMainProgress = prev.mainQuestProgress;
      if (prev.mainQuest === "M1") nextMainProgress += 1;
      if (prev.mainQuest === "M4" && m.name === "信用不良騎士") nextMainProgress += 1;

      // 通緝任務目標討伐檢測
      let updatedWanted = prev.wantedQuests ? [...prev.wantedQuests] : [];
      updatedWanted = updatedWanted.map(w => {
        if (w.isAccepted && !w.isSubmitted && !w.isCompleted && (w.targetName === m.name || m.name.includes(w.targetName) || w.targetName.includes(m.name))) {
          const nextKills = w.currentKills + 1;
          const isComp = nextKills >= w.needKills;
          if (isComp) {
            addLog(`🎯 【通緝目標擊破】成功討伐「${w.targetName}」！可前往【通緝公告欄】或【個人狀態】交付任務領取報酬！`);
          } else {
            addLog(`🎯 【通緝進度】討伐「${w.targetName}」進度: ${nextKills} / ${w.needKills}`);
          }
          return {
            ...w,
            currentKills: nextKills,
            isCompleted: isComp
          };
        }
        return w;
      });

      // 掉落物隨機抽取
      if (Math.random() < 0.4) {
        const allEquip = [...EQUIPMENT.weapons, ...EQUIPMENT.armors, ...EQUIPMENT.accessories];
        const drop = allEquip[Math.floor(Math.random() * allEquip.length)];
        if (drop && drop.id !== "broken_sword" && drop.id !== "cloth_armor") {
          if (canAddItemToInventory(prev.inventory, drop.id, prev.bagSize || 40)) {
            nextInventory.push(drop.id);
            addLog(`🎁 【戰利品】魔物化為碎屑，從其殘骸中發現：${drop.rarity} ${drop.name}！`);
          } else {
            addLog(`⚠️ 【背包空間不足】未能在隨身背包放入戰利品：${drop.rarity} ${drop.name}！`);
          }
        }
      }

      // 混沌惡魔討伐戰利品保證
      if (m.name.includes("混沌惡魔")) {
        nextInventory.push("鑰匙的碎片");
        nextInventory.push("水晶的碎片");
        addLog("🔮 【惡魔戰利品】你討伐了混沌惡魔！從殘餘的魔力黑霧中獲得：『鑰匙的碎片 x1』與『水晶的碎片 x1』！");
      }

      // 在探索地圖中，獲勝會增加地圖進度條
      let nextMapProgress = prev.mapProgress;
      if (prev.currentTerrain) {
        nextMapProgress = Math.min(prev.mapMaxProgress, prev.mapProgress + 10);
        addLog(`🗺️ 戰勝魔物！當前地圖探索進度增加：10% (目前 ${nextMapProgress}%)`);
      }

      return {
        ...prev,
        hp: nextHp,
        holyAegisBattles: nextHolyAegis,
        gold: prev.gold + reward,
        rage: nextRage,
        kills: nextKills,
        mainQuestProgress: nextMainProgress,
        inventory: nextInventory,
        mapProgress: nextMapProgress,
        enemy: null,
        encounterMonster: null,
        depositBattles: prev.deposit > 0 ? prev.depositBattles + 1 : prev.depositBattles,
        wantedQuests: updatedWanted
      };
    });

    setView("victory");
  };

  // Local Save/Load (Fully compatible legacy save state system)
  const performSave = (slot?: number, isAutoSave?: boolean) => {
    const saves: (SaveData | null)[] = getLocalSaves();
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    let timeStr = now.toLocaleTimeString();
    if (isAutoSave) {
      timeStr = `[AUTO] ${timeStr}`;
    }

    const dataToSave: SaveData = {
      id: Date.now(),
      date: dateStr,
      time: timeStr,
      location: "村莊",
      difficulty: getDifficultyDisplay(),
      debt: S.debt,
      credit: S.credit,
      gold: S.gold,
      coins: S.coins,
      savings: S.savings,
      deposit: S.deposit,
      kills: S.kills,
      deathCount: S.deathCount,
      prologueDone: S.prologueDone,
      prologueClass: S.prologueClass,
      debtorClass: S.debtorClass,
      debtorPrefix: S.debtorPrefix || undefined,
      debtorClassName: S.debtorClassName || undefined,
      debtorInherentBuff: S.debtorInherentBuff || undefined,
      debtorBuffName: S.debtorBuffName || undefined,
      debtorBuffDesc: S.debtorBuffDesc || undefined,
      baseHp: S.baseHp || undefined,
      hp: S.hp,
      maxHp: S.maxHp,
      weapon: S.weapon,
      armor: S.armor,
      accessory: S.accessory,
      helmet: S.helmet || null,
      necklace: S.necklace || null,
      belt: S.belt || null,
      greaves: S.greaves || null,
      boots: S.boots || null,
      bagSize: S.bagSize || 40,
      inventory: S.inventory || [],
      teammates: S.teammates || [],
      teammateEquip: S.teammateEquip || {},
      tavernTeammates: S.tavernTeammates || [],
      villageVisits: S.villageVisits || 0,
      churchRerollsInVisit: S.churchRerollsInVisit || 0,
      churchRerollLockedVisits: S.churchRerollLockedVisits || 0,
      terrainProgress: S.terrainProgress || {},
      contract: S.contract,
      mainQuest: S.mainQuest,
      mainQuestProgress: S.mainQuestProgress,
      sideQuest: S.sideQuest,
      sideQuestProgress: S.sideQuestProgress,
      playerSkills: S.playerSkills || [],
      skillPoints: S.skillPoints || 0,
      attributePoints: S.attributePoints || 0,
      defenseBonus: S.defenseBonus || 0,
      strength: S.strength || 0,
      agility: S.agility || 0,
      commerce: S.commerce || 0,
      stamina: S.stamina || 0,
      debtLimit: S.debtLimit || 1500,
      forgedItems: S.forgedItems || [],
      equipBuffMap: equipBuffMap,
      skillName: S.skillName,
      creditExp: S.creditExp || 0,
      creditLevel: S.creditLevel || 1,
      totalCreditExp: S.totalCreditExp || 0,
      extraCreditLimit: S.extraCreditLimit || 0,
      day: S.day || 1,
      actionCount: S.actionCount || 0,
      totalActions: S.totalActions || 0,
      innRoomType: S.innRoomType || "micro_studio",
      hotelVault: S.hotelVault || [],
      isVaultFrozen: S.isVaultFrozen || false,
      overdueRent: S.overdueRent || 0,
      wantedQuests: S.wantedQuests || [],
      wantedLastRefreshDay: S.wantedLastRefreshDay || 0,
      learnedSkills: S.learnedSkills || [],
      hasPalaceLetter: S.hasPalaceLetter || false,
      advancedClass: S.advancedClass || null,
      isBeggarMode: S.isBeggarMode || false,
      beggarStickLevel: S.beggarStickLevel || 0,
      beggarCount: S.beggarCount || 0,
      beggarLocation: S.beggarLocation || "公告欄的街道旁",
      depositStartMapProgress: S.depositStartMapProgress || 0,
      saveInfo: { date: dateStr, time: timeStr, location: "村莊", difficulty: getDifficultyDisplay() }
    };

    let targetSlot = slot;
    if (targetSlot === undefined) {
      // Find first empty manual slot (1 to 5)
      for (let i = 1; i <= 5; i++) {
        if (!saves[i]) {
          targetSlot = i;
          break;
        }
      }
      if (targetSlot === undefined || targetSlot === -1) {
        targetSlot = 1;
      }
    }

    while (saves.length <= targetSlot) {
      saves.push(null);
    }
    saves[targetSlot] = dataToSave;
    localStorage.setItem("debtHeroSaves", JSON.stringify(saves.slice(0, 6)));
    setSaveVersion(v => v + 1);

    const slotName = targetSlot === 0 ? "系統自動存檔" : `存檔 ${targetSlot}`;

    if (isAutoSave) {
      addLog(`💾 [AUTO] 當前進度已自動覆蓋至系統存檔！`);
    } else {
      addLog(`💾 存檔已成功儲存於【${slotName}】！`);
      setSaveSuccessMsg(`💾 存檔成功！進度已成功儲存至【${slotName}】`);
    }

    if (onSyncWithCloud) {
      onSyncWithCloud(dataToSave);
    }
    if (!isAutoSave && view !== "saveLoad") {
      setView("menu");
    }
  };

  const loadSave = (data: SaveData) => {
    if (!data) return;
    const { cleanedSkills, correctedAdvClass, hasPunishment } = checkSkillsAndApplyPunishment(data);

    setS(prev => ({
      ...prev,
      prologueDone: true, // 確保讀取機制優先權最高，載入即自動跳過序章
      isBeggarMode: data.isBeggarMode || false,
      beggarStickLevel: data.beggarStickLevel || 0,
      beggarCount: data.beggarCount || 0,
      beggarLocation: (data as any).beggarLocation || "公告欄的街道旁",
      depositStartMapProgress: (data as any).depositStartMapProgress || 0,
      prologueClass: data.prologueClass,
      debtorClass: data.debtorClass,
      debtorPrefix: data.debtorPrefix || null,
      debtorClassName: data.debtorClassName || null,
      debtorInherentBuff: data.debtorInherentBuff || null,
      debtorBuffName: data.debtorBuffName || null,
      debtorBuffDesc: data.debtorBuffDesc || null,
      baseHp: data.baseHp || null,
      hp: hasPunishment ? 1 : data.hp,
      maxHp: data.maxHp,
      gold: data.gold,
      coins: data.coins,
      savings: data.savings || 0,
      deposit: data.deposit || 0,
      debt: data.debt,
      credit: data.credit,
      weapon: data.weapon,
      armor: data.armor,
      accessory: data.accessory,
      helmet: data.helmet || null,
      necklace: data.necklace || null,
      belt: data.belt || null,
      greaves: data.greaves || null,
      boots: data.boots || null,
      bagSize: data.bagSize || 40,
      inventory: data.inventory || [],
      teammates: data.teammates || [],
      teammateEquip: (data as any).teammateEquip || {},
      tavernTeammates: (data as any).tavernTeammates || [],
      villageVisits: (data as any).villageVisits || 0,
      churchRerollsInVisit: (data as any).churchRerollsInVisit || 0,
      churchRerollLockedVisits: (data as any).churchRerollLockedVisits || 0,
      terrainProgress: (data as any).terrainProgress || {},
      day: data.day || 1,
      actionCount: data.actionCount || 0,
      totalActions: data.totalActions || 0,
      innRoomType: data.innRoomType || "micro_studio",
      hotelVault: data.hotelVault || [],
      isVaultFrozen: data.isVaultFrozen || false,
      overdueRent: data.overdueRent || 0,
      contract: data.contract,
      mainQuest: data.mainQuest,
      mainQuestProgress: data.mainQuestProgress || 0,
      sideQuest: data.sideQuest,
      sideQuestProgress: data.sideQuestProgress || 0,
      playerSkills: data.playerSkills || [],
      skillPoints: data.skillPoints || 0,
      attributePoints: data.attributePoints || 0,
      defenseBonus: data.defenseBonus || 0,
      strength: data.strength || 0,
      agility: data.agility || 0,
      commerce: data.commerce || 0,
      stamina: data.stamina || 0,
      debtLimit: data.debtLimit || 1500,
      difficultyLevel: (data as any).difficultyLevel || 1,
      checkpointCampMet: (data as any).checkpointCampMet || false,
      currentTerrain: (data as any).currentTerrain || "rocky",
      forgedItems: data.forgedItems || [],
      kills: data.kills || 0,
      deathCount: data.deathCount || 0,
      skillName: data.skillName || "負債一擊",
      creditExp: data.creditExp || 0,
      creditLevel: data.creditLevel || 1,
      totalCreditExp: data.totalCreditExp || 0,
      extraCreditLimit: data.extraCreditLimit || 0,
      wantedQuests: data.wantedQuests || [],
      wantedLastRefreshDay: data.wantedLastRefreshDay || 0,
      learnedSkills: cleanedSkills,
      hasPalaceLetter: (data as any).hasPalaceLetter || false,
      advancedClass: correctedAdvClass
    }));
    if (data.equipBuffMap) {
      setEquipBuffMap(data.equipBuffMap);
    }
    setSaveVersion(v => v + 1);

    if (hasPunishment) {
      setDivinePunishmentModal(true);
      setView("inn");
      addLog("⚡ [檢測到主職業與基礎職業不符或含有跨職業技能，天罰降臨！主職業已自動修正，不符職業技能已全數移除]");
    } else {
      setView("menu");
      addLog("📂 讀取存檔成功，自動跳過序章並直接切換至村莊廣場！");
    }
  };

  const handleContinueGame = () => {
    const rawSaves: (SaveData | null)[] = getLocalSaves();
    const saves = rawSaves.filter((s): s is SaveData => s !== null && s !== undefined);
    if (saves.length === 0) {
      addLog("⚠️ 沒有找到任何本地存檔進度，請先開始故事序章！");
      return;
    }

    // 尋找最新存檔、自動存檔與手動存檔
    const autoSave = saves.find(s => s.time && s.time.includes("[AUTO]"));
    const manualSaves = saves.filter(s => s.time && !s.time.includes("[AUTO]"));
    
    // 按 id (timestamp) 排序手動存檔
    let latestManualSave: SaveData | null = null;
    if (manualSaves.length > 0) {
      latestManualSave = manualSaves.reduce((prev, curr) => prev.id > curr.id ? prev : curr);
    }

    if (latestManualSave && autoSave && latestManualSave.id > autoSave.id) {
      // 偵測到手動存檔時間戳晚於自動存檔，觸發存檔衝突警告防護介面
      setConflictSaves({ manual: latestManualSave, auto: autoSave });
    } else {
      // 無衝突，直接載入最新的一個存檔 (id 最大者)
      const newestSave = saves.reduce((prev, curr) => prev.id > curr.id ? prev : curr);
      loadSave(newestSave);
    }
  };

  const deleteSaveSlot = (idx: number) => {
    const saves: (SaveData | null)[] = getLocalSaves();
    if (idx >= 0 && idx < 6) {
      while (saves.length <= idx) {
        saves.push(null);
      }
      saves[idx] = null;
    }
    localStorage.setItem("debtHeroSaves", JSON.stringify(saves.slice(0, 6)));
    setSaveVersion(v => v + 1);
    const slotName = idx === 0 ? "系統自動存檔" : `存檔 ${idx}`;
    setSaveSuccessMsg(`🗑️ 已成功刪除【${slotName}】！`);
    addLog(`🗑️ 存檔【${slotName}】已刪除。`);
  };

  // Church healing interval simulation
  const startChurchHeal = () => {
    if (!canHeal()) return;
    setView("church_heal");
    addLog("⛪ 祈禱中...");
    let count = 0;
    const maxCount = Math.ceil(getTotalMaxHp() / 5);
    const interval = setInterval(() => {
      count++;
      setS(prev => {
        const nextHp = Math.min(getTotalMaxHp(), prev.hp + 5);
        if (nextHp >= getTotalMaxHp() || count >= maxCount) {
          clearInterval(interval);
          addLog("⛪ 祈禱完成，生命已全滿。");
          if (prev.mainQuest === "M3") {
            setTimeout(() => {
              updateMainQuest(1);
            }, 100);
          }
          setView("church_menu");
        }
        return { ...prev, hp: nextHp };
      });
    }, 400);
  };

  const performExplorationStep = (decisionLabel: string, selectedDir: string, selectedAct: string) => {
    // Determine path complexity & base cost
    const isComplex = decisionLabel.includes("左側") || decisionLabel.includes("右側") || decisionLabel.includes("叉路");
    const costBase = isComplex ? 25 : 10;
    const diffMultiplier = 1 + (S.difficultyLevel - 1) * 0.25;
    const debtCost = Math.ceil(costBase * diffMultiplier);

    // 1. 檢查信用額度
    const limit = S.debtLimit || 1500;
    const maxLimit = S.debtorInherentBuff === "overdraft_user" ? Math.ceil(limit * 1.2) : limit;
    
    if (S.debt + debtCost > maxLimit) {
      addLog(`⚠️ 信用額度不足！本步需增加負債 $${debtCost}，剩餘額度 $${maxLimit - S.debt}`);
      setView("forced_return");
      return;
    }

    // 2. 如果是北出口山脈，扣 3 HP (極寒冰雪)
    let hpPenalty = 0;
    if (S.currentTerrain === "mountains") {
      hpPenalty = 3;
      addLog("❄️ 寒流侵襲！極寒冰雪使你的生命值受凍流失了 3 點 HP！");
    }

    // 3. Generate pathing description using formula: Path_Text = Prefix + Direction + Action
    const prefixesList = ["毅然決然", "猶豫不決", "麻木地", "被迫", "試探性", "盲目地", "孤注一擲", "冷靜地"];
    const randomPrefix = prefixesList[Math.floor(Math.random() * prefixesList.length)];
    const pathText = `${randomPrefix}${selectedDir}${selectedAct}`;
    addLog(`🗺️ 【${decisionLabel}】你${pathText}，頂著風雨在未知的荒野開墾摸索。`);
    addLog(`💰 【${decisionLabel}】探索產生負債：+$${debtCost} (基礎: $${costBase} * 難度倍率: ${diffMultiplier.toFixed(2)}x)`);
    recordEffectiveAction("野外探索與移動");

    // 4. Calculate next progress
    const nextProgress = (S.mapProgress || 0) + 25;
    let nextDifficultyLevel = S.difficultyLevel;
    let nextCheckpointCampMet = S.checkpointCampMet;
    let nextView = "explore_map";
    let nextCoins = S.coins;
    let nextDirection = S.currentDirection;
    let nextTerrain = S.currentTerrain;
    let nextEncounterMonster = S.encounterMonster;

    // 檢查是否觸發 25%, 50%, 75% 復活點/保存點
    if (nextProgress === 25 || nextProgress === 50 || nextProgress === 75) {
      nextCheckpointCampMet = true;
      addLog(`⛺ 【復活點激活】探索進度達到 ${nextProgress}%！已激活荒野臨時營地（在此處復活將免費並回復 25% HP）。當前進度與戰鬥進度已保存！`);
      
      try {
        const tempSaveState = { 
          ...S, 
          hp: Math.max(1, S.hp - hpPenalty),
          mapProgress: nextProgress, 
          debt: S.debt + debtCost,
          checkpointCampMet: true 
        };
        localStorage.setItem("debtHeroCheckpointSave", JSON.stringify(tempSaveState));
      } catch (e) {
        console.error(e);
      }

      // Autosave to main slot
      setTimeout(() => {
        performSave(0, true);
      }, 50);
    }

    if (nextProgress >= 100) {
      const rewardCoins = 100 + Math.floor(Math.random() * 80) + S.difficultyLevel * 30;
      nextCoins += rewardCoins;
      addLog(`🎉 開拓大成功！你成功將當前區域探索進度推進至 100%！`);
      addLog(`💰 冒險者公會發放了 $${rewardCoins} 金幣探勘獎勵！`);
      addLog(`🚀 頂部按鈕【進入下一個】已解鎖！點擊可隨時踏入【${getDifficultyDisplay(S.difficultyLevel + 1)}】新章節！`);

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastActionResult({
        actionTitle: `【${decisionLabel}】`,
        actionDetail: `你${pathText}，頂著風雨在未知的荒野開墾摸索。`,
        resultTitle: "🎉 區域探索 100% 通關！",
        resultDetail: `成功將地形探索進度推至 100%！獲得公會 $${rewardCoins} 金幣探勘獎勵！`,
        costInfo: `負債 +$${debtCost} (基礎 $${costBase} * 難度 ${diffMultiplier.toFixed(2)}x)${hpPenalty > 0 ? ` | 生命 -${hpPenalty} HP` : ""}`,
        timestamp: nowTime,
        badgeType: "success"
      });

      setS(prev => {
        const finalHp = Math.max(1, prev.hp - hpPenalty);
        const nextTerrainProgress = { ...(prev.terrainProgress || {}) };
        if (prev.currentTerrain) {
          nextTerrainProgress[prev.currentTerrain] = 100;
        }
        return {
          ...prev,
          hp: finalHp,
          mapProgress: 100,
          terrainProgress: nextTerrainProgress,
          coins: nextCoins,
          debt: prev.debt + debtCost,
          depositBattles: prev.deposit > 0 ? prev.depositBattles + 1 : prev.depositBattles
        };
      });
      return;
    }

    // 5. Randomize encounter probability
    const rand = Math.random();
    const encounterChance = 0.45 + Math.random() * 0.25; // Randomizes between 45% and 70% each step!
    
    let resTitle = "開拓進展成功";
    let resDetail = `探勘進度推進至 ${nextProgress}%`;
    let badgeType: "success" | "warning" | "battle" | "camp" | "info" = "success";

    if (rand < encounterChance) {
      // 遭遇魔物 (進入戰鬥宣告)
      const baseMonster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
      nextEncounterMonster = baseMonster;
      nextView = "battle_encounter";
      resTitle = `⚔️ 遭遇魔物【${baseMonster.name}】`;
      resDetail = `前路被敵封鎖！${baseMonster.desc} (生命: ${baseMonster.hp})，進入戰鬥！`;
      badgeType = "battle";
    } else if (rand < 0.85) {
      // 隨機奇遇
      const rewardType = Math.floor(Math.random() * 3);
      if (rewardType === 0) {
        nextCoins += 25;
        addLog("🎁 【荒野奇遇】你在荒地翻到了一個帝國舊錢包，驚喜地獲得了 $25 金幣！");
        resTitle = "🎁 荒野奇遇：發現舊錢包";
        resDetail = "在荒地翻到帝國舊錢包，驚喜獲贈 $25 金幣！";
      } else if (rewardType === 1) {
        setS(prev => ({ ...prev, gold: prev.gold + 1 }));
        addLog("🎁 【荒野奇遇】你在岩縫中撿到一塊發光的金鐵石，獲得了 1 塊金塊熔煉材料！");
        resTitle = "🎁 荒野奇遇：發現金鐵石";
        resDetail = "在岩縫中撿到發光金鐵石，獲得 1 塊金塊材料！";
      } else {
        setS(prev => ({ ...prev, inventory: [...prev.inventory, "治療藥水"] }));
        addLog("🎁 【荒野奇遇】你遇到了一位落難的流浪行商，他感激你的指路，贈送了你一瓶「治療藥水」！");
        resTitle = "🎁 荒野奇遇：遭遇流浪行商";
        resDetail = "指引落難流浪行商，獲贈了一瓶「治療藥水」！";
      }
    } else {
      // 遭遇精靈營地
      nextCheckpointCampMet = true;
      addLog("⛺ 【荒野奇遇】你在迷霧前方看見了溫暖閃爍的營火！你成功進駐了【精靈臨時營地】！");
      nextView = "camp_site";
      resTitle = "⛺ 荒野奇遇：發現精靈營地";
      resDetail = "迷霧前方發現溫暖營火，成功進駐【精靈臨時營地】！";
      badgeType = "camp";
    }

    if (nextProgress === 25 || nextProgress === 50 || nextProgress === 75) {
      resDetail += ` (⛺ 已激活 ${nextProgress}% 臨時營地復活保存點)`;
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastActionResult({
      actionTitle: `【${decisionLabel}】`,
      actionDetail: `你${pathText}，頂著風雨在未知的荒野開墾摸索。`,
      resultTitle: resTitle,
      resultDetail: resDetail,
      costInfo: `負債 +$${debtCost} (基礎 $${costBase} * 難度 ${diffMultiplier.toFixed(2)}x)${hpPenalty > 0 ? ` | 生命 -${hpPenalty} HP (寒流受凍)` : ""}`,
      timestamp: nowTime,
      badgeType: badgeType
    });

    setS(prev => {
      const finalHp = Math.max(1, prev.hp - hpPenalty);
      const nextTerrainProgress = { ...(prev.terrainProgress || {}) };
      if (prev.currentTerrain) {
        nextTerrainProgress[prev.currentTerrain] = nextProgress;
      }
      return {
        ...prev,
        hp: finalHp,
        mapProgress: nextProgress,
        terrainProgress: nextTerrainProgress,
        checkpointCampMet: nextCheckpointCampMet,
        coins: nextCoins,
        debt: prev.debt + debtCost,
        encounterMonster: nextEncounterMonster,
        depositBattles: prev.deposit > 0 ? prev.depositBattles + 1 : prev.depositBattles
      };
    });
    setView(nextView);
  };

  // Drink logic at Tavern
  const triggerDrink = (lvl: number) => {
    const costs: Record<number, number> = { 1: 10, 2: 25, 3: 50 };
    const cost = costs[lvl] || 10;
    
    if (!spend(cost, "酒館喝酒", "酒館")) return;
    
    setS(prev => {
      const rageBonus = { dmg: 1 + lvl * 0.15, def: -lvl * 0.03, dodge: lvl * 0.15 };
      addLog(`🍺 喝下 ${lvl === 3 ? "烈酒！" : "麥芽啤酒！"} 獲得暴怒狀態：傷害提升、防禦降低。`);
      recordEffectiveAction("酒館暢飲與互動");
      return {
        ...prev,
        rageActive: true,
        rageBonus: prev.rageActive && prev.rageBonus ? {
          dmg: Math.min(1.5, prev.rageBonus.dmg + lvl * 0.1),
          def: Math.max(-0.1, prev.rageBonus.def - lvl * 0.02),
          dodge: Math.min(0.5, prev.rageBonus.dodge + lvl * 0.1)
        } : rageBonus,
        hangoverTurns: (prev.hangoverTurns || 0) + lvl
      };
    });
  };

  // Universal Sell System Helper with strict Safety Locks (防呆機制)
  const renderSellInterface = (locationName: string, npcName: string, npcDialogue: string) => {
    const inventoryItems = S.inventory || [];
    const equippedIds = [
      S.weapon, S.armor, S.accessory, S.helmet,
      S.necklace, S.belt, S.greaves, S.boots
    ].filter(Boolean) as string[];
    const vaultItems = S.hotelVault || [];

    const getItemSellPrice = (itemKey: string) => {
      const allEquip = [...EQUIPMENT.weapons, ...EQUIPMENT.armors, ...EQUIPMENT.accessories];
      const foundEquip = allEquip.find(e => e.id === itemKey || e.name === itemKey);
      if (foundEquip) {
        return Math.max(12, Math.floor((foundEquip.baseCost || 20) * 0.7));
      }
      if (itemKey === "治療藥水") return 8;
      if (itemKey === "幽暗迷幻菇") return 15;
      if (itemKey === "精緻皮革") return 18;
      if (itemKey === "鐵礦石") return 25;
      if (itemKey === "魔物核心") return 40;
      if (itemKey === "龍之鱗片") return 85;
      if (itemKey === "金塊") return 15;
      if (itemKey === "落石晶石") return 30;
      if (itemKey === "狂風蒲公英") return 40;
      if (itemKey === "萬年玄冰") return 100;
      if (itemKey === "露營營火") return 20;
      return 10;
    };

    const handleSellFromInventory = (itemKey: string, index: number) => {
      const price = getItemSellPrice(itemKey);
      const displayName = getItemDisplayName(itemKey);
      setS(prev => {
        const nextInv = [...prev.inventory];
        const realIndex = index >= 0 ? index : nextInv.indexOf(itemKey);
        if (realIndex !== -1) {
          nextInv.splice(realIndex, 1);
        }
        return {
          ...prev,
          coins: prev.coins + price,
          inventory: nextInv
        };
      });
      addLog(`💰 【${locationName}】你將【${displayName}】賣給了${npcName}，獲得金幣 +$${price} G！`);
    };

    const handleSellAllFromInventory = (itemKey: string, count: number) => {
      const unitPrice = getItemSellPrice(itemKey);
      const totalPrice = unitPrice * count;
      const displayName = getItemDisplayName(itemKey);
      setS(prev => {
        const nextInv = prev.inventory.filter(i => i !== itemKey);
        return {
          ...prev,
          coins: prev.coins + totalPrice,
          inventory: nextInv
        };
      });
      addLog(`💰 【${locationName}】你將全部 (${count} 個)【${displayName}】賣給了${npcName}，共獲得金幣 +$${totalPrice} G！`);
    };

    const groupedSellItems = groupInventoryItems(inventoryItems);

    return (
      <div className="space-y-4 animate-fade-in text-left">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="text-2xl">
            {locationName.includes("公會") ? "👩‍💼" : locationName.includes("鐵匠") ? "👨‍🏭" : "🏪"}
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 block">{npcName}</span>
            <span className="text-[11px] text-slate-300 italic">{npcDialogue}</span>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-[10px] text-slate-400 leading-relaxed">
          <span className="text-amber-400 font-bold block mb-0.5">🔒 【防呆安全鎖機制】說明：</span>
          【已穿戴裝備】與客棧【保險箱物品】已被系統強制鎖定，絕對禁止販售！您僅能販售背包內的非穿戴隨身物品。
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 flex justify-between items-center px-1">
            <span>🎒 可出售的隨身物品 ({groupedSellItems.length} 種品項)：</span>
            <span className="text-amber-400 font-mono font-bold">持有金幣: ${S.coins} G</span>
          </h4>

          {groupedSellItems.length === 0 ? (
            <div className="p-6 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
              🍃 隨身背包空無一物！沒有可出售的裝備或素材。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {groupedSellItems.map((g) => {
                const price = getItemSellPrice(g.itemKey);
                const totalPrice = price * g.count;
                const isEquippedInInventory = equippedIds.includes(g.itemKey);

                return (
                  <div
                    key={g.itemKey}
                    className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-2.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-100 truncate">{g.displayName}</span>
                        <span className="text-xs font-black font-mono text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          x{g.count}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400/90 font-mono block">
                        回收價: +${price} G/個 {g.count > 1 ? `(總計: +$${totalPrice} G)` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                      {isEquippedInInventory ? (
                        <button
                          disabled
                          className="bg-slate-950 border border-slate-800 text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-60 cursor-not-allowed whitespace-nowrap"
                        >
                          🔒 裝備中 (禁止賣出)
                        </button>
                      ) : g.isQuest ? (
                        <button
                          disabled
                          className="bg-amber-950/60 border border-amber-800/60 text-amber-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-80 cursor-not-allowed whitespace-nowrap"
                        >
                          📜 任務道具 (禁止賣出)
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSellFromInventory(g.itemKey, g.firstIndex)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm whitespace-nowrap"
                          >
                            💰 賣 1個 (+$${price})
                          </button>
                          {g.count > 1 && (
                            <button
                              onClick={() => handleSellAllFromInventory(g.itemKey, g.count)}
                              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm whitespace-nowrap"
                            >
                              ⚡ 全部賣出 (+$${totalPrice})
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-900">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
            🔒 防呆安全鎖已保護項目 (不可出售)：
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-slate-950/80 p-2.5 border border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">🛡️ 身穿裝備中：</span>
              {equippedIds.length === 0 ? (
                <span className="text-[9px] text-slate-600 italic block">無裝備中項目</span>
              ) : (
                equippedIds.map((eqId, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>{getItemDisplayName(eqId)}</span>
                    <span className="text-rose-400 font-bold">🔒 已穿戴鎖定</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-950/80 p-2.5 border border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">🏦 客棧保險箱內寄存：</span>
              {vaultItems.length === 0 ? (
                <span className="text-[9px] text-slate-600 italic block">保險箱內無物品</span>
              ) : (
                vaultItems.slice(0, 3).map((vItem, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="truncate max-w-[120px]">{getItemDisplayName(vItem)}</span>
                    <span className="text-amber-500 font-bold">🔒 保險箱鎖定</span>
                  </div>
                ))
              )}
              {vaultItems.length > 3 && (
                <span className="text-[9px] text-slate-600 block text-right">...及其餘 {vaultItems.length - 3} 件</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Village shop/church contents inline and persist state inside buildings
  const renderVillageContent = () => {
    switch (view) {
      case "forge":
        return (
          <div className="space-y-4 text-center py-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-amber-400">🔧 皇家鐵匠鋪</h3>
              <span className="text-xs bg-slate-950 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                金幣: ${S.coins} G
              </span>
            </div>

            {/* SubTab switcher for forge */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => {
                  setForgeSubTab("craft");
                  setForgeCraftSubPage(false);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  forgeSubTab === "craft"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                🔨 裝備熔煉與打造
              </button>
              <button
                onClick={() => setForgeSubTab("sell")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  forgeSubTab === "sell"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                💰 裝備與金屬礦石販售
              </button>
            </div>

            {forgeSubTab === "craft" ? (
              !forgeCraftSubPage ? (
                <>
                  <p className="text-xs text-slate-400">「粗糙的金鐵，亦能在烈火中重鑄為絕世神兵。」</p>
                  <div className="bg-slate-950 p-3 rounded-xl text-left border border-slate-900 text-xs text-slate-400">
                    <span className="text-amber-400 font-bold">💎 熔煉規則：</span>
                    <p className="mt-1">
                      進入熔煉工坊可選擇「熔煉全新裝備」或「熔煉現有裝備」。成功熔煉後的裝備，即可前往大教堂進行聖光鑑定或屬性重洗。
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {/* 熔煉選項 (點選進入子頁面) */}
                    <button 
                      onClick={() => {
                        setForgeCraftSubPage(true);
                        setForgeSubPageMode('new');
                        setUnforgedForgePage(1);
                      }}
                      className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-4 rounded-xl text-left cursor-pointer transition-all flex justify-between items-center group"
                    >
                      <div>
                        <span className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors block">
                          🧱 熔煉
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          點選進入熔煉工坊子頁面，可選擇【🧱 熔煉全新裝備】或【⚒️ 熔煉現有裝備】解鎖鑑定前置條件！
                        </span>
                      </div>
                      <span className="text-xs bg-amber-500/10 text-amber-400 font-black px-2.5 py-1 rounded border border-amber-500/20 shrink-0">
                        進入工坊 ➔
                      </span>
                    </button>

                    {/* 乞丐專用木棍 (僅在乞丐模式才會出現) */}
                    {S.isBeggarMode && (
                      <button 
                        onClick={() => {
                          const curLvl = S.beggarStickLevel || 0;
                          if (curLvl >= 999) {
                            addLog("❌ 【無限熔煉已達巔峰】乞丐專用木棍已到達上限 [+999 破木棍]！");
                            return;
                          }
                          const cost = Math.min(20, Math.max(2, Math.floor(curLvl * 0.1) + 2));
                          if (!spend(cost, "熔煉乞丐木棍", "鐵匠鋪")) return;

                          // 熔煉機率：70% 成功，30% 失敗
                          const roll = Math.random();
                          if (roll < 0.70) {
                            const nextLvl = curLvl + 1;
                            setS(prev => ({ ...prev, beggarStickLevel: nextLvl }));
                            addLog(`🔥 【乞丐木棍熔煉成功】鐵匠哈肯揮錘精淬！【乞丐專用木棍】升級為 [+${nextLvl} 破木棍] (攻擊力: ${5 + nextLvl * 8})！`);
                          } else {
                            if (curLvl <= 1) {
                              addLog(`💥 【乞丐木棍熔煉失敗】爐火閃爍炸裂，熔煉不幸宣告失敗！受最低保障機制保護 (+1 保底)，等級不會降級！(當前等級維持 [+${curLvl} 破木棍]，攻擊力: ${5 + curLvl * 8})`);
                            } else {
                              const nextLvl = curLvl - 1;
                              setS(prev => ({ ...prev, beggarStickLevel: nextLvl }));
                              addLog(`💥 【乞丐木棍熔煉失敗】爐火劇烈炸裂，木棍受高溫損壞！等級扣除 1 級，降為 [+${nextLvl} 破木棍] (當前攻擊力: ${5 + nextLvl * 8})！`);
                            }
                          }
                        }}
                        className="bg-slate-900 border border-amber-900/50 hover:border-amber-400 p-4 rounded-xl text-left cursor-pointer transition-all flex justify-between items-center"
                      >
                        <div>
                          <span className="text-sm font-bold text-amber-300 block">🪵 熔煉【乞丐專用木棍】(有機率失敗)</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            當前等級：[+{(S.beggarStickLevel || 0)} 破木棍] | 攻擊力：{5 + (S.beggarStickLevel || 0) * 8} (70% 成功 | 失敗扣 1 級，+1 保底不扣)
                          </span>
                        </div>
                        <span className="text-xs bg-amber-500/10 text-amber-400 font-black px-2 py-1 rounded border border-amber-500/20">
                          ${Math.min(20, Math.max(2, Math.floor((S.beggarStickLevel || 0) * 0.1) + 2))} G
                        </span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* 子頁面：熔煉工坊 */
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <button
                      onClick={() => setForgeCraftSubPage(false)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      ◀ 返回鐵匠鋪大廳
                    </button>
                    <span className="text-xs font-bold text-amber-400">🔥 熔煉工坊</span>
                  </div>

                  {/* 子頁面選項切換卡 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setForgeSubPageMode('new')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        forgeSubPageMode === 'new'
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black"
                          : "bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      🧱 熔煉全新裝備
                    </button>
                    <button
                      onClick={() => {
                        setForgeSubPageMode('existing');
                        setUnforgedForgePage(1);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        forgeSubPageMode === 'existing'
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black"
                          : "bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      ⚒️ 熔煉現有裝備
                    </button>
                  </div>

                  {forgeSubPageMode === 'new' ? (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        🧱 熔煉全新神兵裝備
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        鐵匠哈肯拍打著赤紅的鐵砧：「小子，將你在野外打來的金鐵礦石與 $10 金幣工本費放進來，我就能為你重鑄出一件高階武器、防具或飾品，並自動記錄為已熔煉狀態！」
                      </p>

                      <button
                        onClick={() => {
                          const cost = 10;
                          if (!spend(cost, "鐵匠鋪熔煉全新裝備", "鐵匠鋪")) return;
                          
                          const parts: ("weapon" | "armor" | "accessory")[] = ["weapon", "armor", "accessory"];
                          const selectedPart = parts[Math.floor(Math.random() * parts.length)];
                          
                          let pickedItem;
                          if (selectedPart === "weapon") {
                            pickedItem = EQUIPMENT.weapons[Math.floor(Math.random() * EQUIPMENT.weapons.length)];
                          } else if (selectedPart === "armor") {
                            pickedItem = EQUIPMENT.armors[Math.floor(Math.random() * EQUIPMENT.armors.length)];
                          } else {
                            pickedItem = EQUIPMENT.accessories[Math.floor(Math.random() * EQUIPMENT.accessories.length)];
                          }
                          
                          setS(prev => {
                            const updatedForged = [...(prev.forgedItems || [])];
                            if (!updatedForged.includes(pickedItem.id)) {
                              updatedForged.push(pickedItem.id);
                            }
                            if (!updatedForged.includes(pickedItem.name)) {
                              updatedForged.push(pickedItem.name);
                            }
                            
                            const nextState = {
                              ...prev,
                              forgedItems: updatedForged
                            };
                            
                            if (selectedPart === "weapon") {
                              nextState.weapon = pickedItem.id;
                            } else if (selectedPart === "armor") {
                              nextState.armor = pickedItem.id;
                            } else {
                              nextState.accessory = pickedItem.id;
                            }
                            
                            return nextState;
                          });
                          
                          gainCreditExp(200);
                          addLog(`🧱 【鐵匠熔煉】你支付了 $10，哈肯全力打造出了極品裝備：【${pickedItem.rarity} ${pickedItem.name}】並已為你自動穿戴上！（信用消耗 +200）`);
                          recordEffectiveAction("鐵匠鋪熔煉裝備");
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md text-center"
                      >
                        🔥 開始熔煉全新裝備 (消耗 $10 G)
                      </button>
                    </div>
                  ) : (
                    /* 熔煉現有裝備 (帶分頁功能) */
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        ⚒️ 熔煉現有裝備清單
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        選擇身上裝備或背包中尚未熔煉的裝備進行精淬熔煉，成功熔煉後即可至大教堂進行聖光鑑定。
                      </p>

                      {(() => {
                        const unforgedList = getUnforgedEquipmentList();
                        const totalCount = unforgedList.length;
                        const PAGE_SIZE = 4;
                        const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
                        const currentPage = Math.min(unforgedForgePage, totalPages);
                        const pageItems = unforgedList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

                        return (
                          <div className="space-y-3 pt-1">
                            {totalCount === 0 ? (
                              <div className="p-6 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 space-y-1">
                                <p>🍃 目前身上與背包內沒有尚未熔煉的現有裝備！</p>
                                <p className="text-[10px] text-slate-600">所有持有裝備皆已完成過熔煉，或您身上目前無任何裝備。</p>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  {pageItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl flex items-center justify-between gap-2 transition-all"
                                    >
                                      <div className="space-y-0.5 min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-bold truncate" style={{ color: item.color }}>
                                            {item.name}
                                          </span>
                                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded" style={{ backgroundColor: item.color + '20', color: item.color }}>
                                            {item.rarity}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono block">
                                          {item.location} {item.count && item.count > 1 ? `(x${item.count})` : ''}
                                        </span>
                                      </div>

                                      <button
                                        onClick={() => {
                                          const cost = 10;
                                          if (!spend(cost, "熔煉現有裝備", "鐵匠鋪")) return;

                                          setS(prev => {
                                            const updatedForged = [...(prev.forgedItems || [])];
                                            if (!updatedForged.includes(item.id)) updatedForged.push(item.id);
                                            if (!updatedForged.includes(item.name)) updatedForged.push(item.name);
                                            return {
                                              ...prev,
                                              forgedItems: updatedForged
                                            };
                                          });

                                          gainCreditExp(150);
                                          addLog(`🔨 【現有裝備熔煉】你支付了 $10，鐵匠哈肯將【${item.name}】精淬熔煉完畢！已成功解鎖大教堂聖光鑑定！`);
                                          recordEffectiveAction("熔煉現有裝備");
                                        }}
                                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm whitespace-nowrap shrink-0"
                                      >
                                        🔨 熔煉此裝備 ($10 G)
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* 上一頁與下一頁動態分頁切換按鈕 */}
                                <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-2">
                                  <button
                                    onClick={() => setUnforgedForgePage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    ◀ 上一頁
                                  </button>

                                  <span className="text-[11px] font-mono font-bold text-slate-400">
                                    第 {currentPage} / {totalPages} 頁 (共 {totalCount} 件未熔煉裝備)
                                  </span>

                                  <button
                                    onClick={() => setUnforgedForgePage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    下一頁 ▶
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )
            ) : (
              renderSellInterface("皇家鐵匠鋪", "鐵匠哈肯", "「有不要的武器、防具或是採集到的鐵礦石，我都能高價公平回收！」")
            )}

            <button onClick={() => setView("village")} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl mt-6 cursor-pointer transition-all">
              離開鐵匠鋪，返回市集
            </button>
          </div>
        );

      case "forge_confirm":
        return (
          <div className="space-y-4 bg-slate-950 p-4 border border-slate-800 rounded-xl animate-fade-in">
            <h3 className="text-base font-bold text-amber-400 text-center border-b border-slate-800 pb-2">🧱 開始熔煉裝備</h3>
            <p className="text-xs text-slate-300 leading-relaxed text-center py-2">
              鐵匠哈肯拍打著赤紅的鐵砧：「小子，準備好開始你的熔煉了嗎？把你在野外好不容易打來的金鐵礦石放進去，再付給我 10 金幣的燃料工本費，我就能為你打造神兵利器！」
            </p>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  const cost = 10;
                  if (!spend(cost, "鐵匠鋪熔煉", "鐵匠鋪")) return;
                  
                  // Randomly generate weapon, armor or accessory
                  const parts: ("weapon" | "armor" | "accessory")[] = ["weapon", "armor", "accessory"];
                  const selectedPart = parts[Math.floor(Math.random() * parts.length)];
                  
                  let pickedItem;
                  if (selectedPart === "weapon") {
                    pickedItem = EQUIPMENT.weapons[Math.floor(Math.random() * EQUIPMENT.weapons.length)];
                  } else if (selectedPart === "armor") {
                    pickedItem = EQUIPMENT.armors[Math.floor(Math.random() * EQUIPMENT.armors.length)];
                  } else {
                    pickedItem = EQUIPMENT.accessories[Math.floor(Math.random() * EQUIPMENT.accessories.length)];
                  }
                  
                  setS(prev => {
                    const updatedForged = [...(prev.forgedItems || [])];
                    if (!updatedForged.includes(pickedItem.id)) {
                      updatedForged.push(pickedItem.id);
                    }
                    if (!updatedForged.includes(pickedItem.name)) {
                      updatedForged.push(pickedItem.name);
                    }
                    
                    const nextState = {
                      ...prev,
                      forgedItems: updatedForged
                    };
                    
                    // Equipping it automatically
                    if (selectedPart === "weapon") {
                      nextState.weapon = pickedItem.id;
                    } else if (selectedPart === "armor") {
                      nextState.armor = pickedItem.id;
                    } else {
                      nextState.accessory = pickedItem.id;
                    }
                    
                    return nextState;
                  });
                  
                  gainCreditExp(200);
                  addLog(`🧱 【鐵匠熔煉】你支付了 $10，哈肯全力打造出了極品裝備：【${pickedItem.rarity} ${pickedItem.name}】並已為你自動穿戴上！（信用消耗 +200）`);
                  recordEffectiveAction("鐵匠鋪熔煉裝備");
                  setView("forge");
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
              >
                確認熔煉 (消耗 $10)
              </button>
              
              <button
                onClick={() => setView("forge")}
                className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer text-center"
              >
                暫時取消
              </button>
            </div>
          </div>
        );

      case "shop":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-amber-400">🛒 帝國冒險補給站</h3>
              <span className="text-xs bg-slate-950 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                信用膨脹：{(S.inflation * 100).toFixed(0)}%
              </span>
            </div>

            {/* SubTab switcher for shop */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setShopSubTab("buy")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  shopSubTab === "buy"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                🛒 購買藥水與道具
              </button>
              <button
                onClick={() => setShopSubTab("sell")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  shopSubTab === "sell"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                💰 隨身道具與素材高價回收
              </button>
            </div>

            {shopSubTab === "buy" ? (
              <>
                <p className="text-xs text-slate-400">「高價售賣各類探險必需藥劑，價格受信用通膨隨時浮動。」</p>
                
                <div className="grid grid-cols-1 gap-3.5 mt-4">
                  {SHOP_ITEMS.map((p) => {
                    const cost = Math.ceil(p.cost * S.inflation);
                    return (
                      <div key={p.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-left">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-200">{p.name}</span>
                          <span className="text-[10px] text-slate-400 block">{p.desc}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!canAddItemToInventory(S.inventory, p.name, S.bagSize || 40)) {
                              addLog(`❌ 一般隨身背包欄位已滿，無法存放新種類物品【${p.name}】！`);
                              return;
                            }
                            if (!spend(p.cost, `購買${p.name}`, "商店")) return;
                            setS(prev => ({
                              ...prev,
                              inventory: [...prev.inventory, p.name]
                            }));
                            const expReward = Math.ceil(p.cost * 8);
                            gainCreditExp(expReward);
                            addLog(`✅ 成功購買 ${p.name}！（信用消耗 +${expReward}）`);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          ${cost}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              renderSellInterface("帝國冒險補給站", "道具鋪店主", "「藥水、野外菇類、各類採集到的戰利品素材都可在這裡變現！」")
            )}

            <button onClick={() => setView("village")} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl mt-4 cursor-pointer transition-all text-center">
              離開補給站，返回市集
            </button>
          </div>
        );

      case "church_menu":
        return (
          <div className="space-y-4 text-center py-2 animate-fade-in">
            <h3 className="text-lg font-bold text-amber-400">⛪ 大教堂大祭壇</h3>
            
            {/* 牧師進門台詞 */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-left flex items-center gap-3">
              <div className="text-2xl">👴</div>
              <div>
                <span className="text-xs font-bold text-amber-400 block">暴躁的大教堂牧師</span>
                <span className="text-[11px] text-slate-300 italic">「...（低頭數著金幣，看到你進入視若無睹）」</span>
              </div>
            </div>

            {/* 教堂金幣捐獻箱 (Church Donation Box) */}
            <div className="bg-slate-950/90 border border-amber-500/30 p-4 rounded-xl text-left space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <span>🪙 大教堂金幣捐獻箱</span>
                    {(S.churchDonation || 0) >= 10000 && (
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded border border-amber-500/40 font-mono">【暴躁牧師已加入】</span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    累積捐獻達 10,000 金幣感化暴躁牧師！每次捐獻獲得 7 場【聖光防護】(+13% HP & 傷害完全抵擋)！
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">累積捐獻</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">💰 {S.churchDonation || 0} / 10,000</span>
                </div>
              </div>

              <div className="flex gap-2">
                {[100, 500, 1000, 2000].map(amt => (
                  <button
                    key={amt}
                    disabled={S.coins < amt}
                    onClick={() => {
                      if (S.coins < amt) {
                        addLog("⚠️ 金幣不足，無法進行此金額的捐獻！");
                        return;
                      }
                      setS(prev => {
                        const newTotal = (prev.churchDonation || 0) + amt;
                        let logMsg = `🪙 你向教堂捐獻箱投入了 ${amt} 金幣！累積捐獻：${newTotal} 金幣。`;
                        let newTeammates = [...prev.veteranTeammates];
                        if (newTotal >= 10000 && !newTeammates.includes("priest")) {
                          newTeammates.push("priest");
                          logMsg += " 🎉 【神跡感化】「暴躁牧師」被你的誠意（與巨額金幣）震撼，加入了你的陣營！";
                        }
                        return {
                          ...prev,
                          coins: prev.coins - amt,
                          churchDonation: newTotal,
                          holyAegisBattles: 7,
                          veteranTeammates: newTeammates
                        };
                      });
                      addLog(`✨ 獲得神聖祝福！未來 7 場戰鬥將獲得【聖光防護】（HP +13% 且完全抵擋傷害）！`);
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-amber-500/30 text-amber-300 text-xs py-2 rounded-lg font-bold transition-all cursor-pointer text-center"
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Majestic Holy Altar Section */}
            <div className="bg-slate-950/80 border-2 border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center my-4 min-h-[220px] transition-all">
              {/* Golden divine light glow backdrops */}
              <div className="absolute w-48 h-48 rounded-full bg-amber-500/5 blur-3xl -top-10 pointer-events-none" />
              
              {/* Altar icon and sacred flame/glowing point */}
              <div className="relative mb-4 flex items-center justify-center">
                {/* Glowing rings */}
                <div className="absolute w-24 h-24 rounded-full border border-amber-500/20 animate-pulse" />
                <div className="absolute w-16 h-16 rounded-full border border-amber-400/30 animate-ping duration-1000" />
                
                {/* Altar focus light point */}
                <button 
                  disabled={isPrayingEffect}
                  onClick={prayToArchangel}
                  className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] border border-amber-200 z-10 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-6 h-6 text-slate-950 animate-pulse" />
                </button>
              </div>

              <h4 className="text-sm font-black text-amber-300 tracking-wide flex items-center gap-1.5">
                👼 大天使神聖恩賜聖池 (Soul Altar)
              </h4>
              <p className="text-[10px] text-slate-400 max-w-sm mt-1.5 text-center leading-relaxed">
                奉獻 <span className="text-amber-400 font-extrabold font-mono">10 金幣</span> 並向大天使聖壇虔誠祈禱，將能召喚靈魂降臨現世。高機率召喚各路搞笑夥伴，<strong>低機率喚醒擁有史詩及冒險經驗的「英雄級角色」</strong>！
              </p>

              {/* Pity Progress Tracker */}
              <div className="w-full max-w-xs mt-3.5 space-y-1.5 text-left bg-slate-900/40 p-2.5 border border-slate-900 rounded-xl">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <span>🌟 大天使的慈善救濟保底</span>
                    {(S.summonPityCount || 0) >= 10 && (
                      <span className="text-amber-400 font-black animate-pulse">【慈悲降臨】</span>
                    )}
                  </span>
                  <span className="text-amber-400 font-black font-mono">
                    {Math.min(10, S.summonPityCount || 0)} / 10 抽
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, ((S.summonPityCount || 0) / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 text-center italic">
                  {(S.summonPityCount || 0) >= 10 
                    ? "💡 大天使慈悲光環顯現！下一次召喚必定強制強制喚醒英雄級角色！"
                    : `再召喚 ${10 - Math.min(10, S.summonPityCount || 0)} 次未中英雄，將強制觸發大天使保底救濟`}
                </p>
              </div>

              {/* Dynamic Prayer Slider Section (動態連動拉軸) */}
              <div className="w-full max-w-xs mt-3 bg-slate-900/60 p-3 border border-amber-500/30 rounded-2xl space-y-2 text-left shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1 text-[11px]">
                    🎚️ 祈禱連抽次數拉軸：
                  </span>
                  <span className="text-amber-400 font-black font-mono text-xs bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {praySliderCount} 連抽
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={10}
                  value={praySliderCount}
                  onChange={(e) => setPraySliderCount(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-950 rounded-lg cursor-pointer h-2"
                />

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">總消耗金幣:</span>
                    <span className={`font-mono font-bold text-xs ${S.coins < praySliderCount * 10 ? "text-rose-400" : "text-amber-400"}`}>
                      💰 {praySliderCount * 10} 金幣
                    </span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">祈禱後預計累計:</span>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      🌟 {Math.min(10, (S.summonPityCount || 0) + praySliderCount)} / 10 抽
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Single Pray & Multi-Pray Slider Button */}
              <div className="flex gap-2.5 mt-3.5 flex-wrap justify-center w-full max-w-xs">
                {/* Standard single prayer button */}
                <button 
                  disabled={isPrayingEffect || S.coins < 10}
                  onClick={() => prayToArchangel(1)}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-950 text-slate-950 disabled:text-slate-500 font-black text-xs py-2.5 px-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-1 border border-amber-300 disabled:border-slate-800 whitespace-nowrap"
                >
                  {isPrayingEffect ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      禱告中...
                    </>
                  ) : (
                    <>
                      🛐 單次禱告 (10金幣)
                    </>
                  )}
                </button>

                {/* Multi-prayer button linked with slider */}
                {praySliderCount > 1 && (
                  <button 
                    disabled={isPrayingEffect || S.coins < praySliderCount * 10}
                    onClick={() => prayToArchangel(praySliderCount)}
                    className="flex-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-950 text-slate-950 disabled:text-slate-500 font-black text-xs py-2.5 px-3 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1 border border-amber-200 disabled:border-slate-800 whitespace-nowrap"
                  >
                    {isPrayingEffect ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        連抽中...
                      </>
                    ) : (
                      <>
                        ⚡ {praySliderCount}連抽 ({praySliderCount * 10}金幣)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Other Cathedral Services (Secondary tray) */}
            <div className="border-t border-slate-900/60 pt-4 text-left">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2.5 px-1">
                ⛪ 大教堂聖所其他服務：
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={startChurchHeal}
                  className="bg-slate-900 border border-slate-800/80 hover:border-amber-500 p-3.5 rounded-xl text-left cursor-pointer transition-all block"
                >
                  <span className="text-xs font-bold text-slate-100 block">🛐 祈禱靜修</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">免費。坐在長椅上傾聽聖歌，慢慢回滿生命值。</span>
                </button>

                <button 
                  onClick={() => setView("church_appraisal")}
                  className="bg-slate-900 border border-slate-800/80 hover:border-amber-500 p-3.5 rounded-xl text-left cursor-pointer transition-all block"
                >
                  <span className="text-xs font-bold text-slate-100 block">🔮 聖光鑑定</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">花費 5 金幣。自由選擇你身上或背包中未鑑定的裝備（武器、鎧甲、飾品）進行聖光鑑定，解鎖強力附加屬性！</span>
                </button>

                <button 
                  onClick={() => setView("church_confession")}
                  className="bg-slate-900 border border-slate-800/80 hover:border-amber-500 p-3.5 rounded-xl text-left cursor-pointer transition-all col-span-1 sm:col-span-2 block"
                >
                  <span className="text-xs font-bold text-amber-400 block">🧎 聖潔告解與神恩契約</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">向牧師進行靈魂懺悔，隨時免費獲取或更換超強的【神恩契約】。</span>
                </button>

                <button 
                  onClick={doUnrequitedChurchDonation}
                  className="bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 p-3.5 rounded-xl text-left cursor-pointer transition-all col-span-1 sm:col-span-2 block"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-300 block">⛪ 教堂【無償捐獻】贖罪解鎖</span>
                    <span className="text-[10px] text-amber-400 font-extrabold font-mono">金額隨機 (牧師定價)</span>
                  </div>
                  <span className="text-[9px] text-slate-300 mt-0.5 block">
                    向大教堂無償捐獻隨機金幣！可立即贖罪解鎖因魔力重鑄注入太頻繁而被牧師封鎖的重鑄服務。
                  </span>
                </button>

                <button 
                  onClick={() => setView("church_appraisal")}
                  className="bg-slate-900 border border-slate-800/80 hover:border-amber-500 p-3.5 rounded-xl text-left cursor-pointer transition-all col-span-1 sm:col-span-2 block"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-100 block">⚔️ 聖水洗滌重鑄屬性 / 重新注入魔力</span>
                    <span className="text-[10px] text-amber-400 font-extrabold font-mono">$15 / 次</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">
                    使用聖水重新洗滌注入魔力，重洗你裝備中的武器、護甲或飾品的神恩屬性！
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <button onClick={() => setView("village")} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl cursor-pointer transition-all font-bold">
                🏘️ 離開大教堂，返回市集
              </button>
              <button onClick={() => setView("menu")} className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs py-2.5 rounded-xl cursor-pointer transition-all font-bold">
                🏠 回到主選單
              </button>
            </div>
          </div>
        );

      case "church_appraisal": {
        // Collect all equipped gear (weapons, armors, accessories, helmets, necklaces, belts, greaves, boots)
        const equippedList = [
          { slotName: "武器部位", item: getEquippedWeapon() },
          { slotName: "鎧甲部位", item: getEquippedArmor() },
          { slotName: "飾品部位", item: getEquippedAccessory() },
          { slotName: "頭盔部位", item: getEquippedHelmet() },
          { slotName: "項鍊部位", item: getEquippedNecklace() },
          { slotName: "腰帶部位", item: getEquippedBelt() },
          { slotName: "護腿部位", item: getEquippedGreaves() },
          { slotName: "靴子部位", item: getEquippedBoots() },
        ].filter((e): e is { slotName: string; item: Equipment } => e.item !== null && e.item !== undefined);

        const allEquipmentList = [...EQUIPMENT.weapons, ...EQUIPMENT.armors, ...EQUIPMENT.accessories];
        const equippedItemIds = new Set(equippedList.map(e => e.item.id));

        // Find all weapons, armors, and accessories in S.inventory
        const inventoryEquipmentDict: Record<string, { item: Equipment; count: number }> = {};
        (S.inventory || []).forEach(itemKey => {
          const matchedEq = allEquipmentList.find(e => e.id === itemKey || e.name === itemKey);
          if (matchedEq) {
            if (inventoryEquipmentDict[matchedEq.id]) {
              inventoryEquipmentDict[matchedEq.id].count += 1;
            } else {
              inventoryEquipmentDict[matchedEq.id] = { item: matchedEq, count: 1 };
            }
          }
        });

        // Exclude items already listed as equipped to prevent duplicate entries
        const inventoryEquipmentList = Object.values(inventoryEquipmentDict)
          .filter(({ item }) => !equippedItemIds.has(item.id));

        const forgedSet = new Set(S.forgedItems || []);

        interface CandidateItem {
          id: string;
          name: string;
          type: string;
          rarity: string;
          color: string;
          location: string;
          isForged: boolean;
          isAppraised: boolean;
          buff?: Buff;
          count?: number;
        }

        const candidates: CandidateItem[] = [
          ...equippedList.map(({ slotName, item }) => ({
            id: item.id,
            name: item.name,
            type: item.type || "裝備",
            rarity: item.rarity,
            color: item.color,
            location: `${slotName} (已裝備)`,
            isForged: forgedSet.has(item.id) || forgedSet.has(item.name),
            isAppraised: !!equipBuffMap[item.id],
            buff: equipBuffMap[item.id]
          })),
          ...inventoryEquipmentList.map(({ item, count }) => ({
            id: item.id,
            name: item.name,
            type: item.type || "裝備",
            rarity: item.rarity,
            color: item.color,
            location: `🎒 背包物品 ${count > 1 ? `(x${count})` : ""}`,
            isForged: forgedSet.has(item.id) || forgedSet.has(item.name),
            isAppraised: !!equipBuffMap[item.id],
            buff: equipBuffMap[item.id],
            count
          }))
        ];

        const unappraisedList = candidates.filter(c => !c.isAppraised);
        const appraisedList = candidates.filter(c => c.isAppraised);

        let filteredCandidates = unappraisedList;
        if (churchAppraisalTab === "appraised") {
          filteredCandidates = appraisedList;
        } else if (churchAppraisalTab === "all") {
          filteredCandidates = candidates;
        }

        const PAGE_SIZE = 4;
        const totalCount = filteredCandidates.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
        const safePage = Math.min(Math.max(1, churchAppraisalPage), totalPages);
        const pagedCandidates = filteredCandidates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        return (
          <div className="space-y-4 text-center py-4 animate-fade-in">
            <h3 className="text-lg font-bold text-amber-400 flex items-center justify-center gap-2">
              ⛪ 聖殿工坊：神恩鑑定與重鑄 (重新注入魔力)
            </h3>
            <p className="text-xs text-slate-400">
              「所有裝備必須先在鐵匠鋪完成熔煉方可解鎖聖光鑑定。神明的光輝將拂去表面的塵埃，揭示其內藏之玄機。」
            </p>

            {S.churchRerollLockedVisits && S.churchRerollLockedVisits > 0 && (
              <div className="bg-rose-950/40 border border-rose-900/60 p-3.5 rounded-xl text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs font-bold text-rose-400 block">🔒 【聖光重鑄套利已被禁止】</span>
                  <span className="text-[10px] text-rose-300 mt-1 block">
                    憤怒的牧師看穿了你的重刷套利行為！你在大教堂的聖水重鑄服務已被暫時封鎖（還需造訪野外 {S.churchRerollLockedVisits} 次或進行「無償捐獻」）！
                  </span>
                </div>
                <button
                  onClick={doUnrequitedChurchDonation}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shadow-amber-500/20"
                >
                  ⛪ 進行【無償捐獻】解鎖 (金額隨機)
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center justify-center gap-2 border-b border-slate-800/80 pb-3">
              <button
                onClick={() => { setChurchAppraisalTab("unappraised"); setChurchAppraisalPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  churchAppraisalTab === "unappraised"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <span>🔮 待鑑定物品</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  churchAppraisalTab === "unappraised" ? "bg-slate-950/40 text-amber-950" : "bg-slate-800 text-amber-400"
                }`}>
                  {unappraisedList.length}
                </span>
              </button>

              <button
                onClick={() => { setChurchAppraisalTab("appraised"); setChurchAppraisalPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  churchAppraisalTab === "appraised"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <span>✨ 已鑑定 (神恩洗滌)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  churchAppraisalTab === "appraised" ? "bg-slate-950/40 text-indigo-200" : "bg-slate-800 text-indigo-400"
                }`}>
                  {appraisedList.length}
                </span>
              </button>

              <button
                onClick={() => { setChurchAppraisalTab("all"); setChurchAppraisalPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  churchAppraisalTab === "all"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <span>📦 全部裝備</span>
                <span className="bg-slate-950/40 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black text-slate-300">
                  {candidates.length}
                </span>
              </button>
            </div>

            {/* Dynamic Pagination Top Info */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-950/80 border border-slate-800/80 px-3.5 py-2.5 rounded-xl">
                <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  第 <span className="text-amber-400 font-bold">{safePage}</span> / <span className="text-slate-200 font-bold">{totalPages}</span> 頁
                  <span className="text-slate-500 ml-1">
                    (每頁 {PAGE_SIZE} 項，共 {totalCount} 件{churchAppraisalTab === "unappraised" ? "待鑑定品項" : churchAppraisalTab === "appraised" ? "已鑑定品項" : "裝備"})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChurchAppraisalPage(p => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      safePage <= 1
                        ? "bg-slate-900 text-slate-600 border border-slate-800/60 cursor-not-allowed"
                        : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer shadow-sm"
                    }`}
                  >
                    ◀ 上一頁
                  </button>

                  <span className="text-xs font-mono text-slate-400 px-1">
                    {safePage}/{totalPages}
                  </span>

                  <button
                    onClick={() => setChurchAppraisalPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      safePage >= totalPages
                        ? "bg-slate-900 text-slate-600 border border-slate-800/60 cursor-not-allowed"
                        : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer shadow-sm"
                    }`}
                  >
                    下一頁 ▶
                  </button>
                </div>
              </div>
            )}

            {/* Item List */}
            <div className="grid grid-cols-1 gap-3.5 mt-3">
              {pagedCandidates.map((c) => {
                const appraisalCost = 5;
                const rerollCost = 15;

                return (
                  <div key={c.id} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                          {c.location}
                        </span>
                        
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-900/40">
                          {c.type}
                        </span>

                        {/* Status Warnings */}
                        {!c.isForged && (
                          <span className="text-[10px] font-black text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                            🚨 [未熔煉]
                          </span>
                        )}

                        {!c.isAppraised ? (
                          <span className="text-[10px] font-black text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                            🔒 [未鑑定]
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded flex items-center gap-1">
                            ✨ [已完成聖光鑑定]
                          </span>
                        )}

                        {c.isForged && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/40">
                            🔨 鐵匠鋪已熔煉
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded mr-1" style={{ backgroundColor: c.color + '20', color: c.color }}>
                            {c.rarity}
                          </span>
                          <span className="text-sm font-bold text-slate-100">{c.name}</span>
                        </div>

                        <div className="mt-2 text-xs font-mono">
                          {c.buff ? (
                            <p className="text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-900/40 px-2 py-1.5 rounded-lg flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              <span>已鑑定神恩：【{c.buff.name}】 ({c.buff.desc})</span>
                            </p>
                          ) : (
                            <p className="text-slate-500 italic bg-slate-950/40 px-2 py-1 rounded-lg">
                              🔒 尚未進行聖光鑑定 (無附加屬性)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                      {!c.isAppraised ? (
                        !c.isForged ? (
                          <button
                            disabled
                            className="bg-slate-950/80 text-rose-400/80 border border-rose-900/50 text-xs font-bold px-4 py-2.5 rounded-xl opacity-75 cursor-not-allowed w-full sm:w-auto text-center"
                            title="請先前往鐵匠鋪進行裝備熔煉"
                          >
                            🔒 未熔煉 (請先至鐵匠鋪熔煉)
                          </button>
                        ) : (
                          <button
                            onClick={() => appraiseSelectedGear({ itemId: c.id, itemName: c.name })}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/5 w-full sm:w-auto text-center"
                          >
                            🔮 聖光鑑定 ({money(appraisalCost)})
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => rerollSelectedGear({ itemId: c.id, itemName: c.name })}
                          disabled={!!(S.churchRerollLockedVisits && S.churchRerollLockedVisits > 0)}
                          className={`text-xs font-black px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto text-center ${
                            (S.churchRerollLockedVisits && S.churchRerollLockedVisits > 0)
                              ? "bg-slate-800 text-slate-500 border border-slate-900 cursor-not-allowed"
                              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-500/10"
                          }`}
                        >
                          ⚔️ 重新注入魔力 / 聖水洗滌 ({money(rerollCost)})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {totalCount === 0 && (
                <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                  {churchAppraisalTab === "unappraised" ? (
                    <>
                      <p className="text-amber-400 font-bold text-xs">🎉 沒有待鑑定的裝備！</p>
                      <p className="text-slate-400 text-[11px]">
                        你手邊所有的裝備與武器皆已完成聖光鑑定，或尚未獲得新裝備。可切換至「✨ 已鑑定 (神恩洗滌)」進行屬性洗滌重鑄！
                      </p>
                    </>
                  ) : churchAppraisalTab === "appraised" ? (
                    <>
                      <p className="text-slate-400 text-xs">⚠️ 目前尚無已鑑定的裝備！</p>
                      <p className="text-slate-500 text-[11px]">請先在「🔮 待鑑定物品」列表中完成聖光鑑定後，再來進行魔力重洗與聖水洗滌。</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-400 text-xs">⚠️ 你的背包或身上目前沒有任何裝備（武器、鎧甲或飾品）！</p>
                      <p className="text-slate-500 text-[11px]">請在冒險野外擊敗魔物、完成任務，或前往【鐵匠鋪】進行熔煉取得裝備後再來大教堂。</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Pagination Controls if multiple pages */}
            {totalCount > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setChurchAppraisalPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    safePage <= 1
                      ? "bg-slate-900 text-slate-600 border border-slate-800/60 cursor-not-allowed"
                      : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer"
                  }`}
                >
                  ◀ 上一頁
                </button>
                <span className="text-xs font-mono text-slate-400">
                  第 {safePage} / {totalPages} 頁
                </span>
                <button
                  onClick={() => setChurchAppraisalPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    safePage >= totalPages
                      ? "bg-slate-900 text-slate-600 border border-slate-800/60 cursor-not-allowed"
                      : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer"
                  }`}
                >
                  下一頁 ▶
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
              <button 
                onClick={() => setView("church_menu")} 
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                ↩ 返回大教堂聖所
              </button>
              <button 
                onClick={() => setView("village")} 
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                🏘️ 離開大教堂，返回市集
              </button>
              <button 
                onClick={() => setView("menu")} 
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                🏠 回到主選單
              </button>
            </div>
          </div>
        );
      }

      case "church_heal":
        return (
          <div className="text-center py-8 space-y-4">
            <div className="animate-pulse">
              <Landmark className="w-12 h-12 text-amber-500 mx-auto" />
            </div>
            <h3 className="text-lg font-bold text-amber-400">🛐 虔誠祈禱靜修中...</h3>
            <p className="text-xs text-slate-300">聖潔的光芒籠罩著你，傷口正在緩慢癒合。</p>
            <div className="flex justify-center max-w-xs mx-auto">
              {renderTextBar((S.hp / getTotalMaxHp()) * 100, "text-amber-400", 10)}
            </div>
            <p className="text-xs font-mono">{S.hp} / {getTotalMaxHp()} HP</p>

            <div className="grid grid-cols-2 gap-2 mt-6 max-w-xs mx-auto">
              <button 
                onClick={() => setView("church_menu")} 
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
              >
                ↩ 返回大教堂
              </button>
              <button 
                onClick={() => setView("village")} 
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
              >
                🏘️ 返回村莊市集
              </button>
            </div>
          </div>
        );

      case "church_confession":
        return (
          <div className="space-y-4 bg-slate-950 p-4 border border-slate-800 rounded-xl animate-fade-in">
            <h3 className="text-base font-bold text-amber-400 text-center border-b border-slate-800 pb-2">🧎 告解聖殿</h3>
            
            {confessionSuccessMsg && (
              <div className="bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-xl text-xs font-mono text-emerald-300 text-center animate-fade-in">
                🎉 {confessionSuccessMsg}
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800">
                <span className="text-amber-400 font-bold">⛪ 溫和的牧師說：</span>
                <p className="mt-2 text-slate-200">
                  「迷茫的靈魂啊，神恩浩瀚。說吧，這次想祈求什麼神恩？主將賜予你契約加持，助你在揹負重擔的旅途中一路平安。」
                </p>
              </div>
              <p className="text-[11px] text-slate-400 text-center">你可以隨時自由挑選並契約加持以下一項強大的【神恩契約】（不受任何還款與負債狀態限制）：</p>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => {
                    const newVal = Math.floor(Math.random() * 21) + 10;
                    setS(prev => ({ ...prev, confessionBuff: 'leech', confessionVal: newVal }));
                    const msg = `⛪ 契約成功（隨機數值替換）：你契約了【血債血償】神恩！數值替換為 ${newVal}% 吸血！原先的神恩契約已被覆蓋。`;
                    addLog(msg);
                    setConfessionSuccessMsg(msg);
                  }}
                  className={`border p-3 rounded-xl text-left cursor-pointer transition-all ${
                    S.confessionBuff === 'leech' ? "bg-rose-950/50 border-rose-500 shadow-md shadow-rose-950" : "bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-amber-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 block">🩸 神恩契約：血債血償 (Life Leech)</span>
                    {S.confessionBuff === 'leech' && (
                      <span className="text-[10px] bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full font-mono font-bold">當前已生效 ({S.confessionVal || 15}%)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    常駐被動。戰鬥中每次使用普通攻擊或職業技能時，傷害依隨機數值（10%~30%）轉化為自身 HP 回復！(當前隨機數值: {S.confessionBuff === 'leech' ? `${S.confessionVal}%` : "點擊重新替換"})
                  </span>
                </button>

                <button
                  onClick={() => {
                    const newVal = parseFloat((Math.random() * 1.5 + 1.5).toFixed(1));
                    setS(prev => ({ ...prev, confessionBuff: 'toss', confessionVal: newVal }));
                    const msg = `⛪ 契約成功（隨機數值替換）：你契約了【惡意撒幣】主動奧義！數值替換為撒幣威力 ${newVal}x！原先的神恩契約已被覆蓋。`;
                    addLog(msg);
                    setConfessionSuccessMsg(msg);
                  }}
                  className={`border p-3 rounded-xl text-left cursor-pointer transition-all ${
                    S.confessionBuff === 'toss' ? "bg-amber-950/50 border-amber-500 shadow-md shadow-amber-950" : "bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-amber-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 block">💸 神恩契約：惡意撒幣 (Gold Toss)</span>
                    {S.confessionBuff === 'toss' && (
                      <span className="text-[10px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">當前已生效 ({S.confessionVal || 2.0}x)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    解鎖超強主動奧義。戰鬥時隨機抽取全遊戲金幣（身上+保險櫃）發動，倍率加成依隨機數值（1.5x~3.0x）爆發神聖真傷！(當前隨機數值: {S.confessionBuff === 'toss' ? `${S.confessionVal}x` : "點擊重新替換"})
                  </span>
                </button>

                <button
                  onClick={() => {
                    const newVal = Math.floor(Math.random() * 21) + 70;
                    setS(prev => ({ ...prev, confessionBuff: 'shield', confessionVal: newVal }));
                    const msg = `⛪ 契約成功（隨機數值替換）：你契約了【絕對防禦】被動！數值替換為受傷降低 ${newVal}%！原先的神恩契約已被覆蓋。`;
                    addLog(msg);
                    setConfessionSuccessMsg(msg);
                  }}
                  className={`border p-3 rounded-xl text-left cursor-pointer transition-all ${
                    S.confessionBuff === 'shield' ? "bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-950" : "bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-amber-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 block">🛡️ 神恩契約：絕對防禦 (Absolute Defense)</span>
                    {S.confessionBuff === 'shield' && (
                      <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">當前已生效 ({S.confessionVal || 85}%)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    常駐被動。在戰鬥中，神聖護盾永遠環繞著你，使你承受的各種敵方傷害依隨機數值（70%~90%）降低！(當前隨機數值: {S.confessionBuff === 'shield' ? `${S.confessionVal}%` : "點擊重新替換"})
                  </span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
              <button 
                onClick={() => setView("church_menu")} 
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                ↩ 返回大教堂聖所
              </button>
              <button 
                onClick={() => setView("village")} 
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                🏘️ 離開大教堂，返回市集
              </button>
              <button 
                onClick={() => setView("menu")} 
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                🏠 回到主選單
              </button>
            </div>
          </div>
        );

      case "tavern":
        const currentRecruits = (S.tavernTeammates && S.tavernTeammates.length > 0)
          ? S.tavernTeammates
          : ["accountant", "bard", "guard", "miner"];

        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-950 pb-3">
              <Coffee className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-amber-400">破產者小酒館 (Bankrupt's Tavern)</h3>
                <p className="text-[10px] text-slate-400">「來一杯吧！在這裡沒人在乎你是贏家還是落魄的債務人。」</p>
              </div>
            </div>

            {/* 酒精飲料區 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 px-1">🍺 酒精特調與負債灌頂：</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => triggerDrink(1)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-3.5 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">🍺 暢飲一杯麥芽啤</span>
                    <span className="text-[10px] text-slate-400 block mt-1">預支 10 金幣 | 暴怒值 +15%，閃避微升，防禦稍降</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">$10</span>
                </button>
                <button 
                  onClick={() => triggerDrink(2)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-3.5 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">🍷 狂灌三杯伏特加</span>
                    <span className="text-[10px] text-slate-400 block mt-1">預支 25 金幣 | 暴怒值 +35%，傷害大幅增加！</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">$25</span>
                </button>
              </div>
            </div>

            {/* 極限嘲諷對話框 */}
            {dismissedQuote && (
              <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl space-y-2 relative animate-shake">
                <p className="text-xs font-black text-rose-400">🚨 【前隊友解雇留念】{dismissedQuote.name} 啐了一口口水：</p>
                <p className="text-xs text-rose-200 italic font-medium leading-relaxed">
                  {dismissedQuote.text}
                </p>
                <button
                  onClick={() => setDismissedQuote(null)}
                  className="absolute top-2 right-2 text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer px-1.5 py-0.5 rounded"
                >
                  ✕ 閉嘴
                </button>
              </div>
            )}

            {/* 當前小隊成員 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 px-1">🎒 冒險小隊成員 (當前成員)：</h4>
              {S.teammates.length === 0 ? (
                <div className="p-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  🍃 孤家寡人。目前沒有任何隊友追隨你，快去招募幾位搞笑破產者吧！
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {S.teammates.map(id => {
                    const tm = getTeammateData(id);
                    if (!tm) return null;
                    return (
                      <div key={id} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">
                            【{tm.prefix}】{tm.name} <span className="text-[10px] text-slate-400 font-normal">({tm.nickname})</span>
                          </span>
                          <span className="text-[9px] text-amber-500 block mt-0.5">{tm.desc}</span>
                        </div>
                        <button
                          onClick={() => dismissTeammate(id)}
                          className="bg-rose-950/50 hover:bg-rose-900 border border-rose-900 text-rose-300 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          👋 解雇除名
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 可招募的新人夥伴 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs font-bold text-slate-400">🤝 酒館內正待尋求飯碗的破產流浪漢 (每3次進村刷新)：</h4>
                <span className="text-[10px] text-slate-500">進村刷新計數: {S.villageVisits || 0} / 3</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {currentRecruits
                  .filter(id => !S.teammates.includes(id))
                  .map(id => {
                    const tm = getTeammateData(id);
                    if (!tm) return null;
                    const isVeteran = S.veteranTeammates?.includes(id);
                    const finalCost = isVeteran ? 0 : Math.ceil(tm.cost * S.inflation);
                    return (
                      <div 
                        key={id} 
                        className={`bg-slate-950/80 border p-4 rounded-xl flex flex-col justify-between gap-3 transition-all ${
                          isVeteran 
                            ? "border-amber-500/40 hover:border-amber-400 bg-amber-500/[0.02]" 
                            : "border-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-200">【{tm.prefix}】{tm.name}</span>
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{tm.nickname}</span>
                            {isVeteran && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/20">
                                🎖️ 前輩勇者
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {tm.desc} (武力加成: 攻擊力 {tm.atkMin}~{tm.atkMax})
                          </p>

                          {/* Veteran Interactive滄桑對話框 */}
                          {isVeteran && (
                            <div 
                              onClick={() => {
                                addLog(`🍻 【${tm.name}】深深嘆了一口氣，端著酒杯對你說...`);
                                addLog(`💬 「大天使把一個靈魂踹回地面，一個曾經有過史詩及冒險的角色，重新踏在土地上……想當年我也是帶著神兵利器斬妖除魔的傳奇，結果現在只能在酒館看你背著滿身債繼續跳針……真懷念啊，那時候我至少不用每天擔心利息。」`);
                              }}
                              className="mt-2 bg-slate-900/80 border border-amber-500/10 p-3 rounded-lg text-[10px] text-amber-200/80 leading-relaxed cursor-pointer hover:bg-slate-900 transition-colors relative"
                              title="點擊傾聽回憶"
                            >
                              <div className="absolute top-1 right-1.5 text-[8px] text-slate-500 uppercase tracking-widest">💬 點擊傾聽</div>
                              <span className="text-amber-400 font-bold block mb-0.5">💭 喝悶酒的前輩勇者嘆息：</span>
                              "大天使把一個靈魂踹回地面，一個曾經有過史詩及冒險的角色，重新踏在土地上……想當年我也是帶著神兵利器斬妖除魔的傳奇，結果現在只能在酒館看你背著滿身債繼續跳針……真懷念啊，那時候我至少不用每天擔心利息。"
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-1 flex-wrap gap-2">
                          <span className="text-[9px] text-slate-500">
                            {isVeteran ? "🌟 曾與你並肩作戰，現可無代價召回" : "📜 需要簽訂債務共同承擔契約"}
                          </span>
                          <button
                            onClick={() => recruitTeammate(id)}
                            className={`text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md self-end ${
                              isVeteran 
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/5"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white"
                            }`}
                          >
                            {isVeteran ? "🤝 歸隊 (無代價 $0)" : `簽約加入 ${money(finalCost)}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {currentRecruits.filter(id => !S.teammates.includes(id)).length === 0 && (
                  <div className="p-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                    🍻 當前酒館中可招募的流浪漢都已被你收入麾下了！
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setView("village")} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl mt-4 cursor-pointer transition-all"
            >
              返回村莊市集
            </button>
          </div>
        );

      case "bank":
        const hasGold = S.gold > 0;
        const commBonusEachVal = Math.floor(((S.commerce || 10) - 10) * 0.2);
        const coinsForSelected = exchangeSliderAmount * 10;
        const commBonusForSelected = exchangeSliderAmount * commBonusEachVal;
        const feeCoinsForSelected = Math.ceil(coinsForSelected * 0.15);
        const totalGainedForSelected = coinsForSelected + commBonusForSelected - feeCoinsForSelected;

        // 計算定存進度
        const mapEarnedForBank = Math.max(0, (S.mapProgress || 0) - (S.depositStartMapProgress || 0));
        const depositP = Math.min(100, Math.floor((S.depositBattles || 0) / 2 + mapEarnedForBank * 2));
        const minDep = 10;
        const maxDep = Math.max(minDep, S.coins);
        const selectedDepAmount = Math.max(minDep, Math.min(maxDep, depositSliderAmount));

        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Landmark className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-amber-400">帝國皇家信託銀行</h3>
                <p className="text-[10px] text-slate-400">帝國最龐大的金融巨獸，也是你負債與信用支配的起源地。</p>
              </div>
            </div>

            {/* 金塊兌換區域 */}
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">🧱 持有金塊總數：</span>
                <span className="text-sm font-mono font-black text-amber-400">{S.gold} 塊</span>
              </div>

              {!hasGold ? (
                <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  ⚠️ 您當前沒有任何金塊可進行兌換。
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>選擇兌換數量：</span>
                      <span className="font-bold text-slate-200">{exchangeSliderAmount} / {S.gold} 塊</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={S.gold}
                      value={exchangeSliderAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setExchangeSliderAmount(Math.max(1, Math.min(S.gold, val)));
                      }}
                      className="w-full accent-amber-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-900 rounded-xl space-y-1.5 text-[11px] text-slate-300 font-sans">
                    <div className="flex justify-between">
                      <span>🪙 基礎兌換額：</span>
                      <span className="font-mono font-bold text-slate-200">{money(coinsForSelected)}</span>
                    </div>
                    {commBonusForSelected > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>📈 經商天賦加成 ({(S.commerce || 10)} 點)：</span>
                        <span className="font-mono font-bold">+{money(commBonusForSelected)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-rose-400 border-t border-slate-900 pt-1.5">
                      <span>🏦 縮水交易手續費 (15%)：</span>
                      <span className="font-mono font-bold">-{money(feeCoinsForSelected)} 金幣</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-400 border-t border-slate-900 pt-1.5 text-xs">
                      <span>🔥 預計實得金幣：</span>
                      <span>{money(totalGainedForSelected)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => exchangeGold()}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      🧱 兌換指定數量
                    </button>
                    <button
                      onClick={() => {
                        exchangeGold(S.gold);
                      }}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-orange-500/10"
                    >
                      🌟 執行全部兌換
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 活期純儲存保險箱區域 */}
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">🔐 帝國銀行活期金庫 (純儲存保險箱)</span>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-mono font-bold">無手續費 • 0%違約金 • 隨存隨取</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-900 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">當前活期保險箱保管總額</span>
                  <span className="text-sm font-mono font-black text-amber-400">{money(S.savings || 0)}</span>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  <span>攜帶現金: </span>
                  <span className="font-mono font-bold text-slate-200">{money(S.coins)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* 存入控制區 */}
                <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">📥 存入金幣至保險箱</span>
                    <span className="font-mono font-bold text-amber-400">
                      {Math.max(1, Math.min(S.coins || 1, pureSavingsDepositAmount))} / {money(S.coins)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, S.coins)}
                    value={Math.max(1, Math.min(S.coins || 1, pureSavingsDepositAmount))}
                    onChange={(e) => setPureSavingsDepositAmount(parseInt(e.target.value) || 1)}
                    disabled={S.coins <= 0}
                    className="w-full accent-amber-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => depositPureSavings(Math.max(1, Math.min(S.coins, pureSavingsDepositAmount)))}
                      disabled={S.coins <= 0}
                      className="bg-slate-900 border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 font-bold py-1.5 rounded-lg text-[11px] transition-all cursor-pointer disabled:opacity-40"
                    >
                      📥 存入指定金額
                    </button>
                    <button
                      onClick={() => depositPureSavings(S.coins)}
                      disabled={S.coins <= 0}
                      className="bg-amber-500/20 border border-amber-500/60 hover:bg-amber-500/30 text-amber-300 font-bold py-1.5 rounded-lg text-[11px] transition-all cursor-pointer disabled:opacity-40"
                    >
                      💰 全部存入 ({money(S.coins)})
                    </button>
                  </div>
                </div>

                {/* 提領控制區 */}
                <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">📤 從保險箱提領金幣</span>
                    <span className="font-mono font-bold text-amber-400">
                      {Math.max(1, Math.min(S.savings || 1, pureSavingsWithdrawAmount))} / {money(S.savings || 0)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, S.savings || 0)}
                    value={Math.max(1, Math.min(S.savings || 1, pureSavingsWithdrawAmount))}
                    onChange={(e) => setPureSavingsWithdrawAmount(parseInt(e.target.value) || 1)}
                    disabled={(S.savings || 0) <= 0}
                    className="w-full accent-amber-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => withdrawPureSavings(Math.max(1, Math.min(S.savings || 0, pureSavingsWithdrawAmount)))}
                      disabled={(S.savings || 0) <= 0}
                      className="bg-slate-900 border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 font-bold py-1.5 rounded-lg text-[11px] transition-all cursor-pointer disabled:opacity-40"
                    >
                      📤 提領指定金額
                    </button>
                    <button
                      onClick={() => withdrawPureSavings(S.savings || 0)}
                      disabled={(S.savings || 0) <= 0}
                      className="bg-emerald-500/20 border border-emerald-500/60 hover:bg-emerald-500/30 text-emerald-300 font-bold py-1.5 rounded-lg text-[11px] transition-all cursor-pointer disabled:opacity-40"
                    >
                      💰 全部提領 ({money(S.savings || 0)})
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 定存計畫區域 (新增) */}
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">🏦 帝國皇家定期存款計畫</span>
                <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded">起存額度: 10 金幣</span>
              </div>

              {S.deposit <= 0 ? (
                // 尚未存款的介面
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    在信託銀行存放多餘的金幣可以建立定存單。資金將暫時被鎖定，待完成一定地圖探索與基礎行動進度後，即可以享有 <strong>5% 的固定本息獲利</strong> 領回！
                  </p>

                  {maxDep < minDep ? (
                    <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                      ⚠️ 持有金幣不足辦理起存限制 (最低 10 金幣，當前持有: {money(S.coins)})。
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>選擇存入金幣金額：</span>
                          <span className="font-mono font-bold text-amber-400">{selectedDepAmount} / {maxDep} 金幣</span>
                        </div>
                        <input
                          type="range"
                          min={minDep}
                          max={maxDep}
                          value={selectedDepAmount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || minDep;
                            setDepositSliderAmount(Math.max(minDep, Math.min(maxDep, val)));
                          }}
                          className="w-full accent-amber-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="p-3 bg-slate-900/60 border border-slate-900 rounded-xl space-y-1 text-[11px] text-slate-300">
                        <div className="flex justify-between">
                          <span>✍️ 簽署存款金額:</span>
                          <span className="font-mono font-bold text-slate-200">{money(selectedDepAmount)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>📈 5% 利潤收益:</span>
                          <span className="font-mono font-bold">+{money(Math.round(selectedDepAmount * 0.05))}</span>
                        </div>
                        <div className="flex justify-between font-bold text-amber-400 border-t border-slate-900 pt-1 text-xs">
                          <span>💰 滿期領回本息:</span>
                          <span>{money(Math.round(selectedDepAmount * 1.05))}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-3 border border-slate-900 rounded-xl space-y-1.5 text-[10px] text-slate-400">
                        <div>🔓 <strong>成熟解鎖公式</strong>：進度條達到 100% (P = 基礎行動/2 + 地圖進度*2)。</div>
                        <div>🚨 <strong>提前贖回罰則</strong>：進度未滿 100% 時，若強行提前領回，將扣除本金 10% 違約金，無利息利潤。</div>
                      </div>

                      <button
                        onClick={() => makeTimeDeposit(selectedDepAmount)}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-amber-500 text-amber-400 hover:text-amber-300 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        ✍️ 簽署並存入 {money(selectedDepAmount)} 金幣
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // 已有存款的進度顯示與提領介面
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 border border-slate-900 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">鎖定定存本金</span>
                      <span className="font-mono font-black text-slate-200 text-sm">{money(S.deposit)}</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-900 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">預計滿期本息 (5%)</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">{money(Math.round(S.deposit * 1.05))}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">🔓 定存合約成熟度 (Progress)：</span>
                      <span className="font-mono font-bold text-amber-400">{depositP}% / 100%</span>
                    </div>
                    
                    {/* 進度條 */}
                    <div className="w-full bg-slate-950 border border-slate-900 h-3 rounded-full overflow-hidden relative shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${depositP}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400 bg-slate-900/30 p-2 rounded-xl">
                      <div>🛠️ 基礎有效行動: <span className="font-mono font-bold text-slate-200">{S.depositBattles || 0}</span> 次</div>
                      <div>🗺️ 當前地圖進度: <span className="font-mono font-bold text-slate-200">{S.mapProgress || 0}%</span></div>
                    </div>
                    <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                      進度推進機制：每執行 2 次有效行動（如打怪、採集、對話或城鎮交易）+1% | 當前地圖進度每 +1% +2%
                    </p>
                  </div>

                  {depositP >= 100 ? (
                    <button
                      onClick={withdrawTimeDeposit}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      💰 滿期全額領回本息 (實得 {money(Math.round(S.deposit * 1.05))})
                    </button>
                  ) : (
                    <div className="space-y-3 border-t border-slate-900 pt-3">
                      <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-xl text-center text-[10px] text-rose-300 font-sans">
                        ⚠️ 定存尚未成熟。若現在緊急提領，需扣除 10% 本金作為違約懲罰 (扣除: -{money(Math.round(S.deposit * 0.10))}，僅能退回本金 90%: {money(Math.round(S.deposit * 0.90))})。
                      </div>
                      <button
                        onClick={withdrawTimeDeposit}
                        className="w-full bg-slate-900 border border-rose-900/50 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        🚨 提前解鎖強制提領 (退回 {money(Math.round(S.deposit * 0.90))})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 還債區域 */}
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">✅ 償還信託欠款：</span>
                <span className="font-mono font-bold text-rose-500">當前負債: {formatDebt(S.debt, S.debtLimit || 1500, S.creditLevel || 1)}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                使用你持有的所有金幣抵償帝國銀行的負債。還債可以大幅提升信用額度、洗刷不良紀錄並賺取額外技能點！
              </p>
              <button
                onClick={repayDebt}
                className="w-full bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-200 hover:text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                🪙 支付當前所有金幣償還
              </button>
            </div>

            <button 
              onClick={() => setView("village")} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
            >
              返回村莊
            </button>
          </div>
        );

      case "inn":
        const innCost = Math.ceil(120 * S.inflation);
        const currentRoomId = S.innRoomType || "micro_studio";
        const currentRoom = ROOM_TYPES[currentRoomId] || ROOM_TYPES.micro_studio;
        const currentVault = S.hotelVault || [];
        const vaultCapacity = currentRoom.vaultCapacity;
        const overdue = S.overdueRent || 0;
        const isFrozen = S.isVaultFrozen || false;

        return (
          <div className="space-y-4 animate-fade-in py-1">
            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-amber-400 flex items-center justify-center gap-2">
                🏨 勇者老客棧 & 魔法保險箱
              </h3>
              <p className="text-xs text-slate-300">
                提供安心的休息之所與防護嚴密的動態容量魔法保險箱
              </p>
            </div>

            {/* Sub-tabs header */}
            <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl gap-1 text-xs font-bold">
              <button
                onClick={() => setInnSubTab('rest')}
                className={`flex-1 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  innSubTab === 'rest'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                🛏️ 客棧休息與房型
              </button>
              <button
                onClick={() => setInnSubTab('vault')}
                className={`flex-1 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 relative ${
                  innSubTab === 'vault'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                🔐 魔法保險箱
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isFrozen
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-slate-900 text-amber-400 border border-slate-800'
                }`}>
                  {currentVault.length}/{vaultCapacity}
                </span>
                {isFrozen && <span className="absolute -top-1 -right-1 text-xs">🚨</span>}
              </button>
              <button
                onClick={() => setInnSubTab('coins')}
                className={`flex-1 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  innSubTab === 'coins'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                🪙 純金幣保管箱
              </button>
            </div>

            {/* TAB 1: 客棧休息與選擇房型 */}
            {innSubTab === 'rest' && (
              <div className="space-y-4">
                {/* 當前入住房型狀態 */}
                <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">當前入住尊榮房型</span>
                      <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                        🏠 {currentRoom.name}
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          每日房租: ${currentRoom.dailyRent} G
                        </span>
                      </h4>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 block">保險箱容量上限</span>
                      <span className="text-base font-black text-emerald-400">{currentRoom.vaultCapacity} 格</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{currentRoom.desc}</p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-400">
                    <div>📅 當前冒險天數: <span className="text-amber-400 font-bold font-mono">第 {S.day || 1} 天</span></div>
                    <div>⏳ 行動推進點數: <span className="text-amber-400 font-bold font-mono">{S.actionCount || 0} / 10 AP</span></div>
                    <div className="col-span-2 text-slate-500 text-[9px] pt-1 border-t border-slate-900">
                      💡 推進機制：每執行 10 次有效行動 (如戰鬥、採集、露營、移動、重洗/熔煉)，時間進入下一天並自動扣除房租。若金幣不足，保險箱將被凍結上鎖。
                    </div>
                  </div>

                  {/* 客棧休息 */}
                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">🛏️ 登記入住與休息</span>
                      <span className="text-[10px] text-slate-400">客棧住宿費: <strong className="text-amber-300">${money(innCost)}</strong>（恢復 100% 生命值）</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!canHeal()) return;
                        if (!spend(innCost, "客棧休息", "客棧")) return;
                        setS(prev => ({ ...prev, hp: getTotalMaxHp() }));
                        addLog("🛌 你在客棧舒服地睡了一覺，生命值已完全補滿！");
                        setView("village");
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/10 transition-all"
                    >
                      登記入住休息
                    </button>
                  </div>
                </div>

                {/* 選擇與變更房型卡片列表 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    🏨 選擇/升級客棧房型 (動態保險箱容量調整)：
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {Object.values(ROOM_TYPES).map(r => {
                      const isSelected = r.id === currentRoomId;
                      const isOverCapacity = currentVault.length > r.vaultCapacity;

                      return (
                        <div
                          key={r.id}
                          className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-100 block text-sm">{r.name}</span>
                              <span className="text-[10px] text-amber-400 font-mono font-bold block mt-0.5">
                                每日房租: ${r.dailyRent} G / 天
                              </span>
                            </div>
                            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                              isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-emerald-400 border border-slate-800'
                            }`}>
                              📦 {r.vaultCapacity} 格
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug">{r.desc}</p>

                          <div className="pt-1">
                            {isSelected ? (
                              <button disabled className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/30 py-1.5 rounded-lg text-xs font-bold cursor-default">
                                ✅ 當前入住中
                              </button>
                            ) : (
                              <button
                                onClick={() => changeInnRoomType(r.id)}
                                disabled={isOverCapacity}
                                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isOverCapacity
                                    ? 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-500 cursor-pointer'
                                }`}
                                title={isOverCapacity ? `物品數 (${currentVault.length}) 超出此房型容量 (${r.vaultCapacity}格)` : `變更入住房型為【${r.name}】`}
                              >
                                {isOverCapacity ? `⚠️ 超出容量 (需<${r.vaultCapacity}件)` : `選擇入住【${r.name}】`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 魔法保險箱操作介面 */}
            {innSubTab === 'vault' && (
              <div className="space-y-4">
                {/* 欠租凍結警示 */}
                {isFrozen && (
                  <div className="bg-rose-950/40 border border-rose-900 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="space-y-1 text-left">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        🚨 房租拖欠中！魔法保險箱已被凍結上鎖
                      </span>
                      <p className="text-[11px] text-rose-300/80">
                        目前拖欠房租欠款：<strong className="text-rose-400 font-mono">${overdue} G</strong>。在結清欠款前，無法存放或取回保險箱內的物品。
                      </p>
                    </div>
                    <button
                      onClick={payOverdueRent}
                      disabled={S.coins < overdue}
                      className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer shadow-lg shadow-rose-600/20 transition-all shrink-0"
                    >
                      🪙 補繳欠款房租 (${overdue} G)
                    </button>
                  </div>
                )}

                {/* 保險箱狀態 & 頂部一鍵操作 */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-2.5">
                    <div>
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                        🔐 客棧【{currentRoom.name}】魔法保險箱
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        每日房租 ${currentRoom.dailyRent} G | 安全魔法鎖保護
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="text-right font-mono text-xs">
                        <span className="text-slate-400 block text-[10px]">保險箱容量</span>
                        <span className="font-bold text-amber-400">{currentVault.length} / {vaultCapacity} 格</span>
                      </div>
                    </div>
                  </div>

                  {/* 一鍵操作按鈕 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={depositAllToVault}
                      disabled={isFrozen || S.inventory.length === 0 || currentVault.length >= vaultCapacity}
                      className="bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500 text-amber-400 font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      📥 一鍵存入背包全部裝備與物品
                    </button>
                    <button
                      onClick={withdrawAllFromVault}
                      disabled={isFrozen || currentVault.length === 0 || S.inventory.length >= (S.bagSize || 40)}
                      className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      📤 一鍵取出保險箱全部物品
                    </button>
                  </div>
                </div>

                {/* 雙欄對照畫面：左側保險箱表格框框 Grid vs 右側背包物品條列式 List */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  
                  {/* 左側：保險箱格子表格 (Grid of Slots) */}
                  <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        📦 保險箱置物格陣列 ({currentVault.length}/{vaultCapacity} 格)
                      </span>
                      <span className="text-[10px] text-slate-500">點擊格子物品即可單件取出</span>
                    </div>

                    {/* 格子矩陣：條列式兩排 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] min-h-[220px] overflow-y-auto p-1.5 border border-slate-900 bg-slate-900/40 rounded-xl">
                      {Array.from({ length: vaultCapacity }).map((_, idx) => {
                        const hasItem = idx < currentVault.length;
                        const itemKey = currentVault[idx];
                        const displayName = hasItem ? getItemDisplayName(itemKey) : null;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (hasItem && !isFrozen) {
                                withdrawFromVault(idx);
                              }
                            }}
                            className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all min-h-[44px] ${
                              hasItem
                                ? isFrozen
                                  ? 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                                  : 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/30 hover:border-amber-400 text-slate-100 cursor-pointer shadow-sm'
                                : 'bg-slate-950/40 border-dashed border-slate-900 text-slate-700 select-none'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 shrink-0">
                                #{idx + 1}
                              </span>
                              {hasItem ? (
                                <span className="font-bold text-amber-200 text-xs leading-snug break-words">
                                  {displayName}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-600 italic">
                                  (空置物格)
                                </span>
                              )}
                            </div>
                            {hasItem && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-lg shrink-0 ml-1">
                                取出 📤
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 右側：隨身背包條列式列表 (Backpack List) */}
                  {(() => {
                    const vaultBagCap = getBagCapacityInfo(S.inventory, S.bagSize || 40);
                    return (
                      <div className="lg:col-span-5 bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                            🎒 隨身背包物品 ({vaultBagCap.totalSlotsUsed}/{vaultBagCap.effectiveBagSize} 格)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            一般: {vaultBagCap.standardSlotsUsed}/{vaultBagCap.baseBagSize} {vaultBagCap.questSlotsUsed > 0 ? `| 任務: +${vaultBagCap.questSlotsUsed}格` : ''}
                          </span>
                        </div>

                        {/* 條列式清單 */}
                        <div className="space-y-1.5 max-h-[360px] min-h-[220px] overflow-y-auto pr-1">
                          {vaultBagCap.grouped.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-xs font-mono space-y-1">
                              <p>🎒 隨身背包內空無一物</p>
                              <p className="text-[10px] text-slate-600">可以在野外打怪採集或在鐵匠鋪熔煉裝備</p>
                            </div>
                          ) : (
                            vaultBagCap.grouped.map((g) => {
                              const wp = EQUIPMENT.weapons.find(w => w.id === g.itemKey || w.name === g.itemKey);
                              const ar = EQUIPMENT.armors.find(a => a.id === g.itemKey || a.name === g.itemKey);
                              const ac = EQUIPMENT.accessories.find(a => a.id === g.itemKey || a.name === g.itemKey);
                              const isEquip = wp || ar || ac;
                              const forgedSet = new Set(S.forgedItems || []);
                              const isForged = isEquip && (forgedSet.has(g.itemKey) || forgedSet.has(wp?.id || "") || forgedSet.has(ar?.id || "") || forgedSet.has(ac?.id || ""));
                              const buff = isEquip ? (equipBuffMap[g.itemKey] || (wp ? equipBuffMap[wp.id] : null) || (ar ? equipBuffMap[ar.id] : null) || (ac ? equipBuffMap[ac.id] : null)) : null;

                              return (
                                <div
                                  key={g.itemKey}
                                  className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                    g.isQuest ? "bg-amber-950/20 border-amber-800/40" : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-2 flex-wrap">
                                    <span className="font-bold text-slate-200 truncate" style={{ color: g.color }}>
                                      {g.displayName}
                                    </span>
                                    <span className="text-[11px] font-black font-mono text-amber-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 shrink-0">
                                      x{g.count}
                                    </span>
                                    {isForged && (
                                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/60 shrink-0 font-mono">
                                        🔥 已熔煉
                                      </span>
                                    )}
                                    {buff && (
                                      <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800/60 shrink-0 font-mono">
                                        ✨ 神恩:【{buff.name}】
                                      </span>
                                    )}
                                    {g.isQuest && (
                                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/60 shrink-0">
                                        ✨ 任務動態格
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => depositToVault(g.firstIndex)}
                                      disabled={isFrozen || currentVault.length >= vaultCapacity}
                                      className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                                    >
                                      📥 存入 1個
                                    </button>

                                    {g.count > 1 && (
                                      <button
                                        onClick={() => depositAllOfItemToVault(g.itemKey)}
                                        disabled={isFrozen || currentVault.length >= vaultCapacity}
                                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                                      >
                                        📥 全部存入
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
            )}

            {/* TAB 3: 純金幣保管箱 */}
            {innSubTab === 'coins' && (
              <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    🪙 客棧連通金幣保管箱 (隨存隨取)
                  </span>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-mono font-bold">
                    隨存隨取 • 0%違約金
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-900 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">保管箱當前保管額</span>
                    <span className="font-mono font-black text-amber-400 text-sm">{money(S.savings || 0)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">手邊持有金幣</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">{money(S.coins)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => depositPureSavings(S.coins)}
                    disabled={S.coins <= 0}
                    className="bg-slate-900 border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-40"
                  >
                    📥 全部存入保管箱
                  </button>
                  <button
                    onClick={() => withdrawPureSavings(S.savings || 0)}
                    disabled={(S.savings || 0) <= 0}
                    className="bg-slate-900 border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-40"
                  >
                    📤 全部從保管箱提領
                  </button>
                </div>
              </div>
            )}

            {/* 返回村莊按鈕 */}
            <button 
              onClick={() => setView("village")} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              🚪 離開客棧，返回村莊市集
            </button>
          </div>
        );

      case "guild":
        const GUILD_SKILLS = MASTER_SKILLS;

        const sideNeedGuild = S.sideQuest ? S.sideQuest.need : 0;
        const sideProgGuild = S.sideQuestProgress || 0;
        const isSideCompleteGuild = S.sideQuest && sideProgGuild >= sideNeedGuild;
        const freeRefreshesLeftGuild = S.freeSideQuestRefreshes ?? 2;

        return (
          <div className="space-y-4 animate-fade-in font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="text-base font-bold text-amber-400">帝國冒險者公會 (Adventurer's Guild)</h3>
                  <p className="text-[10px] text-slate-400">「技能研修、任務發布與支線審計刷新中心」</p>
                </div>
              </div>
              <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-full text-slate-400 border border-slate-800">
                金幣: <span className="text-amber-400 font-bold">{S.coins}</span>
              </span>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 border-b border-slate-800/80 pb-2">
              <button
                onClick={() => setGuildTab("skills")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  guildTab === "skills"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                🎓 公會技能學習區
              </button>
              <button
                onClick={() => setGuildTab("quests")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  guildTab === "quests"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                📋 任務看板與支線刷新
              </button>
              <button
                onClick={() => setGuildTab("sell")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  guildTab === "sell"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                👩‍💼 櫃台美女資產變現
              </button>
            </div>

            {guildTab === "skills" && (
              <div className="space-y-3">
                {/* Category filter */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "全部" },
                    { id: "warrior", label: "⚔️ 戰士型" },
                    { id: "mage", label: "🔥 法師型" },
                    { id: "assassin", label: "🗡️ 刺客型" },
                    { id: "priest", label: "🕊️ 聖職型" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setGuildClassFilter(cat.id as any)}
                      className={`text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer whitespace-nowrap transition-all ${
                        guildClassFilter === cat.id
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-900"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Skill list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {GUILD_SKILLS.filter(s => guildClassFilter === "all" || s.category === guildClassFilter).map(skill => {
                    const isLearned = S.learnedSkills?.includes(skill.id);
                    const isAllowed = isSkillAllowedForPlayer(skill.category, S);
                    const isAdvMatched = !skill.requiredAdv || S.advancedClass === skill.requiredAdv;
                    const isLockedByAdv = isAllowed && !isAdvMatched;
                    const advJobName = skill.requiredAdv ? getAdvClassName(skill.requiredAdv) : "";
                    const reqLv = skill.reqLevel || 20;

                    return (
                      <div
                        key={skill.id}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 ${
                          isLearned
                            ? "bg-emerald-950/20 border-emerald-800/40"
                            : !isAllowed
                              ? "bg-rose-950/20 border-rose-900/60"
                              : isLockedByAdv
                                ? "bg-rose-950/25 border-rose-800/80 shadow-inner"
                                : "bg-slate-900/90 border-slate-800 hover:border-amber-500/40"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-bold flex items-center gap-1 ${!isAllowed || isLockedByAdv ? "text-rose-400" : "text-slate-100"}`}>
                              <span>{skill.icon}</span>
                              <span>{skill.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 ml-1">
                                {skill.type === "active" ? "主動" : "被動"}
                              </span>
                            </span>
                            <span className={`text-xs font-bold font-mono ${!isAllowed || isLockedByAdv ? "text-rose-400" : "text-amber-400"}`}>
                              💰 {skill.cost} 金幣
                            </span>
                          </div>
                          <p className={`text-[10px] mt-1.5 leading-relaxed ${!isAllowed || isLockedByAdv ? "text-rose-300/80" : "text-slate-400"}`}>
                            {skill.desc}
                          </p>
                          {isLockedByAdv && (
                            <div className="text-[11px] font-bold text-rose-500 mt-2 flex items-center gap-1 bg-rose-950/50 p-1.5 rounded border border-rose-900/60">
                              <span>🔒</span>
                              <span>需要轉職【{advJobName}】需求-Lv {reqLv}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-1">
                          {isLearned ? (
                            <div className="text-center text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 py-1.5 rounded-lg">
                              ✅ 已學習掌控
                            </div>
                          ) : !isAllowed ? (
                            <button
                              disabled={true}
                              className="w-full bg-rose-950/60 border border-rose-800/80 text-rose-400 font-bold text-[11px] py-1.5 rounded-lg transition-all text-center cursor-not-allowed shadow-inner"
                            >
                              🔒 職業不符 (限{getCategoryLabel(skill.category)}學習)
                            </button>
                          ) : isLockedByAdv ? (
                            <button
                              disabled={true}
                              className="w-full bg-rose-950/80 border border-rose-800/90 text-rose-500 font-bold text-[11px] py-1.5 rounded-lg transition-all text-center cursor-not-allowed shadow-inner"
                            >
                              🔒 需要轉職【{advJobName}】需求-Lv {reqLv}
                            </button>
                          ) : (
                            <button
                              disabled={S.coins < skill.cost}
                              onClick={() => {
                                if (S.coins < skill.cost) {
                                  addLog("⚠️ 金幣不足，無法學習該技能！");
                                  return;
                                }
                                setS(prev => ({
                                  ...prev,
                                  coins: prev.coins - skill.cost,
                                  learnedSkills: [...(prev.learnedSkills || []), skill.id]
                                }));
                                addLog(`🎓 恭喜！你消耗了 ${skill.cost} 金幣，成功學會公會技能【${skill.name}】！`);
                              }}
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 disabled:text-slate-600 font-bold text-xs py-1.5 rounded-lg transition-all cursor-pointer text-center"
                            >
                              學習技能 (💰 {skill.cost})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {guildTab === "quests" && (
              <div className="space-y-4">
                {/* Main quest box */}
                <div className="bg-slate-950 p-3.5 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      ⭐ 主線任務 (Main Quest)
                    </span>
                    <span className="text-[9px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50 font-mono">
                      🔒 帝國保護 (不可刷新)
                    </span>
                  </div>
                  {S.mainQuest && MAIN_QUESTS[S.mainQuest] ? (
                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-slate-200">{MAIN_QUESTS[S.mainQuest].name}</p>
                      <p className="text-[10px] text-slate-400">{MAIN_QUESTS[S.mainQuest].desc}</p>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                        <span>進度: {S.mainQuestProgress || 0} / {MAIN_QUESTS[S.mainQuest].need}</span>
                        <span className="text-amber-400 font-bold">
                          {(((S.mainQuestProgress || 0) / MAIN_QUESTS[S.mainQuest].need) * 100).toFixed(0)}%
                        </span>
                      </div>
                      {renderTextBar(Math.min(100, Math.floor(((S.mainQuestProgress || 0) / MAIN_QUESTS[S.mainQuest].need) * 100)), "text-amber-500", 10)}
                      
                      {/* 主線任務交付按鈕 */}
                      {(S.mainQuestProgress || 0) >= MAIN_QUESTS[S.mainQuest].need ? (
                        <button
                          onClick={() => completeMainQuest(S.mainQuest!)}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
                        >
                          🏆 交付主線任務 (領取獎勵)
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-900 border border-slate-800 text-slate-500 font-bold py-1.5 rounded-xl text-xs opacity-60 cursor-not-allowed mt-2 flex items-center justify-center gap-1.5"
                        >
                          🔒 交付主線任務 (未達成條件: {S.mainQuestProgress || 0} / {MAIN_QUESTS[S.mainQuest].need})
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">主線任務已全部完成！</p>
                  )}
                </div>

                {/* Side quest box with refresh */}
                <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      📋 支線委託 (Side Quest)
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      本日免費刷新: {freeRefreshesLeftGuild} 次
                    </span>
                  </div>

                  {S.sideQuest ? (
                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-slate-200">{S.sideQuest.label}</p>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>完成進度: {sideProgGuild} / {sideNeedGuild}</span>
                        <span className="text-emerald-400 font-bold">
                          +{S.sideQuest.reward.coins} 金幣 / +{S.sideQuest.reward.gold || 0} 金塊
                        </span>
                      </div>
                      {renderTextBar(Math.min(100, Math.floor((sideProgGuild / sideNeedGuild) * 100)), "text-emerald-500", 10)}
                      
                      {/* 支線委託交付按鈕 */}
                      {isSideCompleteGuild ? (
                        <button
                          onClick={completeSideQuest}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
                        >
                          🏆 交付支線委託 (收訖報酬)
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-900 border border-slate-800 text-slate-500 font-bold py-1.5 rounded-xl text-xs opacity-60 cursor-not-allowed mt-2 flex items-center justify-center gap-1.5"
                        >
                          🔒 交付支線委託 (未達成條件: {sideProgGuild} / {sideNeedGuild})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 space-y-2">
                      <p className="text-xs text-slate-400">當前無進行中的支線委託。</p>
                      <button
                        onClick={() => {
                          const pool = [
                            { type: "hunt", target: "史萊姆", need: 3, label: "【野外治安】消滅 3 隻史萊姆", reward: { coins: 80, gold: 15 } },
                            { type: "hunt", target: "哥布林", need: 2, label: "【商路清理】獵殺 2 隻哥布林", reward: { coins: 120, gold: 20 } },
                            { type: "hunt", target: "騎士", need: 2, label: "【騎士警戒】討伐 2 隻信用不良騎士", reward: { coins: 180, gold: 30 } }
                          ];
                          const picked = pool[Math.floor(Math.random() * pool.length)];
                          setS(prev => ({ ...prev, sideQuest: picked, sideQuestProgress: 0 }));
                          addLog(`📋 接取了支線委託：${picked.label}`);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                      >
                        ➕ 隨機接取新委託
                      </button>
                    </div>
                  )}

                  {/* Refresh button */}
                  <div className="pt-2 border-t border-slate-900">
                    <button
                      onClick={() => {
                        let freeLeft = S.freeSideQuestRefreshes ?? 2;
                        if (freeLeft <= 0 && S.coins < 20) {
                          addLog("⚠️ 金幣不足，刷新需要 20 金幣！");
                          return;
                        }
                        let cost = 0;
                        if (freeLeft > 0) {
                          freeLeft -= 1;
                          addLog(`✨ 使用公會免費額度刷新支線任務！(本日剩餘 ${freeLeft} 次)`);
                        } else {
                          cost = 20;
                          addLog("💸 支付 20 金幣情報費，刷新支線任務！");
                        }

                        const pool = [
                          { type: "hunt", target: "史萊姆", need: 3, label: "【野外治安】消滅 3 隻史萊姆", reward: { coins: 80, gold: 15 } },
                          { type: "hunt", target: "哥布林", need: 2, label: "【商路清理】獵殺 2 隻哥布林", reward: { coins: 120, gold: 20 } },
                          { type: "hunt", target: "騎士", need: 2, label: "【騎士警戒】討伐 2 隻信用不良騎士", reward: { coins: 180, gold: 30 } },
                          { type: "hunt", target: "強盜", need: 3, label: "【山賊剿滅】肅清 3 隻荒野強盜", reward: { coins: 150, gold: 25 } },
                          { type: "collect", target: "鐵礦石", need: 4, label: "【公會物資】收集 4 個鐵礦石", reward: { coins: 100, gold: 20 } }
                        ];
                        let avail = pool.filter(p => !S.sideQuest || p.label !== S.sideQuest.label);
                        if (avail.length === 0) avail = pool;
                        const picked = avail[Math.floor(Math.random() * avail.length)];

                        setS(prev => ({
                          ...prev,
                          coins: prev.coins - cost,
                          sideQuest: picked,
                          sideQuestProgress: 0,
                          freeSideQuestRefreshes: freeLeft
                        }));
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 text-xs font-bold py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      🔄 刷新支線任務 {freeRefreshesLeftGuild > 0 ? `(免費, 剩${freeRefreshesLeftGuild}次)` : "(消耗 20 金幣)"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {guildTab === "sell" && (
              <div className="space-y-4">
                {/* 領取【皇宮的推薦信】專區 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      ✉️ 皇宮推薦信申領櫃台 (轉職前置證明)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      轉職條件: [預支負債 / 信用等級 達 Lv.20] (當前 Lv.{S.creditLevel || 1})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    冒險者公會櫃台美女艾咪：「當您的信用等級或預支額度達到 Lv.20 門檻時，即可在此領取【皇宮的推薦信】！憑此信可通過皇宮守衛，進入皇家轉職聖殿進行高級職業轉職！」
                  </p>
                  <div className="pt-1">
                    {S.hasPalaceLetter ? (
                      <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg text-emerald-400 text-xs font-bold text-center">
                        ✅ 已持有【皇宮的推薦信】！您可以隨時前往【帝國皇宮】進行高級轉職！
                      </div>
                    ) : (
                      <button
                        disabled={(S.creditLevel || 1) < 20}
                        onClick={() => {
                          if ((S.creditLevel || 1) < 20) {
                            addLog("⚠️ 信用等級未達 Lv.20，無法領取皇宮推薦信！");
                            return;
                          }
                          setS(prev => ({
                            ...prev,
                            hasPalaceLetter: true,
                            inventory: prev.inventory.includes("皇宮推薦信") ? prev.inventory : [...prev.inventory, "皇宮推薦信"]
                          }));
                          addLog("✉️ 櫃台招待員「艾咪」微笑著向你遞交了【皇宮的推薦信】！您現在憑此推薦信可正式進入帝國皇宮聖殿進行轉職！");
                        }}
                        className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 disabled:text-slate-500 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md border border-amber-400/40"
                      >
                        {(S.creditLevel || 1) >= 20 ? "✉️ 領取【皇宮的推薦信】" : `🔒 信用等級不足 (需達 Lv.20，當前 Lv.${S.creditLevel || 1})`}
                      </button>
                    )}
                  </div>
                </div>

                {renderSellInterface("帝國冒險者公會", "櫃台美女「艾咪」", "「冒險者大人，需要將戰利品、採集素材或隨身舊裝備變現嗎？公會提供最優厚的收購價喔～」")}
              </div>
            )}

            <button onClick={() => setView("village")} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl cursor-pointer font-bold">
              🏘️ 離開冒險者公會，返回市集
            </button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <button onClick={() => setView("guild")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🏛️</span>
                <span className="text-sm font-bold block text-amber-400">冒險者公會</span>
                <span className="text-[10px] text-slate-400 block mt-1">技能學習與委託刷新</span>
              </button>
              <button onClick={() => setView("forge")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🔧</span>
                <span className="text-sm font-bold block">鐵匠鋪</span>
                <span className="text-[10px] text-slate-400 block mt-1">熔煉及裝備替換</span>
              </button>
              <button onClick={() => setView("shop")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🏪</span>
                <span className="text-sm font-bold block">道具鋪</span>
                <span className="text-[10px] text-slate-400 block mt-1">購買藥水及消耗品</span>
              </button>
              <button onClick={() => setView("church_menu")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">⛪</span>
                <span className="text-sm font-bold block">教堂</span>
                <span className="text-[10px] text-slate-400 block mt-1">祈禱治療與鑑定</span>
              </button>
              <button onClick={() => setView("inn")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🏨</span>
                <span className="text-sm font-bold block">旅館</span>
                <span className="text-[10px] text-slate-400 block mt-1">休息回滿生命</span>
              </button>
              <button onClick={() => setView("tavern")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🍺</span>
                <span className="text-sm font-bold block">酒館</span>
                <span className="text-[10px] text-slate-400 block mt-1">買醉尋歡，獲取BUFF</span>
              </button>
              <button onClick={() => setView("bank")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🏦</span>
                <span className="text-sm font-bold block">信託銀行</span>
                <span className="text-[10px] text-slate-400 block mt-1">金塊兌換與還債</span>
              </button>
              <button onClick={() => setView("palace")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🏰</span>
                <span className="text-sm font-bold block text-amber-300">帝國皇宮</span>
                <span className="text-[10px] text-slate-400 block mt-1">核心皇家禁地門崗</span>
              </button>
              <button onClick={() => setView("commoners_district")} className="bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 p-4 rounded-xl text-left transition-all cursor-pointer">
                <span className="text-lg block mb-1">🏚️</span>
                <span className="text-sm font-bold block text-amber-300">平民區</span>
                <span className="text-[10px] text-slate-400 block mt-1">居民對話與斗篷人合成</span>
              </button>
            </div>
            
            <button
              onClick={() => setView("menu")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              🚪 離開市集，返回村莊廣場
            </button>
          </div>
        );
    }
  };

  // Main UI render router
  const renderScreen = () => {
    switch (view) {
      case "main_title_menu":
        const rawLocalSaves = getLocalSaves();
        const hasLocalSaves = rawLocalSaves.some(s => s !== null && s !== undefined);
        return (
          <div className="space-y-6 py-6 text-center max-w-lg mx-auto">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase">
                🛡️ COIN RANGERS - DEBT HERO 🛡️
              </span>
              <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent tracking-tight">
                金幣戰士之負債勇者
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                勇者的終點不是擊敗魔王，而是魔王死後的債務追討。
              </p>
            </div>

            <div className="border border-slate-800/80 bg-slate-950/40 p-5 rounded-2xl space-y-4">
              {/* 開始遊戲 - 故事序章 */}
              <button
                onClick={() => {
                  setS(INITIAL_STATE);
                  setView("prologue_intro");
                  setLogLines([
                    "勇者小隊站在魔王面前。",
                    "這是決定世界命運的一戰。",
                    "但你不知道的是，勝利才是真正的開始。"
                  ]);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-amber-500/5 hover:shadow-amber-500/10 text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                📖 故事的開始序章 (New Game)
              </button>

              {/* 繼續遊戲 */}
              <button
                onClick={handleContinueGame}
                disabled={!hasLocalSaves}
                className={`w-full py-3.5 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer ${
                  hasLocalSaves
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/30 shadow-md'
                    : 'bg-slate-900 text-slate-500 border border-slate-950 cursor-not-allowed opacity-40'
                }`}
              >
                ⚡ 繼續遊戲 (Continue)
              </button>

              {/* 讀取本地進度 */}
              <button
                onClick={() => setView("saveLoad")}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                📂 讀取存檔 (Load Save)
              </button>

              {/* 離開遊戲 */}
              <button
                onClick={() => setView("exit_screen")}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-rose-950 text-slate-400 hover:text-rose-400 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                🚪 離開遊戲 (Exit)
              </button>
            </div>
            
            <div className="text-[10px] text-slate-500 font-mono">
              PRODUCED BY COIN RANGERS - DEBT HERO ARC • SECURE SANDBOX RUNTIME
            </div>
          </div>
        );

      case "exit_screen":
        return (
          <div className="py-12 text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto text-3xl">
              🚪
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-200">您已離開遊戲</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                感謝您遊玩《金幣戰士之負債勇者》！您的所有本地存檔均已安全保留於瀏覽器儲存庫中。
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-500 leading-normal">
              請直接關閉此瀏覽器分頁或點擊下方按鈕返回主選單。
            </div>
            <button
              onClick={() => setView("main_title_menu")}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              ↩ 返回主選單
            </button>
          </div>
        );

      case "prologue_intro":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-400 border-b border-amber-500/20 pb-2">⚔️ 序章：決定命運的前夕</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              你率領著傳說中的勇者小隊，突破了無數重圍，終於站在了終焉地城的深處——魔王阿薩斯的面前。<br/>
              此時的你是 LV.MAX、手握聖劍、身披龍鱗，無所畏懼。
            </p>
            <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-400 font-mono">
              <p>🗡️ 戰士 —— 狂怒與鐵壁，誓死守護身前</p>
              <p>🔮 法師 —— 奧術光華湧動，指尖引導流星</p>
              <p>🗡️ 刺客 —— 身處陰影不見形，一刃斷喉生死分</p>
            </div>
            <button 
              onClick={() => setView("prologue_class")}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10 text-sm"
            >
              選擇操作角色，直面魔王！
            </button>
          </div>
        );

      case "prologue_class":
        return (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-bold text-amber-400 mb-6">【操作角色抉擇】</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => choosePrologueClass("warrior")}
                className="bg-slate-900 border-2 border-slate-800 hover:border-amber-500 p-6 rounded-2xl cursor-pointer text-left transition-all"
              >
                <span className="text-2xl block mb-2">🛡️</span>
                <span className="text-base font-bold text-slate-100 block">無畏戰士</span>
                <span className="text-xs text-slate-400 block mt-2">150 HP | 高護甲與戰爭踐踏，攻防兼備</span>
              </button>
              <button 
                onClick={() => choosePrologueClass("mage")}
                className="bg-slate-900 border-2 border-slate-800 hover:border-amber-500 p-6 rounded-2xl cursor-pointer text-left transition-all"
              >
                <span className="text-2xl block mb-2">🔮</span>
                <span className="text-base font-bold text-slate-100 block">至高法師</span>
                <span className="text-xs text-slate-400 block mt-2">80 HP | 極致奧術，自帶毀滅炎爆與冰凍</span>
              </button>
              <button 
                onClick={() => choosePrologueClass("assassin")}
                className="bg-slate-900 border-2 border-slate-800 hover:border-amber-500 p-6 rounded-2xl cursor-pointer text-left transition-all"
              >
                <span className="text-2xl block mb-2">🗡️</span>
                <span className="text-base font-bold text-slate-100 block">暗影刺客</span>
                <span className="text-xs text-slate-400 block mt-2">100 HP | 潛伏暗殺，高暴擊率與劇毒之刃</span>
              </button>
            </div>
          </div>
        );

      case "prologue_battle":
        const activePr = activePrologue();
        if (!activePr) return null;
        
        // 獲取序章其餘兩個角色作為隊友
        const otherPrologueClasses = Object.keys(PROLOGUE_CLASSES).filter(id => id !== S.prologueClass);
        
        return (
          <div className="space-y-4">
            {/* 敵方 (對面) */}
            <div className="bg-slate-950 p-4 border-2 border-slate-800 rounded-2xl space-y-2 transition-all duration-300">
              {renderProgressBarHTML(40, false)}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1">😈 敵方對陣：魔王阿薩斯</span>
                <span className="text-xs font-mono text-slate-300 font-bold">HP: {S.bossHp} / {S.bossMaxHp}</span>
              </div>
              <div className="flex justify-center mt-1">
                {renderTextBar((S.bossHp / S.bossMaxHp) * 100, "text-rose-500", 10)}
              </div>
            </div>

            {/* 虛線分割線 */}
            <div className="border-t border-dashed border-slate-800/80 my-1"></div>

            {/* 當下戰鬥訊息 */}
            <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center min-h-[90px] text-center relative overflow-hidden backdrop-blur-sm">
              <span className="text-[9px] font-black text-amber-500/90 uppercase tracking-widest mb-2 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800">
                ⚔️ 當下戰鬥訊息 ⚔️
              </span>
              <div className="space-y-1 w-full max-w-md">
                {logLines.length > 0 ? (
                  logLines.slice(0, 2).map((log, i) => {
                    const isLatest = i === 0;
                    const isWarning = log.includes("⚠️") || log.includes("💀") || log.includes("☠️") || log.includes("Church") || log.includes("牧師");
                    const isGold = log.includes("🧱") || log.includes("💰") || log.includes("🎁");
                    return (
                      <div 
                        key={i} 
                        className={`text-xs transition-all duration-300 font-mono leading-relaxed ${
                          isLatest 
                            ? `text-sm font-black scale-[1.01] ${isWarning ? 'text-rose-400' : isGold ? 'text-amber-400' : 'text-emerald-400'}` 
                            : 'text-slate-500 text-[11px] opacity-50'
                        }`}
                      >
                        {isLatest ? "▶ " : "  "} {log}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500 italic">戰役蓄勢待發...</span>
                )}
              </div>
            </div>

            {/* 虛線分割線 */}
            <div className="border-t border-dashed border-slate-800/80 my-1"></div>

            {/* 我方 (下方) */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                {/* 主控角色 */}
                <div className="bg-slate-950 p-3 rounded-xl border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.02] transition-all duration-300">
                  {renderProgressBarHTML(100, true)}
                  <span className="text-[10px] text-amber-500 font-black block mt-1">👑 主控角色: {activePr.name}</span>
                  <span className="text-xs font-mono font-bold text-slate-100 block mt-1">HP: {S.hp} / {S.maxHp}</span>
                  <div className="flex justify-center mt-2">
                    {renderTextBar((S.hp / S.maxHp) * 100, "text-emerald-400", 10)}
                  </div>
                </div>

                {/* 隊友 1 */}
                {(() => {
                  const tId = otherPrologueClasses[0];
                  const tData = PROLOGUE_CLASSES[tId];
                  return (
                    <div className="bg-slate-950/60 p-3 rounded-xl border-2 border-slate-800 transition-all duration-300">
                      {renderProgressBarHTML(50, false)}
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">👥 隊友: {tData.name}</span>
                      <span className="text-xs font-mono text-slate-300 block mt-1">HP: {tData.hp} / {tData.hp}</span>
                      <div className="flex justify-center mt-2">
                        {renderTextBar(100, "text-emerald-500/80", 10)}
                      </div>
                    </div>
                  );
                })()}

                {/* 隊友 2 */}
                {(() => {
                  const tId = otherPrologueClasses[1];
                  const tData = PROLOGUE_CLASSES[tId];
                  return (
                    <div className="bg-slate-950/60 p-3 rounded-xl border-2 border-slate-800 transition-all duration-300">
                      {renderProgressBarHTML(70, false)}
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">👥 隊友: {tData.name}</span>
                      <span className="text-xs font-mono text-slate-300 block mt-1">HP: {tData.hp} / {tData.hp}</span>
                      <div className="flex justify-center mt-2">
                        {renderTextBar(100, "text-emerald-500/80", 10)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={prologueAttackNormal} className="bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 p-4 rounded-xl font-bold cursor-pointer transition-colors text-xs text-left">
                🗡️ 普通揮砍 <span className="text-[10px] text-slate-400 block font-normal mt-0.5">揮舞聖器，造成穩定物理傷害</span>
              </button>
              <button onClick={prologueAttackHeavy} className="bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 p-4 rounded-xl font-bold cursor-pointer transition-colors text-xs text-left">
                💥 狂暴烈擊 <span className="text-[10px] text-slate-400 block font-normal mt-0.5">2倍超高傷害，但反噬自身 -10 HP</span>
              </button>
              <button onClick={prologueAttackDefend} className="bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 p-4 rounded-xl font-bold cursor-pointer transition-colors text-xs text-left">
                🛡️ 招架姿態 <span className="text-[10px] text-slate-400 block font-normal mt-0.5">格擋魔王下一次近戰攻擊，傷害減半</span>
              </button>
              <button onClick={() => setView("prologue_skill")} className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 p-4 rounded-xl font-bold cursor-pointer transition-colors text-xs text-left">
                🔮 職業奧義 <span className="text-[10px] text-slate-400 block font-normal mt-0.5">釋放毀滅性的戰略技能</span>
              </button>
            </div>
          </div>
        );

      case "prologue_skill":
        const c = activePrologue();
        if (!c) return null;
        return (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-amber-400">🔮 選擇釋放的終極奧義</h3>
            <div className="grid grid-cols-1 gap-3">
              {c.skills.map((skill, i) => (
                <button 
                  key={skill.id}
                  onClick={() => prologueUseSkill(i)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 p-3.5 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-sm font-bold text-slate-100 block">{skill.name}</span>
                  <span className="text-xs text-slate-400 block mt-1">{skill.desc}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setView("prologue_battle")} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 rounded-xl mt-4 cursor-pointer">
              返回戰鬥
            </button>
          </div>
        );

      case "prologue_curse":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-rose-500">魔王的靈魂低語...</h2>
            <blockquote className="border-l-4 border-rose-500 pl-4 py-1 italic text-slate-300 text-sm">
              「愚蠢的冒險者...你以為擊碎我的肉身就是終點？<br/>
              在這個世界，支配萬物的不再是純粹的武力，而是金錢與債務！<br/>
              感受我的終極詛咒吧——降格吧，墮入無邊無際的負債深淵！」
            </blockquote>
            <p className="text-xs text-slate-400 leading-relaxed">
              天空中裂開了紫黑色的裂縫，混沌的雷霆劈碎了你的傳說聖劍，龍鱗鎧甲在耀光中化為塵埃。你不再是高高在上的 LV.MAX 英雄...
            </p>
            <button 
              onClick={triggerCurse}
              className="w-full bg-rose-600 hover:bg-rose-500 text-slate-950 font-black py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/10 text-sm"
            >
              承受詛咒，力量流失！
            </button>
          </div>
        );

      case "level_drop":
        return (
          <div className="space-y-6 text-center py-6">
            <div className="animate-spin text-rose-500 w-10 h-10 mx-auto">
              <RefreshCw className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-rose-500">⚡ 等級崩壞中 ⚡</h3>
            <div className="text-4xl font-extrabold font-mono tracking-wider bg-slate-950 py-4 px-6 border border-rose-500/30 rounded-2xl inline-block" style={{ color: levelDropText.includes("-LV") ? '#d96050' : '#f0c040' }}>
              {levelDropText}
            </div>
            <div className="flex justify-center my-3 max-w-sm mx-auto">
              {renderTextBar(levelDropProgress, "text-rose-500", 10)}
            </div>
            <p className="text-xs text-slate-400">你感覺到幾十年的修為正在被剝奪...</p>
          </div>
        );

      case "prologue_archangel":
        return (
          <div className="space-y-6 max-w-lg mx-auto py-4 text-center animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold tracking-wider animate-pulse">
              👼 神聖洗禮 SACRED BAPTISM
            </div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 tracking-tight">
              【大天使的救贖降臨】
            </h2>
            
            <div className="bg-slate-950/70 p-6 border border-yellow-500/20 rounded-2xl text-left space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <p className="text-xs text-slate-400 italic leading-relaxed">
                正當勇者與夥伴們身受魔王降格詛咒、奄奄一息倒地不起時，天空中突然灑下一道神聖而溫暖的金黃色光芒。
                一位莊嚴而美麗的大天使緩緩降臨，看著你們，發出了溫柔而充滿慈悲的嘆息...
              </p>
              
              <div className="border-l-4 border-yellow-400 pl-4 py-2 space-y-2 text-slate-200">
                <p className="text-sm font-bold text-yellow-300">「醒醒吧，勇者一行人...」</p>
                <p className="text-xs leading-relaxed text-slate-300">
                  「我已用神聖神蹟治癒了你們瀕死的軀殼與傷勢。雖然魔王的終極負債詛咒過於強大，我無法將其徹底消除，但我已用天使之羽淨化了部分詛咒，使其對你們造成的影響大幅減輕，免於直接墜入靈魂虛無。」
                </p>
                <p className="text-xs leading-relaxed text-slate-300">
                  「即便如此，在接下來的冒險中，你們依然會受到『信用額度』的現實制約。勇者啊，帶著殘存的希望，重新站起來，用開拓與智慧來解開這一切束縛，重新奪回你們的榮耀吧！」
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                setView("debtor_select");
                addLog("等級已歸零，你現在是個受祝福的負債者。");
                addLog("請選擇你的破產身份，開始全新的人生。");
              }}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-yellow-500/10 text-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
              叩謝救贖神恩，重塑凡世之軀
            </button>
          </div>
        );

      case "debtor_select":
        return (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider animate-pulse">
                🎰 命運之輪 CASINO WHEEL
              </div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 tracking-tight">
                【清算命運大輪盤】
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                大天使長微笑著揮動金黃色的賬單——勇者降格為負債者，命運天平將Prefix(前綴) + Class(職業) + 宿命Buff進行無機質隨機重組！
              </p>
            </div>

            {/* 4 Cards Grid with Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {debtorOptions.map((item, index) => {
                const isSelected = rolledDebtorId === item.id;
                const isCurrentlyHighlighted = rollHighlightIndex === index;
                
                let borderStyle = "border-slate-800 bg-slate-900/30 text-slate-500 opacity-50 scale-100";
                if (isRollingDebtor && isCurrentlyHighlighted) {
                  borderStyle = "border-amber-400 bg-amber-500/10 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-[1.03] animate-pulse";
                } else if (isSelected) {
                  borderStyle = "border-emerald-500 bg-emerald-950/20 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-[1.03] border-2 ring-2 ring-emerald-500/30";
                } else if (!isRollingDebtor && !rolledDebtorId) {
                  borderStyle = "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:scale-[1.01]";
                }

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl text-left border transition-all duration-150 relative overflow-hidden ${borderStyle}`}
                  >
                    {/* Glowing Accent Indicator */}
                    {isCurrentlyHighlighted && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-600 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-bl uppercase tracking-widest animate-bounce">
                        SELECTING
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-bl uppercase tracking-widest">
                        MY DESTINY
                      </div>
                    )}

                    <span className="text-sm font-black block text-slate-100">{item.name}</span>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{item.prefix}</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{item.cls}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 text-[10px] font-mono text-slate-400 border-t border-slate-900 pt-2">
                      <div>💖 生命值: <span className="font-bold text-rose-400">{item.hp}</span></div>
                      <div>⚔️ 力量值: <span className="font-bold text-amber-500">{item.strength}</span></div>
                      <div>⚡ 敏捷值: <span className="font-bold text-sky-400">{item.agility}</span></div>
                      <div>🍃 體力值: <span className="font-bold text-emerald-400">{item.stamina}</span></div>
                      <div>🪙 起始金: <span className="font-bold text-yellow-500">${item.gold}</span></div>
                      <div>🧱 起始債: <span className="font-bold text-red-500">${item.debt}</span></div>
                    </div>

                    <div className="mt-3 p-1.5 rounded bg-slate-950/50 border border-slate-900/60 text-[10px] leading-relaxed">
                      <div className="flex items-center gap-1 font-bold text-indigo-400 mb-0.5">
                        <span className="text-[11px]">📜</span> {item.buff.name}
                        <span className={`text-[8px] px-1 py-0.2 rounded font-black ml-auto ${item.buff.type === '代價型' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {item.buff.type}
                        </span>
                      </div>
                      <div className="text-slate-400">{item.buff.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gambling Actions Section */}
            <div className="bg-slate-950/80 border border-slate-900 p-5 rounded-2xl text-center space-y-4 shadow-inner">
              {isRollingDebtor && (
                <div className="space-y-3">
                  <div className="flex justify-center gap-1">
                    <span className="animate-bounce delay-100 text-2xl">💸</span>
                    <span className="animate-bounce delay-200 text-2xl">🪙</span>
                    <span className="animate-bounce delay-300 text-2xl">🎰</span>
                  </div>
                  <p className="text-xs text-amber-400 font-bold tracking-widest animate-pulse uppercase">
                    ⚡ 命運指針狂飆轉動中，請按捺住你的心跳... ⚡
                  </p>
                  <button
                    disabled
                    className="w-full max-w-xs bg-slate-900 text-slate-500 font-extrabold py-3 px-6 rounded-xl text-xs cursor-not-allowed border border-slate-800 flex items-center justify-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    輪盤飛速轉動中...
                  </button>
                </div>
              )}

              {!isRollingDebtor && !rolledDebtorId && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    請點擊下方按鈕，撥動大天使的命運天平！
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto">
                    <button
                      onClick={startDebtorRoll}
                      className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 text-slate-950 font-black py-3.5 px-6 rounded-xl text-xs cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5 animate-pulse"
                    >
                      🎰 命運隨機抽取 (SPIN!)
                    </button>
                    <button
                      onClick={generateNewOptions}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-300 font-bold py-3.5 px-6 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      🔄 ［刷新腳色清單］
                    </button>
                  </div>
                </div>
              )}

              {rolledDebtorId && (
                <div className="space-y-4 animate-fade-in">
                  {(() => {
                    const chosenOpt = debtorOptions.find(o => o.id === rolledDebtorId);
                    return (
                      <>
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl max-w-sm mx-auto space-y-1">
                          <p className="text-xs text-emerald-400 font-black">🎉 命運抽取完畢！</p>
                          <p className="text-sm font-bold text-slate-100">
                            你將以 【{chosenOpt?.name}】 身份開始遊戲
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto">
                          <button
                            onClick={() => selectDebtorClass(rolledDebtorId)}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3 px-5 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-emerald-500/10"
                          >
                            ✨ 接受此生，開啟旅程
                          </button>
                          
                          <button
                            onClick={startDebtorRoll}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-amber-400 font-bold py-3 px-5 rounded-xl text-xs cursor-pointer transition-all"
                          >
                            🎰 重新抽取 (不認命)
                          </button>
                        </div>

                        <div className="max-w-sm mx-auto pt-1">
                          <button
                            onClick={generateNewOptions}
                            className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500 text-slate-400 hover:text-slate-200 font-bold py-2.5 px-5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            🔄 ［刷新腳色清單］(重新生成4個職業)
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        );

      case "menu":
        const db = activeDebtor();
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Compass className="w-5 h-5" /> 負債大陸之村莊廣場
            </h2>
            {S.isBeggarMode && (
              <div className="bg-amber-950/70 border border-amber-600/70 p-3 rounded-xl text-xs text-amber-300 flex justify-between items-center animate-pulse">
                <span>🎭 當前處於【扮演乞丐】狀態！使用【乞丐專用木棍 (+{S.beggarStickLevel || 0})】</span>
                <button
                  onClick={() => {
                    setS(prev => ({ ...prev, isBeggarMode: false, beggarCount: 0 }));
                    addLog("👕 你脫下了乞丐破衣，恢復了冒險者原本的身份與全身裝備。");
                  }}
                  className="bg-amber-900/80 hover:bg-amber-800 text-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-600 cursor-pointer"
                >
                  脫下破衣
                </button>
              </div>
            )}
            <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
              <p>📍 當前主線: <span className="font-bold text-amber-400">{S.mainQuest ? MAIN_QUESTS[S.mainQuest].name : "所有主線已完結！"}</span> ({S.mainQuestProgress} / {S.mainQuest ? MAIN_QUESTS[S.mainQuest].need : 0})</p>
              {S.sideQuest && (
                <p>○ 當前支線: <span className="font-bold text-emerald-400">{S.sideQuest.label}</span> ({S.sideQuestProgress} / {S.sideQuest.need})</p>
              )}
              <p>⚔️ 已消滅魔物: {S.kills} 隻 | 💀 重生次數: {S.deathCount}</p>
              <p>⛺ 靈魂錨點: {S.checkpointCampMet ? <span className="text-emerald-400 font-bold">已在荒野臨時營地激活 (死亡免費復活點)</span> : <span className="text-slate-500 italic">未激活 (需大教堂馬車收費)</span>}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              <button onClick={() => setView("village_exit")} className="bg-gradient-to-tr from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 p-4 rounded-xl font-bold cursor-pointer transition-all flex flex-col justify-between h-20 shadow-md">
                <span className="text-sm block">⚔️ 出發冒險</span>
                <span className="text-[10px] opacity-85 block font-normal">選擇出口方向，深入野外</span>
              </button>

              <button onClick={enterVillage} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left">
                <span className="text-sm block text-amber-400">🏘️ 村莊市集</span>
                <span className="text-[10px] text-slate-400 block font-normal">鐵匠、藥水、教堂、客棧</span>
              </button>

              <button onClick={() => setView("status")} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left">
                <span className="text-sm block text-slate-200">📊 個人狀態</span>
                <span className="text-[10px] text-slate-400 block font-normal">屬性、加成、契約裝備</span>
              </button>

              <button onClick={() => setView("questBoard")} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left">
                <span className="text-sm block text-amber-400">📜 通緝公告欄</span>
                <span className="text-[10px] text-slate-400 block font-normal">接取帝國懸賞討伐目標</span>
              </button>

              <button onClick={() => setView("palace")} className="bg-slate-900 hover:bg-slate-800 border border-amber-900/40 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left">
                <span className="text-sm block text-amber-300">🏰 帝國皇宮</span>
                <span className="text-[10px] text-slate-400 block font-normal">皇家禁地與門口守衛</span>
              </button>

              <button onClick={() => setView("commoners_district")} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left">
                <span className="text-sm block text-amber-300">🏚️ 帝國平民區</span>
                <span className="text-[10px] text-slate-400 block font-normal">居民對話委託與斗篷人</span>
              </button>

              <button 
                onClick={() => {
                  if (!S.isBeggarMode) {
                    setS(prev => ({ ...prev, isBeggarMode: true }));
                    addLog("🕵️ 【扮演乞丐】你躲到陰暗的小巷，身姿東摸西扭，裝扮成為一個穿著破爛身體髒污的乞丐！所有裝備技能暫時隱藏，拿起了破木棍。");
                  }
                  setView("beggar_alley");
                }} 
                className="bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-300 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left"
              >
                <span className="text-sm block">🎭 扮演乞丐</span>
                <span className="text-[10px] text-amber-400/80 block font-normal">陰暗巷弄喊話乞討與升級木棍</span>
              </button>

              <button onClick={() => setView("saveLoad")} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left">
                <span className="text-sm block text-slate-200">💾 儲存讀取</span>
                <span className="text-[10px] text-slate-400 block font-normal">存檔罪證與人生輪迴</span>
              </button>

              <button 
                onClick={() => {
                  setConfirmModal({
                    title: "🔄 確定要破產重生？",
                    message: "當前遊戲進度將全部歸零並重置，確定要重新開始嗎？",
                    confirmText: "確認重生",
                    confirmStyle: "rose",
                    onConfirm: () => {
                      setS(INITIAL_STATE);
                      setView("prologue_intro");
                      setLogLines(["勇者小隊站在魔王面前。"]);
                    }
                  });
                }} 
                className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 text-rose-400 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left"
              >
                <span className="text-sm block">🔄 破產重生</span>
                <span className="text-[10px] opacity-80 block font-normal text-rose-500">拋棄此生重新再來</span>
              </button>
            </div>

            {/* 導覽功能按鈕 */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => setView(prevView || "main_title_menu")}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                ↩️ (返回)上一頁
              </button>
              <button
                onClick={() => setView("main_title_menu")}
                className="bg-slate-900 hover:bg-slate-800 border border-rose-900/50 hover:border-rose-500/60 text-rose-300 text-xs py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                🏠 回到主選單
              </button>
            </div>
          </div>
        );

      case "beggar_alley":
        if (beggarChoices.length === 0) {
          setBeggarChoices(getRandomBeggarChoices());
        }

        const currentN = S.beggarCount || 0;
        const currentRiskPct = Math.min(100, Math.floor(2.5 * Math.pow(currentN, 1.3)));
        const nextN = currentN + 1;
        const nextBaseRiskPct = Math.min(100, Math.floor(2.5 * Math.pow(nextN, 1.3)));

        let riskTheme = {
          border: "border-emerald-500/80 shadow-emerald-900/20",
          bg: "bg-emerald-950/80",
          text: "text-emerald-400",
          status: "🛡️ 巡邏守衛目光掃過，暫時安全，可安心討錢"
        };
        if (currentRiskPct >= 65) {
          riskTheme = {
            border: "border-rose-500/90 shadow-rose-900/60 animate-pulse",
            bg: "bg-rose-950/90",
            text: "text-rose-400",
            status: "🚨 守衛手按佩劍向你走來！再喊一次極大概率會被逮捕社會性死亡！"
          };
        } else if (currentRiskPct >= 35) {
          riskTheme = {
            border: "border-orange-500/80 shadow-orange-900/40",
            bg: "bg-orange-950/85",
            text: "text-orange-400",
            status: "⚠️ 附近守衛開始對你指指點點，眼神充滿嫌惡與戒備！"
          };
        } else if (currentRiskPct >= 15) {
          riskTheme = {
            border: "border-amber-500/80 shadow-amber-900/30",
            bg: "bg-amber-950/85",
            text: "text-amber-400",
            status: "👁️ 巡邏守衛注意到你這邊的騷動，向你張望了幾眼..."
          };
        }

        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-amber-900/60 pb-2">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <span>🎭 陰暗巷弄・乞討現場</span>
              </h2>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 font-bold">
                乞丐模式啟用中
              </span>
            </div>

            {/* 扮演乞丐背景觸發台詞與地點 */}
            <div className="bg-amber-950/40 border border-amber-800/50 p-3.5 rounded-xl space-y-2 text-xs text-amber-200/90 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300">📍 當前乞討地點：</span>
                  <span className="text-xs font-black text-amber-100 bg-amber-900/60 px-2.5 py-1 rounded-lg border border-amber-700/50">
                    {S.beggarLocation || "公告欄的街道旁"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const currentLoc = S.beggarLocation || "公告欄的街道旁";
                    const avail = BEGGAR_LOCATIONS.filter(l => l !== currentLoc);
                    const newLoc = avail[Math.floor(Math.random() * avail.length)];
                    const currentN = S.beggarCount || 0;
                    const reduceAmount = Math.floor(Math.random() * 3) + 2;
                    const newN = Math.max(0, currentN - reduceAmount);
                    setS(prev => ({
                      ...prev,
                      beggarLocation: newLoc,
                      beggarCount: newN
                    }));
                    setBeggarChoices(getRandomBeggarChoices());
                    addLog(`📍 【更換乞討地點】你轉移陣地前往【${newLoc}】，順利擺脫了巡邏守衛的關注！(連續喊話警戒降至 ${newN} 次，風險降低)`);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 self-start sm:self-auto"
                >
                  📍 更換地點 (隨機降低被捕風險)
                </button>
              </div>

              <p className="font-bold text-amber-300 pt-1">
                🕵️ 「你躲在【{S.beggarLocation || "公告欄的街道旁"}】，身姿東摸西扭，裝扮成為一個穿著破爛身體髒污的乞丐。」
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-900/40">
                <div>
                  <span className="text-slate-400">當前專用武器：</span>
                  <span className="font-black text-amber-400">🪵 乞丐專用木棍 (+{S.beggarStickLevel || 0})</span>
                  <span className="text-[10px] text-slate-400 ml-1">(攻擊力: {5 + (S.beggarStickLevel || 0) * 8})</span>
                </div>
                <div>
                  <span className="text-slate-400">裝備與技能限制：</span>
                  <span className="text-rose-400 font-bold">所有常規裝備/道具/技能皆隱藏無效</span>
                </div>
              </div>
            </div>

            {/* 中央醒目即時風險監控面板 (動態風險遞增 + 色彩回饋) */}
            <div className={`p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg ${riskTheme.bg} ${riskTheme.border}`}>
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs font-bold text-slate-300">連續喊話碎碎念次數：</span>
                  <span className="text-sm font-black font-mono text-white underline">{currentN} 次</span>
                </div>
                <div className="text-[11px] font-bold text-slate-200/90">
                  {riskTheme.status}
                </div>
              </div>

              <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-700/60 pt-2 sm:pt-0 sm:pl-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  當前守衛關注警戒值
                </div>
                <div className={`text-2xl font-black font-mono ${riskTheme.text}`}>
                  [當前被捕風險：{currentRiskPct}%]
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  下一次點擊風險：約 {nextBaseRiskPct}% (+亂數 0~5%)
                </div>
              </div>
            </div>

            {/* 台詞選擇清單 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  🗣️ 請選擇向路人開口討錢的台詞 (點擊會增加連續喊話次數與風險)
                </h3>
                <button
                  onClick={() => setBeggarChoices(getRandomBeggarChoices())}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-700/40 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1"
                >
                  🔄 手動刷新台詞
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {beggarChoices.map((opt, i) => {
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const calculatedN = (S.beggarCount || 0) + 1;
                        const noise = Math.random() * 5;
                        const risk = Math.min(100, Math.floor(2.5 * Math.pow(calculatedN, 1.3) + noise));
                        const roll = Math.random() * 100;

                        if (roll <= risk) {
                          const fine = 600;
                          let remaining = fine;
                          let pCoins = 0;
                          let pSavings = 0;
                          let pDebt = 0;

                          if (S.coins > 0) {
                            pCoins = Math.min(S.coins, remaining);
                            remaining -= pCoins;
                          }
                          if (remaining > 0 && S.savings > 0) {
                            pSavings = Math.min(S.savings, remaining);
                            remaining -= pSavings;
                          }
                          if (remaining > 0) {
                            pDebt = remaining;
                          }

                          setS(prev => ({
                            ...prev,
                            coins: prev.coins - pCoins,
                            savings: prev.savings - pSavings,
                            debt: prev.debt + pDebt,
                            isBeggarMode: false,
                            beggarCount: 0
                          }));

                          setBeggarArrestDetails({
                            paidCoins: pCoins,
                            paidSavings: pSavings,
                            addedDebt: pDebt
                          });
                          setBeggarArrestModal(true);

                          addLog(`🚨 【守衛逮捕審判】第 ${calculatedN} 次喊話時風險飆升至 ${risk}% (判定骰 ${Math.floor(roll)}%)，你被巡邏守衛當場逮捕！架去冒險者公會，審判罰款 $600 金幣！`);
                        } else {
                          const reward = Math.floor(Math.random() * (opt.maxCoin - opt.minCoin + 1)) + opt.minCoin;
                          setS(prev => ({
                            ...prev,
                            coins: prev.coins + reward,
                            beggarCount: calculatedN
                          }));
                          addLog(`🗣️ 【乞討得金 (第${calculatedN}次喊話)】你向路人喊道：「${opt.text}」——獲得金幣 +$${reward} G！(當前喊話 ${calculatedN} 次, 下次被捕風險約 ${Math.min(100, Math.floor(2.5 * Math.pow(calculatedN + 1, 1.3)))}%)`);
                          setBeggarChoices(getRandomBeggarChoices());
                        }
                      }}
                      className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/80 p-3.5 rounded-xl text-left cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded border border-amber-900/40 bg-amber-950/20 text-amber-400">
                          {opt.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          💰 預估收益: ${opt.minCoin} ~ ${opt.maxCoin} G | ⚠️ 點擊觸發風險: ~${nextBaseRiskPct}% (+亂數0~5%)
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-100 group-hover:text-amber-300 leading-relaxed">
                        「{opt.text}」
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setS(prev => ({ ...prev, isBeggarMode: false, beggarCount: 0 }));
                  addLog("👕 你脫下了髒兮兮的乞丐破衣，整理好衣冠，恢復了原本的冒險者姿態。");
                  setView("menu");
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all border border-slate-700 text-center"
              >
                🚪 脫下破衣 (重置風險並恢復冒險者姿態)
              </button>
              <button
                onClick={() => setView("menu")}
                className="w-full bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all border border-amber-800/60 text-center"
              >
                🏰 返回村莊廣場 (保持乞丐狀態與當前風險)
              </button>
            </div>
          </div>
        );

      case "village_exit":
        const mapList = [
          {
            id: "rocky",
            direction: "east",
            name: "落石岩地 (Rocky Ground)",
            weather: "沙塵暴",
            weatherDesc: "漫天黃沙漫步，使戰鬥中雙方命中率大幅下降。",
            bgClass: "from-amber-950/40 via-yellow-950/20 to-slate-950",
            borderClass: "border-amber-700/50 hover:border-amber-500",
            textColor: "text-amber-400 font-bold",
            difficulty: "🟢 簡單",
            diffColor: "text-emerald-400 border border-emerald-400/30 bg-emerald-500/5",
            levelGuide: "建議等級: LV. 1 - 10",
            desc: "「荒蕪的礫石地上滾落著碎石，遠處刮起暴虐的沙塵，能見度極差。」",
            weatherIdx: 2
          },
          {
            id: "plains",
            direction: "south",
            name: "狂風平原 (Windy Plains)",
            weather: "暴風雨",
            weatherDesc: "狂風夾雜大雨，戰鬥中全隊 ATB 蓄力速度稍微加快！",
            bgClass: "from-emerald-950/40 via-teal-950/20 to-slate-950",
            borderClass: "border-emerald-700/50 hover:border-emerald-500",
            textColor: "text-emerald-400 font-bold",
            difficulty: "🟡 困難",
            diffColor: "text-amber-400 border border-amber-400/30 bg-amber-500/5",
            levelGuide: "建議等級: LV. 10 - 25",
            desc: "「無垠的草地上狂風呼嘯，瓢潑的大雨擊打著眼皮，使人血液沸騰。」",
            weatherIdx: 1
          },
          {
            id: "forest",
            direction: "west",
            name: "幽暗森林 (Forest)",
            weather: "迷霧籠罩",
            weatherDesc: "濃霧茫茫，此處躲避樹木與裝死機率加倍。",
            bgClass: "from-cyan-950/40 via-blue-950/20 to-slate-950",
            borderClass: "border-cyan-700/50 hover:border-cyan-500",
            textColor: "text-cyan-400 font-bold",
            difficulty: "🟠 夢魘",
            diffColor: "text-orange-400 border border-orange-400/30 bg-orange-500/5",
            levelGuide: "建議等級: LV. 25 - 50",
            desc: "「高聳古老的樹木遮天蔽日，幽暗的濃霧中不時傳來奇怪的摩擦聲。」",
            weatherIdx: 3
          },
          {
            id: "mountains",
            direction: "north",
            name: "寒冷山脈 (Mountains)",
            weather: "極寒冰雪",
            weatherDesc: "刺骨寒風，探險時如未進駐營地，極寒雪凍會使生命值每步流失 3 HP！",
            bgClass: "from-rose-950/40 via-red-950/20 to-slate-950",
            borderClass: "border-rose-700/50 hover:border-rose-500",
            textColor: "text-rose-400 font-bold",
            difficulty: "🔴 煉獄",
            diffColor: "text-rose-400 border border-rose-500/30 bg-rose-500/5",
            levelGuide: "建議等級: LV. 50+",
            desc: "「漫天飛雪遮擋了視線，冰霜覆蓋著岩壁，冰凍的寒風摧殘著你的意志。」",
            weatherIdx: 0
          }
        ];

        const currentSelectedMap = mapList[activeMapIndex] || mapList[0];
        const savedProgressVal = S.terrainProgress?.[currentSelectedMap.id] || 0;

        return (
          <div className="space-y-4 font-mono">
            <h2 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Compass className="w-5 h-5" /> 選擇出發的方向</span>
              <span className="text-[10px] text-slate-500">地圖區塊 ({activeMapIndex + 1} / 4)</span>
            </h2>
            
            <p className="text-xs text-slate-400">
              村莊的四個出口通往不同的荒野地貌。請利用下方導航來切換不同地圖，評估危險程度與探索度後再出發：
            </p>

            {/* 地圖切換導航 */}
            <div className="flex justify-between items-center bg-slate-900/30 p-2 border border-slate-900 rounded-xl">
              <button
                onClick={() => setActiveMapIndex(prev => (prev === 0 ? 3 : prev - 1))}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer border border-slate-800"
              >
                ◀️ 上一個區塊
              </button>
              
              <div className="flex gap-1.5 justify-center items-center">
                {mapList.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      idx === activeMapIndex ? "bg-amber-400 w-4" : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveMapIndex(prev => (prev === 3 ? 0 : prev + 1))}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer border border-slate-800"
              >
                ▶️ 下一個區塊
              </button>
            </div>

            {/* 當前選定地圖詳情卡片 */}
            <div className={`bg-gradient-to-b ${currentSelectedMap.bgClass} border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl transition-all duration-300`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-3">
                <div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${currentSelectedMap.diffColor}`}>
                    {currentSelectedMap.difficulty}
                  </span>
                  <h3 className={`text-base font-black ${currentSelectedMap.textColor} mt-1.5`}>
                    {currentSelectedMap.name}
                  </h3>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-[11px] text-slate-500 block">本地圖探索進度</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{savedProgressVal}%</span>
                </div>
              </div>

              {/* 地圖描述 */}
              <div className="bg-slate-950/50 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed border border-slate-900/50">
                {currentSelectedMap.desc}
              </div>

              {/* 天氣與危險度說明 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 space-y-1">
                  <span className="text-slate-500 block text-[10px]">當前異常天候</span>
                  <span className="text-slate-200 font-bold">🌪 {currentSelectedMap.weather}</span>
                  <p className="text-[10px] text-slate-400 leading-tight mt-1">{currentSelectedMap.weatherDesc}</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 space-y-1">
                  <span className="text-slate-500 block text-[10px]">探險難度建議</span>
                  <span className="text-slate-200 font-bold">🛡️ {currentSelectedMap.levelGuide}</span>
                  <p className="text-[10px] text-slate-400 leading-tight mt-1">進入此地圖每走一步，將會動態計入你的資產審計中。</p>
                </div>
              </div>

              {/* 進入地圖按鈕 */}
              <button
                onClick={() => {
                  setS(prev => {
                    return {
                      ...prev,
                      currentDirection: currentSelectedMap.direction,
                      currentTerrain: currentSelectedMap.id,
                      weather: WEATHERS[currentSelectedMap.weatherIdx],
                      mapProgress: savedProgressVal
                    };
                  });
                  addLog(`🧭 你走向村莊${
                    currentSelectedMap.direction === "east" ? "東" :
                    currentSelectedMap.direction === "south" ? "南" :
                    currentSelectedMap.direction === "west" ? "西" : "北"
                  }側出口，前方是【${currentSelectedMap.name}】！`);
                  setView("explore_map");
                }}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-orange-500/10 text-center"
              >
                🧭 踏上遠征：開始探索這片區域
              </button>
            </div>

            {/* Consistent Navigation Control Center */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={() => setView("menu")} 
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl cursor-pointer font-mono border border-slate-700 font-bold"
              >
                ⬅️ 返回（上一頁）
              </button>
              <button 
                onClick={backToMainMenu} 
                className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs py-2.5 rounded-xl cursor-pointer font-mono border border-rose-800/50 font-bold"
              >
                🏠 回到主選單
              </button>
            </div>
          </div>
        );

      case "explore_map":
        const directionName: Record<string, string> = { east: "東出口 - 落石岩地", south: "南出口 - 狂風平原", west: "西出口 - 幽暗森林", north: "北出口 - 寒冷山脈" };
        const weatherName: Record<string, string> = { rocky: "🌫️ 沙塵暴", plains: "🌧️ 暴風雨", forest: "🌫️ 迷霧籠罩", mountains: "❄️ 極寒冰雪" };
        const diffMultiplierVal = 1 + (S.difficultyLevel - 1) * 0.25;
        const simpleCostVal = Math.ceil(10 * diffMultiplierVal);
        const complexCostVal = Math.ceil(25 * diffMultiplierVal);

        return (
          <div className="space-y-4 animate-fade-in">
            {/* 1. 地圖區塊與 0~100% 進度條（含圓形 ◯ 符號停留位置標記 & 難度標示） */}
            <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400">🗺️ 當前地圖區塊: {directionName[S.currentDirection || "east"]}</span>
                  <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                    {weatherName[S.currentTerrain || "rocky"]}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400 font-bold">【難度標示:</span>
                  <span className="text-amber-400 font-black bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded shadow-sm">
                    {getDifficultyDisplay(S.difficultyLevel)}
                  </span>
                  <span className="text-slate-400 font-bold">】</span>
                </div>
              </div>

              {/* 進度條 (0~100%) 與 圓形 ◯ 符號 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <span>📍 區域探索開拓進度:</span>
                    <span className="text-amber-400 font-extrabold text-sm">{S.mapProgress || 0}% / 100%</span>
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {(S.mapProgress || 0) >= 100 ? "🎉 已達 100%！可點選進入下一階難度" : "達成 100% 即可解鎖下一階難度"}
                  </span>
                </div>

                {/* 0~100% 進度條軌道，圓形 ◯ 符號停留在腳色 0~100% 進度位置 */}
                <div className="relative w-full h-5 bg-slate-900 rounded-full border border-slate-800 flex items-center my-3 px-1">
                  <div 
                    className="h-3 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, S.mapProgress || 0))}%` }}
                  />
                  {/* 圓形 ◯ 符號停留於當前進度 */}
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-7 h-7 bg-amber-400 text-slate-950 font-black rounded-full border-2 border-slate-950 shadow-lg transition-all duration-300 text-xs select-none shadow-amber-500/40"
                    style={{ left: `${Math.min(100, Math.max(0, S.mapProgress || 0))}%` }}
                  >
                    ◯
                  </div>
                </div>

                {/* 每 100% 可點選 [進入下一階難度] 按鈕 */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    disabled={S.difficultyLevel <= 1}
                    onClick={() => {
                      if (S.difficultyLevel <= 1) return;
                      setS(prev => ({
                        ...prev,
                        difficultyLevel: Math.max(1, prev.difficultyLevel - 1),
                        mapProgress: 0
                      }));
                      addLog(`↩ 退回上一個地圖難度！難度調至：【${getDifficultyDisplay(Math.max(1, S.difficultyLevel - 1))}】`);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    ⬅ 回到上一階難度
                  </button>

                  <button
                    disabled={(S.mapProgress || 0) < 100}
                    onClick={() => {
                      const rewardCoins = 100 + Math.floor(Math.random() * 80) + S.difficultyLevel * 30;
                      const nextDiff = S.difficultyLevel + 1;
                      setS(prev => ({
                        ...prev,
                        difficultyLevel: nextDiff,
                        mapProgress: 0,
                        coins: prev.coins + rewardCoins,
                        checkpointCampMet: false
                      }));
                      addLog(`🚀 進入下一階難度！難度等級提升至：【${getDifficultyDisplay(nextDiff)}】！`);
                      addLog(`💰 獲得冒險者公會 $${rewardCoins} 金幣破關獎勵！`);
                    }}
                    className={`text-xs px-5 py-2 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                      (S.mapProgress || 0) >= 100
                        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/30 animate-bounce"
                        : "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span>⚡ [進入下一階難度: {getDifficultyDisplay(S.difficultyLevel + 1)}] ➡</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. 野外自由地圖導航 (Free Terrain Navigation) */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🧭 野外自由地形導航 (方向與地形自由切換)</span>
                </span>
                <span className="text-[10px] text-slate-400">點選方向可隨時移動切換區域</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "rocky", dir: "east", name: "落石岩地", weather: WEATHERS[0], icon: "⛰️" },
                  { id: "plains", dir: "south", name: "狂風平原", weather: WEATHERS[1], icon: "🌾" },
                  { id: "forest", dir: "west", name: "幽暗森林", weather: WEATHERS[2], icon: "🌲" },
                  { id: "mountains", dir: "north", name: "寒冷山脈", weather: WEATHERS[3], icon: "🏔️" },
                ].map(mapItem => {
                  const isCurrent = S.currentTerrain === mapItem.id;
                  const prog = S.terrainProgress?.[mapItem.id] || (isCurrent ? S.mapProgress || 0 : 0);
                  return (
                    <button
                      key={mapItem.id}
                      onClick={() => {
                        if (isCurrent) return;
                        setS(prev => {
                          const prevTerrain = prev.currentTerrain;
                          const nextProgressMap = { ...(prev.terrainProgress || {}) };
                          if (prevTerrain) {
                            nextProgressMap[prevTerrain] = prev.mapProgress || 0;
                          }
                          const targetSavedProg = nextProgressMap[mapItem.id] || 0;
                          return {
                            ...prev,
                            currentDirection: mapItem.dir,
                            currentTerrain: mapItem.id,
                            weather: mapItem.weather,
                            mapProgress: targetSavedProg,
                            terrainProgress: nextProgressMap
                          };
                        });
                        addLog(`🧭 自由移動切換至【${mapItem.name}】！當地探索進度：${prog}%`);
                        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        setLastActionResult({
                          actionTitle: "【自由地形切換】",
                          actionDetail: `切換至【${mapItem.name}】(${mapItem.icon})，朝 ${mapItem.dir} 方向區塊移動。`,
                          resultTitle: `🧭 進入【${mapItem.name}】`,
                          resultDetail: `已抵達【${mapItem.name}】！該區域探索進度：${prog}% | 當地氣候：【${mapItem.weather.name}】(${mapItem.weather.desc})`,
                          costInfo: `氣候過路支出: $${mapItem.weather.cost} | 利息加成: ${mapItem.weather.interest}x`,
                          timestamp: nowTime,
                          badgeType: "info"
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? "bg-amber-950/50 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10 font-bold"
                          : "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span>{mapItem.icon} {mapItem.name}</span>
                        {isCurrent && <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-black">當前</span>}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                        <span>進度</span>
                        <span className={isCurrent ? "text-amber-400 font-bold" : "text-slate-300"}>{prog}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.5 當前執行的行動與最新探勘結果展示區塊 */}
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl space-y-2.5 mt-4 shadow-lg shadow-black/40">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-sm">📜</span>
                  <span className="text-xs font-bold text-amber-300">當前行動與最新探勘結果 (Current Action & Result)</span>
                </div>
                {lastActionResult?.timestamp && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {lastActionResult.timestamp}
                  </span>
                )}
              </div>

              {lastActionResult ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {/* 行動 */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">🎬 執行行動:</span>
                      <span className="text-amber-300 font-bold">{lastActionResult.actionTitle}</span>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed font-mono mt-1">
                      {lastActionResult.actionDetail}
                    </p>
                  </div>

                  {/* 結果 */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">🎯 行動結果:</span>
                      <span className={`font-bold ${
                        lastActionResult.badgeType === "battle" ? "text-rose-400" :
                        lastActionResult.badgeType === "warning" ? "text-amber-400" :
                        lastActionResult.badgeType === "camp" ? "text-emerald-400" :
                        lastActionResult.badgeType === "success" ? "text-cyan-400" : "text-amber-200"
                      }`}>
                        {lastActionResult.resultTitle}
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed font-mono mt-1">
                      {lastActionResult.resultDetail}
                    </p>
                    {lastActionResult.costInfo && (
                      <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1 mt-1 flex items-center justify-between font-mono">
                        <span>影響與代價:</span>
                        <span className="text-amber-400 font-semibold">{lastActionResult.costInfo}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/60 text-center text-xs text-slate-400 space-y-1">
                  <div className="flex justify-center items-center gap-1.5 text-amber-300/80 font-bold">
                    <span>🧭 野外探勘準備中</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    尚無最新行動紀錄。請點選上方【地形切換】或下方【開拓決策】開始探險。
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3 mt-4">
              <span className="text-xs font-bold text-amber-400 block">🧭 選擇下一步開拓決策（簡單路徑 +${simpleCostVal} 負債，複雜叉路 +${complexCostVal} 負債）：</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => performExplorationStep("繼續深入前行", "往前", "邁步向前")}
                  className="bg-gradient-to-tr from-amber-600/90 to-orange-600/90 hover:from-amber-500 hover:to-orange-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-xs text-left flex flex-col justify-between h-20 border border-amber-500/30"
                >
                  <span className="text-amber-200 font-extrabold text-[13px]">👣 繼續深入 <span className="text-[10px] text-orange-100 block">+$${simpleCostVal} 負債</span></span>
                  <span className="text-[9px] text-slate-300 block font-normal mt-1 leading-tight">往前 邁步向前<br/>穩定探求新天地</span>
                </button>

                <button
                  onClick={() => performExplorationStep("在四周漫步徘徊", "繞道", "挪動腳步")}
                  className="bg-gradient-to-tr from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-xs text-left flex flex-col justify-between h-20 border border-cyan-500/30"
                >
                  <span className="text-cyan-200 font-extrabold text-[13px]">🧭 漫步徘徊 <span className="text-[10px] text-cyan-100 block">+$${simpleCostVal} 負債</span></span>
                  <span className="text-[9px] text-slate-300 block font-normal mt-1 leading-tight">繞道 挪動腳步<br/>隨機應變避險行</span>
                </button>

                <button
                  onClick={() => performExplorationStep("筆直往正前進", "往前", "快步奔走")}
                  className="bg-gradient-to-tr from-indigo-600/90 to-purple-600/90 hover:from-indigo-500 hover:to-purple-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-xs text-left flex flex-col justify-between h-20 border border-indigo-500/30"
                >
                  <span className="text-indigo-200 font-extrabold text-[13px]">🎯 筆直往前 <span className="text-[10px] text-indigo-100 block">+$${simpleCostVal} 負債</span></span>
                  <span className="text-[9px] text-slate-300 block font-normal mt-1 leading-tight">往前 快步奔走<br/>快速破陣行如風</span>
                </button>

                                <button
                  onClick={() => performExplorationStep("探索左側叉路", "往左側叉路", "小心潛行")}
                  className="bg-gradient-to-tr from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-xs text-left flex flex-col justify-between h-20 border border-emerald-500/30"
                >
                  <span className="text-emerald-200 font-extrabold text-[13px]">🌿 左側叉路 <span className="text-[10px] text-emerald-100 block">+${money(complexCostVal)} 負債</span></span>
                  <span className="text-[9px] text-slate-300 block font-normal mt-1 leading-tight">往左側叉路 小心潛行<br/>暗影迷蹤覓小徑</span>
                </button>

                <button
                  onClick={() => performExplorationStep("探索右側叉路", "往右側叉路", "緩慢推進")}
                  className="bg-gradient-to-tr from-rose-600/90 to-pink-600/90 hover:from-rose-500 hover:to-pink-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-xs text-left flex flex-col justify-between h-20 border border-rose-500/30"
                >
                  <span className="text-rose-200 font-extrabold text-[13px]">💎 右側叉路 <span className="text-[10px] text-rose-100 block">+${money(complexCostVal)} 負債</span></span>
                  <span className="text-[9px] text-slate-300 block font-normal mt-1 leading-tight">往右側叉路 緩慢推進<br/>堅定持重踏碎石</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <button
                onClick={gatherResources}
                className="bg-gradient-to-tr from-cyan-700 to-teal-800 hover:from-cyan-600 hover:to-teal-750 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-all flex flex-col justify-between h-20 shadow-md text-left border border-cyan-500/20"
              >
                <span className="text-sm block text-cyan-200">🌿 進行野外採集</span>
                <span className="text-[10px] opacity-85 block font-normal text-slate-300">特有選項 | 負債 +$5 | 產出各區特產或藥水</span>
              </button>

              <button
                onClick={() => {
                  setWildCampStatus('idle');
                  setWildCampMonster(null);
                  setView("wild_camp");
                }}
                className="bg-gradient-to-tr from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-all flex flex-col justify-between h-20 shadow-md text-left border border-emerald-500/20"
              >
                <span className="text-sm block text-emerald-200">⛺ 進行野外露營</span>
                <span className="text-[10px] opacity-85 block font-normal text-slate-300">常駐選項 | 可過夜恢復 100% HP</span>
              </button>

              <button
                onClick={() => setView("status")}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left"
              >
                <span className="text-sm block text-indigo-300">📊 個人狀態</span>
                <span className="text-[10px] text-slate-400 block font-normal">屬性、加成、契約裝備</span>
              </button>

              <button
                onClick={() => {
                  setS(prev => {
                    const terrain = prev.currentTerrain;
                    const nextTerrainProgress = { ...(prev.terrainProgress || {}) };
                    if (terrain) {
                      nextTerrainProgress[terrain] = prev.mapProgress || 0;
                    }
                    return {
                      ...prev,
                      currentDirection: null,
                      currentTerrain: null,
                      terrainProgress: nextTerrainProgress,
                      mapProgress: 0
                    };
                  });
                  addLog("🧭 你安全撤退，沿著原路返回了村莊廣場。");
                  setView("menu");
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-4 rounded-xl font-bold cursor-pointer transition-colors flex flex-col justify-between h-20 text-left"
              >
                <span className="text-sm block text-amber-400">🏘️ 撤回村莊</span>
                <span className="text-[10px] text-slate-400 block font-normal">無消耗 | 退出開拓路線 (保存當前進度)</span>
              </button>
            </div>

            {/* Consistent Title Menu Option */}
            <div className="flex justify-center mt-2.5">
              <button 
                onClick={backToMainMenu} 
                className="text-slate-500 hover:text-rose-400 text-[10px] font-mono cursor-pointer transition-colors"
              >
                [ 🏠 退出至遊戲主選單 (Auto-Saves) ]
              </button>
            </div>
          </div>
        );

      case "wild_camp":
        const hasCampfire = S.inventory.includes("露營營火");
        return (
          <div className="space-y-4 text-center py-6 px-4 bg-gradient-to-b from-slate-950 to-slate-900 border border-emerald-500/20 rounded-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-5xl animate-bounce duration-1000 mt-2">⛺</div>
            <h3 className="text-xl font-bold text-emerald-400">⛺ 荒野臨時營地</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              「在危機四伏的荒野中，你尋得了一處避風的角落，燃起火堆、調整狀態...」
            </p>

            {wildCampStatus === "idle" && (
              <div className="space-y-4 max-w-md mx-auto mt-6">
                <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl">
                  <span className="text-xs font-bold text-slate-300 block mb-2">🔥 露營防護狀態：</span>
                  {hasCampfire ? (
                    <div className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                      🛡️ 背包中已有<span>【露營營火】</span>護身！過夜將 100% 安全無虞。
                    </div>
                  ) : (
                    <div className="text-xs text-amber-500 flex flex-col items-center gap-1">
                      <span className="font-bold">⚠️ 未持有「露營營火」！</span>
                      <span className="text-[10px] text-slate-400">今晚在此處過夜，將有 25% 概率在睡夢中被狂暴魔物襲擊。</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => {
                      const diffMultiplier = 1 + (S.difficultyLevel - 1) * 0.25;
                      const campDebtCost = Math.ceil(20 * diffMultiplier);

                      const limit = S.debtLimit || 1500;
                      const maxLimit = S.debtorInherentBuff === "overdraft_user" ? Math.ceil(limit * 1.2) : limit;

                      if (S.debt + campDebtCost > maxLimit) {
                        addLog(`⚠️ 信用額度不足！野外過夜需要增加負債 $${campDebtCost}，剩餘額度 $${maxLimit - S.debt}`);
                        setView("forced_return");
                        return;
                      }

                      const fullHp = getTotalMaxHp();
                      
                      setS(prev => {
                        const nextDebt = prev.debt + campDebtCost;
                        const isLimitReached = nextDebt >= maxLimit;
                        let nextView = view;
                        if (isLimitReached) {
                          addLog(`🏦 當前欠款已達最高上限！-LV ${money(nextDebt)} / ${money(maxLimit)}`);
                          addLog(`冒險中斷！你被銀行強制召回。`);
                          nextView = "forced_return";
                        }
                        return {
                          ...prev,
                          hp: fullHp,
                          debt: nextDebt,
                          forcedReturn: isLimitReached ? true : prev.forcedReturn,
                          view: nextView
                        };
                      });

                      if (hasCampfire) {
                        setS(prev => {
                          const idx = prev.inventory.indexOf("露營營火");
                          const nextInv = [...prev.inventory];
                          if (idx !== -1) nextInv.splice(idx, 1);
                          return { ...prev, inventory: nextInv };
                        });
                        setWildCampStatus("safe");
                        addLog(`⛺ 【野外露營】你點燃了防魔的「露營營火」，溫暖舒適地度過了一夜（增加負債 +$${campDebtCost}）。生命值完全恢復 (100%)！`);
                        recordEffectiveAction("野外露營過夜");
                      } else {
                        const roll = Math.random();
                        if (roll < 0.25) {
                          const monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
                          setWildCampMonster(monster);
                          setWildCampStatus("ambushed");
                          addLog(`⚠️ 【露營夜襲】半夜一聲嘶吼！一頭惡劣的 ${monster.name} 突破了臨時防禦向你發動奇襲！（增加負債 +$${campDebtCost}）`);
                        } else {
                          setWildCampStatus("safe");
                          addLog(`⛺ 【野外露營】雖無營火，但今晚很安靜。你安全度過了一夜（增加負債 +$${campDebtCost}），生命值完全恢復 (100%)！`);
                          recordEffectiveAction("野外露營過夜");
                        }
                      }
                    }}
                    className="bg-gradient-to-tr from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-lg flex flex-col items-center justify-center"
                  >
                    <span className="text-sm font-black">🛌 進行過夜</span>
                    <span className="text-[10px] opacity-85 font-normal">負債 +$${Math.ceil(20 * (1 + (S.difficultyLevel - 1) * 0.25))} | 回復 100% HP</span>
                  </button>

                  <button
                    onClick={() => {
                      setView("explore_map");
                    }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all flex flex-col items-center justify-center"
                  >
                    <span className="text-sm">👣 繼續旅程</span>
                    <span className="text-[10px] text-slate-500 font-normal">返回開拓探索</span>
                  </button>
                </div>
              </div>
            )}

            {wildCampStatus === "safe" && (
              <div className="space-y-4 max-w-sm mx-auto mt-6 animate-fade-in">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center space-y-2">
                  <span className="text-2xl">💤</span>
                  <p className="text-sm font-bold text-emerald-400">一夜安眠！</p>
                  <p className="text-xs text-slate-300">劈啪閃爍的火光驅散了寒意，生命值完全恢復了。</p>
                  <div className="flex justify-center py-1 max-w-xs mx-auto">
                    {renderTextBar(100, "text-emerald-400", 10)}
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-bold block">HP: {S.hp} / {getTotalMaxHp()}</span>
                </div>

                <button
                  onClick={() => {
                    setView("explore_map");
                  }}
                  className="w-full bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold py-3 rounded-xl text-xs cursor-pointer transition-all shadow-md"
                >
                  👣 繼續旅程
                </button>
              </div>
            )}

            {wildCampStatus === "ambushed" && wildCampMonster && (
              <div className="space-y-4 max-w-sm mx-auto mt-6">
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-center space-y-2">
                  <span className="text-3xl animate-pulse">🚨</span>
                  <p className="text-sm font-bold text-rose-500">【突發！夜半遭襲】</p>
                  <p className="text-xs text-slate-300">
                    一陣狂暴的吼聲震碎了夜空！一隻 <span className="text-rose-400 font-bold">{wildCampMonster.name}</span> 突破了暗哨，猛撲而來！
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    「{wildCampMonster.desc}」
                  </p>
                  <div className="pt-2">
                    <span className="text-xs text-emerald-400 font-mono font-bold block">（過夜回復效果已生效：HP 已滿 100%）</span>
                    <span className="text-xs text-slate-300 font-mono block mt-1">HP: {S.hp} / {getTotalMaxHp()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    startBattle(S.weather, wildCampMonster, true);
                  }}
                  className="w-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold py-3 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-red-950/50"
                >
                  ⚔️ 拔劍迎擊！ (遭遇奇襲)
                </button>
              </div>
            )}
          </div>
        );

      case "battle_encounter":
        const encMonster = S.encounterMonster || MONSTERS[0];
        const terrainName: Record<string, string> = { rocky: "落石岩地", plains: "狂風平原", forest: "幽暗森林", mountains: "寒冷山脈" };
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-rose-500 border-b border-slate-800 pb-2">⚠️ 警報！遭遇魔物突襲</h2>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2.5 text-xs font-mono">
              <p className="text-rose-400 font-bold">【遭遇目標】{encMonster.name}</p>
              <p className="text-slate-300">魔物描述: {encMonster.desc}</p>
              <p className="text-slate-400">所在地形: {terrainName[S.currentTerrain || "rocky"]} ({WEATHERS.find(w => w.name === S.weather?.name)?.desc || ""})</p>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-bold">你可以選擇堂堂正正迎擊，或是利用周圍地形躲藏閃避...</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  startBattle(S.weather, encMonster, false);
                }}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white p-4 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
              >
                ⚔️ 拔劍正面迎擊
                <span className="text-[10px] text-slate-300 block font-normal mt-1">進入 ATB 時間條搏殺，享受正常的先攻順序</span>
              </button>

              <button
                onClick={() => {
                  // 根據地形決定躲避描述與機率
                  let hideMsg = "";
                  let successChance = 0.45; // 默認 45%

                  if (S.currentTerrain === "forest") {
                    hideMsg = "你「躲進茂密樹木」背後，緊張地盯著周圍的樹木倒影，大氣不敢喘一下...";
                    successChance = 0.75; // 森林有 75% 機率
                  } else if (S.currentTerrain === "rocky") {
                    hideMsg = "你「縮進巨石後方」縫隙，屏住呼吸，試圖將身體與巨石融為一體...";
                  } else if (S.currentTerrain === "plains") {
                    hideMsg = "你迅速「臥倒草叢」之中，連呼吸都屏住了，保佑別踩到乾枯枝幹...";
                  } else if (S.currentTerrain === "mountains") {
                    hideMsg = "你深吸一籠寒風，將自己「縮進山脊碎石」夾縫之中，假裝成一塊頑石...";
                  }

                  addLog(`🙈 嘗試閃避：${hideMsg}`);

                  if (Math.random() < successChance) {
                    // 成功閃避
                    const bonusCoins = 5 + Math.floor(Math.random() * 10);
                    setS(prev => ({
                      ...prev,
                      coins: prev.coins + bonusCoins,
                      encounterMonster: null
                    }));
                    addLog(`🌿 避險成功！${encMonster.name} 在附近徘徊嗅了嗅，似乎沒有發現你，踱步走開了。`);
                    addLog(`🎁 意外驚喜！你在躲藏的隱蔽處驚喜地撿到了前人遺留的 $${bonusCoins} 枚金幣！`);
                    setView("explore_map");
                  } else {
                    // 失敗，魔物搶攻
                    addLog(`⚠️ 避險失敗！「卡鏘！」你不小心踩碎了碎骨枯枝！${encMonster.name} 猛地回頭發現了你！`);
                    addLog(`💥 魔物咆哮著發動奇襲，享有優先攻擊全力！`);
                    startBattle(S.weather, encMonster, true); // forceEnemyFirst = true
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-amber-400 p-4 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
              >
                🙈 裝死或閃避魔物
                <span className="text-[10px] text-slate-400 block font-normal mt-1">森林(75%)/其他地形(45%)機率。失敗將遭受先制突襲！</span>
              </button>
            </div>
          </div>
        );

      case "camp_site":
        return (
          <div className="space-y-4 text-center py-4 bg-slate-950 p-4 border border-slate-800 rounded-xl relative">
            <div className="text-4xl animate-bounce mb-2">⛺</div>
            <h2 className="text-base font-bold text-emerald-400 border-b border-slate-800 pb-2">⛺ 精靈臨時營地</h2>
            <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 text-left">
              <span className="text-amber-400 font-bold">⛺ 隊友與精靈守護者調侃道：</span>
              <p className="mt-2 text-slate-200">
                「別以為在荒郊野外點個篝火就是度假了！瞧瞧你們勇者小隊身上那一屁股的債務，還不趕緊圍著火堆把傷養好，明天好起來繼續給帝國銀行當黑工搬磚！」
              </p>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              此處為本輪開拓的【安全錨點】。你在這裡休息時，靈魂將與自然連結。本輪如果在荒野被擊敗，將可以選擇在此地「免費復活 (恢復 25% HP)」，而不再需要向大教堂支付昂貴的馬車費！
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  if (!canHeal()) return;
                  setS(prev => ({
                    ...prev,
                    hp: Math.min(getTotalMaxHp(), prev.hp + 20)
                  }));
                  addLog("🛌 你在溫慢的精靈營火前靠著背包休息了片刻，恢復了 20 點 HP。");
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 p-3.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                💤 圍火小憩 (回復 20 HP)
              </button>

              <button
                onClick={() => {
                  setView("explore_map");
                  addLog("👣 你站起身，拍拍身上的雪泥，與隊友重新踏上開拓前行的旅途！");
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                👣 重新啟程，繼續開拓
              </button>
            </div>
          </div>
        );

      case "village":
      case "forge":
      case "forge_confirm":
      case "shop":
      case "church_menu":
      case "church_appraisal":
      case "church_heal":
      case "church_confession":
      case "tavern":
      case "bank":
      case "inn":
      case "guild":
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2">🏘️ 村莊市集</h2>
            {renderVillageContent()}
          </div>
        );

      case "status":
        const maxHpStatus = getTotalMaxHp();
        const creditPct = S.credit > 0 ? Math.min(100, Math.round((S.creditExp / S.credit) * 100)) : 0;
        const debtPct = S.debtLimit > 0 ? Math.min(100, Math.round((S.debt / S.debtLimit) * 100)) : 0;

        const acceptedWantedForStatus = (S.wantedQuests || []).filter(q => q.isAccepted && !q.isSubmitted);
        const sideNeedStatus = S.sideQuest ? S.sideQuest.need : 0;
        const sideProgStatus = S.sideQuestProgress || 0;
        const isSideCompleteStatus = S.sideQuest && sideProgStatus >= sideNeedStatus;

        return (
          <div className="space-y-4 font-mono">
            <h2 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Compass className="w-5 h-5 text-slate-400" /> [ AUDITING REPORT : 勇者資產負債與能力值審計表 ]
            </h2>

            {/* 子頁籤導覽列 */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setStatusSubTab("attributes")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusSubTab === "attributes"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                📊 屬性與能力值
              </button>
              <button
                onClick={() => setStatusSubTab("skills")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusSubTab === "skills"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                ✨ 技能與神恩
                {(S.learnedSkills?.length || 0) > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    statusSubTab === "skills" ? "bg-slate-950 text-amber-300" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {S.learnedSkills?.length || 0}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStatusSubTab("quests")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusSubTab === "quests"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                📋 目前任務清單
                {(acceptedWantedForStatus.length > 0 || S.mainQuest || S.sideQuest) && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    statusSubTab === "quests" ? "bg-slate-950 text-amber-300" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {acceptedWantedForStatus.length + (S.mainQuest ? 1 : 0) + (S.sideQuest ? 1 : 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStatusSubTab("ledger")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusSubTab === "ledger"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                🏦 信用與負債
              </button>
              <button
                onClick={() => setStatusSubTab("inventory")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusSubTab === "inventory"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                {(() => {
                  const cap = getBagCapacityInfo(S.inventory, S.bagSize || 40);
                  return `🎒 裝備與行囊 (${cap.totalSlotsUsed}/${cap.effectiveBagSize})`;
                })()}
              </button>
              <button
                onClick={() => setStatusSubTab("teammates")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusSubTab === "teammates"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                👥 隊友夥伴 ({S.teammates.length})
              </button>
            </div>

            {/* 子頁籤 1: 屬性與能力值 */}
            {statusSubTab === "attributes" && (
              <div className="space-y-4 animate-fade-in">
                {/* 基本帳戶狀況 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 border-b border-slate-900 pb-1.5 uppercase tracking-wider">
                    📁 第一部分：基本帳務與物理指標 (Core General Ledger)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">審計職業代碼與當前身份 (Class)</span>
                      <span className="text-slate-200 font-bold">{getPlayerFullClassName(S)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">生理完整度 (HP)</span>
                      <span className="text-slate-200 font-bold">{S.hp} / {maxHpStatus}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">極限暴怒儲能 (Rage)</span>
                      <span className="text-slate-200 font-bold">{S.rage}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">勞動武力修正 (Atk Bonus)</span>
                      <span className="text-slate-200 font-bold">+{getAtkBonus()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">防務吸收係數 (Def Bonus)</span>
                      <span className="text-slate-200 font-bold">+{getDefBonus()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">生命汲取回饋 (Lifesteal)</span>
                      <span className="text-slate-200 font-bold">+{getLifestealBonus()}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">信託活期存款 (Savings)</span>
                      <span className="text-amber-500 font-bold">{money(S.savings)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/50 py-1">
                      <span className="text-slate-500">持用開拓裝備 (Weapon)</span>
                      <span className="text-slate-300">{getEquippedWeapon()?.name || "無"}</span>
                    </div>
                  </div>
                </div>

                {/* 四大核心屬性分配 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      📊 第二部分：資產分配審計額度 (Capability Attributes)
                    </h3>
                    {(S.attributePoints || 0) > 0 && (
                      <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/20 animate-pulse rounded">
                        待配置額度：{S.attributePoints} Pt
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* 力量 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">1. 力量 (Strength)</div>
                        <div className="text-[10px] text-slate-500 block">影響單次勞動（戰鬥）產出量：每次擊敗獲得金塊時，產出增加 +2% (當前：+{((S.strength || 10) - 10) * 2}%)</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-mono font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">{S.strength || 10} 點</span>
                        {(S.attributePoints || 0) > 0 && (
                          <button
                            onClick={() => allocateAttribute('strength')}
                            className="bg-slate-850 hover:bg-slate-755 hover:text-amber-400 text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-700 text-xs transition-all cursor-pointer"
                          >
                            [ 配置 +1 ]
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 敏捷 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">2. 敏捷 (Agility)</div>
                        <div className="text-[10px] text-slate-500 block">縮短行動進度條的填充時間：行動前進步長 +0.4/點 (當前：+{(((S.agility || 10) - 10) * 0.4).toFixed(1)} 速度)</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-mono font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">{S.agility || 10} 點</span>
                        {(S.attributePoints || 0) > 0 && (
                          <button
                            onClick={() => allocateAttribute('agility')}
                            className="bg-slate-850 hover:bg-slate-755 hover:text-amber-400 text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-700 text-xs transition-all cursor-pointer"
                          >
                            [ 配置 +1 ]
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 經商 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">3. 經商 (Commerce)</div>
                        <div className="text-[10px] text-slate-500 block">影響銀行兌換匯率：金塊兌換金幣加成 +0.2 金幣/點 (當前：兌換時獲得 +{Math.floor(((S.commerce || 10) - 10) * 0.2)} 額外金幣)</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-mono font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">{S.commerce || 10} 點</span>
                        {(S.attributePoints || 0) > 0 && (
                          <button
                            onClick={() => allocateAttribute('commerce')}
                            className="bg-slate-850 hover:bg-slate-755 hover:text-amber-400 text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-700 text-xs transition-all cursor-pointer"
                          >
                            [ 配置 +1 ]
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 體力 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">4. 體力 (Stamina)</div>
                        <div className="text-[10px] text-slate-500 block">決定連續戰鬥不崩潰時長：提高生命值上限 +5 HP/點 (當前：+{((S.stamina || 10) - 10) * 5} Max HP)</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-mono font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">{S.stamina || 10} 點</span>
                        {(S.attributePoints || 0) > 0 && (
                          <button
                            onClick={() => allocateAttribute('stamina')}
                            className="bg-slate-850 hover:bg-slate-755 hover:text-amber-400 text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-700 text-xs transition-all cursor-pointer"
                          >
                            [ 配置 +1 ]
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 幸運 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">5. 幸運 (Luck)</div>
                        <div className="text-[10px] text-slate-500 block">影響稀有資源採集機率與暴擊率：採集暴擊機率增加 +1%/點 (當前：+{((S.luck || 10) - 10) * 1}%)</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-mono font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">{S.luck || 10} 點</span>
                        {(S.attributePoints || 0) > 0 && (
                          <button
                            onClick={() => allocateAttribute('luck')}
                            className="bg-slate-850 hover:bg-slate-755 hover:text-amber-400 text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-700 text-xs transition-all cursor-pointer"
                          >
                            [ 配置 +1 ]
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 意志 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">6. 意志 (Willpower)</div>
                        <div className="text-[10px] text-slate-500 block">抵禦負債的精神痛苦：降低在戰鬥中所承受的固定利息傷害 -0.5/點 (當前：-{(((S.willpower || 10) - 10) * 0.5).toFixed(1)} 固傷減免)</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-mono font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">{S.willpower || 10} 點</span>
                        {(S.attributePoints || 0) > 0 && (
                          <button
                            onClick={() => allocateAttribute('willpower')}
                            className="bg-slate-850 hover:bg-slate-755 hover:text-amber-400 text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-700 text-xs transition-all cursor-pointer"
                          >
                            [ 配置 +1 ]
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 技能與大教堂神恩契約清單 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center justify-between">
                    <span>✨ 已掌握技能與大教堂神恩契約 (Skills & Church Blessings)</span>
                    <span className="text-[10px] text-slate-500 font-normal">全職通用技能與當前契約</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* 教堂神恩技能 */}
                    {S.confessionBuff === "toss" && (
                      <div className="bg-amber-950/40 border border-amber-800 p-2.5 rounded-lg">
                        <div className="font-bold text-amber-300 flex justify-between">
                          <span>💸 惡意撒幣</span>
                          <span className="text-[10px] text-amber-400/80">【主動神恩】</span>
                        </div>
                        <p className="text-[10px] text-amber-200/80 mt-1">
                          威力加成 {S.confessionVal || 2.0}x | 隨機傾瀉身上與保險櫃全額金幣造成神聖真傷。
                        </p>
                      </div>
                    )}
                    {S.confessionBuff === "leech" && (
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg opacity-85">
                        <div className="font-bold text-rose-300 flex justify-between">
                          <span>🩸 血債血償</span>
                          <span className="text-[10px] text-slate-400">【被動常駐 (灰字)】</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          (自動觸發) 所有普通攻擊與職業技能均附加 {S.confessionVal || 15}% 吸血回復。
                        </p>
                      </div>
                    )}
                    {S.confessionBuff === "shield" && (
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg opacity-85">
                        <div className="font-bold text-emerald-300 flex justify-between">
                          <span>🛡️ 絕對防禦</span>
                          <span className="text-[10px] text-slate-400">【被動常駐 (灰字)】</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          (自動觸發) 神聖護盾保護，承受的所有敵方傷害永久降低 {S.confessionVal || 85}%。
                        </p>
                      </div>
                    )}

                    {/* 已學會技能列表 */}
                    {(S.learnedSkills || []).map(skId => {
                      const mSk = MASTER_SKILLS.find(m => m.id === skId || m.id === skId.replace("warrior_", "").replace("mage_", "").replace("assassin_", "").replace("priest_", ""));
                      if (!mSk) return null;
                      return (
                        <div key={skId} className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
                          <div className="font-bold text-slate-200 flex justify-between">
                            <span>✨ {mSk.name}</span>
                            <span className="text-[10px] text-slate-500">{getCategoryLabel(mSk.category)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{mSk.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 子頁籤: 技能與神恩 */}
            {statusSubTab === "skills" && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. 職業固有與天生技能 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center justify-between">
                    <span>⚔️ 職業與天生固有技能 (Inherent Class Skills)</span>
                    <span className="text-[10px] text-slate-400 font-mono">當前職業: {getPlayerFullClassName(S)}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {CLASS_SKILLS[S.prologueClass || getPlayerBaseCategory(S)]?.map(sk => (
                      <div key={sk.id} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
                        <div className="font-bold text-amber-300 flex justify-between items-center">
                          <span>✨ {sk.name}</span>
                          <span className="text-[10px] bg-amber-950/80 border border-amber-800/60 text-amber-400 px-2 py-0.5 rounded font-mono">
                            預支消耗: ${sk.cost}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                          {sk.desc || `威力 ${sk.mult}x 倍率打擊，展現 ${getPlayerBaseClassName(S)} 之專長特色。`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. 大教堂神恩契約 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center justify-between">
                    <span>⛪ 大教堂神恩契約 (Church Divine Blessings)</span>
                    <span className="text-[10px] text-amber-300 font-mono">
                      {S.confessionBuff ? "神恩契約生效中" : "未進行聖洗告解"}
                    </span>
                  </h3>
                  {S.confessionBuff ? (
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {S.confessionBuff === "toss" && (
                        <div className="bg-amber-950/40 border border-amber-800 p-3 rounded-xl">
                          <div className="font-bold text-amber-300 flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span>💸 惡意撒幣</span>
                              <span className="text-[10px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded font-mono">【主動神恩奧義】</span>
                            </span>
                            <span className="text-amber-400 font-mono font-bold">威力加成 {S.confessionVal || 2.0}x</span>
                          </div>
                          <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                            戰鬥中隨機抽取全遊戲金幣資產（身上+保險櫃）爆發漫天硬幣雨，造成極高神聖真實傷害。
                          </p>
                        </div>
                      )}
                      {S.confessionBuff === "leech" && (
                        <div className="bg-rose-950/40 border border-rose-800 p-3 rounded-xl">
                          <div className="font-bold text-rose-300 flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span>🩸 血債血償</span>
                              <span className="text-[10px] bg-rose-900 text-rose-200 px-1.5 py-0.5 rounded font-mono">【被動常駐神恩】</span>
                            </span>
                            <span className="text-rose-400 font-mono font-bold">吸血比例 {S.confessionVal || 15}%</span>
                          </div>
                          <p className="text-[11px] text-rose-200/90 mt-1 leading-relaxed">
                            常駐被動。戰鬥中所有普通攻擊與技能打擊均附加吸血效果，將造成傷害的一部分轉化為自身生命回復。
                          </p>
                        </div>
                      )}
                      {S.confessionBuff === "shield" && (
                        <div className="bg-emerald-950/40 border border-emerald-800 p-3 rounded-xl">
                          <div className="font-bold text-emerald-300 flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span>🛡️ 絕對防禦</span>
                              <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded font-mono">【被動常駐神恩】</span>
                            </span>
                            <span className="text-emerald-400 font-mono font-bold">減傷比例 {S.confessionVal || 85}%</span>
                          </div>
                          <p className="text-[11px] text-emerald-200/90 mt-1 leading-relaxed">
                            常駐被動。神聖護盾永遠庇佑你，使戰鬥中承受的所有敵方傷害大幅降低。
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">尚無生效的大教堂神恩契約，可前往村莊大教堂進行聖洗告解。</p>
                  )}
                </div>

                {/* 3. 已研習學習技能清單 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center justify-between">
                    <span>📖 已研習學習技能 (Learned Master Skills)</span>
                    <span className="text-[10px] text-slate-400 font-mono">已研習: {S.learnedSkills?.length || 0} 個</span>
                  </h3>
                  {S.learnedSkills && S.learnedSkills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {Array.from(new Set(S.learnedSkills)).map(skId => {
                        const sId = String(skId);
                        const mSk = MASTER_SKILLS.find(m => m.id === sId || m.id === sId.replace("warrior_", "").replace("mage_", "").replace("assassin_", "").replace("priest_", ""));
                        return (
                          <div key={sId} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
                            <div className="font-bold text-slate-200 flex justify-between items-center">
                              <span>✨ {mSk?.name || sId}</span>
                              <span className="text-[10px] text-amber-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {mSk ? getCategoryLabel(mSk.category) : "冒險技能"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                              {mSk?.desc || "已在冒險過程中研習習得之冒險技能。"}
                            </p>
                            {mSk && (
                              <div className="text-[10px] text-slate-500 font-mono mt-2 pt-1.5 border-t border-slate-800 flex justify-between">
                                <span>研習花費: 💰 ${mSk.cost}</span>
                                <span>熟練程度: 已精通</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">尚未在村莊或公會學習任何額外職業技能。</p>
                  )}
                </div>
              </div>
            )}

            {/* 子頁籤 2: 目前任務清單 */}
            {statusSubTab === "quests" && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. 主線任務 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <p className="font-bold text-amber-400 text-xs flex items-center justify-between border-b border-slate-900 pb-2">
                    <span>⭐ 當前主線任務 (Main Quest)</span>
                    {S.mainQuest && (
                      <span className="text-[10px] text-amber-500/80 font-normal">
                        進行中 ({(S.mainQuestProgress / MAIN_QUESTS[S.mainQuest].need * 100).toFixed(0)}%)
                      </span>
                    )}
                  </p>
                  {S.mainQuest ? (
                    <div className="space-y-2 text-slate-300 text-xs">
                      <p className="font-bold text-slate-200">
                        {MAIN_QUESTS[S.mainQuest].name}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {MAIN_QUESTS[S.mainQuest].desc}
                      </p>
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>任務進度：</span>
                          <span>{S.mainQuestProgress || 0} / {MAIN_QUESTS[S.mainQuest].need}</span>
                        </div>
                        {renderTextBar(Math.min(100, Math.floor(((S.mainQuestProgress || 0) / MAIN_QUESTS[S.mainQuest].need) * 100)), "text-amber-500", 12)}
                      </div>

                      <div className="pt-1">
                        {(S.mainQuestProgress || 0) >= MAIN_QUESTS[S.mainQuest].need ? (
                          <button
                            onClick={() => completeMainQuest(S.mainQuest!)}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-2 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                          >
                            🏆 交付主線任務（領取獎勵）
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic bg-slate-900/40 p-2 rounded-lg border border-slate-900 text-center">
                            前往對應野外地圖完成目標後可交付
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-xs">無，所有主線任務已完成！</p>
                  )}
                </div>

                {/* 2. 支線任務 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <p className="font-bold text-emerald-400 text-xs flex items-center justify-between border-b border-slate-900 pb-2">
                    <span>🍃 當前支線委託 (Side Quest)</span>
                    {S.sideQuest && (
                      <span className={`text-[10px] font-bold ${isSideCompleteStatus ? "text-emerald-400 animate-pulse" : "text-slate-500"}`}>
                        {isSideCompleteStatus ? "🟢 目標已達成" : `進行中 (${(sideProgStatus / sideNeedStatus * 100).toFixed(0)}%)`}
                      </span>
                    )}
                  </p>
                  
                  {S.sideQuest ? (
                    <div className="space-y-2 text-slate-300 text-xs">
                      <p className="font-bold text-slate-200">
                        {S.sideQuest.label}
                      </p>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>達成進度：</span>
                          <span>{sideProgStatus} / {sideNeedStatus}</span>
                        </div>
                        {renderTextBar(Math.min(100, Math.floor(sideProgStatus / sideNeedStatus * 100)), "text-emerald-500", 12)}
                      </div>

                      <div className="flex justify-between items-center text-[11px] bg-slate-900/40 p-2 border border-slate-900 rounded-lg">
                        <span className="text-slate-400">合約報酬金：</span>
                        <span className="text-emerald-400 font-bold">
                          +{S.sideQuest.reward.coins}金幣 / +{S.sideQuest.reward.gold || 0}金塊
                        </span>
                      </div>

                      <div className="pt-1">
                        {isSideCompleteStatus ? (
                          <button
                            onClick={completeSideQuest}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-2 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                          >
                            🏆 交付支線委託（收報酬）
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic bg-slate-900/40 p-2 rounded-lg border border-slate-900 text-center">
                            達成目標後可交付領取報酬
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-slate-500 italic text-xs">
                      當前沒有接取支線外包委託（可至「冒險者公會/通緝公告欄」接取）
                    </div>
                  )}
                </div>

                {/* 3. 已接取通緝任務 */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <p className="font-bold text-rose-400 text-xs flex items-center justify-between border-b border-slate-900 pb-2">
                    <span>📜 已接取通緝懸賞任務 ({acceptedWantedForStatus.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">保證金 $3 G 已預付</span>
                  </p>

                  {acceptedWantedForStatus.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 italic text-xs space-y-2">
                      <p>尚未接取任何通緝懸賞目標。</p>
                      <button
                        onClick={() => setView("questBoard")}
                        className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3 py-1 rounded-lg text-xs border border-slate-800 transition-all cursor-pointer"
                      >
                        前往通緝公告欄查看
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {acceptedWantedForStatus.map(q => (
                        <div key={q.id} className="bg-slate-900/40 p-3 border border-slate-850 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-amber-300 text-sm">{q.targetTitle}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              q.isCompleted
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                                : "bg-slate-950 text-slate-400 border-slate-800"
                            }`}>
                              {q.isCompleted ? "🟢 目標已擊破" : "🟡 討伐進行中"}
                            </span>
                          </div>

                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 space-y-1 text-[11px]">
                            <div className="text-slate-300">
                              📍 <span className="text-slate-500">所在地形地點：</span>
                              <span className="text-amber-400 font-bold ml-1">{q.terrainName}</span>
                            </div>
                            <div className="text-slate-300">
                              💰 <span className="text-slate-500">懸賞酬勞金額：</span>
                              <span className="text-emerald-400 font-bold ml-1">${q.rewardCoins} G （完成退還 $3 保證金）</span>
                            </div>
                            <div className="text-slate-300">
                              🎁 <span className="text-slate-500">可能掉落物品：</span>
                              <span className="text-slate-300 font-bold ml-1">{q.potentialDrops.join("、")}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>討伐進度：</span>
                              <span>{q.currentKills} / {q.needKills}</span>
                            </div>
                            {renderTextBar(Math.min(100, Math.floor((q.currentKills / q.needKills) * 100)), "text-rose-500", 12)}
                          </div>

                          <div className="pt-1">
                            {q.isCompleted ? (
                              <button
                                onClick={() => completeWantedQuest(q.id)}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-2 px-3 rounded-xl text-xs cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                              >
                                🏆 交付通緝任務（領取 ${q.rewardCoins} G + 退還 $3 保證金）
                              </button>
                            ) : (
                              <div className="text-[10px] text-slate-500 italic text-center py-1">
                                請至「{q.terrainName}」擊敗 {q.needKills - q.currentKills} 只「{q.targetName}」
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 子頁籤 3: 信用與負債 */}
            {statusSubTab === "ledger" && (
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4 animate-fade-in">
                <h3 className="text-xs font-bold text-slate-400 border-b border-slate-900 pb-1.5 uppercase tracking-wider">
                  🏦 第三部分：信用度與負債明細帳戶 (The Ledger Details v2.4)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* [ 模組 A：當前負債狀況 ] */}
                  <div className="bg-slate-900/30 p-3.5 rounded-lg border border-slate-900 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-rose-400 font-bold">[ 模組 A：當前負債狀況 ]</span>
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded">LV {S.creditLevel}</span>
                      </div>
                      <div className="text-slate-200 mt-2">
                        當前欠款：<span className="text-rose-500 font-bold font-mono text-sm">{money(S.debt)} / {money(S.debtLimit || 1500)}</span> (LV.{S.creditLevel} 基準上限)
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        備註：野外戰鬥後，<span className="text-rose-400">{money(S.debt)}</span> 將動態更新。當達到 <span className="text-rose-400">{money(S.debtLimit || 1500)}</span> 時，強制觸發「負債過載」狀態。
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-950 mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>當前欠款載量：</span>
                        <span>{debtPct}%</span>
                      </div>
                      <div>{renderTextBar(debtPct, "text-rose-500", 12)}</div>
                      
                      {/* 視覺警示門檻 */}
                      {(S.debt >= 1500 || S.debt >= (S.debtLimit || 1500)) && (
                        <div className="mt-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2.5 py-1.5 rounded text-[10px] font-black animate-pulse text-center">
                          🚨 執行強制勞動 (Hard Labor) 警告已發布！
                        </div>
                      )}
                    </div>
                  </div>

                  {/* [ 模組 B：系統信用額度 ] */}
                  <div className="bg-slate-900/30 p-3.5 rounded-lg border border-slate-900 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-emerald-400 font-bold">[ 模組 B：系統信用額度 ]</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">審計評等</span>
                      </div>
                      <div className="text-slate-200 mt-2">
                        當前信用消耗：<span className="text-emerald-500 font-bold font-mono text-sm">{S.creditExp} / {S.credit}</span> (最高上限)
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        備註：此處顯示玩家已消耗的「村莊服務額度」。初始預設值固定為 $0。
                      </p>
                      <p className="text-[9px] text-slate-600 mt-1.5 leading-tight italic">
                        [說明：這一項設定就是經驗值，只是名稱不同。每次滿了會增加玩家的負債上限和信用額度，以及屬性和技能點。滿了會歸0，額度上限會增加]
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-950 mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>信用額度進度：</span>
                        <span>{creditPct}%</span>
                      </div>
                      <div>{renderTextBar(creditPct, "text-emerald-500", 12)}</div>
                      
                      {/* 視覺警示門檻 */}
                      {S.creditExp >= S.credit && (
                        <div className="mt-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1.5 rounded text-[10px] font-black animate-pulse text-center">
                          🔴 信用凍結 (Credit Frozen)
                        </div>
                      )}

                      {S.creditExp >= S.credit && (
                        <button 
                          onClick={triggerCreditLevelUp}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[11px] py-1.5 px-3 rounded-lg cursor-pointer mt-2 transition-all border border-emerald-400 shadow-md shadow-emerald-500/10 text-center block"
                        >
                          💳 提升信用評等 (重置與解凍)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Repayment in Status */}
                {S.coins > 0 && S.debt > 0 && (
                  <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
                    <span className="text-slate-300">擁有可用金幣 <span className="text-amber-400 font-bold">{S.coins}</span> 枚，可在狀態表直接償還部分債務</span>
                    <button
                      onClick={repayDebt}
                      className="bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-all border border-rose-400/30 cursor-pointer"
                    >
                      💸 立即還債 (償還 {Math.min(S.coins, S.debt)} 金幣)
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 leading-normal italic text-center mt-2 pt-1">
                  「在無限複利的極致魔法壓迫下，只有精準的資產重組與還款，才是唯一的生還之路。」
                </p>
              </div>
            )}

            {/* 子頁籤 4: 裝備與行囊 */}
            {statusSubTab === "inventory" && (
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4 animate-fade-in">
                <h3 className="text-xs font-bold text-slate-400 border-b border-slate-900 pb-1.5 uppercase tracking-wider">
                  🎒 第四部分：持用物資與全身裝備資產審計 (Equipment & Inventory)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 裝備欄 */}
                  <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-900 space-y-3">
                    <span className="text-amber-400 font-bold">🛡️ 當前配戴裝備 (Audit Slots)</span>
                    
                    <div className="space-y-2 text-xs">
                      {/* 武器 */}
                      <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg border border-slate-850">
                        <div>
                          <span className="text-slate-500 mr-2">【武器】</span>
                          {getEquippedWeapon() ? (
                            <span style={{ color: getEquippedWeapon()?.color }} className="font-bold">
                              {getEquippedWeapon()?.name} (Atk +{getEquippedWeapon()?.atk})
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">空無一物 (赤手空拳)</span>
                          )}
                        </div>
                        {getEquippedWeapon() && (
                          <button
                            onClick={() => unequipItem("weapon")}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-700 cursor-pointer"
                          >
                            卸下
                          </button>
                        )}
                      </div>

                      {/* 鎧甲 */}
                      <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg border border-slate-850">
                        <div>
                          <span className="text-slate-500 mr-2">【鎧甲】</span>
                          {getEquippedArmor() ? (
                            <span style={{ color: getEquippedArmor()?.color }} className="font-bold">
                              {getEquippedArmor()?.name} (Def +{getEquippedArmor()?.def})
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">空無一物 (無防備)</span>
                          )}
                        </div>
                        {getEquippedArmor() && (
                          <button
                            onClick={() => unequipItem("armor")}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-700 cursor-pointer"
                          >
                            卸下
                          </button>
                        )}
                      </div>

                      {/* 飾品 */}
                      <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg border border-slate-850">
                        <div>
                          <span className="text-slate-500 mr-2">【飾品】</span>
                          {getEquippedAccessory() ? (
                            <span style={{ color: getEquippedAccessory()?.color }} className="font-bold">
                              {getEquippedAccessory()?.name}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">空無一物</span>
                          )}
                        </div>
                        {getEquippedAccessory() && (
                          <button
                            onClick={() => unequipItem("accessory")}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-700 cursor-pointer"
                          >
                            卸下
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 背包物品 */}
                  {(() => {
                    const statusBagCap = getBagCapacityInfo(S.inventory, S.bagSize || 40);
                    return (
                      <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-900 space-y-3 flex flex-col">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                          <span className="text-emerald-400 font-bold">
                            🎒 背包行囊總帳 ({statusBagCap.totalSlotsUsed} / {statusBagCap.effectiveBagSize} 格)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            一般: {statusBagCap.standardSlotsUsed}/{statusBagCap.baseBagSize} {statusBagCap.questSlotsUsed > 0 ? `| 任務: +${statusBagCap.questSlotsUsed}格` : ''}
                          </span>
                        </div>
                        
                        {statusBagCap.grouped.length === 0 ? (
                          <div className="text-center py-6 text-slate-600 italic leading-relaxed flex-1 flex items-center justify-center">
                            「行囊空空如也，簡直比你的信用記錄還要乾淨。」
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 flex-1">
                            {statusBagCap.grouped.map((g) => {
                              const wp = EQUIPMENT.weapons.find(w => w.id === g.itemKey || w.name === g.itemKey);
                              const ar = EQUIPMENT.armors.find(a => a.id === g.itemKey || a.name === g.itemKey);
                              const ac = EQUIPMENT.accessories.find(a => a.id === g.itemKey || a.name === g.itemKey);
                              
                              const isEquip = wp || ar || ac;
                              const forgedSet = new Set(S.forgedItems || []);
                              const isForged = isEquip && (forgedSet.has(g.itemKey) || forgedSet.has(wp?.id || "") || forgedSet.has(ar?.id || "") || forgedSet.has(ac?.id || ""));
                              const buff = isEquip ? (equipBuffMap[g.itemKey] || (wp ? equipBuffMap[wp.id] : null) || (ar ? equipBuffMap[ar.id] : null) || (ac ? equipBuffMap[ac.id] : null)) : null;

                              return (
                                <div key={g.itemKey} className={`flex justify-between items-center p-2 border rounded-lg text-xs ${
                                  g.isQuest ? "bg-amber-950/20 border-amber-800/40" : "bg-slate-950/40 border-slate-900"
                                }`}>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold font-mono text-left" style={{ color: g.color }}>
                                      {g.displayName}
                                      {wp && ` (武器 Atk +${wp.atk}${buff && buff.effect === "atk" ? ` +${buff.value}%` : ""})`}
                                      {ar && ` (鎧甲 Def +${ar.def}${buff && buff.effect === "def" ? ` +${buff.value}%` : ""})`}
                                      {ac && ` (飾品)`}
                                    </span>
                                    <span className="text-[11px] font-black font-mono text-amber-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                                      x{g.count}
                                    </span>
                                    {isForged && (
                                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/60 font-mono">
                                        🔥 已熔煉
                                      </span>
                                    )}
                                    {buff && (
                                      <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800/60 font-mono">
                                        ✨ 神恩:【{buff.name}】({buff.desc})
                                      </span>
                                    )}
                                    {g.isQuest && (
                                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/60">
                                        ✨ 任務動態格
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-1.5 shrink-0 ml-2">
                                    {g.count > 1 && (
                                      <button
                                        onClick={() => setSelectedStackSubMenu({ itemKey: g.itemKey, displayName: g.displayName })}
                                        className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] border border-indigo-500/40 cursor-pointer shadow transition-all"
                                        title="檢視並精確選擇該堆疊中的個別個體"
                                      >
                                        🔍 個體分流 (x{g.count})
                                      </button>
                                    )}
                                    {isEquip ? (
                                      <button
                                        onClick={() => equipItem(wp?.id || ar?.id || ac?.id || g.itemKey, g.firstIndex)}
                                        className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-500/30 cursor-pointer"
                                      >
                                        裝備
                                      </button>
                                    ) : (
                                      <>
                                        {(g.itemKey === "治療藥水" || g.itemKey === "healing_potion") && (
                                          <button
                                            onClick={() => usePotionFromStatus(g.firstIndex)}
                                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold px-1.5 py-0.5 rounded text-[10px] border border-blue-500/30 cursor-pointer"
                                          >
                                            飲用
                                          </button>
                                        )}
                                        {(g.itemKey === "傳送指南針" || g.itemKey === "teleport_compass") && (
                                          <button
                                            onClick={() => setTeleportCompassModal({ invIndex: g.firstIndex })}
                                            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] border border-amber-500/30 cursor-pointer"
                                          >
                                            折躍
                                          </button>
                                        )}
                                        {g.itemKey === "幽暗迷幻菇" && (
                                          <button
                                            onClick={() => useMushroomFromStatus(g.firstIndex)}
                                            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-bold px-1.5 py-0.5 rounded text-[10px] border border-purple-500/30 cursor-pointer"
                                          >
                                            食用
                                          </button>
                                        )}
                                        {!g.isQuest && (
                                          <button
                                            onClick={() => sellItemFromStatus(g.itemKey, g.firstIndex)}
                                            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 font-bold px-1.5 py-0.5 rounded text-[10px] border border-amber-500/30 cursor-pointer"
                                          >
                                            變賣 1個
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 子頁籤 5: 隊友夥伴 */}
            {statusSubTab === "teammates" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      👥 冒險小隊夥伴陣容與解約審計
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      當前成員：{S.teammates.length} 位
                    </span>
                  </div>

                  {S.teammates.length === 0 ? (
                    <div className="p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                      <p className="text-slate-400 text-xs font-bold">🍃 當前小隊沒有任何隊友夥伴！</p>
                      <p className="text-slate-500 text-[10px]">
                        您可以前往【破產者小酒館】招募夥伴，或至【大教堂聖池祈禱】召喚傳奇勇者夥伴歸隊並肩作戰。
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {S.teammates.map(id => {
                        const tm = getTeammateData(id);
                        if (!tm) return null;

                        const eq = S.teammateEquip?.[id] || {};
                        const wpObj = eq.weapon ? EQUIPMENT.weapons.find(w => w.id === eq.weapon || w.name === eq.weapon) : null;
                        const arObj = eq.armor ? EQUIPMENT.armors.find(a => a.id === eq.armor || a.name === eq.armor) : null;
                        const acObj = eq.accessory ? EQUIPMENT.accessories.find(a => a.id === eq.accessory || a.name === eq.accessory) : null;
                        const bonusAtk = (wpObj?.atk || 0) + Math.floor((acObj?.effectValue || 0) * 0.5);

                        return (
                          <div key={id} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-left shadow-lg">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-xs font-bold text-slate-100 block">
                                  【{tm.prefix}】{tm.name}
                                </span>
                                <span className="text-[10px] text-amber-400/90 block font-mono">{tm.nickname}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => openTeammateGiftModal(id)}
                                  className="bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/80 hover:border-indigo-400 text-indigo-300 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1"
                                >
                                  <span>🎁 贈與裝備</span>
                                </button>
                                <button
                                  onClick={() => dismissTeammate(id)}
                                  className="bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 hover:border-rose-500 text-rose-300 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1"
                                >
                                  <span>👋 解除合作</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-1.5">
                              {tm.desc}
                            </p>

                            {/* 隊友專屬裝備狀態 */}
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1 text-[10px]">
                              <div className="text-[10px] font-bold text-indigo-300 flex justify-between items-center border-b border-slate-900 pb-1">
                                <span>🛡️ 隊友裝備欄位 (綁定)</span>
                                <span className="text-[9px] text-rose-400 font-mono font-bold">[隊友專屬]</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 pt-0.5 text-slate-300">
                                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center space-y-0.5">
                                  <span className="text-[9px] text-slate-500 block">⚔️ 武器</span>
                                  <span className="font-bold text-amber-300 truncate block text-[10px]">
                                    {wpObj ? wpObj.name : "無"}
                                  </span>
                                  {wpObj && <span className="text-[9px] text-rose-400 font-mono font-bold block">[隊友專屬]</span>}
                                </div>
                                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center space-y-0.5">
                                  <span className="text-[9px] text-slate-500 block">🛡️ 鎧甲</span>
                                  <span className="font-bold text-blue-300 truncate block text-[10px]">
                                    {arObj ? arObj.name : "無"}
                                  </span>
                                  {arObj && <span className="text-[9px] text-rose-400 font-mono font-bold block">[隊友專屬]</span>}
                                </div>
                                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center space-y-0.5">
                                  <span className="text-[9px] text-slate-500 block">💍 飾品</span>
                                  <span className="font-bold text-purple-300 truncate block text-[10px]">
                                    {acObj ? acObj.name : "無"}
                                  </span>
                                  {acObj && <span className="text-[9px] text-rose-400 font-mono font-bold block">[隊友專屬]</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono bg-slate-950 p-1.5 rounded-lg border border-slate-900">
                              <span>⚔️ 物理支援戰力：</span>
                              <span className="font-bold">
                                + Atk {tm.atkMin + bonusAtk} ~ {tm.atkMax + bonusAtk}
                                {bonusAtk > 0 && <span className="text-amber-400 text-[9px] ml-1">(裝備 +{bonusAtk})</span>}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Consistent Navigation Control Center */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={() => setView(prevView && prevView !== "status" ? prevView : "menu")} 
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl cursor-pointer font-mono border border-slate-700 font-bold"
              >
                ⬅️ 返回（上一頁）
              </button>
              <button 
                onClick={backToMainMenu} 
                className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs py-2.5 rounded-xl cursor-pointer font-mono border border-rose-800/50 font-bold"
              >
                🏠 回到主選單
              </button>
            </div>
          </div>
        );

      case "palace":
        return (
          <div className="space-y-4 animate-fade-in font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                🏰 帝國皇宮 (Royal Imperial Palace)
              </h2>
              <span className="text-xs bg-amber-950/60 text-amber-400 px-2.5 py-1 rounded-full border border-amber-800/50 font-medium">
                核心皇家禁地
              </span>
            </div>

            {/* Guard Header */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-900/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl bg-amber-950/80 p-3 rounded-2xl border border-amber-800/60 flex items-center justify-center">
                  💂‍♂️💂‍♂️
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">皇宮正門與皇家槍衛</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    王都中央最雄偉高聳的金碧宮殿。兩名皇家守衛身穿鍍金重甲，手持皇家衛隊銀槍。
                  </p>
                </div>
              </div>
            </div>

            {/* Check if has Palace Letter */}
            {S.hasPalaceLetter ? (
              <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/50 space-y-4">
                <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
                  <span className="text-3xl">✉️</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">守衛行禮致敬！出示【皇宮的推薦信】成功通過！</h4>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      「這是冒險者公會發出的皇家最高資質證明！歡迎尊貴的冒險者進入【皇家轉職聖殿】！」
                    </p>
                  </div>
                </div>

                {/* 皇家轉職聖殿 */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                      <span>👑 皇家轉職聖殿 (Royal Job Change Chamber)</span>
                    </h3>
                    <span className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-bold">
                      當前高階職業: {
                        S.advancedClass === "berserker" ? "⚔️ 狂戰士" :
                        S.advancedClass === "paladin" ? "🛡️ 聖騎士" :
                        S.advancedClass === "archmage" ? "🔮 大魔導士" :
                        S.advancedClass === "illusionist" ? "🌀 幻術師" :
                        S.advancedClass === "shadow_assassin" ? "🗡️ 暗影刺客" : "尚無進階職業"
                      }
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    請選擇符合您基礎職業脈絡的皇家高階職業進行進階轉職：
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "berserker", name: "狂戰士", category: "warrior", icon: "⚔️", desc: "【戰士進階】力量與暴怒的化身！基礎物攻加成大幅提升，攻擊附帶破甲震懾！" },
                      { id: "paladin", name: "聖騎士", category: "warrior", icon: "🛡️", desc: "【戰士/聖職進階】極致堅固與神聖加持！擁有極高護甲防禦，並可掌控聖光治療！" },
                      { id: "archmage", name: "大魔導士", category: "mage", icon: "🔮", desc: "【法師進階】毀滅性魔法風暴的主宰！奧術、冰霜與怒雷傷害全面提升 40%！" },
                      { id: "illusionist", name: "幻術師", category: "mage", icon: "🌀", desc: "【法師進階】操縱心靈與空間鏡像！高機率使敵方陷入混亂與持續凍結！" },
                      { id: "shadow_assassin", name: "暗影刺客", category: "assassin", icon: "🗡️", desc: "【刺客進階】出沒於陰影中的致命殺手！爆擊率與背刺致死傷害倍率大幅翻倍！" }
                    ].map(adv => {
                      const isCurrent = S.advancedClass === adv.id;
                      const baseCat = getPlayerBaseCategory(S);
                      const isCompatible = isAdvClassCompatibleWithBase(baseCat, adv.id);
                      return (
                        <div
                          key={adv.id}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 ${
                            isCurrent
                              ? "bg-amber-950/30 border-amber-500/60"
                              : !isCompatible
                              ? "bg-slate-950/40 border-slate-900 opacity-60"
                              : "bg-slate-950 border-slate-800 hover:border-amber-500/40"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                <span>{adv.icon}</span>
                                <span>{adv.name}</span>
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {adv.category === "warrior" ? "戰士系" : adv.category === "mage" ? "法師系" : "刺客系"}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                              {adv.desc}
                            </p>
                          </div>

                          <div className="pt-1">
                            {isCurrent ? (
                              <div className="text-center text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 py-1.5 rounded-lg">
                                👑 當前已進階職位
                              </div>
                            ) : !isCompatible ? (
                              <div className="text-center text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-900/60 py-1.5 rounded-lg">
                                ❌ 與基礎職業不符
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setS(prev => ({
                                    ...prev,
                                    advancedClass: adv.id,
                                    hasPalaceLetter: false,
                                    inventory: prev.inventory.filter(i => i !== "皇宮推薦信" && i !== "皇宮的推薦信")
                                  }));
                                  addLog(`👑 【皇家轉職成功】恭喜！您憑藉【皇宮的推薦信】順利進階轉職為【${adv.name}】！【皇宮的推薦信】已自動收回消耗，防止重複利用！解鎖高階職業權限！`);
                                }}
                                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs py-1.5 rounded-lg transition-all cursor-pointer text-center shadow-md"
                              >
                                👑 進行皇家進階轉職為【{adv.name}】
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  🛡️ 門口守衛態度沉穩，眼神銳利地冷視著你...
                </h4>
                <p className="text-xs text-slate-400 italic bg-slate-950 p-3 rounded-lg border border-slate-850">
                  「沒有冒險者公會核發的【皇宮的推薦信】（需預支負債/信用等級達 Lv.20），平民與債務者一律嚴禁踏入皇宮半步！」
                </p>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      setPalaceKickedModal(true);
                      addLog("💥 【皇宮闖入失敗】兩個守衛兵器交叉擋住你，其中一個跟你說：「你看那邊！」，接著你被一腳踹出去很狼狽，兩個守衛則哈哈大笑看著你！");
                    }}
                    className="w-full bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 hover:from-rose-800 hover:to-amber-800 text-rose-100 font-bold p-3.5 rounded-xl text-xs cursor-pointer transition-all border border-rose-700/60 shadow-lg flex items-center justify-between"
                  >
                    <div className="text-left">
                      <span className="block font-black text-sm">🚪 嘗試直接闖入皇宮 (硬闖)</span>
                      <span className="block text-[10px] text-rose-300 font-normal mt-0.5">無視守衛阻擋，硬是往前衝向皇宮大門...</span>
                    </div>
                    <span className="text-lg">🏃💨</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setView("menu")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-700 mt-2"
            >
              ↩️ 離開皇宮大門，返回村莊廣場
            </button>

            {palaceKickedModal && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-slate-900 border-2 border-rose-600/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
                  <div className="text-5xl animate-bounce">🦵💥😵</div>
                  <h3 className="text-lg font-black text-rose-400">💥 狼狽被踹飛！</h3>
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-rose-950 text-xs text-slate-200 leading-relaxed text-left space-y-2">
                    <p className="font-bold text-amber-300">
                      「兩個守衛兵器交叉擋住你，其中一個跟你說：『你看那邊！』」
                    </p>
                    <p className="text-rose-400 font-semibold">
                      接著你順著手指的方向看過去，下一秒你被守衛一腳狠狠踹出去，姿態極其狼狽！
                    </p>
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-amber-400 text-center font-bold text-sm">
                      🤣🤣 守衛兵甲、乙：「哈哈哈哈哈哈！傻瓜，還真看過去啊！」
                    </div>
                    <p className="text-slate-400 text-[11px] italic text-center">
                      兩個守衛站在皇宮門口，放聲哈哈大笑地看著狼狽趴在地上的你...
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setPalaceKickedModal(false);
                      setView("menu");
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-xs cursor-pointer shadow-md transition-all"
                  >
                    拍拍灰塵，狼狽返回村莊廣場
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case "commoners_district": {
        const keyFragCount = S.inventory.filter(i => i === "鑰匙的碎片" || i === "鑰匙碎片").length;
        const crystalFragCount = S.inventory.filter(i => i === "水晶的碎片" || i === "水晶碎片").length;
        const hasKey = S.inventory.includes("散發異樣光芒的鑰匙");
        const hasCrystal = S.inventory.includes("富含魔力的水晶");

        const completeResidentQuest = (residentKey: string, reqType: string, reqVal: number) => {
          if (reqType === "potion") {
            if (!S.inventory.includes("治療藥水")) {
              addLog("❌ 【背包中無治療藥水】無法完成平民青年所需的藥水委託！");
              return;
            }
            removeItemsFromInventory("治療藥水", 1);
          } else if (reqType === "coins") {
            if (S.coins < reqVal) {
              addLog(`❌ 【金幣不足】金幣不夠支付 $${reqVal} G！`);
              return;
            }
            setS(prev => ({ ...prev, coins: prev.coins - reqVal }));
          }

          const reward = slumRewardsMap[residentKey] || generateRandomSlumReward();

          setS(prev => {
            const nextInv = [...prev.inventory];
            for (let i = 0; i < reward.shardCount; i++) {
              nextInv.push(reward.shardItem);
            }
            for (let i = 0; i < reward.foodCount; i++) {
              nextInv.push(reward.foodItem);
            }
            return {
              ...prev,
              inventory: nextInv,
              coins: prev.coins + reward.coinReward
            };
          });

          setResidentTaskDone(prev => ({ ...prev, [residentKey]: true }));
          addLog(`🎁 【平民委託完成】獲得 『${reward.shardItem} x${reward.shardCount}』 與 美食 『${reward.foodItem} x${reward.foodCount}』 (金幣 +$${reward.coinReward} G)！`);
        };

        const donateToSlums = (type: "coins_small" | "coins_large" | "potion" | "campfire") => {
          const reward = slumRewardsMap[type] || generateRandomSlumReward();
          if (type === "coins_small") {
            if (S.coins < 10) {
              addLog("❌ 【金幣不足】需要 $10 G 才能進行貧民區社區捐獻！");
              return;
            }
            setS(prev => {
              const nextInv = [...prev.inventory];
              for (let i = 0; i < reward.shardCount; i++) nextInv.push(reward.shardItem);
              for (let i = 0; i < reward.foodCount; i++) nextInv.push(reward.foodItem);
              return { ...prev, coins: prev.coins - 10, inventory: nextInv };
            });
            refreshSlumRewards();
            setResidentTaskDone({});
            gainCreditExp(100);
            addLog(`💖 【貧民區捐獻援助】你捐獻了 $10 G 家用物資基金！獲得 『${reward.shardItem} x${reward.shardCount}』、美食 『${reward.foodItem} x${reward.foodCount}』！全區域動態委託與獎勵已【即刻刷新】！`);
          } else if (type === "coins_large") {
            if (S.coins < 20) {
              addLog("❌ 【金幣不足】需要 $20 G 才能進行貧民區社區建設資助！");
              return;
            }
            setS(prev => {
              const nextInv = [...prev.inventory];
              for (let i = 0; i < reward.shardCount; i++) nextInv.push(reward.shardItem);
              for (let i = 0; i < reward.foodCount; i++) nextInv.push(reward.foodItem);
              return { ...prev, coins: prev.coins - 20, inventory: nextInv };
            });
            refreshSlumRewards();
            setResidentTaskDone({});
            gainCreditExp(200);
            addLog(`💖 【貧民區建設資助】你資助了 $20 G 建設基金！獲得 『${reward.shardItem} x${reward.shardCount}』、美食 『${reward.foodItem} x${reward.foodCount}』！全區域動態委託與獎勵已【即刻刷新】！`);
          } else if (type === "potion") {
            if (!S.inventory.includes("治療藥水")) {
              addLog("❌ 【背包無治療藥水】無可用藥水捐獻給醫療站！");
              return;
            }
            removeItemsFromInventory("治療藥水", 1);
            setS(prev => {
              const nextInv = [...prev.inventory];
              for (let i = 0; i < reward.shardCount; i++) nextInv.push(reward.shardItem);
              for (let i = 0; i < reward.foodCount; i++) nextInv.push(reward.foodItem);
              return { ...prev, inventory: nextInv };
            });
            refreshSlumRewards();
            setResidentTaskDone({});
            gainCreditExp(150);
            addLog(`📦 【醫療物資援助】捐獻 1 瓶【治療藥水】！獲得 『${reward.shardItem} x${reward.shardCount}』、美食 『${reward.foodItem} x${reward.foodCount}』！全區域動態委託與獎勵已【即刻刷新】！`);
          } else if (type === "campfire") {
            if (!S.inventory.includes("露營營火")) {
              addLog("❌ 【背包無露營營火】無可用營火捐獻給破棚屋防寒！");
              return;
            }
            removeItemsFromInventory("露營營火", 1);
            setS(prev => {
              const nextInv = [...prev.inventory];
              for (let i = 0; i < reward.shardCount; i++) nextInv.push(reward.shardItem);
              for (let i = 0; i < reward.foodCount; i++) nextInv.push(reward.foodItem);
              return { ...prev, inventory: nextInv };
            });
            refreshSlumRewards();
            setResidentTaskDone({});
            gainCreditExp(180);
            addLog(`🔥 【棚屋防寒援助】捐獻 1 個【露營營火】！獲得 『${reward.shardItem} x${reward.shardCount}』、美食 『${reward.foodItem} x${reward.foodCount}』！全區域動態委託與獎勵已【即刻刷新】！`);
          }
        };

        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                🏚️ 帝國平民區 (Commoners' District)
              </h2>
              <button
                onClick={() => {
                  refreshSlumRewards();
                  setResidentTaskDone({});
                  addLog("🔄 【貧民區動態刷新】隨機獎勵池與居民委託已手動重置刷新！");
                }}
                className="text-xs bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-500/40 cursor-pointer transition-all"
              >
                🔄 動態刷新獎勵池
              </button>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-900">
              王都腹地外的喧囂巷弄，居住著熱情樸實的平民。與他們互動可協助處理生活瑣事以換取隨機抽取自<strong>【碎片限定池（鑰匙/水晶碎片）】</strong>與<strong>【食物限定池（鮮美清湯/精燉濃湯/水果/雜糧面包/蔬果沙拉/脆皮臘肉/秘醃醬菜）】</strong>的豐厚隨機獎勵！
            </p>

            {/* 1. 平民居民互動與隨機委託 */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-amber-300 flex items-center justify-between">
                <span>🏡 平民居民隨機委託 (隨機抽取限定池)</span>
                <span className="text-[10px] text-slate-400 font-normal">自由接取，不強制</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 青年 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👦</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">平民青年・阿傑</h4>
                      <p className="text-[10px] text-slate-400">「天天為了交房租努力工作！冒險者大人幫個忙吧！」</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded text-[11px] text-amber-300 border border-slate-850">
                    📋 獎勵：{slumRewardsMap["youth"].shardItem} x{slumRewardsMap["youth"].shardCount} + {slumRewardsMap["youth"].foodItem} x{slumRewardsMap["youth"].foodCount} + ${slumRewardsMap["youth"].coinReward} G
                  </div>
                  <button
                    disabled={residentTaskDone["youth"]}
                    onClick={() => completeResidentQuest("youth", "potion", 0)}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      residentTaskDone["youth"]
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 text-slate-950"
                    }`}
                  >
                    {residentTaskDone["youth"] ? "✅ 今日委託已完成" : `🤝 提供治療藥水 (領取隨機獎勵)`}
                  </button>
                </div>

                {/* 小孩 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👧</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">平民小孩・小花</h4>
                      <p className="text-[10px] text-slate-400">「大哥哥！我有在溝渠撿到亮晶晶的碎片和好吃的喔！」</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded text-[11px] text-amber-300 border border-slate-850">
                    📋 獎勵：{slumRewardsMap["child"].shardItem} x{slumRewardsMap["child"].shardCount} + {slumRewardsMap["child"].foodItem} x{slumRewardsMap["child"].foodCount} + ${slumRewardsMap["child"].coinReward} G
                  </div>
                  <button
                    disabled={residentTaskDone["child"]}
                    onClick={() => completeResidentQuest("child", "coins", 5)}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      residentTaskDone["child"]
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    }`}
                  >
                    {residentTaskDone["child"] ? "✅ 今日委託已完成" : "🍬 給予 $5 G 零用錢 (領取隨機獎勵)"}
                  </button>
                </div>

                {/* 夫妻 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👫</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">平民夫妻・強森夫婦</h4>
                      <p className="text-[10px] text-slate-400">「日子雖然辛苦，但一家人平平安安最重要。」</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded text-[11px] text-amber-300 border border-slate-850">
                    📋 獎勵：{slumRewardsMap["couple"].shardItem} x{slumRewardsMap["couple"].shardCount} + {slumRewardsMap["couple"].foodItem} x{slumRewardsMap["couple"].foodCount} + ${slumRewardsMap["couple"].coinReward} G
                  </div>
                  <button
                    disabled={residentTaskDone["couple"]}
                    onClick={() => completeResidentQuest("couple", "coins", 10)}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      residentTaskDone["couple"]
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {residentTaskDone["couple"] ? "✅ 今日委託已完成" : "💰 資助 $10 G (領取隨機獎勵)"}
                  </button>
                </div>

                {/* 老人 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👵</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">平民老人・老班恩</h4>
                      <p className="text-[10px] text-slate-400">「年輕人，聽老人講講以前王都深處的秘密吧...」</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded text-[11px] text-amber-300 border border-slate-850">
                    📋 獎勵：{slumRewardsMap["elder"].shardItem} x{slumRewardsMap["elder"].shardCount} + {slumRewardsMap["elder"].foodItem} x{slumRewardsMap["elder"].foodCount} + ${slumRewardsMap["elder"].coinReward} G
                  </div>
                  <button
                    disabled={residentTaskDone["elder"]}
                    onClick={() => completeResidentQuest("elder", "none", 0)}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      residentTaskDone["elder"]
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-500 text-white"
                    }`}
                  >
                    {residentTaskDone["elder"] ? "✅ 今日委託已完成" : "🍵 傾聽講古 (領取隨機獎勵)"}
                  </button>
                </div>
              </div>
            </div>

            {/* 1.5 貧民區建設資助與委託動態刷新機制 (Slum Support & Dynamic Refresh) */}
            <div className="bg-slate-900 p-4 rounded-xl border border-rose-900/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <span>💖 貧民區建設資助與委託動態刷新中心</span>
                </h3>
                <span className="text-[10px] text-amber-400 font-bold bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                  可循環任務刷新
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                向貧民區捐獻金幣或生活物資，可即刻改善社區生活並獲得聲望與額外碎片！資助行為將<strong className="text-amber-300">「直接動態刷新全區域所有居民的委託任務」</strong>，讓你可隨時再次挑戰循環任務！
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => donateToSlums("coins_small")}
                  className="bg-slate-950 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 p-3 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-300">💰 捐獻 $10 G 救濟金</span>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">+$100 信用經驗</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">資助貧民區日常採購，【即刻動態重置與刷新】所有居民委託！</span>
                </button>

                <button
                  onClick={() => donateToSlums("coins_large")}
                  className="bg-slate-950 hover:bg-slate-800 border border-amber-500/60 hover:border-amber-400 p-3 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-300">💎 資助 $20 G 社區建設</span>
                    <span className="text-[10px] text-amber-400 font-bold font-mono">+碎片各1 / +$200 經驗</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">大額建設基金，獲得【鑰匙碎片x1 + 水晶碎片x1】並【動態刷新全區域委託】！</span>
                </button>

                <button
                  onClick={() => donateToSlums("potion")}
                  className="bg-slate-950 hover:bg-slate-800 border border-blue-500/40 hover:border-blue-400 p-3 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-300">🧪 捐獻 1 瓶【治療藥水】</span>
                    <span className="text-[10px] text-amber-400 font-bold font-mono">+鑰匙碎片x1</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">支援社區醫療防衛，獲得【鑰匙碎片 x1】並【即刻刷新全區域委託】！</span>
                </button>

                <button
                  onClick={() => donateToSlums("campfire")}
                  className="bg-slate-950 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-400 p-3 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-300">🔥 捐獻 1 個【露營營火】</span>
                    <span className="text-[10px] text-purple-400 font-bold font-mono">+水晶碎片x1</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">給貧民區破棚屋提供禦寒取暖，獲得【水晶碎片 x1】並【即刻刷新全區域委託】！</span>
                </button>
              </div>
            </div>

            {/* 2. 神秘斗篷人與道具合成 */}
            <div className="bg-gradient-to-b from-purple-950/40 to-slate-950 p-4 rounded-xl border border-purple-900/50 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl bg-purple-950 p-2.5 rounded-2xl border border-purple-800">🧙‍♂️</span>
                <div>
                  <h3 className="font-bold text-sm text-purple-300">神秘的斗篷人</h3>
                  <p className="text-[11px] text-slate-400 italic">
                    「漆黑的黑洞正於深處呼喚...收集齊碎片，吾將為爾等開啟混沌的大門...」
                  </p>
                </div>
              </div>

              {/* 碎片與鑰匙持有狀態 */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-purple-900/30">
                <p>🗝️ 鑰匙的碎片: <span className="font-bold text-amber-400">{keyFragCount} / 6</span></p>
                <p>🔮 水晶的碎片: <span className="font-bold text-purple-400">{crystalFragCount} / 8</span></p>
                <p>🔑 異樣光芒鑰匙: {hasKey ? <span className="text-emerald-400 font-bold">已擁有 1 把</span> : <span className="text-slate-500">未持有</span>}</p>
                <p>💎 富含魔力水晶: {hasCrystal ? <span className="text-emerald-400 font-bold">已擁有 1 個</span> : <span className="text-slate-500">未持有</span>}</p>
              </div>

              {/* 合成按鈕區 */}
              <div className="space-y-2 pt-1">
                {/* 鑰匙合成 */}
                <button
                  disabled={keyFragCount < 6}
                  onClick={() => {
                    removeItemsFromInventory("鑰匙的碎片", 6);
                    setS(prev => ({ ...prev, inventory: [...prev.inventory, "散發異樣光芒的鑰匙"] }));
                    addLog("🔮 【神秘合成】神秘的斗篷人接過 6 個鑰匙碎片，在一陣幽暗微光的詠唱中，合成了『散發異樣光芒的鑰匙』！");
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between px-4 border ${
                    keyFragCount >= 6
                      ? "bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                  }`}
                >
                  <span>🗝️ 合成「散發異樣光芒的鑰匙」 (需要 6 個鑰匙碎片)</span>
                  <span className="font-mono text-[11px]">{keyFragCount >= 6 ? "可合成 ✅" : `${keyFragCount}/6`}</span>
                </button>

                {/* 水晶合成 */}
                <button
                  disabled={crystalFragCount < 8}
                  onClick={() => {
                    removeItemsFromInventory("水晶的碎片", 8);
                    setS(prev => ({ ...prev, inventory: [...prev.inventory, "富含魔力的水晶"] }));
                    addLog("🔮 【神秘合成】神秘的斗篷人接過 8 個水晶碎片，將其灌注高純度魔力，合成了『富含魔力的水晶』！");
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between px-4 border ${
                    crystalFragCount >= 8
                      ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-400"
                      : "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                  }`}
                >
                  <span>🔮 合成「富含魔力的水晶」 (需要 8 個水晶碎片)</span>
                  <span className="font-mono text-[11px]">{crystalFragCount >= 8 ? "可合成 ✅" : `${crystalFragCount}/8`}</span>
                </button>

                {/* 解鎖混沌地下世界 */}
                <button
                  disabled={!hasKey || !hasCrystal}
                  onClick={() => {
                    removeItemsFromInventory("散發異樣光芒的鑰匙", 1);
                    removeItemsFromInventory("富含魔力的水晶", 1);
                    addLog("🌀 【混沌儀式】神秘的斗篷人接過『散發異樣光芒的鑰匙』與『富含魔力的水晶』，撕裂空間開啟了通往【混沌地下世界】的黑洞裂隙！");
                    setView("chaos_underworld");
                  }}
                  className={`w-full py-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg flex items-center justify-between px-4 border mt-2 ${
                    hasKey && hasCrystal
                      ? "bg-gradient-to-r from-purple-800 via-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-600 text-white border-purple-400 animate-pulse"
                      : "bg-slate-950 text-slate-500 border-slate-850 cursor-not-allowed"
                  }`}
                >
                  <div className="text-left">
                    <span className="block font-black text-sm">🌀 開啟並進入【混沌地下世界】</span>
                    <span className="block text-[10px] opacity-80 font-normal">需同時消耗「散發異樣光芒的鑰匙」與「富含魔力的水晶」</span>
                  </div>
                  <span className="text-lg">🌌</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setView("menu")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-700"
            >
              ↩️ 離開平民區，返回村莊廣場
            </button>
          </div>
        );
      }

      case "chaos_underworld": {
        const startChaosDemonBattle = () => {
          const CHAOS_DEMONS: Monster[] = [
            {
              name: "【混沌惡魔】焦熱獄犬",
              desc: "來自混沌深淵的雙頭獄火魔犬，噴吐著燒灼靈魂的焦熱之火。",
              hp: 250,
              maxHp: 250,
              atk: 32,
              reward: 120
            },
            {
              name: "【混沌惡魔】深淵噬魂魔",
              desc: "遊走於虛空裂隙的邪靈，啃噬冒險者的靈魂與戰鬥意志。",
              hp: 350,
              maxHp: 350,
              atk: 42,
              reward: 180
            },
            {
              name: "【混沌惡魔】混沌魔將伯爵",
              desc: "手持巨型魔王之刃的混沌將領，身披幽冥重甲，實力極度恐怖！",
              hp: 480,
              maxHp: 480,
              atk: 55,
              reward: 280
            },
            {
              name: "【混沌惡魔】貪婪魔王分身",
              desc: "太古魔王留存於地下世界的貪婪意識體，掌握毀滅性的黑暗魔法。",
              hp: 650,
              maxHp: 650,
              atk: 68,
              reward: 450
            }
          ];

          const pickedDemon = CHAOS_DEMONS[Math.floor(Math.random() * CHAOS_DEMONS.length)];
          addLog(`🌀 【混沌襲來】你踏入混沌地下世界的黑霧中，遭遇了強大惡魔：${pickedDemon.name}！`);
          startBattle(undefined, pickedDemon);
        };

        return (
          <div className="space-y-4 animate-fade-in bg-slate-950 p-4 rounded-2xl border-2 border-purple-900/80 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
              <h2 className="text-base font-black text-purple-300 flex items-center gap-2">
                🌀 混沌地下世界 (Chaos Underworld)
              </h2>
              <span className="text-xs bg-purple-950 text-purple-300 px-2.5 py-1 rounded-full border border-purple-800 font-bold">
                高階惡魔副本
              </span>
            </div>

            <div className="bg-purple-950/30 p-4 rounded-xl border border-purple-900/50 space-y-2 text-xs text-purple-200">
              <p className="font-bold text-amber-300">⚠️ 混沌黑洞規則說明：</p>
              <p>
                此處為被太古惡魔割據的黑暗異空間。玩家可在地下世界中自由選擇討伐惡魔或主動離開。
              </p>
              <p className="text-rose-400 font-semibold mt-1">
                📌 離開後若欲再次進入，必須重新向平民區斗篷人消耗一組完整的「散發異樣光芒的鑰匙」與「富含魔力的水晶」！
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={startChaosDemonBattle}
                className="bg-gradient-to-tr from-purple-900 via-indigo-900 to-rose-900 hover:from-purple-800 hover:to-rose-800 text-white p-4 rounded-xl font-bold cursor-pointer transition-all border border-purple-500/50 shadow-xl flex flex-col justify-between h-24 text-left"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-purple-200">⚔️ 討伐混沌惡魔</span>
                  <span className="text-xl">👿</span>
                </div>
                <span className="text-[10px] text-purple-300 font-normal">
                  挑戰強大惡魔，獲得豐厚金塊、經驗值與高機率碎片戰利品！
                </span>
              </button>

              <button
                onClick={() => {
                  setConfirmModal({
                    title: "🚪 確定主動離開混沌地下世界？",
                    message: "離開後，若需再次進入，必須重新向斗篷人提供並消耗『散發異樣光芒的鑰匙』與『富含魔力的水晶』。確定離開嗎？",
                    confirmText: "確認離開",
                    confirmStyle: "amber",
                    onConfirm: () => {
                      addLog("🌌 你主動選擇離開了混沌地下世界，安全返回平民區。");
                      setView("commoners_district");
                    }
                  });
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 p-4 rounded-xl font-bold cursor-pointer transition-all flex flex-col justify-between h-24 text-left"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-amber-300">🚪 離開混沌地下世界</span>
                  <span className="text-xl">🏃</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  回到平民區（再次進入需重新消耗鑰匙與水晶）
                </span>
              </button>
            </div>
          </div>
        );
      }

      case "questBoard":
        const sideNeed = S.sideQuest ? S.sideQuest.need : 0;
        const sideProg = S.sideQuestProgress || 0;
        const isSideComplete = S.sideQuest && sideProg >= sideNeed;

        const hasPendingWantedQuest = (S.wantedQuests || []).some(q => q.isAccepted && !q.isSubmitted);
        const availableWanted = (S.wantedQuests || []).filter(q => !q.isAccepted && !q.isSubmitted);
        const acceptedWanted = (S.wantedQuests || []).filter(q => q.isAccepted && !q.isSubmitted);

        return (
          <div className="space-y-4 font-mono animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                📜 帝國通緝公告欄 (Imperial Bounty Notice Board)
              </h2>
              <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                📅 每 3 天自動刷新 (當前第 {S.day || 1} 天 | 刷新於第 {S.wantedLastRefreshDay || 1} 天)
              </span>
            </div>

            {/* 守衛台詞對話框 */}
            <div className="bg-slate-950 p-4 border border-rose-900/40 rounded-xl space-y-2 shadow-lg relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-rose-800/50 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  💂‍♂️
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-400 text-xs">皇家帝國執法守衛 (Guard)</span>
                    <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/50 px-1.5 py-0.2 rounded">冷酷駐守中</span>
                  </div>
                  {hasPendingWantedQuest ? (
                    <p className="text-xs text-amber-200/90 leading-relaxed font-sans italic">
                      守衛冷不防，看著你「雙手交叉在胸前，單腳踱步，衡量著你什麼時候才會把任務完成」
                    </p>
                  ) : (
                    <p className="text-xs text-rose-200/90 leading-relaxed font-sans italic">
                      守衛盯著你，上下打量著你，有種不說出口的「鄙視與懷疑...彷彿在看一個隨時會跑路的頭號嫌疑犯。手放在腰間的兵器做好隨時抓捕的準備」
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 切換子頁籤：可接取通緝 / 已接取通緝 / 主線與支線 */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setQuestBoardSubTab("available")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  questBoardSubTab === "available"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                📜 最新通緝懸賞名單 ({availableWanted.length})
              </button>
              <button
                onClick={() => setQuestBoardSubTab("accepted")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  questBoardSubTab === "accepted"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                📋 已接取通緝委託 ({acceptedWanted.length})
                {acceptedWanted.some(q => q.isCompleted) && (
                  <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded-full font-black text-[10px] animate-pulse">
                    可交付
                  </span>
                )}
              </button>
            </div>

            {/* 子頁籤 1: 最新通緝懸賞名單 */}
            {questBoardSubTab === "available" && (
              <div className="space-y-3">
                {availableWanted.length === 0 ? (
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">目前通緝公告欄上的懸賞目標已被全部接取或平定！</p>
                    <p className="text-[11px] text-slate-500">（請等待每 3 天自動刷新，或於「已接取通緝委託」頁面進行討伐交付）</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableWanted.map(q => {
                      const canAffordDeposit = S.gold >= 3;
                      return (
                        <div key={q.id} className="bg-slate-950 p-4 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 flex flex-col justify-between text-xs transition-all">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-amber-400 text-sm block">{q.targetTitle}</span>
                              <span className="text-[10px] bg-rose-950/60 text-rose-400 border border-rose-900/40 px-2 py-0.5 rounded font-mono">
                                保證金 $3 G
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{q.desc}</p>
                            
                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-900 space-y-1 text-[11px]">
                              <div className="text-slate-300">
                                🗺️ <span className="text-slate-500">所在地形地點：</span>
                                <span className="text-amber-300 font-bold ml-1">{q.terrainName}</span>
                              </div>
                              <div className="text-slate-300">
                                💰 <span className="text-slate-500">懸賞酬勞金額：</span>
                                <span className="text-emerald-400 font-bold ml-1">${q.rewardCoins} G （完成歸還 $3 保證金）</span>
                              </div>
                              <div className="text-slate-300">
                                🎁 <span className="text-slate-500">可能掉落戰利品：</span>
                                <span className="text-slate-300 font-bold ml-1">{q.potentialDrops.join("、")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            {canAffordDeposit ? (
                              <button
                                onClick={() => acceptWantedQuest(q.id)}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-2 px-3 rounded-xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                              >
                                🗡️ 支付 $3 保證金並接取通緝
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-slate-900 text-slate-600 font-bold py-2 px-3 rounded-xl text-xs border border-slate-950 cursor-not-allowed text-center"
                              >
                                🔒 金幣不足 $3 G (無法預付保證金)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 子頁籤 2: 已接取通緝委託 */}
            {questBoardSubTab === "accepted" && (
              <div className="space-y-3">
                {acceptedWanted.length === 0 ? (
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">你目前尚未接取任何通緝懸賞任務。</p>
                    <button
                      onClick={() => setQuestBoardSubTab("available")}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
                    >
                      📜 查看最新通緝名單
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {acceptedWanted.map(q => (
                      <div key={q.id} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between text-xs">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-amber-300 text-sm block">{q.targetTitle}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              q.isCompleted
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                                : "bg-slate-900 text-slate-400 border-slate-800"
                            }`}>
                              {q.isCompleted ? "🟢 目標已擊破" : "🟡 討伐進行中"}
                            </span>
                          </div>

                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-900 space-y-1 text-[11px]">
                            <div className="text-slate-300">
                              📍 <span className="text-slate-500">出現地點/地形：</span>
                              <span className="text-amber-400 font-bold ml-1">{q.terrainName}</span>
                            </div>
                            <div className="text-slate-300">
                              💰 <span className="text-slate-500">懸賞金與退款：</span>
                              <span className="text-emerald-400 font-bold ml-1">${q.rewardCoins} G （交付退還 $3 保證金）</span>
                            </div>
                            <div className="text-slate-300">
                              🎁 <span className="text-slate-500">可能掉落物：</span>
                              <span className="text-slate-300 font-bold ml-1">{q.potentialDrops.join("、")}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>討伐進度：</span>
                              <span>{q.currentKills} / {q.needKills}</span>
                            </div>
                            {renderTextBar(Math.min(100, Math.floor((q.currentKills / q.needKills) * 100)), "text-rose-500", 12)}
                          </div>
                        </div>

                        <div className="pt-2">
                          {q.isCompleted ? (
                            <button
                              onClick={() => completeWantedQuest(q.id)}
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-md text-center flex items-center justify-center gap-1.5"
                            >
                              🏆 交付通緝任務（領取 ${q.rewardCoins} G + 退還 $3 保證金）
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-slate-900 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs border border-slate-950 cursor-not-allowed text-center"
                            >
                              🔒 交付通緝任務（目標尚未擊破: {q.currentKills}/{q.needKills}）
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 主線任務與支線外包任務 交付看板 */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 border-b border-slate-900 pb-1.5 uppercase tracking-wider">
                ⭐ 冒險者傳統委託 (Main & Side Quests Ledger)
              </h3>

              {/* 主線任務 */}
              <div className="space-y-2">
                <p className="font-bold text-amber-400 text-[13px] flex items-center justify-between border-b border-slate-900 pb-1">
                  <span>⭐ 主線資產重組委託 (Main Ledger)</span>
                  {S.mainQuest && (
                    <span className="text-[10px] text-amber-500/80 font-normal">
                      進行中 ({(S.mainQuestProgress / MAIN_QUESTS[S.mainQuest].need * 100).toFixed(0)}%)
                    </span>
                  )}
                </p>
                {S.mainQuest ? (
                  <div className="space-y-2 text-slate-300 text-xs">
                    <p className="font-bold text-slate-200">
                      {MAIN_QUESTS[S.mainQuest].name}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {MAIN_QUESTS[S.mainQuest].desc}
                    </p>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>開拓進度：</span>
                        <span>{S.mainQuestProgress || 0} / {MAIN_QUESTS[S.mainQuest].need}</span>
                      </div>
                      {renderTextBar(Math.min(100, Math.floor(((S.mainQuestProgress || 0) / MAIN_QUESTS[S.mainQuest].need) * 100)), "text-amber-500", 12)}
                    </div>

                    <div className="pt-2">
                      {(S.mainQuestProgress || 0) >= MAIN_QUESTS[S.mainQuest].need ? (
                        <button
                          onClick={() => completeMainQuest(S.mainQuest!)}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-amber-500/10 border border-amber-400 text-center flex items-center justify-center gap-1.5"
                        >
                          🏆 交付主線任務（領取獎勵）
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-900 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs border border-slate-950 cursor-not-allowed text-center flex items-center justify-center gap-1.5"
                        >
                          🔒 交付主線任務（未達成條件: {S.mainQuestProgress || 0} / {MAIN_QUESTS[S.mainQuest].need}）
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-slate-500 italic text-xs">無，所有債務主線已完結！世界因你的精確審計而得救。</p>
                )}
              </div>

              {/* 支線任務 */}
              <div className="border-t border-slate-900 pt-4 space-y-2">
                <p className="font-bold text-emerald-400 text-[13px] flex items-center justify-between border-b border-slate-900 pb-1">
                  <span>🍃 帝國銀行流動性委託 (Side Quests)</span>
                  {S.sideQuest && (
                    <span className={`text-[10px] font-bold ${isSideComplete ? "text-emerald-400 animate-pulse" : "text-slate-500"}`}>
                      {isSideComplete ? "🟢 任務目標已達成" : `進行中 (${(sideProg / sideNeed * 100).toFixed(0)}%)`}
                    </span>
                  )}
                </p>
                
                {S.sideQuest ? (
                  <div className="space-y-2 text-slate-300 text-xs">
                    <p className="font-bold text-slate-200">
                      {S.sideQuest.label}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>達成進度：</span>
                        <span>{sideProg} / {sideNeed}</span>
                      </div>
                      {renderTextBar(Math.min(100, Math.floor(sideProg / sideNeed * 100)), "text-emerald-500", 12)}
                    </div>

                    <div className="flex justify-between items-center text-[11px] bg-slate-900/40 p-2 border border-slate-900 rounded-lg">
                      <span className="text-slate-400">合約報酬金：</span>
                      <span className="text-emerald-400 font-bold">
                        +{S.sideQuest.reward.coins}金幣 / +{S.sideQuest.reward.gold || 0}金塊
                      </span>
                    </div>

                    <div className="pt-2">
                      {isSideComplete ? (
                        <button
                          onClick={completeSideQuest}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-emerald-500/10 border border-emerald-400 text-center flex items-center justify-center gap-1.5"
                        >
                          🏆 交付支線委託（收報酬）
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-900 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs border border-slate-950 cursor-not-allowed text-center flex items-center justify-center gap-1.5"
                        >
                          🔒 交付支線委託（未達成條件: {sideProg} / {sideNeed}）
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-center py-4 bg-slate-900/20 border border-slate-900 border-dashed rounded-xl space-y-2">
                    <p className="text-[11px] text-slate-500">當前沒有活躍中的外包委託。</p>
                    <button 
                      onClick={acceptSideQuest} 
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer transition-all shadow-md border border-emerald-500/20"
                    >
                      🤝 洽簽全新金幣外包合約
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Consistent Navigation Control Center */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={() => setView("menu")} 
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl cursor-pointer font-mono border border-slate-700 font-bold"
              >
                ⬅️ 返回（上一頁）
              </button>
              <button 
                onClick={backToMainMenu} 
                className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs py-2.5 rounded-xl cursor-pointer font-mono border border-rose-800/50 font-bold"
              >
                🏠 回到主選單
              </button>
            </div>
          </div>
        );

      case "saveLoad":
        const localSavesRaw: (SaveData | null)[] = getLocalSaves();
        const localSaves = Array.from({ length: 6 }, (_, idx) => localSavesRaw[idx] || null);
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>💾 檔案管理器與專案導出</span>
              <span className="text-[10px] font-mono font-normal text-slate-500">v{saveVersion}</span>
            </h2>

            {saveSuccessMsg && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-bold flex justify-between items-center shadow-lg">
                <span>{saveSuccessMsg}</span>
                <button onClick={() => setSaveSuccessMsg(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer px-2">✕</button>
              </div>
            )}
            
            {/* 存檔槽列表 */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>📌 本地存檔進度 (共 6 個存檔欄位)</span>
                <span className="text-[10px] text-slate-500 italic">系統存檔為自動儲存，不可手動覆蓋</span>
              </h3>
              
              {localSaves.map((save, i) => {
                const isSystemSave = i === 0;
                const slotName = isSystemSave ? "系統存檔" : `存檔 ${i}`;
                
                return (
                  <div key={i} className={`p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                    isSystemSave 
                      ? "bg-slate-950/80 border-amber-500/30 shadow-[inset_0_1px_3px_rgba(245,158,11,0.05)]" 
                      : "bg-slate-950 border-slate-800"
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isSystemSave 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-slate-850 text-slate-300 border border-slate-750"
                        }`}>
                          {slotName}
                        </span>
                        {save ? (
                          <span className="text-[10px] text-slate-400 font-mono">({save.date} {save.time})</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">(尚未建立)</span>
                        )}
                      </div>
                      {save ? (
                        <p className="text-[11px] text-slate-300 mt-2 font-mono">
                          💰 金幣: {money(save.gold)} | 負債: -LV {money(save.debt)} | 難度: {save.difficulty}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-2 italic">
                          {isSystemSave ? "尚未觸發系統自動存檔 (完成戰鬥或遭遇事件時將自動儲存)" : (S.prologueDone ? "無存檔數據，點擊「+ 建立存檔」開始記錄此欄位" : "無存檔數據")}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {save ? (
                        <>
                          <button 
                            onClick={() => loadSave(save)} 
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs"
                          >
                            讀取
                          </button>
                          {!isSystemSave && S.prologueDone && (
                            <button 
                              onClick={() => {
                                setConfirmModal({
                                  title: `⚠️ 確定要覆蓋【${slotName}】？`,
                                  message: `將會以您目前的遊戲進度覆蓋【${slotName}】，舊的存檔進度將無法恢復。`,
                                  confirmText: "確認覆蓋",
                                  confirmStyle: "amber",
                                  onConfirm: () => performSave(i, false)
                                });
                              }} 
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs"
                            >
                              覆蓋存檔
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                title: `🗑️ 確定要刪除【${slotName}】？`,
                                message: `確定要刪除【${slotName}】嗎？刪除後數據將無法復原。`,
                                confirmText: "確認刪除",
                                confirmStyle: "rose",
                                onConfirm: () => deleteSaveSlot(i)
                              });
                            }} 
                            className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs"
                          >
                            刪除
                          </button>
                        </>
                      ) : (
                        <>
                          {!isSystemSave ? (
                            S.prologueDone ? (
                              <button 
                                onClick={() => performSave(i, false)} 
                                className="bg-slate-900 hover:bg-slate-800 hover:border-amber-500 border border-dashed border-slate-800 text-slate-300 font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-all text-xs"
                              >
                                + 建立存檔
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">無存檔進度</span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">自動寫入</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 專案與存檔數據導出 */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3 text-xs font-mono">
              <h3 className="text-xs font-bold text-amber-500 border-b border-slate-900 pb-1.5 uppercase">
                📦 專案資料與存檔資料導出指南 (Export Center)
              </h3>
              
              <div className="space-y-2 text-[11px] leading-relaxed text-slate-300">
                <div className="space-y-1">
                  <strong className="text-slate-100">1. 完整專案源碼導出 (Export Source Code):</strong><br />
                  本遊戲為完整的 React + TypeScript 單頁 Web 應用專案。您可以點擊本視窗最右上角的 <strong className="text-amber-400">「Settings (齒輪)」</strong> 選單，然後選擇：
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1.5">
                  <div className="text-emerald-400 font-bold">• Download as ZIP</div>
                  <p className="text-slate-400 leading-normal">這將打包並下載本遊戲的所有 HTML/TSX 原始碼，您可以在本機解壓並執行 <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-300 font-mono">npm install && npm run dev</code> 運行遊戲。</p>
                  <div className="text-sky-400 font-bold">• Export to GitHub</div>
                  <p className="text-slate-400 leading-normal">您可以直接將本專案一鍵匯出、部署並建立您專屬的 GitHub 程式庫儲存庫。</p>
                </div>

                <div className="pt-1">
                  <strong className="text-slate-100">2. 跨裝置存檔備份 (Local Save JSON Backup):</strong><br />
                  下方為您當前瀏覽器中的所有存檔數據的加密序列化代碼。您可以複製它以備份或轉移存檔，或者在下方輸入框貼上以恢復您的冒險：
                </div>

                <div className="space-y-1.5 mt-2">
                  <textarea
                    readOnly
                    value={localStorage.getItem("debtHeroSaves") || "[]"}
                    onClick={(e) => {
                      (e.target as HTMLTextAreaElement).select();
                      alert("存檔數據已選中，請按 Ctrl+C / Cmd+C 進行複製備份。");
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-[10px] text-slate-400 font-mono focus:outline-none h-16 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 italic text-center">點擊上方文字框即可全選存檔代碼並複製。</p>
                </div>

                {/* 存檔代碼導入 */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <strong className="text-slate-100 font-bold block">3. 導入外部存檔 (Import Save):</strong>
                  <div className="flex gap-2">
                    <input
                      id="save-import-input"
                      type="text"
                      placeholder="貼上您複製的存檔代碼 (JSON)..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById("save-import-input") as HTMLInputElement;
                        if (!input || !input.value.trim()) {
                          alert("請先貼上存檔數據！");
                          return;
                        }
                        try {
                          const parsed = JSON.parse(input.value.trim());
                          if (Array.isArray(parsed)) {
                            localStorage.setItem("debtHeroSaves", JSON.stringify(parsed));
                            alert("🎉 存檔導入成功！將重新載入頁面以更新數據。");
                            window.location.reload();
                          } else {
                            alert("導入格式錯誤：存檔應為陣列格式！");
                          }
                        } catch (err) {
                          alert("導入失敗：存檔數據無效或損毀！");
                        }
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-xs cursor-pointer"
                    >
                      匯入
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setView(S.prologueDone ? "menu" : "main_title_menu")} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 rounded-xl mt-4 cursor-pointer font-mono border border-slate-700">
              [ RETURN TO GENERAL OFFICE : 返回大廳 ]
            </button>
          </div>
        );

      case "battle_main":
        if (!S.enemy) return null;
        
        const isEnemyActive = S.isEnemyTurn || S.activeTurnOwner === "enemy";
        const isPlayerActive = S.isPlayerTurn || S.activeTurnOwner === "player";

        return (
          <div className="space-y-4">
            {/* 敵方 (對面) */}
            <div className={`bg-slate-950 p-4 border-2 rounded-2xl space-y-2 transition-all duration-300 ${
              damagedTarget === "enemy"
                ? "border-red-500 bg-red-950/40 animate-pulse scale-[0.98] shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                : isEnemyActive 
                  ? "border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.35)] scale-[1.01]" 
                  : "border-slate-800"
            }`}>
              {renderProgressBarHTML(Math.min(100, S.enemyGauge), isEnemyActive)}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1">😈 敵方對陣：{S.enemy.name}</span>
                <span className="text-xs font-mono text-slate-300 font-bold">HP: {S.enemy.hp} / {S.enemy.maxHp}</span>
              </div>
              <p className="text-[10px] text-slate-400">說明: {S.enemy.desc}</p>
              <p className="text-[10px] text-slate-400">戰場天氣: {S.weather.name} ({S.weather.desc})</p>
              <div className="flex justify-center mt-1">
                {renderTextBar((S.enemy.hp / S.enemy.maxHp) * 100, "text-rose-500", 10)}
              </div>
            </div>

            {/* 虛線分割線 */}
            <div className="border-t border-dashed border-slate-800/80 my-1"></div>

            {/* 當下戰鬥訊息 */}
            <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center min-h-[90px] text-center relative overflow-hidden backdrop-blur-sm">
              <span className="text-[9px] font-black text-amber-500/90 uppercase tracking-widest mb-2 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800">
                ⚔️ 當下戰鬥訊息 ⚔️
              </span>
              <div className="space-y-1 w-full max-w-md">
                {logLines.length > 0 ? (
                  logLines.slice(0, 2).map((log, i) => {
                    const isLatest = i === 0;
                    const isWarning = log.includes("⚠️") || log.includes("💀") || log.includes("☠️") || log.includes("Church") || log.includes("牧師");
                    const isGold = log.includes("🧱") || log.includes("💰") || log.includes("🎁");
                    return (
                      <div 
                        key={i} 
                        className={`text-xs transition-all duration-300 font-mono leading-relaxed ${
                          isLatest 
                            ? `text-sm font-black scale-[1.01] ${isWarning ? 'text-rose-400' : isGold ? 'text-amber-400' : 'text-emerald-400'}` 
                            : 'text-slate-500 text-[11px] opacity-50'
                        }`}
                      >
                        {isLatest ? "▶ " : "  "} {log}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500 italic">戰役蓄勢待發...</span>
                )}
              </div>
            </div>

            {/* 虛線分割線 */}
            <div className="border-t border-dashed border-slate-800/80 my-1"></div>

            {/* 我方 (下方) */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                {/* 主控角色 */}
                <div className={`bg-slate-950 p-3 rounded-xl border-2 transition-all duration-300 ${
                  damagedTarget === "player"
                    ? "border-red-500 bg-red-950/40 animate-pulse scale-[0.98] shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                    : isPlayerActive 
                      ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.02]" 
                      : "border-slate-800"
                }`}>
                  {renderProgressBarHTML(Math.min(100, S.playerGauge), isPlayerActive)}
                  <span className="text-[10px] text-amber-500 font-black block mt-1">👑 主控角色: {activeDebtor().name}</span>
                  <span className="text-xs font-mono font-bold text-slate-100 block mt-1">HP: {S.hp} / {getTotalMaxHp()}</span>
                  <div className="flex justify-center mt-2">
                    {renderTextBar((S.hp / getTotalMaxHp()) * 100, "text-emerald-400", 10)}
                  </div>
                </div>

                {/* 隊友們 */}
                {(() => {
                  const activeTms = S.teammates.map(id => getTeammateData(id)).filter(Boolean) as Teammate[];
                  const slots = [0, 1];
                  return slots.map(index => {
                    const t = activeTms[index];
                    if (t) {
                      const tMaxHp = getTeammateMaxHp(t.id);
                      const isTmActive = S.isAllyTurn && S.activeTurnOwner === t.id;
                      const tmGauge = S.allyGauges[t.id] || 0;
                      const isTmDamaged = damagedTarget === t.id;
                      return (
                        <div key={t.id} className={`bg-slate-950/60 p-3 rounded-xl border-2 transition-all duration-300 ${
                          isTmDamaged
                            ? "border-red-500 bg-red-950/40 animate-pulse scale-[0.98] shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                            : isTmActive 
                              ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.02]" 
                              : "border-slate-800"
                        }`}>
                          {renderProgressBarHTML(Math.min(100, tmGauge), isTmActive)}
                          <span className="text-[10px] text-slate-400 font-bold block mt-1">👥 隊友: {t.name}</span>
                          <span className="text-xs font-mono text-slate-300 block mt-1">HP: {tMaxHp} / {tMaxHp}</span>
                          <div className="flex justify-center mt-2">
                            {renderTextBar(100, "text-emerald-500/80", 10)}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={`empty-${index}`} className="bg-slate-950/20 p-3 rounded-xl border border-dashed border-slate-800/80 flex flex-col justify-center items-center min-h-[104px]">
                          <span className="text-[10px] text-slate-600 block">👥 隊友欄位 {index + 1}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">暫無隊友 (可去村莊招募)</span>
                        </div>
                      );
                    }
                  });
                })()}
              </div>
            </div>

            {!S.isPlayerTurn ? (
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center space-y-2 mt-4 animate-pulse">
                {S.isAllyTurn ? (
                  <>
                    <div className="text-emerald-400 font-bold text-sm">👥 勇者小隊隊友行動中...</div>
                    <div className="text-slate-400 text-[10px]">正在計算戰術配合，發動輔助或協同打擊</div>
                  </>
                ) : (
                  <>
                    <div className="text-rose-400 font-bold text-sm">😈 魔物敵方正在伺機行動...</div>
                    <div className="text-slate-400 text-[10px]">請做好防禦準備，抵抗迎面而來的猛烈攻勢</div>
                  </>
                )}
              </div>
            ) : (
              <>
                {battleMenuState === "root" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <button 
                      onClick={() => setBattleMenuState("attack")}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3.5 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-sm mb-0.5">
                        <span>⚔️</span>
                        <span>[攻擊]</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal leading-tight">普通斬擊、重創打擊與快速連擊攻勢</span>
                    </button>

                    <button 
                      onClick={() => setBattleMenuState("skill")}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500 text-slate-100 p-3.5 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-purple-400 font-extrabold text-sm mb-0.5">
                        <span>🔮</span>
                        <span>[技能]</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal leading-tight">職業核心絕招、懺悔撒幣與公會傳承技能</span>
                    </button>

                    <button 
                      onClick={() => setBattleMenuState("item")}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 text-slate-100 p-3.5 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-sm mb-0.5">
                        <span>🎒</span>
                        <span>[道具]</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal leading-tight">使用隨身背包中的治療藥水與冒險素材</span>
                    </button>

                    <button 
                      onClick={() => setBattleMenuState("escape")}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs col-span-1 sm:col-span-3 flex items-center justify-between"
                    >
                      <span className="text-rose-400 font-bold">🏃 [撒手遠程逃跑]</span>
                      <span className="text-[10px] text-slate-400 font-normal">預支手續費，安全撤退回村莊</span>
                    </button>
                  </div>
                )}

                {battleMenuState === "attack" && (
                  <div className="space-y-3 mt-4">
                    <p className="text-[11px] text-amber-400 font-bold">⚔️ 基礎與特殊物理攻勢：</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button 
                        onClick={() => {
                          doPlayerAttack(1.0, "普通斬擊", "你揮起沉重而殘破的武器，");
                          setBattleMenuState("root");
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                      >
                        🗡️ 普通斬擊
                        <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $3 | 造成 1.0 倍基礎物傷</span>
                      </button>

                      <button 
                        onClick={() => {
                          doPlayerAttack(1.5, "重創打擊", "你蓄力發動破空強擊！");
                          setBattleMenuState("root");
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                      >
                        💥 重創打擊
                        <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $8 | 造成 1.5 倍強化物傷 (30% 暈眩)</span>
                      </button>

                      <button 
                        onClick={() => {
                          doPlayerAttack(1.6, "快速連擊", "你急速揮舞武器發動兩連突刺！");
                          setBattleMenuState("root");
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                      >
                        ⚡ 快速連擊
                        <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $10 | 迅捷連擊造成 1.6 倍連段傷害</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => setBattleMenuState("root")}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer mt-2"
                    >
                      🔙 返回上級選單
                    </button>
                  </div>
                )}

                {battleMenuState === "skill" && (
                  <div className="space-y-3 mt-4">
                    <p className="text-[11px] text-purple-400 font-bold flex items-center justify-between">
                      <span>🔮 角色與公會傳承技能 (目前身份: {getPlayerFullClassName(S)})：</span>
                      <span className="text-[10px] text-slate-400 font-normal">可預支負債施展</span>
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                      {/* 1. 戰士 / 勇者類 職業專屬技能 */}
                      {(S.debtorClass === "warrior" || S.debtorClass === "standard" || S.prologueClass === "warrior" || (S.debtorClassName && (S.debtorClassName.includes("戰士") || S.debtorClassName.includes("勇者"))) || (!S.debtorClass && !S.debtorClassName)) && (
                        <>
                          <button 
                            onClick={() => {
                              doPlayerCastSkill("warrior_shield", 6, 1.2, "鐵壁聖盾");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            🛡️ 鐵壁聖盾
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $6 | 下回合格擋 (100% 免疫傷害)</span>
                          </button>

                          <button 
                            onClick={() => {
                              doPlayerCastSkill("warrior_stomp", 10, 1.5, "踐踏重擊");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            💥 踐踏重擊
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $10 | 1.5 倍物傷 & 60% 機率暈眩</span>
                          </button>

                          <button 
                            onClick={() => {
                              doPlayerCastSkill("warrior_armor_break", 14, 1.8, "裂甲重擊");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            ⚔️ 裂甲重擊
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $14 | 1.8 倍高額物理裂甲傷害</span>
                          </button>
                        </>
                      )}

                      {/* 2. 法師 / 行員類 職業專屬技能 */}
                      {(S.debtorClass === "mage" || S.debtorClass === "clerk" || S.prologueClass === "mage" || (S.debtorClassName && (S.debtorClassName.includes("法師") || S.debtorClassName.includes("行員")))) && (
                        <>
                          <button 
                            onClick={() => {
                              doPlayerCastSkill("mage_pyro", 15, 2.5, "奧術炎爆");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            🔥 奧術炎爆
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $15 | 2.5 倍極高奧術傷害，自損 10 HP</span>
                          </button>

                          <button 
                            onClick={() => {
                              doPlayerCastSkill("mage_ice", 12, 1.4, "絕對凍結");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            ❄️ 絕對凍結
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $12 | 凍結魔物 1 回合 (降低其動作)</span>
                          </button>

                          <button 
                            onClick={() => {
                              doPlayerCastSkill("mage_thunder", 8, 1.6, "怒雷震懾");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            ⚡ 怒雷震懾
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $8 | 削弱魔物攻擊力，造成 1.6 倍雷傷</span>
                          </button>
                        </>
                      )}

                      {/* 3. 刺客 / 舞者類 職業專屬技能 */}
                      {(S.debtorClass === "assassin" || S.debtorClass === "dancer" || S.prologueClass === "assassin" || (S.debtorClassName && (S.debtorClassName.includes("刺客") || S.debtorClassName.includes("舞者")))) && (
                        <>
                          <button 
                            onClick={() => {
                              doPlayerCastSkill("assassin_backstab", 15, 1.8, "絕殺背刺");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            🎯 絕殺背刺
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $15 | 70% 機率爆發 2.5 倍超高致命傷害</span>
                          </button>

                          <button 
                            onClick={() => {
                              doPlayerCastSkill("assassin_poison", 10, 1.2, "劇毒毒刃");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            💀 劇毒毒刃
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $10 | 1.2 倍傷害，使其陷入 3 回合劇毒</span>
                          </button>

                          <button 
                            onClick={() => {
                              doPlayerCastSkill("assassin_smoke", 8, 0.8, "煙幕遁影");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            💨 煙幕遁影
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $8 | 下回合獲得 100% 完美閃避</span>
                          </button>
                        </>
                      )}

                      {/* 4. 礦工 / 商人類 職業專屬技能 */}
                      {(S.debtorClass === "miner" || (S.debtorClassName && (S.debtorClassName.includes("礦工") || S.debtorClassName.includes("商人")))) && (
                        <>
                          <button 
                            onClick={() => {
                              doPlayerCastSkill("miner_collapse", 12, 1.8, "礦脈爆破");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            ⛏️ 礦脈爆破
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $12 | 1.8 倍落石物理衝擊 & 40% 機率暈眩</span>
                          </button>

                          <button 
                            onClick={() => {
                              doPlayerCastSkill("miner_forge", 10, 1.0, "熔岩防護");
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-100 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            💎 熔岩防護
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">預支 $10 | 下回合獲得 100% 堅固護盾招架</span>
                          </button>
                        </>
                      )}

                      {/* 特殊 / 教堂神恩技能 (Church Divine Blessing Skills) */}
                      {S.confessionBuff === "toss" && (
                        <button 
                          onClick={() => {
                            doPlayerCastTossSkill();
                            setBattleMenuState("root");
                          }}
                          className="bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/60 hover:border-amber-400 text-amber-200 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs shadow-md shadow-amber-500/10"
                        >
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-amber-300 font-extrabold">
                              <span>💸</span>
                              <span>惡意撒幣</span>
                              <span className="text-[9px] bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 text-amber-400 font-mono">
                                全職通用主動神恩
                              </span>
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono font-bold">
                              全遊戲金幣 (身上+保險櫃)
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-300/80 block font-normal mt-1.5 leading-relaxed">
                            【主動奧義】威力 {S.confessionVal || 2.0}x | 隨機傾瀉身上與保險櫃內的金幣發動極致毀滅硬幣雨！造成高額神聖真實傷害！
                          </span>
                        </button>
                      )}

                      {S.confessionBuff === "leech" && (
                        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-left select-none opacity-70">
                          <div className="flex justify-between items-center text-slate-400 font-bold text-xs">
                            <span className="flex items-center gap-1.5">
                              <span>🩸</span>
                              <span>血債血償</span>
                              <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                                全職通用被動神恩
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">[自動觸發 - 灰字不可點選]</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-normal mt-1.5 leading-relaxed">
                            【被動常駐】(名稱呈現灰色，無法點選) 普通攻擊與所有職業技能均附加 {S.confessionVal || 15}% 吸血效果回復自身 HP。
                          </span>
                        </div>
                      )}

                      {S.confessionBuff === "shield" && (
                        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-left select-none opacity-70">
                          <div className="flex justify-between items-center text-slate-400 font-bold text-xs">
                            <span className="flex items-center gap-1.5">
                              <span>🛡️</span>
                              <span>絕對防禦</span>
                              <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                                全職通用被動神恩
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">[自動觸發 - 灰字不可點選]</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-normal mt-1.5 leading-relaxed">
                            【被動常駐】(名稱呈現灰色，無法點選) 神聖護盾永遠保護著你，承受的所有敵方傷害降低 {S.confessionVal || 85}%。
                          </span>
                        </div>
                      )}

                                      {/* 5. 村莊/公會/教堂所學技能 (Village & Guild & Church Learned Skills) */}
                      {Array.from(new Set(S.learnedSkills || [])).map(skillId => {
                        const sId = String(skillId);
                        const mSk = MASTER_SKILLS.find(m => m.id === sId || m.id === sId.replace("warrior_", "").replace("mage_", "").replace("assassin_", "").replace("priest_", ""));
                        if (!mSk) {
                          // Fallback rendering for unmapped learned skill
                          return (
                            <button
                              key={sId}
                              onClick={() => {
                                doPlayerCastSkill(sId, 10, 1.5, sId);
                                setBattleMenuState("root");
                              }}
                              className="bg-slate-900 border border-indigo-500/50 text-indigo-200 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                            >
                              ✨ {sId} (傳承絕學)
                              <span className="text-[10px] text-indigo-300/80 block font-normal mt-0.5">預支 $10 | 造成高額技能傷害與效果</span>
                            </button>
                          );
                        }

                        const pClass = S.prologueClass || S.debtorClass || "warrior";
                        const isAllowed = isSkillAllowedForPlayer(mSk.category, S);
                        const isAdvMatched = !mSk.requiredAdv || S.advancedClass === mSk.requiredAdv;

                        if (!isAllowed) {
                          return (
                            <div
                              key={sId}
                              className="bg-slate-950/90 border border-rose-900/80 p-3 rounded-xl text-left opacity-85 select-none"
                            >
                              <div className="flex items-center justify-between text-rose-500 font-bold text-xs">
                                <span className="flex items-center gap-1">
                                  <span>🔒</span>
                                  <span>{mSk.name}</span>
                                </span>
                                <span className="text-[9px] bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800 text-rose-400 font-mono">
                                  {getCategoryLabel(mSk.category)}專屬 (鎖定)
                                </span>
                              </div>
                              <span className="text-[10px] text-rose-400/90 block font-semibold mt-1">
                                ❌ [跨職業限制] 你的當前職業為【{getPlayerFullClassName(S)}】，無法使用不同職業之技能！
                              </span>
                            </div>
                          );
                        }

                        if (!isAdvMatched) {
                          const advJobName = getAdvClassName(mSk.requiredAdv!);
                          const reqLv = mSk.reqLevel || 20;
                          return (
                            <div
                              key={sId}
                              className="bg-slate-950/90 border border-rose-900/80 p-3 rounded-xl text-left opacity-85 select-none"
                            >
                              <div className="flex items-center justify-between text-rose-500 font-bold text-xs">
                                <span className="flex items-center gap-1">
                                  <span>🔒</span>
                                  <span>{mSk.name}</span>
                                </span>
                                <span className="text-[9px] bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800 text-rose-400 font-mono">
                                  {advJobName}專屬 (鎖定)
                                </span>
                              </div>
                              <span className="text-[10px] text-rose-500 font-bold block mt-1">
                                🔒 需要轉職【{advJobName}】需求-Lv {reqLv}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={sId}
                            onClick={() => {
                              doPlayerCastSkill(mSk.id, mSk.cost, mSk.multiplier, mSk.name);
                              setBattleMenuState("root");
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/50 hover:border-indigo-400 text-indigo-200 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span>✨ {mSk.name}</span>
                              <span className="text-[9px] text-amber-400 font-mono">預支 ${mSk.cost}</span>
                            </div>
                            <span className="text-[10px] text-indigo-300/80 block font-normal mt-0.5">
                              {mSk.desc}
                            </span>
                          </button>
                        );
                      })}

                      {/* 6. 動態渲染 S.playerSkills 陣列中的自訂/升級職業技能 */}
                      {(S.playerSkills || []).map((sk) => (
                        <button
                          key={sk.id}
                          onClick={() => {
                            doPlayerCastSkill(sk.id, sk.cost || 10, sk.mult || 1.5, sk.name);
                            setBattleMenuState("root");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 border border-purple-500/50 hover:border-purple-400 text-purple-200 p-3 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                        >
                          ⚡ {sk.name} (LV.{sk.level || 1})
                          <span className="text-[10px] text-purple-300/80 block font-normal mt-0.5">
                            預支 ${sk.cost || 10} | {sk.desc}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setBattleMenuState("root")}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer mt-2"
                    >
                      🔙 返回上級選單
                    </button>
                  </div>
                )}

                {battleMenuState === "item" && (
                  <div className="space-y-3 mt-4">
                    <p className="text-[11px] text-emerald-400 font-bold">🎒 戰術包裹與藥水：</p>
                    
                    {S.inventory.includes("治療藥水") && (
                      <button
                        onClick={() => {
                          if (!canHeal()) return;
                          setS(prev => {
                            const idx = prev.inventory.indexOf("治療藥水");
                            const nextInv = [...prev.inventory];
                            if (idx > -1) nextInv.splice(idx, 1);
                            const nextHp = Math.min(getTotalMaxHp(), prev.hp + 50);
                            return {
                              ...prev,
                              hp: nextHp,
                              inventory: nextInv
                            };
                          });
                          addLog("🧴 你大口喝下了「治療藥水」！生命值回復了 50 點！");
                          setBattleMenuState("root");
                        }}
                        className="w-full bg-emerald-950/40 border border-emerald-800 hover:border-emerald-500 text-emerald-400 p-4 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                      >
                        🧴 使用 治療藥水 (背包剩餘: {S.inventory.filter(i => i === "治療藥水").length} 瓶)
                        <span className="text-[10px] text-slate-300 block font-normal mt-0.5">立刻回復你身上的 50 點生命值 (HP)</span>
                      </button>
                    )}

                    {(S.inventory.includes("傳送指南針") || S.inventory.includes("teleport_compass")) && (
                      <button
                        onClick={() => {
                          const idx = S.inventory.findIndex(i => i === "傳送指南針" || i === "teleport_compass");
                          if (idx > -1) {
                            setTeleportCompassModal({ invIndex: idx });
                          }
                        }}
                        className="w-full bg-amber-950/40 border border-amber-800 hover:border-amber-500 text-amber-300 p-4 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                      >
                        🧭 使用 傳送指南針 (剩餘: {S.inventory.filter(i => i === "傳送指南針" || i === "teleport_compass").length} 個)
                        <span className="text-[10px] text-slate-300 block font-normal mt-0.5">發動空間折躍：可選擇回到復活點、回到野外當前區域或回到村莊</span>
                      </button>
                    )}

                    {!S.inventory.includes("治療藥水") && !S.inventory.includes("傳送指南針") && !S.inventory.includes("teleport_compass") && (
                      <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                        🎒 包包裡空空如也，無可用戰鬥道具！(可前往村莊道具店購買)
                      </div>
                    )}

                    <button 
                      onClick={() => setBattleMenuState("root")}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                    >
                      🔙 返回上級選單
                    </button>
                  </div>
                )}

                {battleMenuState === "escape" && (
                  <div className="space-y-3 mt-4">
                    <p className="text-[11px] text-rose-400 font-bold">🏃 逃跑判定：</p>
                    <button 
                      onClick={() => {
                        if (!spend(30, "戰場逃跑", "逃跑")) return;
                        addLog("🏃 你拍拍屁股、抱起腦袋，狼狽地逃回野外當前地圖區域！預支了 $30 負債手續費");
                        setS(prev => ({ ...prev, enemy: null, encounterMonster: null }));
                        setBattleMenuState("root");
                        setView("explore_map");
                      }}
                      className="w-full bg-rose-950/40 border border-rose-900/30 hover:border-rose-500 text-rose-400 p-4 rounded-xl font-bold cursor-pointer transition-all text-left text-xs"
                    >
                      🏃 預支手續費逃跑
                      <span className="text-[10px] opacity-80 block font-normal mt-0.5">預支 $30 | 丟下尊嚴，退出戰鬥回到當前野外地圖區塊</span>
                    </button>

                    <button 
                      onClick={() => setBattleMenuState("root")}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                    >
                      🔙 返回上級選單
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "victory":
        return (
          <div className="text-center py-6 space-y-4">
            <h3 className="text-xl font-black text-emerald-400">🎉 戰役完勝！</h3>
            <p className="text-sm">成功將魔物化為虛無，你感覺到被封印的經脈舒展了一些。</p>
            <p className="text-xs text-slate-400">當前負債: {debtText()}</p>
            <div className="flex gap-4 justify-center mt-6">
              <button 
                onClick={() => {
                  setS(prev => ({ ...prev, enemy: null, encounterMonster: null }));
                  setView("explore_map");
                }} 
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-lg shadow-amber-500/15"
              >
                🗺️ 返回野外 (當前地圖區塊)
              </button>
            </div>
          </div>
        );

      case "death":
        const reviveCost = Math.ceil((200 + S.deathCount * 10) * S.inflation);
        return (
          <div className="text-center py-8 space-y-4">
            <h3 className="text-xl font-black text-rose-500">💀 勇者小隊翻車倒地 💀</h3>
            <p className="text-sm">眼前的世界陷入一片黑暗，躺在荒野冰冷泥濘的草坑中...</p>
            
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2 text-left text-xs font-mono max-w-sm mx-auto">
              <span className="text-rose-400 font-bold">⛪ 暴躁牧師的咆哮傳入耳邊：</span>
              <p className="text-slate-300 italic mt-1 leading-relaxed">
                「都是你這不靠譜的勇者小隊闖的禍！本來有著最強職業技能，結果天天欠一屁股債！還不快給我從泥坑裡爬起來還債打工！」
              </p>
            </div>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto mt-6">
              {S.checkpointCampMet && (
                <button
                  onClick={() => {
                    setS(prev => ({
                      ...prev,
                      hp: Math.ceil((getMaxHpBonus() + (DEBTOR_CLASSES[prev.debtorClass]?.hp || 100)) * 0.25),
                      alive: true,
                      rage: 0,
                      enemy: null,
                      encounterMonster: null
                    }));
                    addLog("⛺ 【營地復活】精靈守護者圍著火堆熬製了草藥，隊友將你背回營火旁。你悠悠醒轉，HP 恢復至 25% (免費復活)！");
                    setView("explore_map");
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
                >
                  🏥 臨時營地・免費靈魂復活 (回復 25% HP)
                </button>
              )}

              <button 
                onClick={() => {
                  setPendingReviveCost(reviveCost);
                  setPriestReviveStep(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-100 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
              >
                ⛪ 雇傭大教堂馬車復活 ({money(reviveCost)} 負債)
              </button>

              <button 
                onClick={() => {
                  setConfirmModal({
                    title: "☠️ 確定要拋棄此生重新再來？",
                    message: "所有進度、裝備與契約將被抹去，確定要開啟新輪迴嗎？",
                    confirmText: "放棄此生",
                    confirmStyle: "rose",
                    onConfirm: () => {
                      setS(INITIAL_STATE);
                      setView("prologue_intro");
                      setLogLines(["你選擇了放棄此生。"]);
                    }
                  });
                }}
                className="w-full bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 py-2 rounded-xl text-xs cursor-pointer border border-rose-900/30"
              >
                徹底放棄此生，重新轉世
              </button>
            </div>
          </div>
        );

      case "forced_return":
        return (
          <div className="text-center py-6 space-y-4">
            <h3 className="text-lg font-black text-rose-500">🏦 皇家信託召回令</h3>
            <p className="text-sm">「由於您的債務額度已達到信用上限極限，我們被迫凍結您的冒險許可。」</p>
            <p className="text-xs text-slate-400">請即刻前往銀行進行資產重組與欠款抵償，或至個人畫面提升額度。</p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button
                onClick={() => {
                  setView("status");
                  setStatusSubTab("ledger");
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-lg transition-all"
              >
                💳 [信貸與負債] (提升額度)
              </button>
              <button onClick={() => setView("bank")} className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-xs border border-amber-500/30 cursor-pointer transition-all">
                前往信託銀行還債
              </button>
              <button onClick={() => setView("status")} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-xs cursor-pointer transition-all">
                清算我的資產
              </button>
            </div>
          </div>
        );

      case "contract":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-amber-400 text-center">🏦 皇家信託：特權契約</h3>
            <p className="text-xs text-slate-300">「恭喜您成功將債務歸零！為了表彰您的努力，我們提供以下三份特權契約，並提供 300 金幣的開拓補助款！」</p>
            <div className="grid grid-cols-1 gap-3 mt-4">
              {Object.entries(CONTRACTS).map(([key, value]) => (
                <button 
                  key={key}
                  onClick={() => {
                    setS(prev => ({
                      ...prev,
                      contract: key,
                      debt: Math.ceil(prev.credit * 0.25),
                      coins: prev.coins + 300
                    }));
                    addLog(value.apply);
                    setView("menu");
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-4 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-sm font-bold text-slate-100 block">{value.name}</span>
                  <span className="text-xs text-slate-400 block mt-1">{value.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "ending":
        return (
          <div className="text-center py-8 space-y-4">
            <h3 className="text-2xl font-black text-amber-500 animate-bounce">🏆 終焉：理財至尊</h3>
            <p className="text-sm">你終於擊碎了魔王的金融帝國，在極限的信貸魔咒下，將所有的負債徹底清零！</p>
            <p className="text-xs text-slate-300">你用理智與自律戰勝了黑暗的壟斷巨獸，解鎖了真正的自由。</p>
            <p className="text-xs text-slate-500">感謝遊玩《金錢戰士：負債勇者》React 模組化重塑版！</p>
            <button 
              onClick={() => {
                setS(INITIAL_STATE);
                setView("prologue_intro");
              }}
              className="bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              開啟新輪迴
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Status HUD Layout
  const maxHp = getTotalMaxHp();
  const debtPct = S.credit > 0 ? Math.round((S.debt / S.credit) * 100) : 0;
  const hpPct = Math.round((S.hp / maxHp) * 100);
  const isWilderness = view === "explore_map" || view === "battle_encounter" || view === "battle_main" || view === "wild_camp" || view === "camp_site" || view === "battle" || view === "prologue_battle";

  return (
    <div id="game-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. HUD & Game Interface (Left/Center) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Status HUD Panel */}
        <div id="hud-panel" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* HP Stat */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="bg-rose-500/10 p-2 rounded-xl text-rose-500">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">生命體魄 (HP)</span>
              <span className="text-sm font-black font-mono text-slate-100">{S.hp} / {maxHp}</span>
              <div className="mt-1 scale-[0.8] origin-left">
                {renderTextBar(hpPct, "text-rose-500", 6)}
              </div>
            </div>
          </div>

          {!S.prologueDone && (
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center gap-3 col-span-1 sm:col-span-3">
              <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 block font-bold">傳奇勇者等級</span>
                <span className="text-sm font-black font-mono text-amber-300">LV.MAX (極限傳說)</span>
              </div>
            </div>
          )}

          {S.prologueDone && (
            <>
              {/* Gold Nuggets */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">金塊 (🧱)</span>
                  <span className="text-sm font-black font-mono text-amber-400">{S.gold} 塊</span>
                </div>
              </div>

              {/* Gold Coins */}
              <div className={`transition-all duration-300 p-3 rounded-2xl flex items-center gap-3 border ${
                isWilderness 
                  ? "bg-slate-950/40 border-slate-900 opacity-40 text-slate-500 saturate-50 select-none cursor-not-allowed" 
                  : "bg-slate-900 border-slate-800 text-slate-100"
              }`}>
                {isWilderness ? (
                  <div className="bg-slate-900 p-2 rounded-xl text-slate-600">
                    <Lock className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 p-2 rounded-xl text-yellow-500">
                    <Coins className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {isWilderness ? "金幣 (🔒 荒野禁用)" : "金幣 (💰)"}
                  </span>
                  <span className={`text-sm font-black font-mono ${isWilderness ? "text-slate-500" : "text-yellow-400"}`}>
                    {S.coins} 枚
                  </span>
                </div>
              </div>

              {/* Debt & Credit Ratio */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-start gap-2.5 col-span-2 sm:col-span-1">
                <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 mt-0.5 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block font-bold leading-tight">預支負債 / 信用額度</span>
                  <div className="text-[10px] font-black font-mono block mt-1.5 space-y-1">
                    <div className="text-rose-400 leading-tight">
                      預支負債：{formatDebt(S.debt, S.debtLimit, S.creditLevel)}
                    </div>
                    <div className="text-emerald-400 leading-tight">
                      信用額度：{formatCredit(S.creditExp, S.credit)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Dynamic Game Board Viewport */}
        <div id="game-board-viewport" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 min-h-[380px] flex flex-col justify-center relative overflow-hidden">
          {/* Subtle grid backing decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-10 pointer-events-none"></div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* 2. Interactive Real-time Log Console (Right) */}
      <div id="log-console" className="lg:col-span-4 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl min-h-[400px] h-full justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            戰役與財務記錄日誌
          </span>
          <span className="text-[10px] bg-slate-900 px-2.5 py-1 rounded-full text-slate-500 border border-slate-800 font-mono">
            {S.weather.name}
          </span>
        </div>

        {/* Log rows scroll box */}
        <div className="flex-1 overflow-y-auto max-h-[380px] pr-2 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div ref={logTopRef} />
          {logLines.map((log, idx) => {
            let isWarning = log.includes("⚠️") || log.includes("💀");
            let isGold = log.includes("🧱") || log.includes("💰") || log.includes("🎁");
            return (
              <p 
                key={idx} 
                className={`text-xs leading-relaxed font-mono ${isWarning ? 'text-rose-400 font-bold' : isGold ? 'text-amber-400 font-medium' : 'text-slate-400'}`}
              >
                {log}
              </p>
            );
          })}
        </div>

        <div className="border-t border-slate-800 pt-3 mt-3 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            當前通貨膨脹率: {Math.round(S.inflation * 100)}% (預支乘數)
          </p>
        </div>

      </div>

      {/* 守衛逮捕公會審判 Modal */}
      {beggarArrestModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600/80 p-6 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl animate-shake">
            <div className="text-center space-y-2">
              <div className="text-4xl animate-bounce">🚨 🍅 🥬 👎</div>
              <h3 className="text-lg font-black text-rose-400">【社會性死亡】被守衛逮捕與公會審判！</h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/60 space-y-3 text-xs leading-relaxed text-slate-200">
              <p className="font-bold text-rose-300 text-sm">
                守衛與公會審判台詞：
              </p>
              <p className="text-amber-200/90 italic font-mono bg-rose-950/30 p-3 rounded-lg border border-rose-900/40">
                「你被兩個守衛架起來，抓去冒險者公會，經過審判決定罰款600金幣。你被公會裡的所有冒險者扔各種東西，躲在桌底無比難堪，所有冒險者並朝你不斷"噓"聲貶低你，讓你面紅耳赤顏面盡失。隨後你和你的東西被公會的櫃檯小姐轟出去」
              </p>
            </div>

            {beggarArrestDetails && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
                <p className="text-slate-400 font-bold border-b border-slate-800 pb-1">💰 600 金幣罰款清算明細：</p>
                <p className="text-emerald-400">・現有金幣支付：-${beggarArrestDetails.paidCoins} G</p>
                {beggarArrestDetails.paidSavings > 0 && (
                  <p className="text-emerald-400">・銀行存款抵扣：-${beggarArrestDetails.paidSavings} G</p>
                )}
                {beggarArrestDetails.addedDebt > 0 && (
                  <p className="text-rose-400 font-bold">・金額不足轉為追加負債：+${beggarArrestDetails.addedDebt} G</p>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setBeggarArrestModal(false);
                setBeggarArrestDetails(null);
                setView("menu");
              }}
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black py-3 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-lg text-center"
            >
              😭 狼狽爬出公會，返回村莊廣場 (結束乞丐扮演)
            </button>
          </div>
        </div>
      )}

      {/* 天罰雷劫 Modal (Divine Punishment) */}
      {divinePunishmentModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/80 p-6 rounded-2xl max-w-md w-full space-y-5 shadow-2xl animate-shake text-center font-mono">
            <div className="space-y-2">
              <div className="text-5xl animate-bounce">⚡🌩️💥</div>
              <h3 className="text-lg font-black text-amber-400">⚡ 天罰雷劫降臨！</h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/60 space-y-3 text-xs leading-relaxed text-slate-200">
              <p className="font-bold text-amber-300 text-sm">
                [你偷學了不同職業的技能，受到天罰雷劫，最終你失去了不屬於你的能力]
              </p>
              <p className="text-rose-400 text-[11px] leading-relaxed">
                九天狂雷攜天地威壓轟然炸裂，將非你本職與未達轉職權限的跨職能力全部洗淨！你劇痛無比昏迷倒地，幸得好心人救援背回旅館...
              </p>
            </div>

            <button
              onClick={() => {
                setDivinePunishmentModal(false);
                setView("inn");
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-lg text-center"
            >
              😵 在旅館床鋪上甦醒 (繼續遊戲)
            </button>
          </div>
        </div>
      )}

      {/* 惡意撒幣 50% 金幣資產消耗警告 Modal */}
      {toss50PercentWarningModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[210] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl text-center font-mono">
            <div className="text-4xl">💸 ⚠️ 🚨</div>
            <h3 className="text-base font-black text-amber-400">【惡意撒幣高額警告】</h3>
            <div className="bg-amber-950/60 p-4 rounded-xl border border-amber-800 text-xs text-amber-200 leading-relaxed whitespace-pre-line text-left">
              {toss50PercentWarningModal}
            </div>
            <button
              onClick={() => setToss50PercentWarningModal(null)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-md"
            >
              了解，繼續戰鬥！
            </button>
          </div>
        </div>
      )}

      {/* 通用確認對話框 (Custom Confirm Modal) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-scale-up">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-100">{confirmModal.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer border border-slate-700 transition-all"
              >
                {confirmModal.cancelText || "取消"}
              </button>
              <button
                onClick={() => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  action();
                }}
                className={`flex-1 py-2.5 font-bold rounded-xl text-xs cursor-pointer transition-all ${
                  confirmModal.confirmStyle === "rose"
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                    : confirmModal.confirmStyle === "emerald"
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                }`}
              >
                {confirmModal.confirmText || "確定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 存檔衝突警告手動選擇介面 (Save Conflict Warning UI) */}
      {conflictSaves && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-rose-500/20 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                ⚠️
              </div>
              <h3 className="text-lg font-black text-rose-400">偵測到存檔衝突防護！</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                系統偵測到您最更新的【手動存檔】時間戳晚於【自動存檔 (AUTO)】。
                為防止您的最新進度被覆蓋，請手動確認要讀取哪一個進度：
              </p>
            </div>

            <div className="space-y-3">
              {/* 手動存檔 */}
              <button
                onClick={() => {
                  loadSave(conflictSaves.manual);
                  setConflictSaves(null);
                }}
                className="w-full text-left p-4 bg-slate-950 hover:bg-slate-800 border-2 border-emerald-500/50 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all space-y-1.5 block"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-400">📂 讀取手動存檔 (推薦)</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">最新進度</span>
                </div>
                <div className="text-xs text-slate-200 font-mono">
                  時間：{conflictSaves.manual.date} {conflictSaves.manual.time}
                </div>
                <div className="text-[11px] text-slate-400">
                  負債: -LV {money(conflictSaves.manual.debt)} | 難度: {conflictSaves.manual.difficulty}
                </div>
              </button>

              {/* 自動存檔 */}
              <button
                onClick={() => {
                  loadSave(conflictSaves.auto);
                  setConflictSaves(null);
                }}
                className="w-full text-left p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 rounded-2xl cursor-pointer transition-all space-y-1.5 block"
              >
                <span className="text-xs font-black text-amber-400 block">🤖 讀取自動存檔 (AUTO)</span>
                <div className="text-xs text-slate-300 font-mono">
                  時間：{conflictSaves.auto.date} {conflictSaves.auto.time}
                </div>
                <div className="text-[11px] text-slate-400">
                  負債: -LV {money(conflictSaves.auto.debt)} | 難度: {conflictSaves.auto.difficulty}
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConflictSaves(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 大天使神聖召喚與靈魂輪迴介面 (Archangel Summon & Reincarnation Modal) */}
      {summonDialogueOpen && summonedHeroId && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 max-w-lg w-full shadow-2xl shadow-amber-400/20 space-y-5 animate-scale-up relative overflow-hidden">
            
            {/* Background Light Beam effect */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

            <div className="text-center space-y-2 relative">
              <span className="text-3xl animate-bounce block">👼</span>
              <h3 className="text-lg font-black text-amber-400">✨ 大天使聖池：靈魂現身 ✨</h3>
              <p className="text-xs text-slate-400">大天使引導著一位逝去勇士或搞笑破產者的靈魂重新降臨這片大地...</p>
            </div>

            {/* Display Summoned Character Card */}
            {(() => {
              const tm = getTeammateData(summonedHeroId);
              if (!tm) return null;
              const isHeroic = tm.type === "勇者小隊";
              return (
                <div className="space-y-4">
                  {/* Hero card */}
                  <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-amber-300">【{tm.prefix}】{tm.name}</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">{tm.nickname}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          戰力加成：攻擊力 {tm.atkMin}~{tm.atkMax} | 契約金：{isHeroic ? "大天使降臨 (免費)" : `${tm.cost}金幣`}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                        {isHeroic ? "🏆 英雄級靈魂" : "🤡 搞笑靈魂"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-900/60 p-2.5 border border-slate-800 rounded-xl">
                      {tm.desc}
                    </p>

                    {/* Reincarnation Dialog Box - SPECIFIC MONOLOGUE */}
                    {isPitySummon ? (
                      <div className="mt-4 space-y-3">
                        <div className="bg-amber-500/15 border-l-4 border-amber-400 p-3 rounded-r-xl space-y-1">
                          <p className="text-[10px] font-bold text-amber-400">👼 大天使捧腹大笑嘲諷：</p>
                          <p className="text-xs text-amber-200 italic leading-relaxed font-serif font-bold">
                            「哈哈哈～你是臉多黑，黑到連一個地縛靈都不理你。」
                          </p>
                        </div>
                        <div className="bg-slate-900 border border-amber-500/20 p-3 rounded-xl space-y-1">
                          <p className="text-[10px] font-black text-amber-300">⚔️ 保底英雄專屬登場台詞：</p>
                          <p className="text-xs text-slate-100 italic leading-relaxed font-serif whitespace-pre-line">
                            {summonHeroQuote || "「牛頓當年被蘋果砸到發現萬有引力，不知道拿塊地磚砸你，會發現什麼...，會不會發現你腦袋裡裝的全部都是銀行貸款？」"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      isHeroic ? (
                        <div className="mt-4 bg-amber-500/10 border-l-4 border-amber-400 p-3 rounded-r-xl space-y-1">
                          <p className="text-[10px] font-bold text-amber-400">🗣️ 靈魂現身的黑色幽默無奈吐槽：</p>
                          <p className="text-xs text-amber-100 italic leading-relaxed font-serif whitespace-pre-line">
                            {summonHeroQuote || HERO_QUOTES[0]}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-400">🗣️ 凡人靈魂驚慌登場：</p>
                          <p className="text-xs text-slate-300 italic leading-relaxed font-serif">
                            「雖然我只是個凡人，但為了糊口……看在 10 金幣的份上，我也來湊個熱鬧吧！」
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Soul tucao / error warning message */}
                  {soulTucaoMsg && (
                    <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs rounded-xl space-y-1 animate-shake">
                      <p className="font-bold text-rose-400">⚠️ 靈魂無情吐槽白爛警告：</p>
                      <p className="italic font-serif">
                        {soulTucaoMsg}
                      </p>
                    </div>
                  )}

                  {/* If successful (team has empty slot) */}
                  {summonStatus === 'success' && (
                    <div className="space-y-3">
                      <div className="text-center text-xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/60 py-2 rounded-xl">
                        🎉 已自動補入隊伍空位中，正式成為冒險夥伴！
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSummonDialogueOpen(false);
                            setSummonedHeroId(null);
                            setSummonStatus(null);
                            setSoulTucaoMsg(null);
                          }}
                          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
                        >
                          感謝大天使恩賜
                        </button>
                        <button
                          onClick={() => {
                            setSummonDialogueOpen(false);
                            setSummonedHeroId(null);
                            setSummonStatus(null);
                            setSoulTucaoMsg(null);
                            const countToUse = praySliderCount > 1 && S.coins >= praySliderCount * 10 ? praySliderCount : 1;
                            prayToArchangel(countToUse);
                          }}
                          disabled={S.coins < 10}
                          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 disabled:text-slate-500 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1 border border-amber-300 disabled:border-slate-800"
                        >
                          🛐 繼續祈禱 ({praySliderCount > 1 && S.coins >= praySliderCount * 10 ? `${praySliderCount}連抽` : "10金幣"})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If swap pending (team is full) */}
                  {summonStatus === 'swap_pending' && (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-300 font-bold px-1 text-center">
                        🚨 目前小隊已滿編 (最多2人)，請點擊選擇一名成員，完成靈魂輪迴交接：
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {S.teammates.map(id => {
                          const existingTm = getTeammateData(id);
                          if (!existingTm) return null;
                          const isSelected = swapSelectedTeammateId === id;
                          return (
                            <button
                              key={id}
                              onClick={() => {
                                setSwapSelectedTeammateId(id);
                                setSoulTucaoMsg(null);
                              }}
                              className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                isSelected 
                                  ? "bg-amber-500/10 border-amber-400 shadow-md shadow-amber-400/5" 
                                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-200">【{existingTm.prefix}】{existingTm.name}</span>
                                {isSelected && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 py-0.5 rounded font-black">選中置換</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">({existingTm.nickname})</p>
                              <p className="text-[9px] text-rose-400 mt-1 leading-snug">解職後前往酒館歸位</p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 pt-2">
                        {/* Cancel button */}
                        <button
                          onClick={() => {
                            setSummonDialogueOpen(false);
                            setSummonedHeroId(null);
                            setSwapSelectedTeammateId(null);
                            setSummonStatus(null);
                            setSoulTucaoMsg(null);
                          }}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
                        >
                          放棄召喚
                        </button>
                        
                        {/* Confirm button */}
                        <button
                          onClick={confirmHeroReplacement}
                          className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                        >
                          確定置換
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* 鑑定數值相異之疊加物品子頁面 Modal (Identified Stats Sub-Menu) */}
      {selectedStackSubMenu && (() => {
        const { itemKey, displayName } = selectedStackSubMenu;
        const instanceIndices: number[] = [];
        S.inventory.forEach((key, idx) => {
          if (key === itemKey) instanceIndices.push(idx);
        });

        if (instanceIndices.length === 0) {
          return null;
        }

        const wp = EQUIPMENT.weapons.find(w => w.id === itemKey || w.name === itemKey);
        const ar = EQUIPMENT.armors.find(a => a.id === itemKey || a.name === itemKey);
        const ac = EQUIPMENT.accessories.find(a => a.id === itemKey || a.name === itemKey);
        const isEquip = !!(wp || ar || ac);
        const forgedSet = new Set(S.forgedItems || []);

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                <div>
                  <h3 className="font-black text-sm text-indigo-300 flex items-center gap-2">
                    📦 【{displayName}】疊加物品個體選擇與數值分流
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    此堆疊共包含 <span className="text-amber-400 font-bold font-mono">{instanceIndices.length}</span> 個獨立個體，可個別檢視數值與屬性並進行精確選擇。
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStackSubMenu(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {instanceIndices.map((invIdx, idx) => {
                  const instanceId = `${itemKey}_${invIdx}`;
                  const buff = equipBuffMap[instanceId] || equipBuffMap[itemKey] || null;
                  const isForged = forgedSet.has(itemKey) || forgedSet.has(wp?.id || "") || forgedSet.has(ar?.id || "") || forgedSet.has(ac?.id || "");
                  const isAppraised = !!buff;

                  return (
                    <div key={invIdx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                              個體 #{idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              背包索引: #{invIdx}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 space-y-0.5 pt-1">
                            {wp && <p>⚔️ 基礎攻擊力: <span className="text-emerald-400 font-bold">Atk +{wp.atk}</span></p>}
                            {ar && <p>🛡️ 基礎防禦力: <span className="text-blue-400 font-bold">Def +{ar.def}</span></p>}
                            {isEquip && (
                              <div className="flex items-center gap-2 text-[10px] mt-1">
                                <span className={isForged ? "text-amber-400 font-bold" : "text-slate-500"}>
                                  {isForged ? "🔥 已於鐵匠鋪熔煉" : "🔒 未熔煉"}
                                </span>
                                <span>•</span>
                                <span className={isAppraised ? "text-purple-300 font-bold" : "text-slate-500"}>
                                  {isAppraised ? "✨ 已完成聖光鑑定" : "🔮 未鑑定"}
                                </span>
                              </div>
                            )}
                            {buff && (
                              <div className="bg-purple-950/40 p-2 rounded-lg border border-purple-800/50 text-[11px] text-purple-300 mt-1">
                                <p className="font-bold text-purple-200">✨ 神恩屬性：【{buff.name}】</p>
                                <p className="text-[10px] text-purple-300/80">{buff.desc}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900/80">
                        {isEquip ? (
                          <button
                            onClick={() => {
                              equipItem(wp?.id || ar?.id || ac?.id || itemKey, invIdx);
                              addLog(`⚔️ 成功從堆疊中裝備第 ${idx + 1} 件【${displayName}】！`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition-all shadow"
                          >
                            ⚔️ 裝備此件
                          </button>
                        ) : (
                          <>
                            {(itemKey === "治療藥水" || itemKey === "healing_potion") && (
                              <button
                                onClick={() => usePotionFromStatus(invIdx)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition-all"
                              >
                                🧪 使用此件
                              </button>
                            )}
                            {(itemKey === "傳送指南針" || itemKey === "teleport_compass") && (
                              <button
                                onClick={() => setTeleportCompassModal({ invIndex: invIdx })}
                                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition-all"
                              >
                                🧭 發動折躍
                              </button>
                            )}
                            {itemKey === "幽暗迷幻菇" && (
                              <button
                                onClick={() => useMushroomFromStatus(invIdx)}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition-all"
                              >
                                🍄 食用此件
                              </button>
                            )}
                          </>
                        )}
                        {!isQuestItem(itemKey) && (
                          <button
                            onClick={() => sellItemFromStatus(itemKey, invIdx)}
                            className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-bold px-2.5 py-1 rounded-lg text-xs border border-amber-500/30 cursor-pointer transition-all"
                          >
                            💰 變賣此件
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 shrink-0 border-t border-slate-800">
                <button
                  onClick={() => setSelectedStackSubMenu(null)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors border border-slate-700"
                >
                  ✕ 關閉個體列表
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 隊友裝備贈與雙欄位視窗 Modal (Teammate Equipment Gift Double Column Modal) */}
      {giftTeammateId && (() => {
        const tm = getTeammateData(giftTeammateId);
        if (!tm) return null;

        const originalEquip = S.teammateEquip?.[giftTeammateId] || {};

        // Find all equipment items in draftInventory
        const forgedSet = new Set(S.forgedItems || []);
        const eqItemsList: {
          itemKey: string;
          invIdx: number;
          name: string;
          slotType: "weapon" | "armor" | "accessory";
          statDesc: string;
          buff: Buff | null;
          isForged: boolean;
        }[] = [];

        draftInventory.forEach((itemKey, idx) => {
          const wp = EQUIPMENT.weapons.find(w => w.id === itemKey || w.name === itemKey);
          const ar = EQUIPMENT.armors.find(a => a.id === itemKey || a.name === itemKey);
          const ac = EQUIPMENT.accessories.find(a => a.id === itemKey || a.name === itemKey);

          const instanceId = `${itemKey}_${idx}`;
          const buff = equipBuffMap[instanceId] || equipBuffMap[itemKey] || (wp ? equipBuffMap[wp.id] : null) || (ar ? equipBuffMap[ar.id] : null) || (ac ? equipBuffMap[ac.id] : null) || null;
          const isForged = forgedSet.has(itemKey) || forgedSet.has(wp?.id || "") || forgedSet.has(ar?.id || "") || forgedSet.has(ac?.id || "");

          if (wp) {
            let stat = `Atk +${wp.atk}`;
            if (buff) {
              if (buff.effect === "atk") stat += ` (神恩 +${buff.value}%)`;
              else stat += ` (${buff.name}: ${buff.desc})`;
            }
            eqItemsList.push({ itemKey, invIdx: idx, name: wp.name, slotType: "weapon", statDesc: stat, buff, isForged });
          } else if (ar) {
            let stat = `Def +${ar.def}`;
            if (buff) {
              if (buff.effect === "def") stat += ` (神恩 +${buff.value}%)`;
              else stat += ` (${buff.name}: ${buff.desc})`;
            }
            eqItemsList.push({ itemKey, invIdx: idx, name: ar.name, slotType: "armor", statDesc: stat, buff, isForged });
          } else if (ac) {
            let stat = ac.effect || `Effect +${ac.value || ac.effectValue || 0}`;
            if (buff) stat += ` (${buff.name}: ${buff.desc})`;
            eqItemsList.push({ itemKey, invIdx: idx, name: ac.name, slotType: "accessory", statDesc: stat, buff, isForged });
          }
        });

        const slots = [
          { key: "weapon" as const, title: "武器部位", icon: "⚔️" },
          { key: "armor" as const, title: "鎧甲部位", icon: "🛡️" },
          { key: "accessory" as const, title: "飾品部位", icon: "💍" }
        ];

        return (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-5 animate-fade-in">
            <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-2xl p-4 sm:p-6 max-w-4xl w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                <div>
                  <h3 className="font-black text-sm sm:text-base text-indigo-300 flex items-center gap-2">
                    🎁 隊友裝備贈與與永久鎖定 - 【{tm.prefix}】{tm.name} ({tm.nickname})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    點選左側個人背包裝備放入右側隊友欄位。同欄位再贈與的裝備將<strong className="text-rose-400 font-bold">「直接覆蓋原同欄位物品 (無法收回/舊物銷毀)」</strong>。
                  </p>
                </div>
                <button
                  onClick={() => setGiftTeammateId(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 text-lg cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Double Column Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
                {/* Left Column: Player Inventory (Draft Inventory) */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col min-h-0">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2 shrink-0">
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      🎒 玩家個人裝備背包 ({eqItemsList.length} 件可贈與)
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">挑選裝備贈予</span>
                  </div>

                  {eqItemsList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs italic space-y-1">
                      <span>🍃 個人行囊中目前沒有可贈與的武器、鎧甲或飾品。</span>
                      <span className="text-[10px] text-slate-600">可前往村莊【鐵匠鋪】熔煉或購買裝備後再來贈與夥伴。</span>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                      {eqItemsList.map((eq) => {
                        const targetSlotCurrentItem = draftTeammateEquip[eq.slotType];
                        const willOverwrite = !!targetSlotCurrentItem;

                        return (
                          <div
                            key={`${eq.itemKey}_${eq.invIdx}`}
                            className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-100">{eq.name}</span>
                                <span className="text-[9px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                                  {eq.slotType === "weapon" ? "⚔️ 武器" : eq.slotType === "armor" ? "🛡️ 鎧甲" : "💍 飾品"}
                                </span>
                                {eq.isForged && (
                                  <span className="text-[9px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800 font-mono font-bold">
                                    🔥 已熔煉
                                  </span>
                                )}
                                {eq.buff && (
                                  <span className="text-[9px] bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 font-mono font-bold">
                                    ✨ 【{eq.buff.name}】
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-emerald-400 font-mono block">{eq.statDesc}</span>
                              {eq.buff && (
                                <span className="text-[9px] text-purple-300/90 font-mono block">
                                  魔力灌注神恩：{eq.buff.desc}
                                </span>
                              )}
                              {willOverwrite && (
                                <span className="text-[9px] text-rose-400 font-bold block">
                                  ⚠️ 贈與將覆蓋隊友現有「{targetSlotCurrentItem}」
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleDraftEquip(eq.itemKey, eq.invIdx)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all shrink-0 shadow-md shadow-indigo-600/20"
                            >
                              ➡️ 贈與隊友
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Teammate Dedicated Equipment Slots */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-900/40 flex flex-col min-h-0">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2 shrink-0">
                    <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      👥 【{tm.name}】專屬裝備欄位
                    </h4>
                    <span className="text-[10px] text-rose-400 font-bold font-mono bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      [隊友專屬 - 永久綁定]
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                    {slots.map((s) => {
                      const currentItemName = draftTeammateEquip[s.key];
                      const wp = currentItemName ? EQUIPMENT.weapons.find(w => w.id === currentItemName || w.name === currentItemName) : null;
                      const ar = currentItemName ? EQUIPMENT.armors.find(a => a.id === currentItemName || a.name === currentItemName) : null;
                      const ac = currentItemName ? EQUIPMENT.accessories.find(a => a.id === currentItemName || a.name === currentItemName) : null;
                      
                      const buff = currentItemName ? (equipBuffMap[currentItemName] || (wp ? equipBuffMap[wp.id] : null) || (ar ? equipBuffMap[ar.id] : null) || (ac ? equipBuffMap[ac.id] : null)) : null;
                      const isForged = currentItemName ? (forgedSet.has(currentItemName) || forgedSet.has(wp?.id || "") || forgedSet.has(ar?.id || "") || forgedSet.has(ac?.id || "")) : false;

                      const originalName = originalEquip[s.key];
                      const isNewlyPlacedInDraft = currentItemName && currentItemName !== originalName;
                      const isOverwritten = originalName && currentItemName && currentItemName !== originalName;

                      return (
                        <div
                          key={s.key}
                          className={`p-3 rounded-xl border space-y-2 transition-all ${
                            currentItemName
                              ? "bg-indigo-950/30 border-indigo-500/50"
                              : "bg-slate-900/50 border-slate-800/80 border-dashed"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                              <span>{s.icon}</span> {s.title}
                            </span>
                            {currentItemName ? (
                              <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 font-mono">
                                [隊友專屬]
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">未裝備</span>
                            )}
                          </div>

                          {currentItemName ? (
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-amber-300">{currentItemName}</span>
                                  {isForged && (
                                    <span className="text-[9px] bg-amber-950/80 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-800 font-mono">
                                      🔥 已熔煉
                                    </span>
                                  )}
                                  {buff && (
                                    <span className="text-[9px] bg-purple-950/80 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-800 font-mono">
                                      ✨ 【{buff.name}】
                                    </span>
                                  )}
                                  {isNewlyPlacedInDraft && (
                                    <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800">
                                      ✨ 新放入預覽
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-emerald-400 font-mono block">
                                  {wp ? `Atk +${wp.atk}${buff && buff.effect === 'atk' ? ` (+${buff.value}%)` : ''}` : ar ? `Def +${ar.def}${buff && buff.effect === 'def' ? ` (+${buff.value}%)` : ''}` : ac ? (ac.effect || `Effect +${ac.effectValue || 0}`) : ""}
                                </span>
                                {buff && (
                                  <span className="text-[9px] text-purple-300/90 font-mono block">
                                    魔力灌注神恩：{buff.desc}
                                  </span>
                                )}
                                {isOverwritten && (
                                  <span className="text-[9px] text-rose-400 font-bold block mt-0.5">
                                    ⚠️ 已覆蓋舊裝備「{originalName}」(確定後舊物品銷毀無法收回)
                                  </span>
                                )}
                              </div>

                              {isNewlyPlacedInDraft && (
                                <button
                                  onClick={() => handleDraftUnequip(s.key)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer transition-colors shrink-0"
                                >
                                  ↩️ 卸回背包
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic py-1">
                              點擊左側對應類別裝備即可贈與放置於此欄位。
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="flex gap-3 pt-2 shrink-0 border-t border-slate-800">
                <button
                  onClick={() => setGiftTeammateId(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer border border-slate-700 transition-all"
                >
                  ✕ 取消變更
                </button>
                <button
                  onClick={handleConfirmGiftEquip}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5"
                >
                  <span>🔒 確認贈與並完成永久鎖定</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 傳送指南針・空間折躍選擇 Modal */}
      {teleportCompassModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[260] flex items-center justify-center p-4 animate-fade-in font-mono">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/10">
              🧭
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-amber-300">🧭 傳送指南針・空間折躍</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                極其昂貴的神聖地理指南針（售價 $799 G）。請選擇勇者小隊欲折躍傳送的目標地點：
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const invIndex = teleportCompassModal.invIndex ?? S.inventory.findIndex(i => i === "傳送指南針" || i === "teleport_compass");
                  if (invIndex > -1) {
                    const nextInv = [...S.inventory];
                    nextInv.splice(invIndex, 1);
                    const campHp = S.checkpointCampMet ? Math.max(S.hp, Math.ceil((getMaxHpBonus() + (DEBTOR_CLASSES[S.debtorClass]?.hp || 100)) * 0.25)) : S.hp;
                    setS(prev => ({ ...prev, hp: campHp, inventory: nextInv, enemy: null, encounterMonster: null }));
                    addLog("🧭 【傳送指南針】發動！神奇光芒包覆全身，空間撕裂折躍回到復活點！");
                    setView("explore_map");
                  }
                  setTeleportCompassModal(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>⛺ [回到復活點]</span>
                <span className="text-[10px] opacity-80">(營地/營火點)</span>
              </button>

              <button
                onClick={() => {
                  const invIndex = teleportCompassModal.invIndex ?? S.inventory.findIndex(i => i === "傳送指南針" || i === "teleport_compass");
                  if (invIndex > -1) {
                    const nextInv = [...S.inventory];
                    nextInv.splice(invIndex, 1);
                    setS(prev => ({ ...prev, inventory: nextInv, enemy: null, encounterMonster: null }));
                    addLog("🧭 【傳送指南針】發動！神奇光芒包覆全身，瞬間傳送回到野外當前地圖區塊！");
                    setView("explore_map");
                  }
                  setTeleportCompassModal(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>🌲 [回到野外]</span>
                <span className="text-[10px] opacity-90">(當前地圖區塊介面)</span>
              </button>

              <button
                onClick={() => {
                  const invIndex = teleportCompassModal.invIndex ?? S.inventory.findIndex(i => i === "傳送指南針" || i === "teleport_compass");
                  if (invIndex > -1) {
                    const nextInv = [...S.inventory];
                    nextInv.splice(invIndex, 1);
                    setS(prev => ({ ...prev, inventory: nextInv, enemy: null, encounterMonster: null }));
                    addLog("🧭 【傳送指南針】發動！神奇光芒包覆全身，瞬間折躍回到村莊廣場！");
                    setView("menu");
                  }
                  setTeleportCompassModal(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>🏰 [回到村莊]</span>
                <span className="text-[10px] opacity-80">(村莊大廳廣場)</span>
              </button>

              <button
                onClick={() => setTeleportCompassModal(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-all mt-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 大教堂暴躁牧師 復活儀式 對話氣泡 Modal */}
      {priestReviveStep !== null && priestReviveStep >= 1 && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fade-in font-mono">
          <div className="bg-slate-900 border-2 border-rose-500/80 p-6 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl text-left relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-12 h-12 rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-rose-500/20">
                ⛪
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
                  <span>大教堂暴躁牧師 (Priest)</span>
                  <span className="text-[10px] bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                    復甦詛咒儀式 ({priestReviveStep}/4)
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">大教堂神聖馬車救護部隊</p>
              </div>
            </div>

            <div className="relative bg-slate-950 p-5 rounded-2xl border-2 border-rose-800/60 shadow-inner space-y-3">
              <div className="absolute -top-2.5 left-8 w-4 h-4 bg-slate-950 border-t-2 border-l-2 border-rose-800/60 rotate-45"></div>
              
              <div className="text-xs text-rose-200 leading-relaxed font-bold tracking-wide space-y-2">
                {priestReviveStep === 1 && (
                  <p className="animate-fade-in text-sm text-amber-200">
                    1「牧師用法杖戳了戳以眼前倒地的人，不滿地說"都是因為勇者小隊，全世界受到詛咒」
                  </p>
                )}
                {priestReviveStep === 2 && (
                  <p className="animate-fade-in text-sm text-amber-200">
                    2「現在施法都必須消耗金幣!除了勇者小隊，被皇宮魔導師賦予了勇者&#123;預支欠款的能力&#125;。」
                  </p>
                )}
                {priestReviveStep === 3 && (
                  <p className="animate-fade-in text-sm text-amber-200">
                    3「牧師不甘願地施展復甦術，看到身上的金幣紛紛融入法術術士中」
                  </p>
                )}
                {priestReviveStep === 4 && (
                  <p className="animate-fade-in text-sm text-amber-200">
                    4「所有倒地的人都一臉惺忪的醒來，牧師不甘願地拍了拍空蕩蕩的褲衩憤恨地走回馬車」
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              {priestReviveStep < 4 ? (
                <button
                  onClick={() => {
                    const nextStep = priestReviveStep + 1;
                    setPriestReviveStep(nextStep);
                  }}
                  className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black px-6 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1"
                >
                  <span>下一段對話 ({priestReviveStep}/4)</span>
                  <span>➡</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const reviveCost = pendingReviveCost || Math.ceil((200 + S.deathCount * 10) * S.inflation);
                    spend(reviveCost, "大教堂復活", "復活");
                    const resHp = Math.ceil((getMaxHpBonus() + (DEBTOR_CLASSES[S.debtorClass]?.hp || 100)) * 0.5);
                    
                    setS(prev => ({
                      ...prev,
                      hp: resHp,
                      alive: true,
                      deathCount: prev.deathCount + 1,
                      rage: 0,
                      enemy: null,
                      encounterMonster: null
                    }));

                    addLog('⛪ 「牧師用法杖戳了戳以眼前倒地的人，不滿地說"都是因為勇者小隊，全世界受到詛咒」');
                    addLog('⛪ 「現在施法都必須消耗金幣!除了勇者小隊，被皇宮魔導師賦予了勇者{預支欠款的能力}。」');
                    addLog('⛪ 「牧師不甘願地施展復甦術，看到身上的金幣紛紛融入法術術士中」');
                    addLog('⛪ 「所有倒地的人都一臉惺忪的醒來，牧師不甘願地拍了拍空蕩蕩的褲衩憤恨地走回馬車」');
                    addLog(`✨ 【大教堂復活完畢】勇者小隊全員復甦！HP 恢復至 50%，已進入【野外當前地圖區塊】！`);

                    setPriestReviveStep(null);
                    setPendingReviveCost(0);
                    setView("explore_map");
                  }}
                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 animate-bounce"
                >
                  <span>✨ 完成復活，重回當前地圖區塊！</span>
                  <span>➡</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 信用額度上限提示 Modal (Requirement 4-1) */}
      {creditLimitModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[350] flex items-center justify-center p-4 animate-fade-in font-mono">
          <div className="bg-slate-900 border-2 border-amber-500/80 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl text-center relative overflow-hidden">
            <div className="w-14 h-14 bg-amber-500/20 border-2 border-amber-500/50 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/20">
              💳
            </div>
            <h3 className="text-base font-black text-amber-300">⚠️ 信用額度已達上限！</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              您的預支負債或信用經驗已達到當前階段最高上限！請進入【信貸與負債】頁面提升額度與評級。
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setCreditLimitModal(false);
                  setView("status");
                  setStatusSubTab("ledger");
                }}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>💳 前往 [信貸與負債] 提升額度</span>
                <span>➡</span>
              </button>
              <button
                onClick={() => setCreditLimitModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
              >
                暫時關閉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
