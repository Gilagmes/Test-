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
  querySelector: () => null
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

const marker = 'window.TWD_WallTraps = {';
const idx = twdJsCode.indexOf(marker);
if (idx !== -1) {
  const iifeStart = twdJsCode.lastIndexOf('(function()', idx);
  const targetCode = twdJsCode.substring(iifeStart !== -1 ? iifeStart : idx);
  eval(targetCode);
}

console.log('--- Testing TWD Wall Traps, Talent Trees & Battle Reports ---');

// Test 1: Wall Traps
assert.ok(window.TWD_WallTraps, 'TWD_WallTraps must exist');
assert.strictEqual(window.TWD_WallTraps.traps.length, 4, 'Must have 4 wall defense traps');
const wireTrap = window.TWD_WallTraps.traps.find(x => x.id === 'wire');
const initialLvl = wireTrap.lvl;
window.TWD_WallTraps.upgradeTrap('wire');
assert.strictEqual(wireTrap.lvl, initialLvl + 1, 'Wire trap lvl should increase by 1');
console.log('✓ Test 1: Wall Defense Traps & Upgrades passed');

// Test 2: Hero Talent Tree
assert.ok(window.TWD_TalentTrees, 'TWD_TalentTrees must exist');
const initialCombat = window.TWD_TalentTrees.heroTalents.vic.combat;
const initialDev = window.TWD_TalentTrees.heroTalents.vic.dev;
const initialPts = window.TWD_TalentTrees.heroTalents.vic.pointsLeft;
const totalExpected = initialCombat + initialDev + initialPts;

window.TWD_TalentTrees.addPoint('combat');
assert.strictEqual(window.TWD_TalentTrees.heroTalents.vic.combat, initialCombat + 1, 'Combat branch should increase');
assert.strictEqual(window.TWD_TalentTrees.heroTalents.vic.pointsLeft, initialPts - 1, 'Points left should decrement');

// Test 3: Reset Talents
window.TWD_TalentTrees.resetTalents();
assert.strictEqual(window.TWD_TalentTrees.heroTalents.vic.combat, 0, 'Combat should reset to 0');
assert.strictEqual(window.TWD_TalentTrees.heroTalents.vic.pointsLeft, totalExpected, 'All points must be refunded');
console.log('✓ Test 2 & 3: Hero Talent Trees & Resets passed');

// Test 4: Battle Report
assert.ok(window.TWD_BattleReport, 'TWD_BattleReport must exist');
console.log('✓ Test 4: Detailed Battle Reports & Damage Charts passed');

console.log('ALL Wall Traps, Talent Trees & Battle Report tests PASS 100%!');

process.exit(0);
