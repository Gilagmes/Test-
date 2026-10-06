const fs = require('fs');

console.log("==================================================");
console.log("  TESTING 3D FLOATING RESOURCE BUBBLES & HARVEST");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  innerWidth: 1024,
  innerHeight: 768,
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    S: {
      res: { food: 500, wood: 500, metal: 300 },
      gems: 50,
      bld: { farm: 3, saw: 2, wrk: 2, lab: 1 },
      heroBldAssign: { farm: 'elena' },
      heroes: [{ id: 'elena', n: 'Елена' }],
      heroQuests: { completed: ['elena'] },
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: () => {},
    save: () => {},
    updTop: () => {}
  }
};
global.window = window;
global.document = {
  getElementById: (id) => ({ id, style: {}, innerHTML: '' }),
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {} },
    appendChild: () => {},
    remove: () => {}
  }),
  body: { appendChild: () => {} }
};

// Evaluate twd-floating-harvest-js
const scriptMatch = html.match(/<script id="twd-floating-harvest-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-floating-harvest-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/4] Harvesting Farm in 3D (with Lv.3 + Elena Specialist + Mastery)...");
const foodBefore = window.G.S.res.food;
window.G.harvest3DBuilding('farm', 200, 300);

console.log("  ✓ Food after 3D harvest:", window.G.S.res.food, `(+${window.G.S.res.food - foodBefore})`);
if (window.G.S.res.food <= foodBefore) {
  console.error("ERROR: Farm harvest yield failed!");
  process.exit(1);
}

console.log("[2/4] Harvesting Sawmill in 3D (Lv.2)...");
const woodBefore = window.G.S.res.wood;
window.G.harvest3DBuilding('saw', 250, 300);

console.log("  ✓ Wood after 3D harvest:", window.G.S.res.wood, `(+${window.G.S.res.wood - woodBefore})`);
if (window.G.S.res.wood <= woodBefore) {
  console.error("ERROR: Sawmill harvest yield failed!");
  process.exit(1);
}

console.log("[3/4] Harvesting Workshop in 3D (Lv.2)...");
const metalBefore = window.G.S.res.metal;
window.G.harvest3DBuilding('wrk', 300, 300);

console.log("  ✓ Metal after 3D harvest:", window.G.S.res.metal, `(+${window.G.S.res.metal - metalBefore})`);
if (window.G.S.res.metal <= metalBefore) {
  console.error("ERROR: Workshop harvest yield failed!");
  process.exit(1);
}

console.log("[4/4] Harvesting Lab in 3D (Lv.1)...");
const gemsBefore = window.G.S.gems;
window.G.harvest3DBuilding('lab', 350, 300);

console.log("  ✓ Gems after 3D harvest:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
if (window.G.S.gems <= gemsBefore) {
  console.error("ERROR: Lab gems harvest yield failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL 3D FLOATING HARVEST TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
