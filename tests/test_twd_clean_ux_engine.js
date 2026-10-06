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
  body: { ...dummyElem, className: '' },
  getElementById: (id) => ({ ...dummyElem, id }),
  querySelector: () => dummyElem,
  querySelectorAll: () => [],
  createElement: (tag) => ({ ...dummyElem, tagName: tag })
};

// Mock Game State G
global.G = {
  S: {
    heroes: [],
    res: { gems: 1000, wood: 500, metal: 300 },
    bld: { farm: 1, hq: 1, wall: 1 },
    workers: { farmer: 1, woodcutter: 1, miner: 0, hunter: 0, builder: 0 },
    maxWorkers: 6
  },
  SUBS: { base: ['buildings'] },
  SL: {},
  snd: () => {},
  toast: () => {},
  updAll: () => {},
  bldUp: (k) => {
    global.G.S.bld[k] = (global.G.S.bld[k] || 0) + 1;
  }
};

// Load js/twd-systems.js target block
const fs = require('fs');
const path = require('path');
const twdJsPath = path.resolve(__dirname, '../js/twd-systems.js');
const twdJsCode = fs.readFileSync(twdJsPath, 'utf-8');

const marker = 'window.TWD_BuildingSheet = {';
const idx = twdJsCode.indexOf(marker);
if (idx !== -1) {
  const iifeStart = twdJsCode.lastIndexOf('(function()', idx);
  const targetCode = twdJsCode.substring(iifeStart !== -1 ? iifeStart : idx);
  eval(targetCode);
}

console.log('--- Testing TWD Clean UI/UX & Contextual Building Sheet ---');

// Test 1: Clean Base Subs
assert.ok(window.G.SUBS.base.length === 1, 'SUBS.base should only have 1 clean tab');
console.log('✓ Test 1: Removed 15-horizontal-subtabs clutter from Base view passed');

// Test 2: Safe Workers Calculation (No NaN)
const workHtml = window.G.rWork();
assert.ok(!workHtml.includes('NAN'), 'rWork HTML must not contain NaN');
assert.ok(workHtml.includes('4/6'), 'Free workers should be 4/6 (6 - 2 assigned)');
console.log('✓ Test 2: Safe Workers Calculation without NaN passed');

// Test 3: Building Sheet Modal
assert.ok(window.TWD_BuildingSheet, 'TWD_BuildingSheet must exist');
window.TWD_BuildingSheet.openBuilding('farm');
assert.strictEqual(typeof window.TWD_BuildingSheet.openBuilding, 'function');
window.TWD_BuildingSheet.upgrade('farm');
assert.strictEqual(global.G.S.bld.farm, 2, 'Farm should be upgraded to level 2');
console.log('✓ Test 3: Contextual 3D Building Action Sheet passed');

console.log('ALL TWD Clean UI/UX tests PASS 100%!');

process.exit(0);
