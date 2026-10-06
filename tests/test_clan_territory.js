const fs = require('fs');

console.log("==================================================");
console.log("  TESTING CLAN TERRITORY WATCHTOWERS (F-118)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    IC: { food: '🍖', wood: '🪵', metal: '⚙', gems: '💎' },
    S: {
      power: 3000,
      res: { wood: 5000, metal: 3000 },
      gems: 100,
      clanTowers: {
        built: ["tower_north"],
        levels: { tower_north: 1 }
      },
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
  createElement: (tag) => ({ tagName: tag, style: {}, appendChild: () => {}, remove: () => {} }),
  body: { appendChild: () => {} }
};

// Evaluate twd-clan-territory-js
const scriptMatch = html.match(/<script id="twd-clan-territory-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-clan-territory-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Testing Clan Territory UI rendering...");
const uiHtml = window.G.rClanTerritoryUI();
console.log("  ✓ Territory UI length:", uiHtml.length);
if (!uiHtml.includes("Северный Мыс") || !uiHtml.includes("Восточные Топи")) {
  console.error("ERROR: Watchtowers missing in UI HTML!");
  process.exit(1);
}

console.log("[2/3] Building Watchtower #2: 'Форпост Восточные Топи'...");
const woodBefore = window.G.S.res.wood;
const metalBefore = window.G.S.res.metal;
const powerBefore = window.G.S.power;

window.G.buildClanTower("tower_swamp");

console.log("  ✓ Wood after build:", window.G.S.res.wood, `(-${woodBefore - window.G.S.res.wood})`);
console.log("  ✓ Metal after build:", window.G.S.res.metal, `(-${metalBefore - window.G.S.res.metal})`);
console.log("  ✓ Power after build:", window.G.S.power, `(+${window.G.S.power - powerBefore})`);
console.log("  ✓ Built towers list:", window.G.S.clanTowers.built);

if (!window.G.S.clanTowers.built.includes("tower_swamp") || window.G.S.power !== powerBefore + 800) {
  console.error("ERROR: Tower build calculation failed!");
  process.exit(1);
}

console.log("[3/3] Upgrading existing Watchtower #1 ('Северный Мыс') to Lv.2...");
const lvBefore = window.G.S.clanTowers.levels.tower_north;
window.G.buildClanTower("tower_north");

console.log("  ✓ Level after upgrade:", window.G.S.clanTowers.levels.tower_north, `(was: ${lvBefore})`);
if (window.G.S.clanTowers.levels.tower_north !== 2) {
  console.error("ERROR: Tower upgrade failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL CLAN TERRITORY TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
