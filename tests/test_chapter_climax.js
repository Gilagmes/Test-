const fs = require('fs');

console.log("==================================================");
console.log("  TESTING TWD CHAPTER CLIMAX EVENTS");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: {
      base: ['buildings', 'tech', 'hospital'],
      heroes: ['roster', 'specialists'],
      social: ['quests', 'daily']
    },
    SL: {},
    QU: [
      { ch: 1, t: "Пепел надежды", st: [{ t: "Шаг 1" }, { t: "Шаг 2" }] }
    ],
    S: {
      ch: 1,
      qs: 2, // past the last step -> chapter done!
      res: { food: 500, wood: 500, metal: 200 },
      gems: 50,
      pow: 2000,
      trust: 0,
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: () => {},
    save: () => {},
    updAll: () => {},
    advEndgame: () => {}
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
  })
};

// Evaluate twd-chapter-climax-js
const scriptMatch = html.match(/<script id="twd-chapter-climax-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-chapter-climax-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Triggering Chapter 1 Climax Event directly...");
window.G.triggerChapterClimax(1);

console.log("[2/3] Confirming Chapter 1 Climax and claiming Grand Rewards...");
const gemsBefore = window.G.S.gems;
const foodBefore = window.G.S.res.food;
const powBefore = window.G.S.pow;

window.G.confirmChapterClimax(1);

console.log("  ✓ New Chapter:", window.G.S.ch, "(was 1)");
console.log("  ✓ Gems after Climax:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Food after Climax:", window.G.S.res.food, `(+${window.G.S.res.food - foodBefore})`);
console.log("  ✓ Power after Climax:", window.G.S.pow, `(+${window.G.S.pow - powBefore})`);

if (window.G.S.ch !== 2 || window.G.S.gems < gemsBefore + 100 || window.G.S.res.food < foodBefore + 1500) {
  console.error("ERROR: Chapter Climax rewards / chapter increment failed!");
  process.exit(1);
}

console.log("[3/3] Testing G.advQ integration when chapter is completed...");
window.G.S.ch = 1;
window.G.S.qs = 2; // Chapter finished
window.G.advQ(); // Should trigger Climax without throwing error

console.log("\n==================================================");
console.log("  ALL CHAPTER CLIMAX TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
