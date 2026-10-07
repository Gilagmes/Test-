const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ctx={console,setTimeout,clearTimeout,Date,Math};ctx.window=ctx;ctx.G={S:{day:5,food:20,heroes:[{id:'hero-lena',name:'Лена',loyalty:70,living:{loyalty:70,fatigue:10}}],commune:{morale:50,security:50}},save(){}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/base-defense-stage3m.js','utf8'),ctx);
const E=ctx.G.heroEvents; assert(E.available().length>0); assert(E.trigger('camp-conversation')); assert(E.get().active); assert(E.resolve('listen')); assert.strictEqual(ctx.G.S.heroes[0].living.loyalty,74); assert.strictEqual(E.get().stats.resolved,1);
ctx.G.S.day=6; assert(E.trigger('shared-supplies')); assert(E.resolve('fair')); assert.strictEqual(ctx.G.S.commune.morale,54); assert(E.get().history.length>=4);
console.log('✓ stage3m 6/6');
