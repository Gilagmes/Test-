const fs = require('fs');

console.log("==================================================");
console.log("  TESTING COMMANDER MORAL DILEMMAS & CHOICES");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    S: {
      res: { food: 1000, wood: 1000, metal: 500 },
      gems: 50,
      pow: 2000,
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: () => {},
    save: () => {},
    updTop: () => {},
    calcPow: () => {}
  }
};
global.window = window;
global.document = {
  getElementById: (id) => ({
    id,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    innerHTML: ''
  }),
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    remove: () => {}
  }),
  body: { appendChild: () => {} }
};

// Evaluate twd-moral-dilemmas-js
const scriptMatch = html.match(/<script id="twd-moral-dilemmas-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-moral-dilemmas-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Triggering Dilemma #01 Modal...");
window.G.openDilemmaModal(1);

console.log("[2/3] Resolving Choice 'humanity' for Dilemma #01...");
const foodBefore = window.G.S.res.food;
const gemsBefore = window.G.S.gems;
const powBefore = window.G.S.pow;

window.G.resolveDilemma(1, 'humanity');

console.log("  ✓ Food after cost:", window.G.S.res.food, `(-${foodBefore - window.G.S.res.food})`);
console.log("  ✓ Gems after reward:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Power after reward:", window.G.S.pow, `(+${window.G.S.pow - powBefore})`);
console.log("  ✓ Next Pending Dilemma:", window.G.S.dilemmas.pending);
console.log("  ✓ History:", window.G.S.dilemmas.history);

if (window.G.S.res.food !== foodBefore - 150 || window.G.S.dilemmas.pending !== 2 || window.G.S.dilemmas.history.length !== 1) {
  console.error("ERROR: Dilemma #01 resolution failed!");
  process.exit(1);
}

console.log("[3/3] Resolving Dilemma #02 (Apex Defector)...");
const metalBefore = window.G.S.res.metal;
window.G.resolveDilemma(2, 'recruit');

console.log("  ✓ Metal after recruitment:", window.G.S.res.metal, `(+${window.G.S.res.metal - metalBefore})`);
console.log("  ✓ Next Pending Dilemma:", window.G.S.dilemmas.pending);

if (window.G.S.dilemmas.pending !== 3 || window.G.S.dilemmas.history.length !== 2) {
  console.error("ERROR: Dilemma #02 resolution failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL MORAL DILEMMA TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
