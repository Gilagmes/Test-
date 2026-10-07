const assert=require('assert'),fs=require('fs'),vm=require('vm');
const ctx={console,setTimeout,clearTimeout,Date,Math};ctx.window=ctx;ctx.G={S:{day:8,heroes:[{id:'hero-lena',name:'Лена',heroCatalogId:'hero-lena',loyalty:70,living:{loyalty:70}}],commune:{morale:50,security:50,reputation:0}},save(){}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/base-defense-stage3l.js','utf8'),ctx);
const C=ctx.G.heroCommuneConsequences;
assert(C.apply('hero-lena','mercy')); assert.strictEqual(ctx.G.S.commune.morale,56); assert(ctx.G.S.commune.productionBonuses.medical>=2); assert(ctx.G.S.communeConsequences.flags.includes('mercy'));
assert(!C.apply('hero-lena','mercy')); assert.strictEqual(C.get('hero-lena').applied.ending,'mercy');
ctx.G.S.heroStoryArcs={completed:{'hero-viktor':{ending:'hold'}}};ctx.G.S.heroes.push({id:'hero-viktor',name:'Виктор',heroCatalogId:'hero-viktor',loyalty:70,living:{loyalty:70}});assert.strictEqual(C.sync(),1);assert(ctx.G.S.commune.security>=58);
console.log('✓ stage3l 4/4');
