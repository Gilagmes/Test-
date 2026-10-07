const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../js/world-expeditions.js'),'utf8');
const heroes=[{id:'h1',n:'Михаил',lv:1,xp:0,hp:100,living:{health:100,maxHealth:100,mood:70,fatigue:0}},{id:'h2',n:'Анна',lv:1,xp:0,hp:100,living:{health:100,maxHealth:100,mood:80,fatigue:0}}];
const ctx={console,Date,Math,setTimeout:(fn)=>fn(),setInterval:()=>0,window:{},document:{getElementById:()=>null,createElement:()=>({}),body:{appendChild(){}}}};ctx.window=ctx;
ctx.G={S:{res:{food:500,water:300,metal:100,wood:100},heroes},toast(){},save(){},updTop(){},tvdRefresh(){}};
vm.createContext(ctx);vm.runInContext(src,ctx);
assert(ctx.TLP_WorldExpeditions.version==='2.7.0');
assert(ctx.G.startWorldExpedition('ruins',2,2,['h1','h2'])===true);
const d=ctx.G.worldExpeditionState(),e=d.active[0]; assert.deepStrictEqual(e.teamIds,['h1','h2']);
for(let i=0;i<6&&d.active.length;i++){ctx.G.processWorldExpedition(e.id,e.nextEventAt+1);if(e.status==='event')ctx.G.resolveWorldExpedition(e.id,e.currentEvent.id==='survivor'?'help':'help');}
if(d.active.length) ctx.G.processWorldExpedition(e.id,Date.now()+10*86400000);
assert(d.active.length===0);assert(d.completed.length===1);assert(heroes.some(h=>h.xp>0));assert(heroes.some(h=>h.living.fatigue>0));
console.log('PASS: Living World Stage 2G');
