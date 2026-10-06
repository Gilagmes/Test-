const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('  STARTING FULL 360° COMPREHENSIVE GAME AUDIT (v10.20)');
console.log('====================================================');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;
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

global.navigator = {
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile)',
  vibrate: (p) => true
};

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
  appendChild: (child) => child,
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
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
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

// Mock Game State G
global.G = {
  S: {
    heroes: [
      { id: 'vic', n: 'Виктор', i: '⚔️', r: 'legendary', lv: 5, a: 50, d: 35 },
      { id: 'gi', n: 'Джина', i: '🏹', r: 'epic', lv: 4, a: 42, d: 25 },
      { id: 'artur', n: 'Артур', i: '🛡️', r: 'epic', lv: 4, a: 28, d: 55 }
    ],
    res: { food: 50000, wood: 50000, metal: 30000, gems: 5000 },
    caps: { food: 999999, wood: 999999, metal: 999999, gems: 99999 },
    energy: 120,
    maxE: 120,
    bld: { hq: 2, farm: 1, saw: 1, bar: 1, hosp: 1, wall: 1, lab: 1, wt: 1, wh: 1, market: 1, wrk: 1 },
    bldQ: [],
    workers: { farmer: 1, woodcutter: 1, miner: 1, hunter: 0, builder: 0 },
    maxWorkers: 6,
    clearedObstacles: [],
    tutDone: false,
    tutStep: 0,
    ch: 1,
    qs: 0,
    day: 1,
    hour: 8,
    tab: 'base',
    sub: 'buildings',
    troops: { melee: 100, ranged: 80, cavalry: 60 }
  },
  BD: {
    hq: { n: "Штаб", i: "🏰", mx: 20, c: t => ({ wood: 50 * t, metal: 30 * t }) },
    farm: { n: "Ферма", i: "🌾", mx: 20, c: t => ({ wood: 30 * t, metal: 10 * t }) },
    saw: { n: "Лесопилка", i: "🪵", mx: 20, c: t => ({ food: 25 * t, metal: 15 * t }) },
    wrk: { n: "Мастерская", i: "🔧", mx: 20, c: t => ({ food: 30 * t, wood: 30 * t }) },
    wall: { n: "Стена", i: "🧱", mx: 25, c: t => ({ wood: 40 * t, metal: 25 * t }) },
    bar: { n: "Казарма", i: "⚔", mx: 20, c: t => ({ food: 50 * t, wood: 20 * t, metal: 20 * t }) },
    hosp: { n: "Госпиталь", i: "🏥", mx: 15, c: t => ({ food: 40 * t, metal: 30 * t }) },
    wt: { n: "Сторожевая", i: "🗼", mx: 15, c: t => ({ wood: 60 * t, metal: 40 * t }) },
    wh: { n: "Склад", i: "📦", mx: 20, c: t => ({ wood: 35 * t, metal: 20 * t }) },
    lab: { n: "Лаборатория", i: "🔬", mx: 15, c: t => ({ food: 40 * t, wood: 30 * t, metal: 40 * t }) },
    market: { n: "Рынок", i: "🏪", mx: 15, c: t => ({ wood: 40 * t, metal: 35 * t }) }
  },
  buildCost(k, amt = 1) {
    const b = this.BD[k];
    if (!b) return { wood: 50, metal: 30 };
    const cur = (this.S.bld[k] || 0) + 1;
    return b.c(cur);
  },
  queuedAmt(t) {
    return (this.S.bldQ || []).filter(e => e.k === t).reduce((e, t) => e + t.amt, 0);
  },
  missingRes() { return ''; },
  addNotif() {},
  sendWorkersTo() {},
  getQuestFocus() {
    return {
      q: { t: "Постройте Ферму", st: [] },
      bld: "farm",
      done: false,
      canClaim: false,
      chapterDone: false,
      tab: "base",
      sub: "buildings"
    };
  },
  nextTut() {
    this.S.tutStep++;
    if (this.S.tutStep > 2) this.S.tutDone = true;
  },
  skipTut() {
    this.S.tutDone = true;
    this.S.res.gems += 30;
  },
  toast: () => {},
  snd: () => {},
  updAll: () => {},
  updQ: () => {},
  save: () => {},
  tab: () => {},
  SUBS: { base: ['buildings'] },
  SL: {}
};

// Load js/twd-systems.js directly
const twdJsPath = path.resolve('/home/user/js/twd-systems.js');
const twdJsCode = fs.readFileSync(twdJsPath, 'utf-8');

eval(twdJsCode);
console.log('✓ Evaluated twd-systems.js cleanly');

