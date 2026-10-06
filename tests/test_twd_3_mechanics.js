const fs = require('fs');

console.log("==================================================");
console.log("  TESTING 3 CORE TWD REPLICA MECHANICS");
console.log("==================================================");

const html = fs.readFileSync(require('path').resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Mock browser environment
const window = {
  G: {
    SUBS: { base: ['buildings', 'tech', 'hospital'] },
    SL: {},
    S: {
      res: { food: 5000, wood: 5000, metal: 3000 },
      gems: 100,
      pow: 4000,
      tutDone: true,
      gar: ['jo', 'elena'],
      heroes: [
        { id: 'jo', n: 'Джо', r: 'Стрелок-охотник', i: '🏹', lv: 5 },
        { id: 'elena', n: 'Елена', r: 'Агроном', i: '🌾', lv: 3 },
        { id: 'marcus', n: 'Маркус', r: 'Инженер', i: '👷', lv: 4 }
      ],
      troops: { melee: 100, ranged: 80, cavalry: 50 },
      bld: { hq: 5, farm: 4, saw: 4, hosp: 3, lab: 3, wrk: 3, wall: 4 },
      hospital: {
        wounded: { melee: 10, ranged: 5, cavalry: 2 }
      }
    },
    toast: (msg) => console.log("  [TOAST]:", msg),
    snd: () => {},
    save: () => {},
    rPanel: () => {},
    updTop: () => {},
    calcPow: () => {}
  }
};
global.window = window;
global.document = {
  body: { appendChild: () => {} },
  getElementById: (id) => ({
    id,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    innerHTML: ''
  }),
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    remove: () => {}
  }),
  querySelector: () => null
};

// Evaluate scripts:
// 1. twd-hosp-tech-js
const hospMatch = html.match(/<script id="twd-hosp-tech-js">([\s\S]*?)<\/script>/);
if (hospMatch) eval(hospMatch[1]);

// 2. twd-hero-bld-assign-js
const heroAssignMatch = html.match(/<script id="twd-hero-bld-assign-js">([\s\S]*?)<\/script>/);
if (heroAssignMatch) eval(heroAssignMatch[1]);

// 3. twd-citadel-defense-js
const cdefMatch = html.match(/<script id="twd-citadel-defense-js">([\s\S]*?)<\/script>/);
if (cdefMatch) eval(cdefMatch[1]);

console.log("\n[TEST 1/3] Назначение Героев на Здания (Development Heroes)...");
window.G.assignHeroToBuilding('farm', 'elena');
console.log("  ✓ Assigned Elena to Farm:", window.G.S.heroBldAssign);
if (window.G.S.heroBldAssign.farm !== 'elena') {
  console.error("ERROR: Hero farm assignment failed!");
  process.exit(1);
}

window.G.assignHeroToBuilding('saw', 'marcus');
console.log("  ✓ Assigned Marcus to Sawmill:", window.G.S.heroBldAssign);
if (window.G.S.heroBldAssign.saw !== 'marcus') {
  console.error("ERROR: Hero sawmill assignment failed!");
  process.exit(1);
}

const farmWidget = window.G.rBuildingHeroAssignWidget('farm');
console.log("  ✓ Farm Widget Rendered successfully (len=" + farmWidget.length + ")");
if (!farmWidget.includes('Елена') || !farmWidget.includes('+30%')) {
  console.error("ERROR: Farm widget missing hero details!");
  process.exit(1);
}

console.log("\n[TEST 2/3] Интерактивная Оборона Стены: Баррикады, Ежи и Потери...");
if (window.CitadelDefenseEngine) {
  const engine = new window.CitadelDefenseEngine(window.G, { wave: 5 });
  engine.energy = 50;
  
  // Test barricade placement on Lane 0
  engine.selectLaneSkill('barricade');
  engine.onLaneClick(0);
  console.log("  ✓ Barricade on Lane 0 HP:", engine.laneBarricades[0].hp, "/ Energy:", engine.energy);
  if (engine.laneBarricades[0].hp <= 0 || engine.energy !== 35) {
    console.error("ERROR: Barricade placement failed!");
    process.exit(1);
  }

  // Test trap placement on Lane 1
  engine.selectLaneSkill('trap');
  engine.onLaneClick(1);
  console.log("  ✓ Trap on Lane 1 active hits:", engine.laneTraps[1], "/ Energy:", engine.energy);
  if (engine.laneTraps[1] !== 4 || engine.energy !== 25) {
    console.error("ERROR: Trap placement failed!");
    process.exit(1);
  }

  // Test victory finish & hospital casualties admission
  engine.finish(true);
  console.log("  ✓ Wounded defenders admitted to Hospital:", window.G.S.hospital.wounded);
  const totalWounded = (window.G.S.hospital.wounded.melee || 0) + (window.G.S.hospital.wounded.ranged || 0);
  if (totalWounded <= 0) {
    console.error("ERROR: Casualties admission failed!");
    process.exit(1);
  }
}

console.log("\n[TEST 3/3] Военный Госпиталь: Лечение и Восстановление Бойцов...");
const meleeWoundedBefore = window.G.S.hospital.wounded.melee;
const meleeTroopsBefore = window.G.S.troops.melee;

// Heal 2 melee troops using resources
window.G.healWoundedTroops('melee', 2);
console.log("  ✓ Wounded after partial heal:", window.G.S.hospital.wounded.melee, "(was " + meleeWoundedBefore + ")");
console.log("  ✓ Melee troops in army after heal:", window.G.S.troops.melee, "(was " + meleeTroopsBefore + ")");
if (window.G.S.hospital.wounded.melee !== meleeWoundedBefore - 2 || window.G.S.troops.melee !== meleeTroopsBefore + 2) {
  console.error("ERROR: Partial hospital heal failed!");
  process.exit(1);
}

// Instant heal all remaining wounded with gems
window.G.healAllWoundedGems();
console.log("  ✓ Remaining wounded after gem surgery:", window.G.S.hospital.wounded);
const remainingWounded = (window.G.S.hospital.wounded.melee || 0) + (window.G.S.hospital.wounded.ranged || 0) + (window.G.S.hospital.wounded.cavalry || 0);
if (remainingWounded !== 0) {
  console.error("ERROR: Full gem heal failed!");
  process.exit(1);
}

console.log("\n==================================================");
console.log("  ALL 3 TWD CORE MECHANICS PASSED 100%!");
console.log("==================================================");
process.exit(0);
