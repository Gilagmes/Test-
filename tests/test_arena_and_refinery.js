const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;

// Mock DOM
const dummyElem = {
  style: {},
  classList: {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false
  },
  innerHTML: '',
  textContent: '',
  appendChild: () => {},
  append: () => {},
  prepend: () => {},
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => null,
  remove: () => {}
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  head: dummyElem,
  body: dummyElem,
  getElementById: (id) => ({ ...dummyElem, id }),
  querySelector: () => dummyElem,
  querySelectorAll: () => [],
  createElement: (tag) => ({ ...dummyElem, tagName: tag })
};

// Mock Game State G
global.G = {
  S: {
    heroes: [],
    res: { gems: 1000 }
  },
  snd: () => {},
  toast: () => {},
  updAll: () => {}
};

// Load js/twd-systems.js target block
const fs = require('fs');
const path = require('path');
const twdJsPath = path.resolve(__dirname, '../js/twd-systems.js');
const twdJsCode = fs.readFileSync(twdJsPath, 'utf-8');

const marker = 'window.TWD_SurvivorArena = {';
const idx = twdJsCode.indexOf(marker);
if (idx !== -1) {
  const iifeStart = twdJsCode.lastIndexOf('(function()', idx);
  const targetCode = twdJsCode.substring(iifeStart !== -1 ? iifeStart : idx);
  eval(targetCode);
}

console.log('--- Testing TWD Survivor 3v3 Arena & Gear Refinery ---');

// Test 1: Tactical 3v3 Arena
assert.ok(window.TWD_SurvivorArena, 'TWD_SurvivorArena must exist');
const initialPts = window.TWD_SurvivorArena.points;
window.TWD_SurvivorArena.fight('opp_1');
assert.strictEqual(window.TWD_SurvivorArena.points, initialPts + 35, 'Arena points should increase after duel');
assert.strictEqual(global.G.S.res.gems, 1050, 'Gems should increase by +50');
console.log('✓ Test 1: Survivor 3v3 Tactical Arena passed');

// Test 2: Gear Refinery
assert.ok(window.TWD_GearRefinery, 'TWD_GearRefinery must exist');
const initialWpnLvl = window.TWD_GearRefinery.heroGear.vic.weapon.lvl;
window.TWD_GearRefinery.upgradeSlot('vic', 'weapon');
assert.strictEqual(window.TWD_GearRefinery.heroGear.vic.weapon.lvl, initialWpnLvl + 1, 'Weapon level should increment by 1');
console.log('✓ Test 2: 4-Slot Gear Refinery & Sharpening passed');

console.log('ALL Survivor Arena & Gear Refinery tests PASS 100%!');
process.exit(0);
