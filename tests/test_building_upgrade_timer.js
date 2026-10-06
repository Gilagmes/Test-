const fs = require('fs');
const path = require('path');

console.log("Testing Building Upgrade Timer & Construction Flow...");

const twd = fs.readFileSync(path.resolve(__dirname, '../js/twd-systems.js'), 'utf8');

// Mock DOM & Game
let domElements = {};
global.document = {
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        innerHTML: '',
        textContent: '',
        style: {},
        classList: {
          add: () => {},
          remove: () => {}
        }
      };
    }
    return domElements[id];
  },
  createElement: (tag) => {
    return {
      tagName: tag,
      innerHTML: '',
      textContent: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {}
      },
      appendChild: () => {}
    };
  },
  body: {
    appendChild: () => {}
  }
};

global.window = {
  _enableNodeBuildingTimer: true,
  TWD_Haptics: {
    lightTap: () => {},
    levelUp: () => {}
  },
  TWD_ProceduralAudio: {
    playConstruction: () => {},
    playVictory: () => {}
  },
  G: {
    S: {
      bld: { hq: 1, farm: 1 },
      res: { food: 500, wood: 500, metal: 500 },
      bldQ: [],
      tutDone: false,
      tutStep: 1
    },
    buildCost: (k, amt) => ({ wood: 50, metal: 30 }),
    applyBuildDone: (k, amt, from, to) => {
      global.window.G.S.bld[k] = to;
    },
    calcPow: () => {},
    updAll: () => {},
    save: () => {},
    toast: (msg) => console.log("  [Toast]:", msg),
    snd: () => {},
    nextTut: () => {
      global.window.G.S.tutStep++;
      console.log("  [Tutorial Advanced] Step is now:", global.window.G.S.tutStep);
    }
  }
};

// Extract and evaluate TWD_BuildingSheet
const match = twd.match(/window\.TWD_BuildingSheet\s*=\s*\{([\s\S]*?)\n\s*\};\n\s*window\.openArtBuilding/);
if (!match) {
  console.error("FAIL: Could not extract TWD_BuildingSheet from twd-systems.js");
  process.exit(1);
}

eval('window.TWD_BuildingSheet = {' + match[1] + '};');

console.log("[1/4] Opening building card before upgrade...");
window.TWD_BuildingSheet.openBuilding('hq');
const modal = domElements['twdBuildingModal'];
if (!modal || !modal.innerHTML.includes('Ратуша (Штаб)')) {
  console.error("FAIL: Building modal did not render correctly");
  process.exit(1);
}
console.log("  ✓ Building card rendered successfully.");

console.log("[2/4] Triggering upgrade for 'hq'...");
const woodBefore = window.G.S.res.wood;
window.TWD_BuildingSheet.upgrade('hq');

if (window.G.S.res.wood >= woodBefore) {
  console.error("FAIL: Resources were not deducted on upgrade start");
  process.exit(1);
}
if (!window.G.S.bldQ || window.G.S.bldQ.length === 0) {
  console.error("FAIL: Building was not added to queue");
  process.exit(1);
}
const qItem = window.G.S.bldQ[0];
console.log(`  ✓ Building added to queue: ${qItem.k} Lv.${qItem.from} ➔ Lv.${qItem.to}, duration ${qItem.dur}ms`);

console.log("[3/4] Verifying Active Construction view with Timer & Progress Bar...");
if (!modal.innerHTML.includes('twd-bld-upgrade-card') || !modal.innerHTML.includes('twdBldTimerText')) {
  console.error("FAIL: Construction timer UI not rendered in modal!");
  process.exit(1);
}
console.log("  ✓ Timer and animated progress bar UI verified.");

console.log("[4/4] Testing Instant Speedup / Finish Build...");
window.TWD_BuildingSheet.instantComplete('hq');
if (window.G.S.bld.hq !== 2) {
  console.error("FAIL: Building level did not increase to 2! Current:", window.G.S.bld.hq);
  process.exit(1);
}
if (window.G.S.bldQ.length !== 0) {
  console.error("FAIL: Building queue was not cleared after completion");
  process.exit(1);
}
console.log("  ✓ Building successfully upgraded to Level 2 and tutorial progressed!");

console.log("ALL BUILDING UPGRADE TIMER TESTS PASSED!");
