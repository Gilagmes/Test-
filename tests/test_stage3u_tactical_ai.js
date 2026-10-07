const fs=require('fs'),vm=require('vm'),assert=require('assert');
const files=['js/base-defense-stage3t.js','js/base-defense-stage3u.js'];
const ctx={console,Date,Math,document:{getElementById:()=>null}};ctx.window={G:{S:{day:4,heroes:[{id:'h1',name:'Роман',role:'Штурмовик',hp:100,maxHp:100},{id:'h2',name:'Лена',role:'Медик',hp:100,maxHp:100}],equipment:{inventory:[],equipped:{},history:[]},loadouts:{presets:{},active:{},history:[]}},baseDefenseState:()=>({active:{status:'active',zombies:[{id:'z1',type:'runner',hp:60,maxHp:100,x:.2},{id:'z2',type:'brute',hp:300,maxHp:320,x:.5}]}})}};
vm.createContext(ctx);for(const f of files)vm.runInContext(fs.readFileSync(f,'utf8'),ctx);const G=ctx.window.G;
let a=G.tacticalAI.chooseTarget(G.baseDefenseState().active,'h1');assert(a&&a.id==='z1');
G.tacticalAI.setProfile('h1',{targeting:'weakest'});a=G.tacticalAI.chooseTarget(G.baseDefenseState().active,'h1');assert(a&&a.id==='z1');
assert(G.tacticalAI.setProfile('h1',{behavior:'defense',targeting:'priority'}));const actions=G.tacticalAI.tick();assert(actions.length===2&&actions[0].target);
assert(G.tacticalAI.enable(false)===false);assert(G.tacticalAI.tick().length===0);assert(G.tacticalAI.enable(true)===true);console.log('Stage 3U Tactical AI: 5/5 passed');
