const fs = require('fs');

console.log("==================================================");
console.log("  TESTING TWD UX SIMPLIFICATION & SMART 1-TAP QUEST");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    IC: { food: '🍖', wood: '🪵', metal: '⚙', gems: '💎' },
    BD: { farm: { n: 'Ферма' }, saw: { n: 'Лесопилка' } },
    S: {
      power: 3600,
      gems: 90,
      res: { food: 750, wood: 300, metal: 150 },
      bld: { hq: 1, farm: 1, saw: 0 },
      sec: 1,
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: (s) => console.log("  [SOUND]:", s),
    save: () => {},
    tab: (t, sub) => console.log(`  [TAB SWITCH]: ${t} / ${sub}`),
    openBuildModal: (b) => console.log(`  [BUILD MODAL]: ${b}`)
  }
};
global.window = window;
global.document = {
  getElementById: (id) => null,
  createElement: (tag) => ({ tagName: tag, style: {}, appendChild: () => {}, remove: () => {} }),
  body: { appendChild: () => {} }
};

// Evaluate twd-ux-simplification-js
const scriptMatch = html.match(/<script id="twd-ux-simplification-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-ux-simplification-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Testing Smart Quest Bar UI rendering...");
const questBarHtml = window.G.rSmartQuestBar();
console.log("  ✓ Smart Quest Bar length:", questBarHtml.length);
if (!questBarHtml.includes("Постройте Лесопилку") || !questBarHtml.includes("👉 К ЦЕЛИ")) {
  console.error("ERROR: Smart quest bar rendering failed!");
  process.exit(1);
}

console.log("[2/3] Testing 1-Tap Smart Quest Action Execution (Sawmill needed)...");
window.G.executeSmartQuestAction();

console.log("[3/3] Testing Smart Quest Bar when Sawmill is built...");
window.G.S.bld.saw = 1;
window.G.S.bld.wall = 1;
window.G.S.bld.bar = 1;
const updatedQuestBar = window.G.rSmartQuestBar();
console.log("  ✓ Updated Quest Bar text includes sector march:", updatedQuestBar.includes("Сектор 2"));

if (!updatedQuestBar.includes("Сектор 2") || !updatedQuestBar.includes("⚔️ В БОЙ")) {
  console.error("ERROR: Quest transition failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL TWD UX SIMPLIFICATION TESTS PASSED 100%!   ");
console.log("==================================================");
process.exit(0);
