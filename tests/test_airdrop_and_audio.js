const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;

// Mock Web Audio API
global.AudioContext = class {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {}
    };
  }
  resume() {}
};

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
    res: { gems: 1000, wood: 500, metal: 300, food: 200 },
    kills: 5
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

const marker = 'window.TWD_ProceduralAudio = {';
const idx = twdJsCode.indexOf(marker);
if (idx !== -1) {
  const iifeStart = twdJsCode.lastIndexOf('(function()', idx);
  const targetCode = twdJsCode.substring(iifeStart !== -1 ? iifeStart : idx);
  eval(targetCode);
}

console.log('--- Testing TWD Base Encounters, Tactical Airdrop & Procedural Web Audio FX ---');

// Test 1: Procedural Web Audio FX
assert.ok(window.TWD_ProceduralAudio, 'TWD_ProceduralAudio must exist');
window.TWD_ProceduralAudio.playShot();
window.TWD_ProceduralAudio.playExplosion();
window.TWD_ProceduralAudio.playHarvest();
window.TWD_ProceduralAudio.playVictory();
console.log('✓ Test 1: Procedural Web Audio Synthesizer passed');

// Test 2: Tactical Airdrop
assert.ok(window.TWD_BaseEncounters, 'TWD_BaseEncounters must exist');
window.TWD_BaseEncounters.spawnAirdrop();
assert.strictEqual(window.TWD_BaseEncounters.airdropActive, true, 'Airdrop must be active after spawn');

const initialGems = global.G.S.res.gems;
window.TWD_BaseEncounters.claimAirdrop();
assert.strictEqual(window.TWD_BaseEncounters.airdropActive, false, 'Airdrop must be inactive after claiming');
assert.strictEqual(global.G.S.res.gems, initialGems + 75, 'Airdrop should grant +75 gems');
console.log('✓ Test 2: Tactical Parachute Airdrop & Rewards passed');

// Test 3: Stray Walkers Snipe
const initialKills = global.G.S.kills;
const initialFood = global.G.S.res.food;
window.TWD_BaseEncounters.killWalker(dummyElem, 120, 200);
assert.strictEqual(global.G.S.kills, initialKills + 1, 'Kills should increase by 1');
assert.strictEqual(global.G.S.res.food, initialFood + 30, 'Food should increase by +30');
console.log('✓ Test 3: Base Perimeter Walkers Snipe Encounters passed');

console.log('ALL Base Encounters & Procedural Audio tests PASS 100%!');
process.exit(0);
