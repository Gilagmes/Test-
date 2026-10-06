const fs = require('fs');

console.log("Testing Apex Lore & Terminal Logic in Node...");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

const window = {
  G: {
    S: {
      res: { food: 500, wood: 500, metal: 200 },
      gems: 50,
      pow: 2000,
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    updTop: () => {},
    calcPow: () => {}
  }
};
global.window = window;
global.document = {
  body: {
    appendChild: () => {}
  },
  getElementById: (id) => {
    return {
      id,
      style: {},
      classList: { add: () => {}, remove: () => {} },
      innerHTML: ''
    };
  },
  createElement: (tag) => {
    return {
      tagName: tag,
      style: {},
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      remove: () => {}
    };
  },
  querySelector: () => null
};

const scriptMatch = html.match(/<script id="twd-apex-lore-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-apex-lore-js not found in HTML!");
  process.exit(1);
}

eval(scriptMatch[1]);

console.log("[1/4] Checking Apex initial state...");
if (!window.G.S.apexLogs) {
  console.error("ERROR: apexLogs not initialized!");
  process.exit(1);
}
console.log("  ✓ Initial apexLogs:", window.G.S.apexLogs);

console.log("[2/4] Triggering Drone Appearance and Shot Down...");
window.G.onApexDroneAppeared();
const gemsBefore = window.G.S.gems;
const metalBefore = window.G.S.res.metal;
window.G.shootApexDrone();

console.log("  ✓ Drones shot:", window.G.S.apexLogs.dronesShot);
console.log("  ✓ Gems after salvage:", window.G.S.gems, `(+${window.G.S.gems - gemsBefore})`);
console.log("  ✓ Metal after salvage:", window.G.S.res.metal, `(+${window.G.S.res.metal - metalBefore})`);
console.log("  ✓ Unlocked dossiers:", window.G.S.apexLogs.unlocked);

if (window.G.S.apexLogs.dronesShot < 1 || window.G.S.gems <= gemsBefore) {
  console.error("ERROR: Drone salvage rewards failed!");
  process.exit(1);
}

console.log("[3/4] Opening Apex Terminal & Decrypting Dossiers...");
window.G.openApexTerminal();

const foodBefore = window.G.S.res.food;
window.G.claimApexDossier(1);

console.log("  ✓ Claimed dossiers:", window.G.S.apexLogs.claimed);
console.log("  ✓ Food after decryption:", window.G.S.res.food, `(+${window.G.S.res.food - foodBefore})`);

if (!window.G.S.apexLogs.claimed.includes(1) || window.G.S.res.food < foodBefore + 1000) {
  console.error("ERROR: Dossier claim reward failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL APEX LORE & DRONE TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
