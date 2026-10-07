const fs=require('fs'),vm=require('vm'),assert=require('assert');
const s3s=fs.readFileSync('js/base-defense-stage3s.js','utf8');
const s3t=fs.readFileSync('js/base-defense-stage3t.js','utf8');
const ctx={console,Date,Math};ctx.window={G:{S:{day:3,res:{metal:30,parts:20,medicine:10,tools:10,ammo:10},heroes:[{id:'h1',name:'Роман',role:'Штурмовик'}]}}};vm.createContext(ctx);vm.runInContext(s3s,ctx);vm.runInContext(s3t,ctx);const G=ctx.window.G;
const i=G.equipment.craft('rifle');assert(i);assert(G.heroLoadouts.setPreset('h1','assault'));assert(G.heroLoadouts.equipSlot('h1','weapon',i.id));let p=G.heroLoadouts.profile('h1');assert(p.stats.damage>0);assert.strictEqual(p.preset,'assault');assert(G.heroLoadouts.savePreset('h1','Рейд'));assert(G.heroLoadouts.unequip('h1','weapon'));assert(G.heroLoadouts.applyPreset('h1','Рейд'));assert(G.heroLoadouts.profile('h1').slots.weapon===i.id);console.log('Stage 3T Loadouts: 6/6 passed');
