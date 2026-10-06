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
    bld: { bar: 4, hosp: 2 },
    power: 300,
    res: { food: 2000, wood: 2000, metal: 1000, gems: 100 }
  },
  snd: () => {},
  toast: () => {},
  updAll: () => {}
};

// Load TWD_Army Engine from HTML
const fs = require('fs');
const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf-8');
const startTag = 'window.TWD_Army = {';
const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf('</script>', startIndex);
const scriptCode = html.substring(startIndex, endIndex);

eval(scriptCode);

console.log('--- Testing TWD Army, Barracks T1-T4 & Hospital System ---');

// Test 1: Initialization
assert.ok(window.TWD_Army, 'TWD_Army must be defined');
window.TWD_Army.initArmyState();
assert.ok(global.G.S.army, 'G.S.army must be initialized');
assert.ok(global.G.S.hospital, 'G.S.hospital must be initialized');
console.log('✓ Test 1: Army and Hospital data structure initialization passed');

// Test 2: Training T1 Melee Troops
const initialFood = global.G.S.res.food;
const initialPower = global.G.S.power;
const initialMeleeT1 = global.G.S.army.melee.t1 || 0;

window.TWD_Army.trainTroops('melee', 't1', 10);

assert.strictEqual(global.G.S.army.melee.t1, initialMeleeT1 + 10, 'Must have trained +10 T1 Melee');
assert.ok(global.G.S.res.food < initialFood, 'Food must be deducted');
assert.ok(global.G.S.power > initialPower, 'Power must increase with trained troops');
console.log('✓ Test 2: T1 Melee Training and Power scaling passed');

// Test 3: Training T2 Ranged Troops (Barracks lvl 4 unlocks T2)
const initialRangedT2 = global.G.S.army.ranged.t2 || 0;
window.TWD_Army.trainTroops('ranged', 't2', 10);
assert.strictEqual(global.G.S.army.ranged.t2, initialRangedT2 + 10, 'Must have trained +10 T2 Ranged');
console.log('✓ Test 3: T2 Ranged Training passed');

// Test 4: Hospital Healing System
global.G.S.hospital.wounded = { melee: 15, ranged: 10, cavalry: 5 };
const totalWounded = 30;
const prevFood = global.G.S.res.food;
const prevMelee = global.G.S.army.melee.t1;

window.TWD_Army.healAll();

assert.strictEqual(global.G.S.hospital.wounded.melee, 0, 'All wounded melee must be healed');
assert.strictEqual(global.G.S.hospital.wounded.ranged, 0, 'All wounded ranged must be healed');
assert.strictEqual(global.G.S.hospital.wounded.cavalry, 0, 'All wounded cavalry must be healed');
assert.strictEqual(global.G.S.army.melee.t1, prevMelee + 15, 'Healed troops must return to army pool');
assert.strictEqual(global.G.S.res.food, prevFood - totalWounded * 5, 'Food cost must be deducted for healing');
console.log('✓ Test 4: Hospital Treatment and Wounded Recovery passed');

console.log('ALL TWD Army, Barracks & Hospital tests PASS 100%!');

process.exit(0);
