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
    res: { gems: 1000 },
    sotfScore: 1200,
    clanHonor: 500
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

const marker = 'window.TWD_AllianceHelp = {';
const idx = twdJsCode.indexOf(marker);
if (idx !== -1) {
  const iifeStart = twdJsCode.lastIndexOf('(function()', idx);
  const targetCode = twdJsCode.substring(iifeStart !== -1 ? iifeStart : idx);
  eval(targetCode);
}

console.log('--- Testing TWD Alliance Rally, SOTF 7-Day & Recon Systems ---');

// Test 1: Alliance Help Subsystem
assert.ok(window.TWD_AllianceHelp, 'TWD_AllianceHelp must exist');
assert.strictEqual(window.TWD_AllianceHelp.helpRequests.length, 3, 'Must start with 3 help requests');
window.TWD_AllianceHelp.helpAll();
assert.strictEqual(window.TWD_AllianceHelp.helpRequests.length, 0, 'Help requests should be cleared after helpAll');
assert.strictEqual(global.G.S.clanHonor, 800, 'Clan Honor should increase by 300 (3 * 100)');
console.log('✓ Test 1: Alliance 1-Tap Help Subsystem passed');

// Test 2: Survival of the Fittest (7-Day Event)
assert.ok(window.TWD_SurvivalOfTheFittest, 'TWD_SurvivalOfTheFittest must exist');
assert.strictEqual(window.TWD_SurvivalOfTheFittest.stages.length, 7, 'Must have 7 daily stages');
window.TWD_SurvivalOfTheFittest.setDay(3);
assert.strictEqual(window.TWD_SurvivalOfTheFittest.currentDay, 3, 'Current day should be 3');
window.TWD_SurvivalOfTheFittest.claimStageReward();
assert.strictEqual(global.G.S.res.gems, 1150, 'Gems must increase by 150');
assert.strictEqual(global.G.S.sotfScore, 1700, 'SOTF score must increase by 500');
console.log('✓ Test 2: Survival of the Fittest 7-Day Event & Milestones passed');

// Test 3: Alliance Rally
assert.ok(window.TWD_AllianceRally, 'TWD_AllianceRally must exist');
const initialRallies = window.TWD_AllianceRally.rallies.length;
window.TWD_AllianceRally.joinRally('ral_1');
const ral1 = window.TWD_AllianceRally.rallies.find(x => x.id === 'ral_1');
assert.strictEqual(ral1.members, 4, 'Rally members should increment to 4');

window.TWD_AllianceRally.createRally();
assert.strictEqual(window.TWD_AllianceRally.rallies.length, initialRallies + 1, 'Rallies count should increase');
console.log('✓ Test 3: Alliance Boss Rally & Joint Army Warfare passed');

// Test 4: Tactical Recon
assert.ok(window.TWD_TacticalRecon, 'TWD_TacticalRecon must exist');
console.log('✓ Test 4: Tactical Sector Recon module passed');

console.log('ALL Alliance Rally, SOTF & Recon tests PASS 100%!');

process.exit(0);
