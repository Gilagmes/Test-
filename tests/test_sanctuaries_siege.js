const fs = require('fs');

console.log("==================================================");
console.log("  TESTING REGIONAL SANCTUARIES & SIEGES (F-114)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    IC: { food: '🍖', wood: '🪵', metal: '⚙', gems: '💎' },
    S: {
      power: 10000,
      energy: 50,
      gems: 50,
      res: { food: 500, wood: 500, metal: 500 },
      sanctuaries: {
        captured: ["sanc_iron"],
        lastClaim: {}
      },
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: () => {},
    save: () => {},
    updTop: () => {},
    rPanel: () => {}
  }
};
global.window = window;

const elements = {};
const mockModal = {
  innerHTML: '',
  querySelector: (sel) => {
    if (!elements[sel]) elements[sel] = { onclick: null };
    return elements[sel];
  },
  remove: () => console.log("  ✓ Siege modal closed on victory.")
};

global.document = {
  getElementById: (id) => null,
  createElement: (tag) => {
    if (tag === 'div') return mockModal;
    return { tagName: tag, style: {}, appendChild: () => {}, remove: () => {} };
  },
  body: { appendChild: () => {} }
};

// Evaluate twd-sanctuaries-js
const scriptMatch = html.match(/<script id="twd-sanctuaries-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-sanctuaries-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Testing Sanctuaries UI rendering...");
const uiHtml = window.G.rSanctuariesUI();
console.log("  ✓ UI HTML length:", uiHtml.length);
if (!uiHtml.includes("Форт «Железный Рубеж»") || !uiHtml.includes("Цитадель Апекс-Зеро")) {
  console.error("ERROR: Sanctuaries UI missing sanctuary cards!");
  process.exit(1);
}

console.log("[2/3] Claiming Daily Tribute from captured Fort 'Железный Рубеж'...");
const woodBefore = window.G.S.res.wood;
const gemsBefore = window.G.S.gems;
window.G.claimSanctuaryLoot("sanc_iron");

console.log("  ✓ Wood after tribute:", window.G.S.res.wood, `(+${window.G.S.res.wood - woodBefore})`);
console.log("  ✓ Gems after tribute:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
if (window.G.S.res.wood <= woodBefore || window.G.S.gems <= gemsBefore) {
  console.error("ERROR: Daily tribute failed to award resources!");
  process.exit(1);
}

console.log("[3/3] Simulating 3-Phase Siege on Station 'Прометей'...");
const energyBefore = window.G.S.energy;
const powerBefore = window.G.S.power;
window.G.startSanctuarySiege("sanc_power");

console.log("  ✓ Energy after siege start:", window.G.S.energy, `(-${energyBefore - window.G.S.energy})`);
if (window.G.S.energy !== energyBefore - 25) {
  console.error("ERROR: Energy deduction failed!");
  process.exit(1);
}

// Simulate triggering attacks through modal buttons
mockModal.querySelector("#siegeBtnArt").onclick(); // Phase 1 -> 50%
mockModal.querySelector("#siegeBtnArt").onclick(); // Phase 1 done -> Phase 2
mockModal.querySelector("#siegeBtnArt").onclick(); // Phase 2 -> 50%
mockModal.querySelector("#siegeBtnArt").onclick(); // Phase 2 done -> Phase 3
mockModal.querySelector("#siegeBtnArt").onclick(); // Phase 3 -> 50%
mockModal.querySelector("#siegeBtnArt").onclick(); // Phase 3 done -> VICTORY!

console.log("  ✓ Captured sanctuaries:", window.G.S.sanctuaries.captured);
console.log("  ✓ Power after victory:", window.G.S.power, `(+${window.G.S.power - powerBefore})`);

if (!window.G.S.sanctuaries.captured.includes("sanc_power") || window.G.S.power <= powerBefore) {
  console.error("ERROR: Sanctuary capture did not apply!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL SANCTUARY SIEGE TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
