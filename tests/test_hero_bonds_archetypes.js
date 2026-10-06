const assert = require('assert');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.window.innerWidth = 1024;
global.window.innerHeight = 768;

// Mock Game State G
global.G = {
  S: {
    heroes: [
      { id: 'vic', n: 'Виктор', i: '⚔️', a: 30, d: 20, lv: 5, r: 'legendary' },
      { id: 'gi', n: 'Джина', i: '🏹', a: 28, d: 15, lv: 4, r: 'epic' },
      { id: 'artur', n: 'Артур', i: '🛡️', a: 20, d: 30, lv: 3, r: 'rare' }
    ],
    heroBondsProg: {}
  },
  rRoster: () => '<div class="hn">Виктор</div><div class="hn">Джина</div>',
  snd: () => {},
  toast: () => {},
  updAll: () => {}
};

// Load TWD_HeroBonds from HTML
const fs = require('fs');
const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf-8');
const startTag = 'window.TWD_HeroBonds = {';
const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf('</script>', startIndex);
const scriptCode = html.substring(startIndex, endIndex);

eval(scriptCode);

console.log('--- Testing TWD Hero Bonds & Archetype Specializations ---');

// Test 1: Archetypes
const vicArch = window.TWD_HeroBonds.getHeroArchetype('vic');
assert.strictEqual(vicArch.n, 'Боевой', 'Viktor must be Combat archetype');

const elenaArch = window.TWD_HeroBonds.getHeroArchetype('elena');
assert.strictEqual(elenaArch.n, 'Развитие', 'Elena must be Development archetype');

const thomasArch = window.TWD_HeroBonds.getHeroArchetype('thomas');
assert.strictEqual(thomasArch.n, 'Снабжение', 'Thomas must be Logistics archetype');
console.log('✓ Test 1: Hero Archetype Specializations (Combat, Dev, Logistics) passed');

// Test 2: Hero Bonds Activation
const bondBrothers = window.TWD_HeroBonds.allBonds.find(b => b.id === 'bond_brothers');
assert.ok(bondBrothers, 'Brothers in Arms bond must exist');
const isBrothersActive = window.TWD_HeroBonds.isBondActive(bondBrothers);
assert.strictEqual(isBrothersActive, true, 'Bond must be active when both Viktor and Gina are recruited');

const bondNightWatch = window.TWD_HeroBonds.allBonds.find(b => b.id === 'bond_night_watch');
const isNightWatchActive = window.TWD_HeroBonds.isBondActive(bondNightWatch);
assert.strictEqual(isNightWatchActive, false, 'Night watch bond inactive when Timur is missing');
console.log('✓ Test 2: Hero Bonds Recruitment Checks passed');

// Test 3: Bond XP and Leveling
assert.strictEqual(window.TWD_HeroBonds.getBondLevel('bond_brothers'), 1, 'Initial Bond Level is 1');
window.TWD_HeroBonds.addBondXP('bond_brothers', 15);
assert.strictEqual(window.TWD_HeroBonds.getBondLevel('bond_brothers'), 2, 'Bond should level up to 2 after 15 XP');
console.log('✓ Test 3: Bond Synergy Progression & Leveling passed');

// Test 4: HTML Render
const bondsHtml = window.TWD_HeroBonds.renderBondsListHTML();
assert.ok(bondsHtml.includes('Братья по оружию'), 'HTML must include bond title');
assert.ok(bondsHtml.includes('АКТИВНО'), 'Active bond indicator must be rendered');
console.log('✓ Test 4: Bonds UI Rendering passed');

console.log('ALL TWD Hero Bonds & Archetypes tests PASS 100%!');

process.exit(0);