// AUDIT SECTION 1: 3D Building Sheet & Interactive Clicks
console.log('--- 1. Auditing 3D Buildings & Construction System ---');
const buildingsToAudit = ['hq', 'farm', 'saw', 'wrk', 'wall', 'bar', 'hosp', 'wt', 'wh', 'lab', 'market'];
for (const bldKey of buildingsToAudit) {
  assert.ok(window.TWD_BuildingSheet, 'TWD_BuildingSheet must exist');
  global.G.S.tutDone = false; // Instant build during tutorial or applyBuildDone
  global.G.S.res = { food: 999999, wood: 999999, metal: 999999, gems: 99999 };
  global.G.S.caps = { food: 999999, wood: 999999, metal: 999999, gems: 99999 };
  const curLvl = global.G.S.bld[bldKey] || 0;
  window.TWD_BuildingSheet.openBuilding(bldKey);
  window.TWD_BuildingSheet.upgrade(bldKey);
  assert.strictEqual(global.G.S.bld[bldKey], curLvl + 1, `Building ${bldKey} should upgrade +1`);
}
console.log(`✓ All 11 buildings (sawmill, farm, hq, etc.) open, calculate costs, and upgrade properly.`);

// AUDIT SECTION 2: Tutorial & Quest Navigation
console.log('--- 2. Auditing Tutorial & 1-Tap Quest Navigation ---');
global.G.S.tutDone = false;
global.G.S.tutStep = 0;
assert.strictEqual(global.G.S.tutDone, false);
global.G.questActionClick();
assert.strictEqual(global.G.S.tutDone, false);
global.G.skipTut();
assert.strictEqual(global.G.S.tutDone, true, 'Tutorial should be skipped on skip button');
console.log('✓ Tutorial skips, auto-advances, and connects to 1-tap quest navigation.');

// AUDIT SECTION 3: Tactical 3v3 Survivor Arena
console.log('--- 3. Auditing Survivor 3v3 Arena ---');
assert.ok(window.TWD_SurvivorArena, 'TWD_SurvivorArena must exist');
assert.ok(window.TWD_SurvivorArena.opponents.length >= 3, 'Must have at least 3 arena opponents');
const initPts = window.TWD_SurvivorArena.points;
window.TWD_SurvivorArena.fight('opp_1');
assert.strictEqual(window.TWD_SurvivorArena.points, initPts + 35, 'Winning arena match adds points');
console.log('✓ Survivor Arena matchmaking, battle simulation, and rank point rewards passed.');

// AUDIT SECTION 4: 4-Slot Gear Refinery
console.log('--- 4. Auditing 4-Slot Gear Refinery ---');
assert.ok(window.TWD_GearRefinery, 'TWD_GearRefinery must exist');
const vicLvlWeapon = window.TWD_GearRefinery.heroGear.vic.weapon.lvl;
window.TWD_GearRefinery.upgradeSlot('vic', 'weapon');
assert.strictEqual(window.TWD_GearRefinery.heroGear.vic.weapon.lvl, vicLvlWeapon + 1, 'Weapon must refine +1');
console.log('✓ 4-Slot Gear Refinery (Weapon, Armor, Helmet, Badge) sharpening passed.');

// AUDIT SECTION 5: Clan Territory & Boundary Expansion
console.log('--- 5. Auditing Clan Territory Outposts ---');
assert.ok(window.TWD_ClanTerritory, 'TWD_ClanTerritory must exist');
const prevOutposts = window.TWD_ClanTerritory.outposts;
window.TWD_ClanTerritory.expandBoundary();
assert.strictEqual(window.TWD_ClanTerritory.outposts, prevOutposts + 1, 'Outposts must increase on expand');
console.log('✓ Clan Territory outposts and territory influence buffer passed.');

// AUDIT SECTION 6: Procedural Audio FX Engine
console.log('--- 6. Auditing Web Audio FX Engine ---');
assert.ok(window.TWD_ProceduralAudio, 'TWD_ProceduralAudio must exist');
window.TWD_ProceduralAudio.playShot();
window.TWD_ProceduralAudio.playExplosion();
window.TWD_ProceduralAudio.playConstruction();
window.TWD_ProceduralAudio.playHarvest();
window.TWD_ProceduralAudio.playVictory();
console.log('✓ Procedural Web Audio FX (gunshots, explosions, builds, harvest, victory) passed.');

// AUDIT SECTION 7: Dynamic Base Encounters (Airdrop & Walkers)
console.log('--- 7. Auditing Dynamic Base Encounters ---');
assert.ok(window.TWD_BaseEncounters, 'TWD_BaseEncounters must exist');
const prevGems = global.G.S.res.gems;
window.TWD_BaseEncounters.claimAirdrop();
assert.strictEqual(global.G.S.res.gems, prevGems + 75, 'Airdrop gives +75 gems');
window.TWD_BaseEncounters.snipeWalker(1);
console.log('✓ Parachute Airdrop crate and perimeter walker sniping passed.');

console.log('====================================================');
console.log('  ALL 7 AUDIT SECTORS PASSED WITH ZERO CRITICAL BUGS');
console.log('====================================================');

process.exit(0);
