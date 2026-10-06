const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock DOM
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => {
    return {
      id,
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      innerHTML: '',
      textContent: '',
      clientWidth: 800,
      clientHeight: 500,
      getContext: () => ({
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        ellipse: () => {},
        strokeRect: () => {},
        fillText: () => {},
        save: () => {},
        restore: () => {},
        createRadialGradient: () => ({
          addColorStop: () => {}
        })
      })
    };
  }
};

// Mock Game State G
global.G = {
  S: {
    wave: 3,
    kills: 50,
    power: 240,
    wHP: 800,
    wMax: 1000,
    bld: { wall: 2 },
    gar: ['h1', 'h2'],
    heroes: [
      { id: 'h1', n: 'Дэрил', i: '🏹', a: 25, d: 15, lv: 3, r: 'epic' },
      { id: 'h2', n: 'Мишонн', i: '⚔️', a: 30, d: 10, lv: 4, r: 'legendary' }
    ],
    res: { food: 500, wood: 500, metal: 300, gems: 50 },
    caps: { food: 5000, wood: 5000, metal: 5000, gems: 9999 }
  },
  snd: () => {},
  toast: () => {},
  updAll: () => {},
  addXP: (amt) => { global.G.S.xp = (global.G.S.xp || 0) + amt; },
  heroXp: (amt) => { global.G.S.heroXpVal = (global.G.S.heroXpVal || 0) + amt; },
  bondXp: (amt) => { global.G.S.bondXpVal = (global.G.S.bondXpVal || 0) + amt; }
};

// Load TWD_Defense Engine
const fs = require('fs');
const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf-8');
const startTag = 'window.TWD_Defense = {';
const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf('</script>', startIndex);
const scriptCode = html.substring(startIndex, endIndex);

eval(scriptCode);

console.log('--- Testing TWD Interactive Tower Defense System ---');

// Test 1: Initialization
assert.ok(window.TWD_Defense, 'TWD_Defense must be defined');
window.TWD_Defense.init();
assert.ok(window.TWD_Defense.canvas, 'Canvas must be initialized');
console.log('✓ Test 1: Engine Initialization passed');

// Test 2: Start Defense Mode
window.TWD_Defense.startDefense(5, false);
assert.strictEqual(window.TWD_Defense.running, true, 'Defense must be running');
assert.strictEqual(window.TWD_Defense.wave, 5, 'Wave must match starting wave 5');
assert.ok(window.TWD_Defense.defenders.length >= 2, 'Defenders must be stationed from garrison');
assert.strictEqual(window.TWD_Defense.defenders[0].hero.n, 'Дэрил', 'First defender must be Daryl');
console.log('✓ Test 2: Defense Start and Hero Garrison Setup passed');

// Test 3: Active Commander Skills (Molotov, Sniper, Shock, Rally)
assert.strictEqual(window.TWD_Defense.skills.molotov.timer, 0, 'Molotov ready');
window.TWD_Defense.activateSkill('molotov');
assert.strictEqual(window.TWD_Defense.fireZones.length, 1, 'Molotov must create a fire zone');
assert.ok(window.TWD_Defense.skills.molotov.timer > 0, 'Molotov must go on cooldown');

window.TWD_Defense.activateSkill('rally');
assert.ok(window.TWD_Defense.skills.rally.activeTimer > 0, 'Rally cry active timer must be positive');
console.log('✓ Test 3: Active Commander Skills execution passed');

// Test 4: Zombie Spawning & Types
window.TWD_Defense.spawnZombie();
assert.strictEqual(window.TWD_Defense.zombies.length, 1, 'Zombie must spawn');
const spawnedZ = window.TWD_Defense.zombies[0];
assert.ok(spawnedZ.hp > 0, 'Zombie must have HP');
assert.ok(spawnedZ.speed > 0, 'Zombie must have Speed');
console.log('✓ Test 4: Horde Spawning mechanics passed');

// Test 5: Shock Stun & Damage
spawnedZ.x = 200; // Place in front of wall
window.TWD_Defense.activateSkill('shock');
assert.ok(spawnedZ.stunTimer > 0, 'Zombie must be stunned by shock grid');
console.log('✓ Test 5: Shock Trap / Stun Grid passed');

// Test 6: Victory & Loot Dispatch
window.TWD_Defense.enemiesRemaining = 0;
window.TWD_Defense.zombies = [];
const startWave = global.G.S.wave;
window.TWD_Defense.handleVictory();
assert.strictEqual(window.TWD_Defense.running, false, 'Defense stops on victory');
assert.strictEqual(global.G.S.wave, startWave + 1, 'Game wave must increment by 1');
assert.ok(global.G.S.res.food > 500, 'Food reward must be credited');
assert.ok(global.G.S.res.wood > 500, 'Wood reward must be credited');
console.log('✓ Test 6: Victory Resolution and Resource Spoils passed');

console.log('ALL TWD Interactive Tower Defense tests PASS 100%!');

process.exit(0);
