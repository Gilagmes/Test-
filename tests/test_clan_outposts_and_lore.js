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

const marker = 'window.TWD_ClanTerritory = {';
const idx = twdJsCode.indexOf(marker);
if (idx !== -1) {
  const iifeStart = twdJsCode.lastIndexOf('(function()', idx);
  const targetCode = twdJsCode.substring(iifeStart !== -1 ? iifeStart : idx);
  eval(targetCode);
}

console.log('--- Testing TWD Clan Territory Outposts & Survivor Lore ---');

// Test 1: Clan Territory Outposts
assert.ok(window.TWD_ClanTerritory, 'TWD_ClanTerritory must exist');
const initialOutposts = window.TWD_ClanTerritory.outposts;
window.TWD_ClanTerritory.expandBoundary();
assert.strictEqual(window.TWD_ClanTerritory.outposts, initialOutposts + 1, 'Outposts count should increase');
console.log('✓ Test 1: Clan Territory Outposts & Boundary Expansion passed');

// Test 2: Survivor Biographies
assert.ok(window.TWD_SurvivorLore, 'TWD_SurvivorLore must exist');
const vicBio = window.TWD_SurvivorLore.bios.vic;
assert.ok(vicBio.lore.includes('Аврора'), 'Viktor lore must mention Aurora');
console.log('✓ Test 2: Survivor Biographies & Quotes passed');

console.log('ALL Clan Outposts & Survivor Lore tests PASS 100%!');
process.exit(0);
