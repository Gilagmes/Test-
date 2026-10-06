const fs = require('fs');

console.log("==================================================");
console.log("  TESTING 3D BASE BUILDING LAYOUT EDITOR (F-120)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    S: {
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: (s) => console.log("  [SOUND]:", s),
    save: () => {}
  }
};
global.window = window;

let mockModal = {
  className: '',
  id: '',
  innerHTML: '',
  remove: () => console.log("  ✓ Layout modal closed.")
};

global.document = {
  getElementById: (id) => null,
  querySelector: () => null,
  createElement: (tag) => {
    if (tag === 'div') return mockModal;
    return { tagName: tag, style: {}, appendChild: () => {}, remove: () => {} };
  },
  body: { appendChild: () => {} }
};

// Evaluate twd-base-layout-js
const scriptMatch = html.match(/<script id="twd-base-layout-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-base-layout-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Opening 3D Base Layout Editor...");
window.G.openBaseLayoutEditor();

console.log("  ✓ Layout Editor HTML length:", mockModal.innerHTML.length);
if (!mockModal.innerHTML.includes("Режим Планировки 3D-Базы") || !mockModal.innerHTML.includes("Ферма")) {
  console.error("ERROR: Layout Editor UI failed to render!");
  process.exit(1);
}

console.log("[2/3] Moving Farm to Plot #4 (Научный кластер)...");
window.G.assignBuildingToPlot("farm", "plot_4");

console.log("  ✓ Farm position:", window.G.S.bldPositions.farm);
console.log("  ✓ Lab swapped position:", window.G.S.bldPositions.lab);

if (window.G.S.bldPositions.farm.plotId !== "plot_4" || window.G.S.bldPositions.lab.plotId !== "plot_1") {
  console.error("ERROR: Plot assignment and swapping failed!");
  process.exit(1);
}

console.log("[3/3] Resetting Base Layout to Defaults...");
window.G.resetDefaultBaseLayout();

console.log("  ✓ Farm restored plot:", window.G.S.bldPositions.farm.plotId);
console.log("  ✓ Lab restored plot:", window.G.S.bldPositions.lab.plotId);

if (window.G.S.bldPositions.farm.plotId !== "plot_1" || window.G.S.bldPositions.lab.plotId !== "plot_4") {
  console.error("ERROR: Reset to default layout failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL BASE LAYOUT TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
