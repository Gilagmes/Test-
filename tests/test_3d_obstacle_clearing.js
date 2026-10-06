const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;

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
      textContent: ''
    };
  }
};

// Mock Game State G
global.G = {
  S: {
    energy: 50,
    power: 1000,
    res: { food: 500, wood: 500, metal: 500, gems: 50 },
    clearedObstacles: ['obs_cars']
  },
  toast: () => {},
  snd: () => {},
  updTop: () => {},
  save: () => {},
  rPanel: () => {},
  clearBaseObstacle: function(obsId) {
    const obs = global.window.TWD_3D_Obstacles.obstaclesList.find(o => o.id === obsId);
    if (!obs) return;
    this.S.energy -= obs.reqEnergy;
    this.S.clearedObstacles.push(obsId);
    this.S.power += obs.power;
    for (let r in obs.loot) {
      if (r === 'gems') this.S.res.gems += obs.loot[r];
      else this.S.res[r] += obs.loot[r];
    }
  }
};

// Load TWD_3D_Obstacles from HTML
const fs = require('fs');
const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf-8');
const startTag = 'window.TWD_3D_Obstacles = {';
const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf('</script>', startIndex);
const scriptCode = html.substring(startIndex, endIndex);

eval(scriptCode);

console.log('--- Testing TWD 3D Interactive Obstacle & Fog Clearing System ---');

// Test 1: Obstacles List
assert.ok(window.TWD_3D_Obstacles, 'TWD_3D_Obstacles must exist');
assert.strictEqual(window.TWD_3D_Obstacles.obstaclesList.length, 6, 'Must define 6 base expansion sectors');
console.log('✓ Test 1: Obstacle & Sector Definitions passed');

// Test 2: Modal Open
window.TWD_3D_Obstacles.openModal('obs_woods');
assert.strictEqual(window.TWD_3D_Obstacles.currentObsId, 'obs_woods', 'Current obstacle must be set to obs_woods');
console.log('✓ Test 2: Obstacle Modal opening passed');

// Test 3: Clearing Obstacle & Rewards Dispatch
const prevWood = global.G.S.res.wood;
const prevEnergy = global.G.S.energy;
const prevPower = global.G.S.power;

window.TWD_3D_Obstacles.confirmClear();

assert.ok(global.G.S.clearedObstacles.includes('obs_woods'), 'obs_woods must be in clearedObstacles list');
assert.strictEqual(global.G.S.energy, prevEnergy - 10, 'Energy must be deducted');
assert.ok(global.G.S.res.wood > prevWood, 'Wood reward must be added');
assert.ok(global.G.S.power > prevPower, 'Colony power must increase');
console.log('✓ Test 3: Obstacle Clearing, Energy deduction & Loot dispatch passed');

console.log('ALL TWD 3D Obstacle & Fog Clearing tests PASS 100%!');
