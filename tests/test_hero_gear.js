const fs = require('fs');

console.log("==================================================");
console.log("  TESTING HERO GEAR & TACTICAL SETS (F-117)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    IC: { food: '🍖', wood: '🪵', metal: '⚙', gems: '💎' },
    S: {
      power: 2000,
      res: { metal: 2000 },
      heroes: [{ id: 'jo', n: 'Майор Джо', lv: 5, a: 20, d: 15, cls: 'Снайпер' }],
      inv: [],
      equip: {},
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: (s) => console.log("  [SOUND]:", s),
    save: () => {},
    updTop: () => {},
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
  remove: () => console.log("  ✓ Gear modal closed.")
};

global.document = {
  getElementById: (id) => null,
  createElement: (tag) => {
    if (tag === 'div') return mockModal;
    return { tagName: tag, style: {}, appendChild: () => {}, remove: () => {} };
  },
  body: { appendChild: () => {} }
};

// Evaluate twd-hero-gear-js
const scriptMatch = html.match(/<script id="twd-hero-gear-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-hero-gear-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Auto-Equipping Best Gear for Major Joe...");
window.G.autoEquipHeroBest('jo');

const equipped = window.G.S.equip['jo'];
console.log("  ✓ Equipped slots:", Object.keys(equipped));
if (!equipped.weapon || !equipped.armor || !equipped.boots || !equipped.module) {
  console.error("ERROR: Not all 4 tactical slots were equipped!");
  process.exit(1);
}

console.log("[2/3] Testing Gear Enhancement (⬆ Заточка оружия за ⚙)...");
const metalBefore = window.G.S.res.metal;
const wpnAtkBefore = equipped.weapon.a;
window.G.enhanceHeroGearItem('jo', 'weapon');

console.log("  ✓ Metal after enhancement:", window.G.S.res.metal, `(-${metalBefore - window.G.S.res.metal})`);
console.log("  ✓ Weapon Level:", equipped.weapon.lv, `(Atk: ${equipped.weapon.a}, was: ${wpnAtkBefore})`);
if (equipped.weapon.lv !== 2 || equipped.weapon.a <= wpnAtkBefore) {
  console.error("ERROR: Weapon enhancement stat failed!");
  process.exit(1);
}

console.log("[3/3] Testing Gear Screen Rendering...");
window.G.showHeroEquip(0);
console.log("  ✓ Gear Screen HTML length:", mockModal.innerHTML.length);
if (!mockModal.innerHTML.includes("Тактическая Экипировка") || !mockModal.innerHTML.includes("Майор Джо")) {
  console.error("ERROR: Gear screen UI failed to render hero info!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL HERO GEAR & SET TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
