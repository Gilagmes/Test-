const fs = require('fs');

console.log("==================================================");
console.log("  TESTING SURVIVOR 3V3 TACTICAL ARENA (F-121)");
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
      inv: [],
      heroes: [
        { id: 'jo', n: 'Майор Джо', a: 25, lv: 10, i: '🏹' },
        { id: 'elena', n: 'Елена', a: 18, lv: 8, i: '🌾' },
        { id: 'marcus', n: 'Маркус', a: 20, lv: 8, i: '👷' }
      ],
      arena: {
        pts: 1450,
        coins: 300,
        wins: 5,
        battlesLeft: 5
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

let elements = {};
const mockModal = {
  className: '',
  id: '',
  innerHTML: '',
  querySelector: (sel) => elements[sel] || { onclick: null },
  remove: () => console.log("  ✓ Arena combat modal closed.")
};

global.document = {
  getElementById: (id) => null,
  createElement: (tag) => {
    if (tag === 'div') return mockModal;
    return { tagName: tag, style: {}, appendChild: () => {}, remove: () => {} };
  },
  body: { appendChild: () => {} }
};

// Evaluate twd-survivor-arena-js
const scriptMatch = html.match(/<script id="twd-survivor-arena-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-survivor-arena-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Testing Arena Tab UI rendering...");
const arenaHtml = window.G.rArena();
console.log("  ✓ Arena UI length:", arenaHtml.length);
if (!arenaHtml.includes("Бронзовая Лига") || !arenaHtml.includes("Командир «Волк»")) {
  console.error("ERROR: Arena UI rendering failed!");
  process.exit(1);
}

console.log("[2/3] Simulating 3v3 Arena Match against 'Командир Волк'...");
const ptsBefore = window.G.S.arena.pts;
const coinsBefore = window.G.S.arena.coins;
const gemsBefore = window.G.S.gems;

window.G.startArenaMatch("riv_wolf");

// Trigger attacks and ultimate
elements["#arenaBtnAttack"] = { onclick: null };
elements["#arenaBtnUlt"] = { onclick: null };

// Re-assign listeners from modal
window.G.startArenaMatch("riv_wolf");
mockModal.querySelector("#arenaBtnUlt").onclick();
mockModal.querySelector("#arenaBtnUlt").onclick(); // Fatal blow

console.log("  ✓ Rating Points after victory:", window.G.S.arena.pts, `(+${window.G.S.arena.pts - ptsBefore})`);
console.log("  ✓ Arena Coins after victory:", window.G.S.arena.coins, `(+${window.G.S.arena.coins - coinsBefore})`);
console.log("  ✓ Gems after victory:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);

if (window.G.S.arena.pts <= ptsBefore || window.G.S.arena.coins <= coinsBefore) {
  console.error("ERROR: Arena victory rewards failed!");
  process.exit(1);
}

console.log("[3/3] Buying 200 Gems Container in Arena Champion Shop...");
const coinsBeforeBuy = window.G.S.arena.coins;
const gemsBeforeBuy = window.G.S.gems;
window.G.buyArenaItem(4);

console.log("  ✓ Coins after buy:", window.G.S.arena.coins, `(-${coinsBeforeBuy - window.G.S.arena.coins})`);
console.log("  ✓ Gems after buy:", window.G.S.gems, `(+${window.G.S.gems - gemsBeforeBuy})`);

if (window.G.S.gems !== gemsBeforeBuy + 200) {
  console.error("ERROR: Arena Shop purchase failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL SURVIVOR 3V3 ARENA TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
