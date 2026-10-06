const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Testing PWA Manifest, Service Worker & Web App Suite ---');

// Test 1: manifest.json validation
const manifestPath = path.resolve(__dirname, '../manifest.json');
assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

assert.strictEqual(manifestContent.short_name, 'The Last Port', 'short_name must match');
assert.strictEqual(manifestContent.display, 'standalone', 'display must be standalone');
assert.ok(manifestContent.icons.length > 0, 'Must contain at least 1 icon entry');
console.log('✓ Test 1: PWA Web App Manifest validation passed');

// Test 2: Service Worker sw.js
const swPath = path.resolve(__dirname, '../sw.js');
assert.ok(fs.existsSync(swPath), 'sw.js must exist');
const swCode = fs.readFileSync(swPath, 'utf-8');
assert.ok(swCode.includes('addEventListener(\'install\''), 'SW must handle install event');
assert.ok(swCode.includes('addEventListener(\'fetch\''), 'SW must handle fetch event');
assert.ok(swCode.includes('caches.match'), 'SW must implement cache matching');
console.log('✓ Test 2: Service Worker CacheFirst Offline Engine passed');

// Test 3: Icons existence
const iconPath = path.resolve(__dirname, '../icons/icon.svg');
assert.ok(fs.existsSync(iconPath), 'icons/icon.svg must exist');
const iconSvg = fs.readFileSync(iconPath, 'utf-8');
assert.ok(iconSvg.includes('<svg'), 'Icon must be valid SVG');
console.log('✓ Test 3: PWA Vector App Icons passed');

console.log('ALL PWA & Service Worker tests PASS 100%!');

process.exit(0);
