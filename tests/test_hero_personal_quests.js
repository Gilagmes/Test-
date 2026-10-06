const fs = require('fs');

console.log("==================================================");
console.log("  TESTING PERSONAL HERO QUESTS & MASTERIES");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    S: {
      res: { food: 1000, wood: 1000, metal: 500 },
      gems: 50,
      pow: 2000,
      sec: 6, // Cleared up to Sector 6!
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

// Evaluate twd-hero-quests-js
const scriptMatch = html.match(/<script id="twd-hero-quests-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-hero-quests-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Triggering Joe's Personal Story Quest...");
window.G.openHeroPersonalQuest('jo');

console.log("[2/3] Claiming Joe's Mastery 'Хладнокровный Снайпер' (Req Sec=4, Cur Sec=6)...");
const gemsBefore = window.G.S.gems;
const powBefore = window.G.S.pow;

window.G.claimHeroMastery('jo');

console.log("  ✓ Completed Hero Quests:", window.G.S.heroQuests.completed);
console.log("  ✓ Gems after Mastery:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Power after Mastery:", window.G.S.pow, `(+${window.G.S.pow - powBefore})`);

if (!window.G.S.heroQuests.completed.includes('jo') || window.G.S.gems < gemsBefore + 50 || window.G.S.pow < powBefore + 1200) {
  console.error("ERROR: Joe's Mastery claim failed!");
  process.exit(1);
}

console.log("[3/3] Claiming Elena's Mastery 'Агрономическое Чудо' (Req Sec=6, Cur Sec=6)...");
const foodBefore = window.G.S.res.food;
window.G.claimHeroMastery('elena');

console.log("  ✓ Food after Elena's reward:", window.G.S.res.food, `(+${window.G.S.res.food - foodBefore})`);
console.log("  ✓ Completed Hero Quests:", window.G.S.heroQuests.completed);

if (!window.G.S.heroQuests.completed.includes('elena') || window.G.S.res.food < foodBefore + 2000) {
  console.error("ERROR: Elena's Mastery claim failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL PERSONAL HERO QUEST TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
