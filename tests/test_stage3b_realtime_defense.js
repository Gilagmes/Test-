const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=global;global.window.addEventListener=()=>{};global.document={getElementById:()=>null};global.performance={now:()=>1000};global.requestAnimationFrame=()=>{};
global.G={S:{wave:3,bld:{wall:2},res:{wood:500,metal:300},survivors:[{id:'s1',name:'Михаил',health:100,attack:80,mood:100}],heroes:[],guardTowers:{tow:{lv:2}}},SUBS:{base:[]},SL:{},save:()=>{},updAll:()=>{},toast:()=>{}};
eval(fs.readFileSync(path.join(__dirname,'../js/base-defense-stage3.js'),'utf8'));eval(fs.readFileSync(path.join(__dirname,'../js/base-defense-realtime.js'),'utf8'));
assert.ok(G.startRealtimeDefense(1));let a=G.getRealtimeDefense();assert.ok(a&&a.status==='active'&&a.zombies.length>0);
G.placeDefenseFighter('front','s1');for(let i=0;i<120;i++)G.tickRealtimeDefense(.25);a=G.getRealtimeDefense();assert.ok(a.status==='won'||a.status==='lost'||a.status==='active');assert.ok(Number(a.shots)>=0);
assert.ok(typeof G.tickRealtimeDefense==='function');assert.ok(typeof G.stopRealtimeDefense==='function');
console.log('✓ Stage 3B realtime defense: 4/4 checks passed');
