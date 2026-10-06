const fs = require('fs');

console.log("==================================================");
console.log("  TESTING ACTIVE COMMANDER ULTIMATES (F-123)");
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
      wHP: 100,
      wMax: 100,
      res: { food: 500, wood: 500, metal: 500 },
      cmdrUltCd: {},
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

// Evaluate twd-commander-skills-js
const scriptMatch = html.match(/<script id="twd-commander-skills-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-commander-skills-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Testing Commander Skills Bar UI rendering...");
const barHtml = window.G.rCommanderSkillsBar();
console.log("  ✓ Skills Bar length:", barHtml.length);
if (!barHtml.includes("Изобилие Урожая") || !barHtml.includes("Орбитальный Залп ПВО")) {
  console.error("ERROR: Skills Bar UI rendering failed!");
  process.exit(1);
}

console.log("[2/3] Activating Ultimate 'Изобилие Урожая' (Supply Surge)...");
const foodBefore = window.G.S.res.food;
window.G.useCommanderUltimate("harvest");

console.log("  ✓ Food after ultimate:", window.G.S.res.food, `(+${window.G.S.res.food - foodBefore})`);
if (window.G.S.res.food !== foodBefore + 1500) {
  console.error("ERROR: Supply surge reward calculation failed!");
  process.exit(1);
}

console.log("[3/3] Activating Ultimate 'Орбитальный Залп ПВО' (Orbital Strike)...");
const gemsBefore = window.G.S.gems;
const powerBefore = window.G.S.power;
window.G.useCommanderUltimate("nuke");

console.log("  ✓ Gems after orbital strike:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Power after orbital strike:", window.G.S.power, `(+${window.G.S.power - powerBefore})`);

if (window.G.S.gems !== gemsBefore + 20 || window.G.S.power !== powerBefore + 500) {
  console.error("ERROR: Orbital strike reward calculation failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL ACTIVE COMMANDER SKILLS TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
