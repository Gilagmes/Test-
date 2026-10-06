const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;
global.Image = class {};

// Mock Navigator with Vibration API
global.navigator = {
  vibrateCalled: false,
  lastPattern: null,
  vibrate: function(pattern) {
    this.vibrateCalled = true;
    this.lastPattern = pattern;
    return true;
  }
};

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
  getContext: () => ({ setTransform: () => {}, fillRect: () => {}, fillText: () => {}, createLinearGradient: () => ({ addColorStop: () => {} }) }),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  querySelectorAll: () => [],
  querySelector: () => null
};

// Mock DOM
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
    caps: { gems: 99999 },
    hour: 12,
    weather: 0
  },
  WEATHER: [{ id: 'clear' }],
  snd: () => {},
  toast: () => {},
  updAll: () => {},
  SUBS: { heroes: [], social: [] },
  SL: {}
};

// Extract TWD_Haptics and TWD_CinematicGacha definition from js/twd-systems.js
const fs = require('fs');
const path = require('path');
const twdJsPath = path.resolve(__dirname, '../js/twd-systems.js');
const twdJsCode = fs.readFileSync(twdJsPath, 'utf-8');

const hapticsStart = twdJsCode.indexOf('window.TWD_Haptics = {');
const gachaEnd = twdJsCode.indexOf('// Hook G.showSummon', hapticsStart);

if (hapticsStart !== -1) {
  const targetCode = twdJsCode.substring(hapticsStart, gachaEnd !== -1 ? gachaEnd : undefined);
  eval(targetCode);
}

console.log('--- Testing TWD Cinematic Gacha Showcase & Mobile Haptics ---');

// Test 1: Haptic Engine
assert.ok(window.TWD_Haptics, 'TWD_Haptics must exist');
window.TWD_Haptics.legendarySummon();
assert.strictEqual(global.navigator.vibrateCalled, true, 'Navigator vibrate must be triggered');
console.log('✓ Test 1: Mobile Haptic Engine and Tactical Presets passed');

// Test 2: Cinematic Gacha Queue
assert.ok(window.TWD_CinematicGacha, 'TWD_CinematicGacha must exist');
const sampleSummons = [
  { h: { id: 'vic', n: 'Виктор', i: '⚔️', r: 'legendary', lv: 5, a: 30, d: 20 }, isNew: true },
  { h: { id: 'gi', n: 'Джина', i: '🏹', r: 'epic', lv: 4, a: 28, d: 15 }, isNew: false }
];

window.TWD_CinematicGacha.showSummonSequence(sampleSummons);
assert.strictEqual(window.TWD_CinematicGacha.queue.length, 2, 'Queue must hold 2 summons');
assert.strictEqual(window.TWD_CinematicGacha.currentIndex, 0, 'Current index must be 0 (first hero)');
console.log('✓ Test 2: Summon Sequence Initialization passed');

// Test 3: Advancing to next hero in pull ×10
window.TWD_CinematicGacha.next();
assert.strictEqual(window.TWD_CinematicGacha.currentIndex, 1, 'Current index must advance to 1 (second hero)');
console.log('✓ Test 3: Multi-Pull Hero Showcase Progression passed');

// Test 4: Quotes and Archetypes
const quote = window.TWD_CinematicGacha.quotes.vic;
assert.ok(quote.includes('Порт'), 'Viktor quote must be present');
console.log('✓ Test 4: Hero Quotes and Archetype integration passed');

console.log('ALL TWD Cinematic Gacha & Haptics tests PASS 100%!');

process.exit(0);
