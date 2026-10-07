const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../js/world-expeditions.js'),'utf8');
const ctx={console,Date,Math,setTimeout:(fn)=>fn(),setInterval:()=>0,window:{},document:{getElementById:()=>null,createElement:()=>({}),body:{appendChild(){}}}};ctx.window=ctx;
ctx.G={S:{res:{food:500,water:300,metal:100,wood:100},heroes:[]},toast(){},save(){},updTop(){},tvdRefresh(){}};
vm.createContext(ctx);vm.runInContext(src,ctx);
assert(ctx.TLP_WorldExpeditions.version==='2.7.0');
assert(ctx.G.startWorldExpedition('ruins',3,2)===true);
const d=ctx.G.worldExpeditionState(),e=d.active[0]; assert(e.totalDays===3); assert(e.status==='traveling');
const t=e.nextEventAt+1; ctx.G.processWorldExpedition(e.id,t); assert(e.day>=1);
if(e.status==='event') ctx.G.resolveWorldExpedition(e.id,'help');
ctx.G.processWorldExpedition(e.id,e.nextEventAt+1);
if(e.status==='event') ctx.G.resolveWorldExpedition(e.id,'help');
ctx.G.processWorldExpedition(e.id,e.nextEventAt+1);
if(e.status==='event') ctx.G.resolveWorldExpedition(e.id,'help');
for(let i=0;i<8 && d.active.length;i++){ctx.G.processWorldExpedition(e.id,Date.now()+10*86400000);if(e.status==='event')ctx.G.resolveWorldExpedition(e.id,'help');}
assert(d.active.length===0); assert(d.completed.length===1); assert(Object.keys(d.completed[0].loot).length>0);
console.log('PASS: Living World Stage 2F');
