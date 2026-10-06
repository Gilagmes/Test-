const fs = require('fs');

console.log("==================================================");
console.log("  TESTING HERO VOICE LINES & COMBAT SPEECH (F-119)");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings'] },
    SL: {},
    S: {
      heroes: [{ id: 'jo', n: 'Майор Джо' }],
      tutDone: true
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: (s) => console.log("  [SOUND]:", s),
    showHero: () => {}
  }
};
global.window = window;

let mockBubble = {
  className: '',
  id: '',
  innerHTML: '',
  remove: () => console.log("  ✓ Speech bubble removed.")
};

global.document = {
  getElementById: (id) => null,
  createElement: (tag) => {
    if (tag === 'div') return mockBubble;
    return { tagName: tag, style: {}, appendChild: () => {}, remove: () => {} };
  },
  body: { appendChild: () => {} }
};

// Evaluate twd-hero-voice-js
const scriptMatch = html.match(/<script id="twd-hero-voice-js">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR: twd-hero-voice-js not found!");
  process.exit(1);
}
eval(scriptMatch[1]);

console.log("[1/3] Triggering Major Joe's Selection Voice Line...");
const joeQuote = window.G.speakHeroQuote('jo', 'select');
console.log("  ✓ Joe's Quote:", joeQuote);
console.log("  ✓ Speech bubble HTML length:", mockBubble.innerHTML.length);

if (!joeQuote.includes("прицел на нуле") || !mockBubble.innerHTML.includes("Майор Джо")) {
  console.error("ERROR: Major Joe voice quote failed!");
  process.exit(1);
}

console.log("[2/3] Triggering Elena's Combat Voice Line...");
const elenaQuote = window.G.speakHeroQuote('elena', 'combat');
console.log("  ✓ Elena's Combat Quote:", elenaQuote);
if (!elenaQuote.includes("Защитим наши запасы")) {
  console.error("ERROR: Elena combat quote failed!");
  process.exit(1);
}

console.log("[3/3] Triggering Melissa's Victory Battle Cry...");
const melissaQuote = window.G.speakHeroQuote('melissa', 'victory');
console.log("  ✓ Melissa's Victory Quote:", melissaQuote);
if (!melissaQuote.includes("Триумф за нами")) {
  console.error("ERROR: Melissa victory quote failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL HERO VOICE LINES TESTS PASSED 100%!");
console.log("==================================================");
process.exit(0);
