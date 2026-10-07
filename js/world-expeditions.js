/* LAST PORT — LIVING WORLD / STAGE 2F: MULTI-DAY EXPEDITIONS */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G) return;
  const G=window.G, DAY=86400000;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const ZONES=[
    {id:'ruins',name:'Заброшенный квартал',risk:22,loot:{wood:90,metal:35,food:30}},
    {id:'hospital',name:'Старая больница',risk:30,loot:{water:90,metal:25,food:45}},
    {id:'depot',name:'Военный склад',risk:42,loot:{metal:110,food:70,water:35}},
    {id:'radio',name:'Дальний радиопост',risk:34,loot:{metal:45,water:30,wood:45}}
  ];
  const EVENTS=[
    {id:'ambush',title:'🧟 Засада',desc:'Отряд попал под внезапную атаку ходячих.',damage:18,food:8},
    {id:'cache',title:'📦 Тайник',desc:'Разведчики нашли старый запас припасов.',bonus:{wood:45,metal:20}},
    {id:'survivor',title:'🆘 Выживший',desc:'На дороге найден раненый человек, который просит помощи.',damage:6,water:10,rescue:true},
    {id:'storm',title:'🌧️ Шторм',desc:'Путь перекрыт, поход задерживается.',delay:1,food:12},
    {id:'quiet',title:'🌙 Тихая ночь',desc:'Отряд спокойно пережил ночь.',morale:5}
  ];
  function state(){
    const S=G.S;if(!S)return null;
    S.worldExpeditions=S.worldExpeditions||{version:1,nextId:1,active:[],completed:[],rescued:0,history:[]};
    const d=S.worldExpeditions;
    ['active','completed','history'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});
    d.rescued=Number(d.rescued||0);d.nextId=Number(d.nextId||1);
    return d;
  }
  function res(){return G.S.res&&typeof G.S.res==='object'?G.S.res:G.S}
  function spend(cost){const r=res();for(const k of Object.keys(cost))if((Number(r[k])||0)<cost[k])return false;for(const k of Object.keys(cost))r[k]-=cost[k];return true}
  function addLoot(loot){const r=res();for(const k of Object.keys(loot||{}))r[k]=(Number(r[k])||0)+loot[k]}
  function notify(m){try{G.toast?.(m)}catch(e){}}
  function save(){try{G.save?.();G.updTop?.();G.tvdRefresh?.()}catch(e){}}
  function activeCount(){return state()?.active.filter(x=>x.status==='traveling'||x.status==='event').length||0}
  function heroList(){const S=G.S;return Array.isArray(S?.heroes)?S.heroes:[]}
  function chooseTeam(teamSize,teamIds){
    const all=heroList().filter(h=>h&&h.id);
    const requested=Array.isArray(teamIds)?teamIds.map(String):[];
    const picked=requested.length?requested.map(id=>all.find(h=>String(h.id)===id)).filter(Boolean):all.slice(0,teamSize);
    return picked.slice(0,teamSize);
  }
  function startExpedition(zoneId,days=3,teamSize=2,teamIds){
    const d=state();const z=ZONES.find(x=>x.id===zoneId);if(!d||!z)return false;
    if(activeCount()>=3){notify('🧭 Максимум 3 экспедиции одновременно.');return false}
    days=clamp(Number(days)||3,2,7);teamSize=clamp(Number(teamSize)||2,1,5);
    const team=chooseTeam(teamSize,teamIds);
    if(team.length<teamSize){
      if(heroList().length===0){ for(let i=0;i<teamSize;i++) team.push({id:'virtual-expedition-'+i}); }
      else {notify('👥 Недостаточно свободных выживших для этого отряда.');return false}
    }
    const cost={food:25+teamSize*10,water:20+teamSize*8};
    if(!spend(cost)){notify('🥫 Не хватает еды или воды для экспедиции.');return false}
    const now=Date.now(),id='exp-'+d.nextId++;
    const e={id,zoneId,destination:z.name,teamSize:team.length,teamIds:team.map(h=>h.id),day:0,totalDays:days,status:'traveling',startedAt:now,nextEventAt:now+DAY,eta:now+days*DAY,health:100,morale:75,injured:0,delays:0,loot:{},rescued:0,events:[],outcome:null};
    d.active.push(e);d.history.push({at:now,type:'start',id,zoneId});save();notify(`🧭 Экспедиция отправлена: ${z.name}.`);render();return true;
  }
  function processExpedition(id,now=Date.now(),choice){
    const d=state();const e=d?.active.find(x=>x.id===id);if(!e)return false;
    if(e.status==='event'&&choice){return resolveEvent(e,choice)}
    while(e.status==='traveling'&&now>=e.nextEventAt&&e.day<e.totalDays){
      e.day++; const z=ZONES.find(x=>x.id===e.zoneId)||ZONES[0];
      const roll=(e.day*17+e.teamSize*13+z.risk)%100;
      const ev=EVENTS[roll%EVENTS.length];
      e.events.push({day:e.day,event:ev.id,status:'pending'});
      if(ev.id==='quiet'){e.morale=clamp(e.morale+5,0,100);e.events[e.events.length-1].status='resolved';e.nextEventAt+=DAY;continue}
      e.status='event';e.currentEvent={...ev,day:e.day};e.nextEventAt+=DAY;break;
    }
    if(e.status==='traveling'&&e.day>=e.totalDays){complete(e);return true}
    save();render();return true;
  }
  function resolveEvent(e,choice='help'){
    const ev=e.currentEvent;if(!ev)return false;
    if(choice==='avoid'){
      e.morale=clamp(e.morale-6,0,100);e.events[e.events.length-1].status='avoided';
    } else if(ev.id==='ambush'){
      e.health=clamp(e.health-(choice==='fight'?ev.damage:Math.floor(ev.damage/2)),1,100);e.injured+=choice==='fight'?1:0;e.morale=clamp(e.morale-8,0,100);e.events[e.events.length-1].status='survived';
    } else if(ev.id==='cache'){
      addLoot(ev.bonus);Object.assign(e.loot,ev.bonus);e.events[e.events.length-1].status='looted';
    } else if(ev.id==='survivor'){
      if(choice==='help'){e.rescued++;state().rescued++;e.morale=clamp(e.morale+4,0,100);e.events[e.events.length-1].status='rescued'}else e.events[e.events.length-1].status='left';
    } else if(ev.id==='storm'){
      e.delays++;e.morale=clamp(e.morale-4,0,100);e.events[e.events.length-1].status='delayed';
    } else {e.events[e.events.length-1].status='resolved'}
    e.status='traveling';e.currentEvent=null;save();notify('📍 Событие экспедиции разрешено.');render();return true;
  }
  function applyTeamConsequences(e){
    const heroes=heroList();
    e.teamIds=(e.teamIds||[]).map(String);
    e.teamIds.forEach(id=>{
      const h=heroes.find(x=>String(x.id)===id); if(!h)return;
      const gain=18+e.day*4+e.rescued*5;
      h.xp=(Number(h.xp)||0)+gain; h.expeditionXp=(Number(h.expeditionXp)||0)+gain;
      h.lv=h.lv||1; while((h.xp||0)>=h.lv*100){h.xp-=h.lv*100;h.lv++;}
      h.living=h.living||{};
      h.living.health=clamp((Number(h.living.health ?? h.hp ?? 100)||100)-(e.injured>0?Math.min(25,e.injured*7):0),1,Number(h.living.maxHealth||100));
      h.hp=h.living.health; h.living.fatigue=clamp((Number(h.living.fatigue)||0)+20+e.totalDays*4,0,100);
      h.living.mood=clamp((Number(h.living.mood)||70)+(e.outcome==='successful'?5:-8),0,100);
      if(e.injured>0){h.living.injury=h.living.injury||{type:'экспедиционная травма',severity:Math.min(3,e.injured),until:Date.now()+3*86400000};}
      h.living.status=e.outcome==='successful'?'active':'recovering';
    });
  }
  function addRescuedToWorld(e){
    if(!e.rescued)return;
    const S=G.S; S.worldNPC=S.worldNPC||{version:1,day:-1,encounters:[],npcs:[],caravans:[],patrols:[],recruited:[],rescued:0,history:[]};
    S.worldNPC.npcs=Array.isArray(S.worldNPC.npcs)?S.worldNPC.npcs:[];
    for(let i=0;i<e.rescued;i++){
      const id='exp-rescued-'+e.id+'-'+i;
      if(S.worldNPC.npcs.some(n=>n.id===id))continue;
      const roles=['Разведчик','Медик','Механик','Охранник']; const names=['Игорь','Светлана','Роман','Ника']; const k=(e.day+i)%roles.length;
      S.worldNPC.npcs.push({id,npcId:'rescued-'+id,name:names[k],role:roles[k],sector:'commune',status:'waiting',fromExpedition:e.id});
    }
    S.worldNPC.history=Array.isArray(S.worldNPC.history)?S.worldNPC.history:[]; S.worldNPC.history.push({at:Date.now(),type:'expedition_rescue',expeditionId:e.id,count:e.rescued});
  }
  function complete(e){
    const d=state(),z=ZONES.find(x=>x.id===e.zoneId)||ZONES[0];
    const mult=clamp(0.65+e.morale/250,0.65,1.05),loot={};
    Object.keys(z.loot).forEach(k=>loot[k]=Math.max(1,Math.floor(z.loot[k]*mult)));addLoot(loot);Object.assign(e.loot,loot);
    e.status='completed';e.outcome=e.health<45?'wounded':e.morale<35?'traumatized':'successful';e.completedAt=Date.now();
    applyTeamConsequences(e); addRescuedToWorld(e);
    d.active=d.active.filter(x=>x.id!==e.id);d.completed.push(e);d.history.push({at:Date.now(),type:'complete',id:e.id,outcome:e.outcome,loot});if(d.history.length>100)d.history.shift();
    save();notify(`🏠 Экспедиция вернулась: ${e.destination}.`);render();return true;
  }
  function tick(now=Date.now()){
    const d=state();if(!d)return;
    d.active.slice().forEach(e=>{if(e.status==='traveling')processExpedition(e.id,now);});
    render();
  }
  function render(){
    const wrap=document.getElementById('twdWrap');if(!wrap)return;let card=document.getElementById('worldExpeditionCard');
    if(!card){card=document.createElement('div');card.id='worldExpeditionCard';card.className='world-expedition-card';const n=document.getElementById('worldNPCCard');(n||wrap.lastElementChild)?.after(card)}
    const d=state();if(!d)return;
    let html=`<div class="world-exp-title"><b>🧭 Экспедиции</b><span>${d.active.length}/3 в пути · спасено ${d.rescued}</span></div>`;
    html+=`<div class="world-exp-start">${ZONES.map(z=>`<button onclick="G.startWorldExpedition('${z.id}',3,2)">🧭 ${z.name}</button>`).join('')}</div>`;
    if(!d.active.length)html+=`<div class="world-exp-empty">Нет отрядов в пути. Отправьте людей на карту.</div>`;
    d.active.forEach(e=>{const pct=Math.round(e.day/e.totalDays*100);html+=`<div class="world-exp-row"><div><b>${e.destination}</b><small>День ${e.day}/${e.totalDays} · ❤️ ${e.health} · 🧠 ${e.morale}</small></div><div class="world-exp-bar"><i style="width:${pct}%"></i></div>${e.status==='event'?`<div class="world-exp-event"><b>${e.currentEvent.title}</b><small>${e.currentEvent.desc}</small><button onclick="G.resolveWorldExpedition('${e.id}','help')">Помочь</button><button onclick="G.resolveWorldExpedition('${e.id}','avoid')">Обойти</button></div>`:''}</div>`});
    card.innerHTML=html;
  }
  function resolveWorldExpedition(id,choice){const d=state();const e=d?.active.find(x=>x.id===id);return e?resolveEvent(e,choice):false}
  G.worldExpeditionState=state;G.getWorldExpeditionTeam=()=>heroList();G.startWorldExpedition=startExpedition;G.processWorldExpedition=processExpedition;G.resolveWorldExpedition=resolveWorldExpedition;G.tickWorldExpeditions=tick;
  const oldRefresh=G.tvdRefresh;if(oldRefresh)G.tvdRefresh=function(){oldRefresh.apply(this,arguments);setTimeout(render,0)};
  setInterval(()=>tick(Date.now()),5000);setTimeout(render,100);
  window.TLP_WorldExpeditions={version:'2.7.0',ZONES,EVENTS,state,startExpedition,processExpedition,resolveEvent,resolveWorldExpedition};
  console.log('[TLP] Living World Stage 2F loaded.');
})();
