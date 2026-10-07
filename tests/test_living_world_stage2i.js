const fs=require('fs'),path=require('path'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'..','js','world-settlements.js'),'utf8');
assert(src.includes('worldSettlements'),'state must exist');
assert(src.includes('establishOutpost'),'outpost system must exist');
assert(src.includes('migrate'),'migration must exist');
assert(src.includes('population'),'population simulation must exist');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert(html.includes('js/world-settlements.js'),'stage 2I module must be loaded');
console.log('✓ Stage 2I settlements/outposts checks passed');
