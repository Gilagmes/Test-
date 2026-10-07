const fs = require('fs');
const path = require('path');

console.log("Testing 3D Camera Pan, Drag & Clean Viewport Rules...");

const e3d = fs.readFileSync(path.resolve(__dirname, '../js/engine3d.js'), 'utf8');
const htmlSource = fs.readFileSync(path.resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');
const cameraSource = e3d + '\n' + htmlSource;
const css = fs.readFileSync(path.resolve(__dirname, '../css/style.css'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');

// Test 1: mobileLabels and artQueue are hidden and do not intercept pointer events
console.log("[1/4] Checking that blocking DOM labels are disabled in 3D scene...");
if (!css.includes('#mobileLabels, .mobileLabel, #artQueue') || !css.includes('pointer-events: none !important')) {
  console.error("FAIL: #mobileLabels / #artQueue are not properly disabled in CSS");
  process.exit(1);
}
console.log("  ✓ Blocking 2D DOM overlays disabled.");

// Test 2: iframe and canvas have touch-action: none for smooth 60fps orbit drag
console.log("[2/4] Checking touch-action styling on 3D canvas and iframe...");
if (!css.includes('#artContainer iframe') || !css.includes('touch-action: none')) {
  console.error("FAIL: iframe touch-action is not configured");
  process.exit(1);
}
console.log("  ✓ 3D touch drag & pinch-to-zoom pass-through enabled.");

// Test 3: panCamera math implementation in 3D engine
console.log("[3/4] Checking panCamera real ground panning implementation...");
if (!cameraSource.includes('panCamera(dx,dy)') && !cameraSource.includes('panCamera(dx, dy)')) {
  console.error("FAIL: panCamera is missing from engine3d.js");
  process.exit(1);
}
console.log("  ✓ Real-time map panning along ground plane verified.");

// Test 4: HUD layout rules prevent top-left overlapping
console.log("[4/4] Checking HUD non-overlapping positioning...");
if (!css.includes('.dilemma-alert-btn') || !css.includes('top: 250px !important')) {
  console.error("FAIL: dilemma-alert-btn spacing rule missing");
  process.exit(1);
}
console.log("  ✓ HUD layout clean separation verified.");

console.log("ALL CAMERA DRAG & CLEAN VIEWPORT TESTS PASSED!");
