/* LAST PORT — LIVING WORLD / STAGE 2E: NPC LIFE & ENCOUNTERS */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G) return;
  const G=window.G, clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), DAY=86400000;
  const ROUTES=[
    {id:'north-road',name:'Северная трасса',from:12,to:61},
    {id:'old-highway',name:'Старая магистраль',from:27,to:43},
    {id:'river-road',name:'Речная дорога',from:61,to:12}
  ];
  const NPC_POOL=[
    {id:'mara',name:'Мара',role:'Разведчик',icon:'🧭',trait:'осторожная',joinCost:{food:45,water:25},skill:'scout'},
    {id:'den',name:'Денис',role:'Механик',icon:'🔧',trait:'практичный',joinCost:{food:55,metal:20},skill:'mechanic'},
    {id:'lena',name:'Лена',role:'Медик',icon:'🩺',trait:'заботливая',joinCost:{food:50,water:30},skill:'medic'},
    {id:'max',name:'Макс',role:'Охранник',icon:'🛡️',trait:'смелый',joinCost:{food:60,metal:15},skill:'guard'}
  ];
  const TYPES=[
    {id:'traveler',icon:'🚶',title:'Одинокий путник',desc:'Выживший просит безопасное место и шанс начать заново.'},
    {id:'rescue',icon:'🆘',title:'Группа на дороге',desc:'Небольшая группа зажата между ходячими и разбитой машиной.'},
    {id:'bandit',icon:'🏴',title:'Бандитский патруль',desc:'Вооружённая группа проверяет караван на старой дороге.'},
    {id:'caravan',icon:'🚚',title:'Караван движется',desc:'Торговцы проходят через соседний сектор.'}
  ];
  function state(){
    const S=G.S;if(!S)return null;
    S.worldNPC=S.worldNPC||{version:1,day:-1,encounters:[],npcs:[],caravans:[],patrols:[],recruited:[],rescued:0,history:[]};
    const d=S.worldNPC;
    ['encounters','npcs','caravans','patrols','recruited','history'].forEach(k=>{d[k]=Array.isArray(d[k])?d[k]:[]});
    d.rescued=Number(d.rescued||0);
    return d;
  }
  function res(){return G.S.res&&typeof G.S.res==='object'?G.S.res:G.S}
  function spend(cost){const r=res();for(const k of Object.keys(cost))if((Number(r[k])||0)<cost[k])return false;for(const k of Object.keys(cost))r[k]-=cost[k];return true}
  function notify(m){try{G.toast?.(m)}catch(e){}}
  function save(){try{G.save?.();G.updTop?.();G.tvdRefresh?.()}catch(e){}}
  function heroList(){const S=G.S;return Array.isArray(S.heroes)?S.heroes:[]}
  function addHero(npc){
    const S=G.S;if(!Array.isArray(S.heroes))S.heroes=[];
    const id='npc-'+npc.id+'-'+Date.now().toString(36);
    const h={id,n:npc.name,name:npc.name,role:npc.role,hp:100,level:1,loyalty:72,living:{mood:80,fatigue:5,health:100,maxHealth:100,loyalty:72,trait:npc.trait,status:'active',xp:0,recruitedFromWorld:true,skill:npc.skill}};
    S.heroes.push(h);return h;
  }
  function spawnDaily(){
    const d=state();if(!d)return;
    const day=Math.floor(Date.now()/DAY);if(d.day===day)return;
    d.day=day;
    d.encounters=[];d.caravans=[];d.patrols=[];
    const npc=NPC_POOL[day%NPC_POOL.length],type=TYPES[day%TYPES.length];
    d.npcs=[{id:`npc-${npc.id}-${day}`,npcId:npc.id,sector:[12,27,43,61][day%4],name:npc.name,role:npc.role,status:'waiting'}];
    d.encounters.push({id:`enc-${day}`,type:type.id,sector:[12,27,43,61][(day+1)%4],status:'active',created:Date.now(),npcId:npc.id});
    d.caravans=ROUTES.map((r,i)=>({id:`car-${day}-${i}`,route:r.id,sector:i%2?r.from:r.to,progress:(day*17+i*31)%100,status:'moving'}));
    d.patrols=[{id:`pat-${day}`,faction:'ironwolves',sector:[43,27,61][day%3],strength:25+(day%4)*5,status:'moving'}];
    d.history.push({at:Date.now(),type:'daily_world_refresh',day});if(d.history.length>80)d.history.shift();
  }
  function recruitWorldNPC(id){
    const d=state();if(!d)return false;const n=d.npcs.find(x=>x.id===id&&x.status==='waiting');if(!n)return false;
    const p=NPC_POOL.find(x=>x.id===n.npcId);if(!p||d.recruited.some(x=>x.npcId===p.id))return false;
    if(!spend(p.joinCost)){notify('🍖 Недостаточно припасов, чтобы принять выжившего.');return false}
    const h=addHero(p);n.status='recruited';d.recruited.push({npcId:p.id,heroId:h.id,at:Date.now()});d.history.push({at:Date.now(),type:'recruited',name:p.name});save();notify(`🏠 ${p.icon} ${p.name} присоединился к коммуне.`);render();return true;
  }
  function resolveEncounter(id,action){
    const d=state();const e=d?.encounters.find(x=>x.id===id&&x.status==='active');if(!e)return false;
    if(action==='rescue'){
      if(!spend({food:30,water:20})){notify('💧 Не хватает припасов для спасательной группы.');return false}
      e.status='resolved';d.rescued++;notify('🆘 Люди спасены. Они будут ждать решения в коммуне.');
    } else if(action==='scout'){
      e.scouted=true;notify('🔭 Разведка завершена: патруль замечен на маршруте.');
    } else if(action==='avoid'){e.status='avoided';notify('↩️ Вы решили не вмешиваться.');}
    else return false;
    d.history.push({at:Date.now(),type:'encounter',encounter:e.type,action});save();render();return true;
  }
  function moveWorld(id,direction){
    const d=state();if(!d)return false;const c=d.caravans.find(x=>x.id===id);if(!c)return false;c.progress=clamp(c.progress+(direction==='forward'?20:-20),0,100);if(c.progress>=100){c.status='arrived';c.progress=0;notify('🚚 Караван прибыл к следующему поселению.')}save();render();return true;
  }
  function tick(){const d=state();if(!d)return;spawnDaily();d.caravans.forEach(c=>{if(c.status==='moving'){c.progress=clamp(c.progress+2,0,100);if(c.progress>=100){c.progress=0;c.status='moving'}}});d.patrols.forEach(p=>{p.strength=Math.max(10,p.strength+(Math.random()<.2?5:-2));});}
  function render(){
    const wrap=document.getElementById('twdWrap');if(!wrap)return;let card=document.getElementById('worldNPCCard');if(!card){card=document.createElement('div');card.id='worldNPCCard';card.className='world-npc-card';const f=document.getElementById('worldFactionsCard');(f||wrap.querySelector('.world-war-card'))?.after(card)}
    const d=state();if(!d)return;spawnDaily();
    const e=d.encounters.find(x=>x.status==='active');const n=d.npcs.find(x=>x.status==='waiting');
    let html=`<div class="world-npc-title"><b>👥 Жизнь на дорогах</b><span>спасено ${d.rescued} · нанято ${d.recruited.length}</span></div>`;
    if(n){const p=NPC_POOL.find(x=>x.id===n.npcId);html+=`<div class="world-npc-person"><span class="wn-icon">${p.icon}</span><div><b>${p.name} · ${p.role}</b><small>${p.trait} · сектор ${n.sector}</small></div><button class="bgn" onclick="G.recruitWorldNPC('${n.id}')">🏠 Принять</button></div>`}
    if(e){const t=TYPES.find(x=>x.id===e.type)||TYPES[0];html+=`<div class="world-npc-event"><div><b>${t.icon} ${t.title}</b><small>${t.desc} · сектор ${e.sector}</small></div><div class="wn-actions"><button class="bs" onclick="G.resolveWorldNPC('${e.id}','scout')">🔭 Разведать</button><button class="bgn" onclick="G.resolveWorldNPC('${e.id}','rescue')">🆘 Помочь</button><button class="bs" onclick="G.resolveWorldNPC('${e.id}','avoid')">↩️ Обойти</button></div></div>`}
    html+=`<div class="world-npc-route"><b>🚚 Движение караванов</b>${d.caravans.slice(0,3).map(c=>{const r=ROUTES.find(x=>x.id===c.route);return `<div><span>${r.name}</span><span>${c.progress}% <button class="bs" onclick="G.moveWorldCaravan('${c.id}','forward')">→</button></span></div>`}).join('')}</div>`;
    card.innerHTML=html;
  }
  G.worldNPCState=state;G.recruitWorldNPC=recruitWorldNPC;G.resolveWorldNPC=resolveEncounter;G.moveWorldCaravan=moveWorld;G.tickWorldNPC=tick;
  const oldRefresh=G.tvdRefresh;if(oldRefresh)G.tvdRefresh=function(){oldRefresh.apply(this,arguments);setTimeout(render,0)};
  const oldShow=G.tvdShow;if(oldShow)G.tvdShow=function(on){oldShow.apply(this,arguments);if(on)setTimeout(render,40)};
  setInterval(tick,5000);setTimeout(render,80);
  window.TLP_WorldNPC={version:'2.5.0',NPC_POOL,TYPES,ROUTES,state,spawnDaily};
  console.log('[TLP] Living World Stage 2E loaded.');
})();
