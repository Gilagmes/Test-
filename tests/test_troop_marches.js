const fs = require('fs');

console.log("==================================================");
console.log("  TESTING ANIMATED TROOP MARCHES & CONVOYS (F-112)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    S: {
      sec: 4,
      energy: 50,
      gems: 50,
      heroes: [{ id: 'jo', n: 'Майор Джо' }],
      army: { melee: 100, ranged: 50, cavalry: 20 },
      tutDone: true
    },
    secInfo: (s) => ({ n: 'Развилка шоссе №' + s, req: 1500 }),
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: () => {},
    save: () => {},
    updTop: () => {},
    rWorld: () => '<div class="world-base">World</div>'
  }
};
global.window = window;
global.document = {
  getElementById: (id) => null,
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {} },
    appendChild: () => {},
    remove: () => {}
  }),
  body: { appendChild: () => {} }
};

// Evaluate twd-troop-marches-js
const scriptMatch = html.match(/<script id="twd-troop-marches-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-troop-marches-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/4] Launching Assault Troop March towards Sector 5...");
let completed = false;
const marchId = window.G.launchTroopMarch("assault", "Сектор 5 (Развилка шоссе №5)", { x: 500, y: 500 }, 2500, (m) => {
  console.log("  ✓ Callback fired! March arrived at:", m.targetName);
  completed = true;
});

console.log("  ✓ Active marches count:", window.G.S.activeMarches.length);
if (window.G.S.activeMarches.length !== 1) {
  console.error("ERROR: March not added to activeMarches!");
  process.exit(1);
}

console.log("[2/4] Testing HTML Rendering of Active Marches Panel...");
const panelHtml = window.G.getActiveMarchesHTML();
console.log("  ✓ Rendered HTML length:", panelHtml.length);
if (!panelHtml.includes("Сектор 5") || !panelHtml.includes("Майор Джо")) {
  console.error("ERROR: March details missing in HTML!");
  process.exit(1);
}

console.log("[3/4] Testing Gem Speed Up (⚡ 💎10)...");
const gemsBefore = window.G.S.gems;
window.G.speedUpMarch(marchId);
console.log("  ✓ Gems after speedup:", window.G.S.gems, `(-${gemsBefore - window.G.S.gems})`);
if (window.G.S.gems !== gemsBefore - 10) {
  console.error("ERROR: Gem cost for speedup failed!");
  process.exit(1);
}

console.log("[4/4] Testing March Completion...");
window.G.completeTroopMarch(marchId, (m) => {
  console.log("  ✓ Forced completion test callback fired!");
});
console.log("  ✓ Active marches after completion:", window.G.S.activeMarches.length);
if (window.G.S.activeMarches.length !== 0) {
  console.error("ERROR: March not removed from queue!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL TROOP MARCHES TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
