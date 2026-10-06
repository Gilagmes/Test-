const fs = require('fs');

console.log("==================================================");
console.log("  TESTING SMART RED DOTS & POWER TRAFFIC LIGHT");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: {
      base: ['buildings', 'tech', 'hospital'],
      heroes: ['roster', 'specialists'],
      social: ['quests', 'daily']
    },
    SL: {},
    S: {
      res: { food: 5000, wood: 5000, metal: 3000 },
      gems: 100,
      pow: 3000,
      sec: 4,
      tutDone: true,
      heroes: [
        { id: 'jo', n: 'Джо', r: 'Стрелок-охотник', i: '🏹', lv: 5 }
      ],
      heroBldAssign: {},
      hospital: {
        wounded: { melee: 10, ranged: 0, cavalry: 0 }
      },
      apexLogs: {
        unlocked: [1, 2],
        claimed: [1] // File 2 unclaimed!
      }
    },
    secInfo: (s) => ({ n: 'Заброшенные Доки', req: 2000, boss: false }),
    hasUnclaimedDailyChests: () => true
  }
};
global.window = window;
global.document = {
  getElementById: () => ({ innerHTML: '', style: {} }),
  createElement: () => ({ tagName: 'div', style: {}, appendChild: () => {} })
};

// Evaluate twd-notifications-traffic-js
const scriptMatch = html.match(/<script id="twd-notifications-traffic-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-notifications-traffic-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("\n[TEST 1/3] Проверка Светофора Мощи (Power Traffic Light)...");

// 1. Green test: My power 3000 vs Req 2000 (150% -> Green)
const greenBadge = window.G.getPowerMatchupBadge(2000);
console.log("  ✓ Green Badge Check (3000 vs 2000):", greenBadge.includes('🟢') && greenBadge.includes('ПРЕВОСХОДСТВО'));
if (!greenBadge.includes('🟢') || !greenBadge.includes('ПРЕВОСХОДСТВО')) {
  console.error("ERROR: Expected Green traffic light badge!");
  process.exit(1);
}

// 2. Yellow test: My power 3000 vs Req 3200 (93% -> Yellow)
const yellowBadge = window.G.getPowerMatchupBadge(3200);
console.log("  ✓ Yellow Badge Check (3000 vs 3200):", yellowBadge.includes('🟡') && yellowBadge.includes('РАВНЫЙ БОЙ'));
if (!yellowBadge.includes('🟡') || !yellowBadge.includes('РАВНЫЙ БОЙ')) {
  console.error("ERROR: Expected Yellow traffic light badge!");
  process.exit(1);
}

// 3. Red test: My power 3000 vs Req 5000 (60% -> Red)
const redBadge = window.G.getPowerMatchupBadge(5000);
console.log("  ✓ Red Badge Check (3000 vs 5000):", redBadge.includes('🔴') && redBadge.includes('ОПАСНОСТЬ'));
if (!redBadge.includes('🔴') || !redBadge.includes('ОПАСНОСТЬ')) {
  console.error("ERROR: Expected Red traffic light badge!");
  process.exit(1);
}

console.log("\n[TEST 2/3] Проверка Умных Красных Точек (Red Dots)...");

// Check Hospital wounded notification
const hospRedDot = window.G.hasSubReward('base', 'hospital');
console.log("  ✓ Hospital Red Dot (Wounded=10):", hospRedDot);
if (!hospRedDot) {
  console.error("ERROR: Hospital should have red dot when wounded > 0!");
  process.exit(1);
}

// Check Quests notification (Daily Chests ready)
const questRedDot = window.G.hasSubReward('social', 'quests');
console.log("  ✓ Quests Red Dot (Chests ready):", questRedDot);
if (!questRedDot) {
  console.error("ERROR: Quests should have red dot when rewards unclaimed!");
  process.exit(1);
}

// Check Apex notification (File 2 unclaimed)
const apexRedDot = window.G.hasSubReward('base', 'apex');
console.log("  ✓ Apex Terminal Red Dot (File #02 unclaimed):", apexRedDot);
if (!apexRedDot) {
  console.error("ERROR: Apex should have red dot when files unclaimed!");
  process.exit(1);
}

// Check Base Tab notification
const baseTabRedDot = window.G.hasTabReward('base');
console.log("  ✓ Base Tab Red Dot:", baseTabRedDot);
if (!baseTabRedDot) {
  console.error("ERROR: Base tab should have red dot when sub-reward active!");
  process.exit(1);
}

console.log("\n[TEST 3/3] Проверка Отображения Карты Мира с Индикатором...");
const worldHtml = window.G.rWorld();
console.log("  ✓ World HTML Rendered with Badge (len=" + worldHtml.length + ")");
if (!worldHtml.includes('cdef-traffic-pill') || !worldHtml.includes('ПРЕВОСХОДСТВО')) {
  console.error("ERROR: World screen missing traffic pill!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL RED DOT & TRAFFIC LIGHT TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
