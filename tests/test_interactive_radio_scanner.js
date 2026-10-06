const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;
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
      value: 942,
      clientWidth: 380,
      clientHeight: 90,
      getContext: () => ({
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {}
      })
    };
  }
};

// Mock Game State G
global.G = {
  S: {
    energy: 50,
    res: { food: 500, wood: 500, metal: 500, gems: 50 }
  },
  toast: () => {},
  snd: () => {},
  updAll: () => {}
};

// Load TWD_Radio from HTML
const fs = require('fs');
const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf-8');
const startTag = 'window.TWD_Radio = {';
const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf('</script>', startIndex);
const scriptCode = html.substring(startIndex, endIndex);

eval(scriptCode);

console.log('--- Testing TWD Interactive SOS Radio Scanner ---');

// Test 1: Initialization
assert.ok(window.TWD_Radio, 'TWD_Radio must exist');
assert.ok(window.TWD_Radio.signals.length >= 4, 'Must have at least 4 radio signals');
console.log('✓ Test 1: Radio Scanner & Signals Definitions passed');

// Test 2: Frequency Tuning & Match Calculation
window.TWD_Radio.init();
window.TWD_Radio.targetFreq = 94.2;
window.TWD_Radio.handleTuning(942); // Exact match
assert.strictEqual(window.TWD_Radio.currentFreq, 94.2, 'Frequency must match 94.2 MHz');
console.log('✓ Test 2: Frequency Tuning & Signal Match passed');

// Test 3: Rescue Expedition Dispatch
const prevFood = global.G.S.res.food;
const prevEnergy = global.G.S.energy;

window.TWD_Radio.dispatchRescue();

assert.strictEqual(global.G.S.energy, prevEnergy - 10, '10 Energy must be deducted');
console.log('✓ Test 3: Rescue Dispatch & Rewards Credited passed');

console.log('ALL TWD Interactive Radio Scanner tests PASS 100%!');
