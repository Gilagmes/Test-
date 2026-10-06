const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.Image = class {};
global.AudioContext = class {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {} },
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
  createBuffer() { return {}; }
  createBufferSource() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
};
global.window.AudioContext = global.AudioContext;
global.navigator = { userAgent: 'Mozilla', vibrate: () => true };

const dummyElem = {
  style: {},
  dataset: {},
  classList: {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false
  },
  innerHTML: '',
  textContent: '',
  appendChild: (c) => c,
  append: () => {},
  prepend: () => {},
  remove: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => dummyElem,
  closest: () => dummyElem,
  getContext: () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fillText: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} })
  }),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 })
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  head: { ...dummyElem },
  body: { ...dummyElem, className: '' },
  getElementById: (id) => ({ ...dummyElem, id }),
  querySelector: () => dummyElem,
  querySelectorAll: () => [dummyElem],
  createElement: (tag) => ({ ...dummyElem, tagName: tag })
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

try {
  const twdCode = fs.readFileSync('js/twd-systems.js', 'utf-8');
  eval(twdCode);
} catch (e) {
  console.error('EVAL ERROR:', e.message, e.stack);
  process.exit(1);
}

try {
  console.log('--- Initial Game State ---');
  console.log('tutDone:', G.S.tutDone, 'tutStep:', G.S.tutStep, 'ch:', G.S.ch, 'qs:', G.S.qs);

  // 1. Step through tutorial
  console.log('--- Step 0: Welcome ---');
  G.nextTut();
  console.log('tutStep:', G.S.tutStep);

  console.log('--- Step 1: Build Farm ---');
  G.questActionClick();
  console.log('After questActionClick on farm, bld:', G.S.bld);
  G.build('farm');
  console.log('After build farm, bld:', G.S.bld, 'tutDone:', G.S.tutDone, 'tutStep:', G.S.tutStep);

  // Advance remaining tutorial steps
  while (!G.S.tutDone && G.S.tutStep < 8) {
    console.log('Advancing tutStep:', G.S.tutStep);
    G.nextTut();
  }
  console.log('Tutorial done! G.S.tutDone:', G.S.tutDone);

  // Give plenty of resources for subsequent chapters
  G.S.res = { food: 50000, wood: 50000, metal: 30000, gems: 5000 };
  G.S.caps = { food: 999999, wood: 999999, metal: 999999, gems: 99999 };

  // Complete Chapter 1
  console.log('--- Completing Chapter 1 ---');
  console.log('Quest focus 1:', G.getQuestFocus().s.t);
  
  // Build sawmill
  G.build('saw');
  while (G.S.bldQ && G.S.bldQ.length > 0) {
    const item = G.S.bldQ.shift();
    G.applyBuildDone(item.k, item.amt, item.from, item.to);
  }
  G.updQ();
  console.log('Quest focus after saw:', G.getQuestFocus().s.t, 'canClaim:', G.getQuestFocus().canClaim);
  if (G.getQuestFocus().canClaim) G.advQ();

  // Upgrade HQ to 2
  console.log('Building HQ 2...');
  G.build('hq');
  while (G.S.bldQ && G.S.bldQ.length > 0) {
    const item = G.S.bldQ.shift();
    G.applyBuildDone(item.k, item.amt, item.from, item.to);
  }
  G.updQ();
  console.log('Quest focus after HQ 2:', G.getQuestFocus().s.t, 'canClaim:', G.getQuestFocus().canClaim);
  if (G.getQuestFocus().canClaim) G.advQ();

  // Claim Chapter 1 reward
  console.log('Quest focus after Ch 1 quests, chapterDone:', G.getQuestFocus().chapterDone, 'canClaim:', G.getQuestFocus().canClaim);
  if (G.getQuestFocus().chapterDone || G.getQuestFocus().canClaim) {
    console.log('Advancing Chapter 1 completion...');
    G.advQ();
  }
  console.log('Current Chapter:', G.S.ch, 'qs:', G.S.qs);
  console.log('Quest focus on Chapter 2:', G.getQuestFocus().s?.t || G.getQuestFocus().text);

  // Now in Chapter 2, quest is "Возвести Стену"
  console.log('--- CHAPTER 2: BUILDING THE WALL ---');
  console.log('Clicking quest action for wall...');
  G.questActionClick();

  console.log('Building wall...');
  G.build('wall');
  console.log('bldQ:', G.S.bldQ);
  console.log('Quest focus while wall building:', G.getQuestFocus().s?.t, 'canClaim:', G.getQuestFocus().canClaim);

  // Process build done
  while (G.S.bldQ && G.S.bldQ.length > 0) {
    const item = G.S.bldQ.shift();
    G.applyBuildDone(item.k, item.amt, item.from, item.to);
  }
  console.log('After wall built, bld:', G.S.bld);
  G.updQ();
  console.log('Quest focus after wall built:', G.getQuestFocus().s?.t, 'canClaim:', G.getQuestFocus().canClaim);
  assert.ok(G.getQuestFocus().canClaim, 'Wall quest should be ready to claim');
  G.advQ();
  console.log('After claiming wall quest, next quest:', G.getQuestFocus().s?.t);

  console.log('=== TEST PASSED SUCCESSFULLY ==='); process.exit(0);
} catch (err) {
  console.error('SIMULATION ERROR:', err.message, err.stack);
}
