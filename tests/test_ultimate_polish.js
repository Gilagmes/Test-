const fs = require('fs');

console.log("==================================================");
console.log("  TESTING TWD ULTIMATE POLISH ENGINE (F-128)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    IC: { food: '🍖', wood: '🪵', metal: '⚙', gems: '💎' },
    HEROES: { jo: { n: 'Майор Джо' }, elena: { n: 'Елена' } },
    S: {
      power: 3500,
      gems: 100,
      res: { food: 2000, wood: 2000, metal: 1000 },
      army: { melee: 100, ranged: 50, cavalry: 30 },
      heroStars: { jo: 1, elena: 1 },
      clanDonations: { def: 1, points: 50 },
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

// Evaluate twd-ultimate-polish-js
const scriptMatch = html.match(/<script id="twd-ultimate-polish-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-ultimate-polish-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/4] Promoting Major Joe's Star Rank (★1 -> ★2)...");
const gemsBefore = window.G.S.gems;
const powerBefore = window.G.S.power;
window.G.promoteHeroStar("jo");

console.log("  ✓ Joe Star Rank:", window.G.S.heroStars.jo);
console.log("  ✓ Gems deducted:", gemsBefore - window.G.S.gems);
console.log("  ✓ Power added:", window.G.S.power - powerBefore);

if (window.G.S.heroStars.jo !== 2 || window.G.S.gems >= gemsBefore) {
  console.error("ERROR: Hero Star promotion failed!");
  process.exit(1);
}

console.log("[2/4] Training 25 Melee Fighters in Barracks...");
const foodBefore = window.G.S.res.food;
const metalBefore = window.G.S.res.metal;
const meleeBefore = window.G.S.army.melee;

window.G.trainTroopBatch("melee", 25);

console.log("  ✓ Melee Army size:", window.G.S.army.melee, `(+${window.G.S.army.melee - meleeBefore})`);
console.log("  ✓ Food cost:", foodBefore - window.G.S.res.food);
console.log("  ✓ Metal cost:", metalBefore - window.G.S.res.metal);

if (window.G.S.army.melee !== meleeBefore + 25) {
  console.error("ERROR: Troop batch training failed!");
  process.exit(1);
}

console.log("[3/4] Donating Wood to Clan Defense Research...");
const woodBefore = window.G.S.res.wood;
const pointsBefore = window.G.S.clanDonations.points;

window.G.donateClanResearch("def");

console.log("  ✓ Clan Tech Lv:", window.G.S.clanDonations.def);
console.log("  ✓ Donation points added:", window.G.S.clanDonations.points - pointsBefore);
console.log("  ✓ Wood deducted:", woodBefore - window.G.S.res.wood);

if (window.G.S.clanDonations.def !== 2 || window.G.S.clanDonations.points <= pointsBefore) {
  console.error("ERROR: Clan donation failed!");
  process.exit(1);
}

console.log("[4/4] Testing Barracks UI Widget Rendering...");
const barracksHtml = window.G.rBarracksTrainingUI();
console.log("  ✓ Barracks HTML length:", barracksHtml.length);
if (!barracksHtml.includes("ВОЕННАЯ КАЗАРМА") || !barracksHtml.includes("Рукопашники")) {
  console.error("ERROR: Barracks UI rendering failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL TWD ULTIMATE POLISH TESTS PASSED 100%!     ");
console.log("==================================================");
process.exit(0);
