const fs = require('fs');

console.log("==================================================");
console.log("  TESTING INTERACTIVE TECH TREE CANVAS (F-113)");
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
      res: { food: 500, wood: 500, metal: 500 },
      bld: { lab: 3 },
      techTree: {
        researched: ["eco_1"],
        activeBranch: "eco"
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

// Evaluate twd-tech-tree-js
const scriptMatch = html.match(/<script id="twd-tech-tree-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-tech-tree-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/4] Testing Tech Tree HTML Rendering in Lab...");
const treeHtml = window.G.rTech();
console.log("  ✓ Tech Tree HTML length:", treeHtml.length);
if (!treeHtml.includes("Экономика и Развитие") || !treeHtml.includes("Агрокультура")) {
  console.error("ERROR: Tech Tree UI rendering missing branch nodes!");
  process.exit(1);
}

console.log("[2/4] Testing Branch Switch to Military (⚔️)...");
window.G.setTechBranch("mil");
console.log("  ✓ Active branch after switch:", window.G.S.techTree.activeBranch);
if (window.G.S.techTree.activeBranch !== "mil") {
  console.error("ERROR: Branch switch failed!");
  process.exit(1);
}

console.log("[3/4] Testing Research of 'eco_2' (Механизация Пилорамы)...");
window.G.setTechBranch("eco");
const powerBefore = window.G.S.power;
const woodBefore = window.G.S.res.wood;
window.G.researchTechNode("eco_2");

console.log("  ✓ Researched list:", window.G.S.techTree.researched);
console.log("  ✓ Power after tech:", window.G.S.power, `(+${window.G.S.power - powerBefore})`);
if (!window.G.S.techTree.researched.includes("eco_2") || window.G.S.power <= powerBefore) {
  console.error("ERROR: Tech research failed to apply!");
  process.exit(1);
}

console.log("[4/4] Testing Tech Dependency Protection (Trying 'eco_4' without 'eco_3')...");
const researchedBefore = window.G.S.techTree.researched.length;
window.G.researchTechNode("eco_4");
if (window.G.S.techTree.researched.length !== researchedBefore) {
  console.error("ERROR: Locked tech was researched without dependency!");
  process.exit(1);
}
console.log("  ✓ Dependency blocked correctly.");

console.log("\n==================================================");
console.log("  ALL TECH TREE CANVAS TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
