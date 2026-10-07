const fs=require('fs'),vm=require('vm'),assert=require('assert');
const G={S:{day:12,res:{food:100,water:100,wood:100,metal:100},heroes:[{id:'hero-lena',heroCatalogId:'hero-lena',name:'Лена',loyalty:70,living:{loyalty:70,mood:70}}]}};
const ctx={window:{G},console,Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/base-defense-stage3j.js','utf8'),ctx);const Q=ctx.window.G.heroPersonalQuests;
assert(Q.get('hero-lena').quest.title==='Последний пациент');assert(Q.start('hero-lena'));assert(Q.state().active['hero-lena']);assert(Q.advance('hero-lena'));assert(Q.advance('hero-lena'));assert(Q.advance('hero-lena'));assert(Q.state().completed['hero-lena']);assert(G.S.heroes[0].living.loyalty>70);assert(G.S.res.food===75);console.log('Stage 3J: 7/7 passed');
