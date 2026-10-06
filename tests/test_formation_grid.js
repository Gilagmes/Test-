const fs = require('fs');

console.log("==================================================");
console.log("  TESTING PRE-BATTLE FORMATION GRID (F-122)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    S: {
      power: 3000,
      heroes: [{ id: 'jo', n: 'Майор Джо', lv: 5 }],
      army: { melee: 100, ranged: 50, cavalry: 50 },
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: (s) => console.log("  [SOUND]:", s),
    save: () => {},
    calcPow: () => {}
  }
};
global.window = window;

let elements = {};
const mockModal = {
  className: '',
  id: '',
  innerHTML: '',
  querySelector: (sel) => elements[sel] || { onclick: null },
  remove: () => console.log("  ✓ Formation modal closed.")
};

global.document = {
  getElementById: (id) => null,
  createElement: (tag) => {
    if (tag === 'div') return mockModal;
    return { tagName: tag, style: {}, appendChild: () => {}, remove: () => {} };
  },
  body: { appendChild: () => {} }
};

// Evaluate twd-formation-grid-js
const scriptMatch = html.match(/<script id="twd-formation-grid-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-formation-grid-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Opening Pre-Battle Formation Screen...");
window.G.openPreBattleFormation();

console.log("  ✓ Formation Modal HTML length:", mockModal.innerHTML.length);
if (!mockModal.innerHTML.includes("Тактическая Расстановка Формации") || !mockModal.innerHTML.includes("Тяжелые Штурмовики")) {
  console.error("ERROR: Formation modal UI rendering failed!");
  process.exit(1);
}

console.log("[2/3] Setting Formation Preset 'Железная Стена' (60% Melee)...");
window.G.setArmyFormationPreset("iron_wall");

console.log("  ✓ Army Ratios after preset:", window.G.S.armyRatios);
if (window.G.S.armyRatios.melee !== 60 || window.G.S.armyRatios.ranged !== 20) {
  console.error("ERROR: Iron wall ratio preset failed!");
  process.exit(1);
}

console.log("[3/3] Setting Formation Preset 'Залп Стрелков' (60% Ranged)...");
window.G.setArmyFormationPreset("sniper_volley");

console.log("  ✓ Army Ratios after sniper preset:", window.G.S.armyRatios);
if (window.G.S.armyRatios.ranged !== 60 || window.G.S.armyRatios.melee !== 20) {
  console.error("ERROR: Sniper volley ratio preset failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL PRE-BATTLE FORMATION TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
