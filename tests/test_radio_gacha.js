const fs = require('fs');

console.log("==================================================");
console.log("  TESTING DRAMATIC RADIO SOS GACHA OPENING (F-115)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    S: {
      gems: 600,
      pity: 0,
      heroes: [],
      caps: { gems: 99999 }
    },
    HR: [
      { id: 'jo', n: 'Майор Джо', r: 'legendary', a: 15, cls: 'gun', i: '🏹' },
      { id: 'elena', n: 'Елена', r: 'rare', a: 10, cls: 'farm', i: '🌾' },
      { id: 'novice', n: 'Новобранец', r: 'common', a: 6, cls: 'melee', i: '🗡' }
    ],
    CLASSES: {
      gun: { n: 'Стрелок', i: '🏹' },
      melee: { n: 'Пехотинец', i: '🗡' },
      farm: { n: 'Специалист', i: '🌾' }
    },
    lastSummon: [
      { h: { id: 'novice', n: 'Новобранец', r: 'common', a: 6, cls: 'melee', i: '🗡', st: 1, lv: 1 }, isNew: true },
      { h: { id: 'jo', n: 'Майор Джо', r: 'legendary', a: 15, cls: 'gun', i: '🏹', st: 1, lv: 1 }, isNew: true }
    ],
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: (s) => console.log("  [SOUND]:", s),
    save: () => {},
    updAll: () => {},
    calcPow: () => {}
  }
};
global.window = window;

let elements = {};
const mockOverlay = {
  className: '',
  id: '',
  innerHTML: '',
  querySelector: (sel) => {
    if (!elements[sel]) {
      elements[sel] = {
        onclick: null,
        getContext: () => ({ fillRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {} }),
        clientWidth: 300,
        clientHeight: 100
      };
    }
    return elements[sel];
  },
  remove: () => console.log("  ✓ Gacha modal closed.")
};

global.document = {
  getElementById: (id) => null,
  createElement: (tag) => {
    if (tag === 'div') return mockOverlay;
    return { tagName: tag, style: {}, appendChild: () => {}, remove: () => {} };
  },
  body: { appendChild: () => {} }
};

global.performance = { now: () => 1000 };
global.requestAnimationFrame = (cb) => setTimeout(cb, 10);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Evaluate twd-radio-gacha-js
const scriptMatch = html.match(/<script id="twd-radio-gacha-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-radio-gacha-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Triggering Cinematic Radio SOS Summon...");
window.G.showSummon();

console.log("  ✓ Radio overlay created with scan box!");
if (!mockOverlay.innerHTML.includes("РАДИОСКАНЕР СИГНАЛОВ SOS")) {
  console.error("ERROR: Radio scan interface missing!");
  process.exit(1);
}

console.log("[2/3] Simulating Skip to Hero Reveal Showcase Card...");
mockOverlay.querySelector("#gachaSkipBtn").onclick();

console.log("  ✓ Hero reveal HTML generated:", mockOverlay.innerHTML.length, "chars");
if (!mockOverlay.innerHTML.includes("Майор Джо") || !mockOverlay.innerHTML.includes("ЛЕГЕНДАРНЫЙ ГЕРОЙ")) {
  console.error("ERROR: Legendary Hero card missing from reveal!");
  process.exit(1);
}

console.log("[3/3] Transitioning to Multi-Summon Summary Grid...");
mockOverlay.querySelector("#gachaToSummaryBtn").onclick();

console.log("  ✓ Multi-Summon Summary HTML length:", mockOverlay.innerHTML.length);
if (!mockOverlay.innerHTML.includes("ИТОГИ ПРИЗЫВА ×2")) {
  console.error("ERROR: Multi-summon summary grid missing!");
  process.exit(1);
}

mockOverlay.querySelector("#gachaFinalCloseBtn").onclick();

console.log("\n==================================================");
console.log("  ALL DRAMATIC RADIO GACHA TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
