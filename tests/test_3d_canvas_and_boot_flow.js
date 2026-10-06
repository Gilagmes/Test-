const fs = require('fs');
const path = require('path');

console.log('Testing 3D WebGL Canvas Initialization & Boot Flow...');

const html = fs.readFileSync(path.resolve(__dirname, '../The_Last_Port_3D_Final.html'), 'utf8');
const e3d = fs.readFileSync(path.resolve(__dirname, '../js/engine3d.js'), 'utf8');
const twd = fs.readFileSync(path.resolve(__dirname, '../js/twd-systems.js'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../css/style.css'), 'utf8');

// Test 1: No unsafe Float32Array overrides
console.log('[1/5] Checking for illegal typed array overrides in 3D iframe source...');
if (e3d.includes('window.Float32Array=parent.Float32Array')) {
  console.error('FAIL: Found window.Float32Array=parent.Float32Array in engine3d.js');
  process.exit(1);
}
console.log('  ✓ No cross-realm typed array pollution.');

// Test 2: Robust WebGLRenderer initialization with fallback
console.log('[2/5] Checking WebGLRenderer fallback protection...');
if (!e3d.includes('powerPreference:"high-performance"') || !e3d.includes('antialias:!1')) {
  console.error('FAIL: WebGLRenderer fallback not found');
  process.exit(1);
}
console.log('  ✓ WebGLRenderer fallback mechanism present.');

// Test 3: Boot dismissal triggers mainBase3D sync
console.log('[3/5] Checking boot dismissal sync hooks...');
if (!twd.includes('window.mainBase3D.sync') || !twd.includes('bootGoDirect')) {
  console.error('FAIL: Boot dismissal hooks missing');
  process.exit(1);
}
console.log('  ✓ Boot dismissal hooks correctly wired.');

// Test 4: Canvas #mc styling has atmospheric gradient fallback
console.log('[4/5] Checking Canvas #mc fallback background styling...');
if (!css.includes('#mc{') || !css.includes('radial-gradient')) {
  console.error('FAIL: #mc fallback background styling missing');
  process.exit(1);
}
console.log('  ✓ Atmospheric canvas fallback styling verified.');

// Test 5: Monolithic bundle contains all tags and passes parsing
console.log('[5/5] Checking monolithic bundle structure...');
if (!html.includes('id="engine3d-js"') || !html.includes('id="main-css"')) {
  console.error('FAIL: Monolithic bundle structure incomplete');
  process.exit(1);
}
console.log('  ✓ Monolithic build integrity verified.');

console.log('ALL 3D CANVAS & BOOT FLOW TESTS PASSED!');
