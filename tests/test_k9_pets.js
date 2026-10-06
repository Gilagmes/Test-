const fs = require('fs');

console.log("==================================================");
console.log("  TESTING CITADEL K9 COMPANIONS & PETS (F-124)");
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
      gems: 50,
      res: { food: 2000, metal: 1000 },
      k9: {
        activeId: 'rex',
        level: 1,
        xp: 0,
        stashReady: true
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

// Evaluate twd-k9-pets-js
const scriptMatch = html.match(/<script id="twd-k9-pets-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-k9-pets-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/4] Testing K9 Companion UI rendering...");
const uiHtml = window.G.rK9CompanionUI();
console.log("  ✓ K9 UI length:", uiHtml.length);
if (!uiHtml.includes("Овчарка «Рекс»") || !uiHtml.includes("Тайник обнаружен")) {
  console.error("ERROR: K9 Companion UI rendering failed!");
  process.exit(1);
}

console.log("[2/4] Training K9 Companion (Lv.1 -> Lv.2)...");
const foodBefore = window.G.S.res.food;
const powerBefore = window.G.S.power;
window.G.trainK9Companion();

console.log("  ✓ Food after training:", window.G.S.res.food, `(-${foodBefore - window.G.S.res.food})`);
console.log("  ✓ Companion Level:", window.G.S.k9.level);
console.log("  ✓ Power after training:", window.G.S.power, `(+${window.G.S.power - powerBefore})`);

if (window.G.S.k9.level !== 2 || window.G.S.power !== powerBefore + 150) {
  console.error("ERROR: K9 companion training failed!");
  process.exit(1);
}

console.log("[3/4] Digging Hidden Stash with Rex...");
const gemsBefore = window.G.S.gems;
window.G.digK9Treasure();

console.log("  ✓ Gems after digging stash:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Stash ready state:", window.G.S.k9.stashReady);

if (window.G.S.gems <= gemsBefore || window.G.S.k9.stashReady !== false) {
  console.error("ERROR: Stash treasure claim failed!");
  process.exit(1);
}

console.log("[4/4] Switching Active Companion to 'Доберман Тайфун'...");
window.G.setActiveK9("typhoon");
console.log("  ✓ Active Breed ID:", window.G.S.k9.activeId);
if (window.G.S.k9.activeId !== "typhoon") {
  console.error("ERROR: Companion breed switch failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL K9 COMPANION TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
