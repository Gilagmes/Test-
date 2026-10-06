const fs = require('fs');

console.log("==================================================");
console.log("  TESTING ALLIANCE JOINT DEFENSE & CRISIS (F-125)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    IC: { food: '🍖', wood: '🪵', metal: '⚙', gems: '💎' },
    S: {
      power: 4000,
      gems: 100,
      res: { food: 5000, metal: 3000 },
      jointDefense: {
        honorPoints: 250,
        bases: {
          base_dawn: { hp: 1200, reinforced: false, defended: false },
          base_nitrogen: { hp: 2000, reinforced: false, defended: false },
          base_supreme: { hp: 3000, reinforced: false, defended: false }
        }
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

// Evaluate twd-alliance-defense-js
const scriptMatch = html.match(/<script id="twd-alliance-defense-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-alliance-defense-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Testing Joint Defense UI rendering...");
const uiHtml = window.G.rAllianceJointDefenseUI();
console.log("  ✓ Alliance Defense UI length:", uiHtml.length);
if (!uiHtml.includes("Форпост «Новый Рассвет»") || !uiHtml.includes("Магазин Чести Альянса")) {
  console.error("ERROR: Alliance Joint Defense UI rendering failed!");
  process.exit(1);
}

console.log("[2/3] Sending Reinforcements to 'Новый Рассвет'...");
const hpBefore = window.G.S.jointDefense.bases.base_dawn.hp;
window.G.sendAllianceReinforcements("base_dawn");

console.log("  ✓ Base HP after garrison arrival:", window.G.S.jointDefense.bases.base_dawn.hp, `(+${window.G.S.jointDefense.bases.base_dawn.hp - hpBefore})`);
console.log("  ✓ Reinforced state:", window.G.S.jointDefense.bases.base_dawn.reinforced);

if (!window.G.S.jointDefense.bases.base_dawn.reinforced || window.G.S.jointDefense.bases.base_dawn.hp <= hpBefore) {
  console.error("ERROR: Reinforcement dispatch failed!");
  process.exit(1);
}

console.log("[3/3] Buying 'Осколки Мелиссы ×5' in Honor Shop (Cost: 200 Honor)...");
const honorBefore = window.G.S.jointDefense.honorPoints;
const gemsBefore = window.G.S.gems;
const powerBefore = window.G.S.power;

window.G.buyAllianceHonorItem("melissa_shards");

console.log("  ✓ Honor after purchase:", window.G.S.jointDefense.honorPoints, `(-${honorBefore - window.G.S.jointDefense.honorPoints})`);
console.log("  ✓ Gems after purchase:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Power after purchase:", window.G.S.power, `(+${window.G.S.power - powerBefore})`);

if (window.G.S.jointDefense.honorPoints !== 50 || window.G.S.gems !== gemsBefore + 50) {
  console.error("ERROR: Alliance Honor purchase failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL ALLIANCE JOINT DEFENSE TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
