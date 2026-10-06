const fs = require('fs');

console.log("==================================================");
console.log("  TESTING TWD CLARITY ENGINE & BUILDING SHEETS");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
let createdElements = [];
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    IC: { food: '🍖', wood: '🪵', metal: '⚙', gems: '💎' },
    S: {
      power: 3000,
      gems: 100,
      res: { food: 500, wood: 500, metal: 300 },
      bld: { hq: 1, farm: 0, saw: 0 },
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: (s) => console.log("  [SOUND]:", s),
    save: () => {},
    updTop: () => {},
    rPanel: () => {}
  }
};
global.window = window;
global.document = {
  getElementById: (id) => null,
  createElement: (tag) => {
    const el = { tagName: tag, style: {}, innerHTML: '', appendChild: () => {}, remove: () => {} };
    createdElements.push(el);
    return el;
  },
  body: { appendChild: (el) => createdElements.push(el) }
};

// Evaluate twd-clarity-engine-js
const scriptMatch = html.match(/<script id="twd-clarity-engine-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-clarity-engine-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Opening TWD Building Sheet for Farm (Level 0 -> 1)...");
window.G.openTWDBuildingSheet("farm");
const sheet = createdElements[0];
console.log("  ✓ Created Sheet Element:", sheet ? sheet.tagName : 'none');
if (!sheet || !sheet.innerHTML.includes("Ферма · Ур. 0") || !sheet.innerHTML.includes("ВОЗВЕСТИ ПОСТРОЙКУ")) {
  console.error("ERROR: Building sheet rendering failed!");
  process.exit(1);
}

console.log("[2/3] Confirming Farm Upgrade to Level 1...");
const woodBefore = window.G.S.res.wood;
const foodBefore = window.G.S.res.food;
const powerBefore = window.G.S.power;

window.G.confirmTWDBuildingUpgrade("farm");

console.log("  ✓ Farm Level after build:", window.G.S.bld.farm);
console.log("  ✓ Wood deducted:", woodBefore - window.G.S.res.wood);
console.log("  ✓ Food deducted:", foodBefore - window.G.S.res.food);
console.log("  ✓ Power added:", window.G.S.power - powerBefore);

if (window.G.S.bld.farm !== 1 || window.G.S.power <= powerBefore) {
  console.error("ERROR: Building upgrade confirmation failed!");
  process.exit(1);
}

console.log("[3/3] Testing Smart Quest Action Auto-Opening Sawmill Sheet (Farm already built)...");
createdElements = [];
window.G.executeSmartQuestAction();
const sawSheet = createdElements[0];
console.log("  ✓ Target Building Sheet opened for Sawmill:", sawSheet && sawSheet.innerHTML.includes("Лесопилка · Ур. 0"));

if (!sawSheet || !sawSheet.innerHTML.includes("Лесопилка · Ур. 0")) {
  console.error("ERROR: Smart quest direct action failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL TWD CLARITY ENGINE TESTS PASSED 100%!     ");
console.log("==================================================");
process.exit(0);
