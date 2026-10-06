const fs = require('fs');

console.log("==================================================");
console.log("  TESTING BASE OBSTACLES & EXPANSION (F-116)");
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
      energy: 50,
      gems: 50,
      res: { food: 500, wood: 500, metal: 500 },
      clearedObstacles: ["obs_cars"],
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

// Evaluate twd-base-obstacles-js
const scriptMatch = html.match(/<script id="twd-base-obstacles-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-base-obstacles-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Testing Base Obstacles UI rendering...");
const uiHtml = window.G.rBaseObstaclesUI();
console.log("  ✓ Obstacles UI length:", uiHtml.length);
if (!uiHtml.includes("Завал разбитых авто") || !uiHtml.includes("Мертвый лес и бурелом")) {
  console.error("ERROR: Obstacles missing from UI HTML!");
  process.exit(1);
}

console.log("[2/3] Clearing Sector B: 'Мертвый лес и бурелом'...");
const woodBefore = window.G.S.res.wood;
const foodBefore = window.G.S.res.food;
const energyBefore = window.G.S.energy;
const powerBefore = window.G.S.power;

window.G.clearBaseObstacle("obs_woods");

console.log("  ✓ Energy after clearing:", window.G.S.energy, `(-${energyBefore - window.G.S.energy})`);
console.log("  ✓ Wood after clearing:", window.G.S.res.wood, `(+${window.G.S.res.wood - woodBefore})`);
console.log("  ✓ Food after clearing:", window.G.S.res.food, `(+${window.G.S.res.food - foodBefore})`);
console.log("  ✓ Power after clearing:", window.G.S.power, `(+${window.G.S.power - powerBefore})`);

if (window.G.S.res.wood !== woodBefore + 1200 || window.G.S.power !== powerBefore + 250) {
  console.error("ERROR: Obstacle loot calculation failed!");
  process.exit(1);
}

console.log("[3/3] Clearing Combat Sector C: 'Логово бродячих ходячих' (Req Power 1200)...");
const gemsBefore = window.G.S.gems;
window.G.clearBaseObstacle("obs_walkers");

console.log("  ✓ Gems after combat clearing:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Cleared obstacles list:", window.G.S.clearedObstacles);

if (!window.G.S.clearedObstacles.includes("obs_walkers") || window.G.S.gems !== gemsBefore + 30) {
  console.error("ERROR: Combat obstacle clearing failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL BASE OBSTACLES TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
