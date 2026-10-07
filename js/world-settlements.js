/* LAST PORT — LIVING WORLD / STAGE 2I: SETTLEMENTS & OUTPOSTS */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G) return;
  const G=window.G, DAY=86400000;
  const TYPES=[
    {id:'commune',icon:'🏘️',name:'Коммуна',basePop:34,growth:1.4},
    {id:'trading',icon:'🏪',name:'Торговый пост',basePop:18,growth:.8},
    {id:'fort',icon:'🛡️',name:'Укреплённый лагерь',basePop:26,growth:.5},
    {id:'ruins',icon:'🏚️',name:'Посёлок руин',basePop:9,growth:-.3}
  ];
  const NAMES=['Сосны','Старый мост','Рубеж','Тихая вода','Красный двор','Северный пост'];
  function state(){
    const S=G.S;if(!S)return null;
    S.worldSettlements=S.worldSettlements||{version:1,lastDay:-1,settlements:[],outposts:[],routes:[],log:[],migration:[]};
    const d=S.worldSettlements;
    ['settlements','outposts','routes','log','migration'].forEach(k=>{d[k]=Array.isArray(d[k])?d[k]:[]});
    if(d.lastDay===-1) seed(d);
    return d;
  }
  function seed(d){
    const sectors=[8,19,35,52,68,79];
    d.settlements=TYPES.map((t,i)=>({id:`settlement-${t.id}-${i}`,name:NAMES[i],type:t.id,sector:sectors[i],population:t.basePop+i*3,morale:55+i*5,food:120+i*20,water:100+i*15,wood:80,metal:45,owner:i===0?'harbor':i===1?'roadkeepers':i===2?'ironwolves':i===3?'watchers':'neutral',relations:i===2?-25:10,level:1,alive:true}));
    d.routes=d.settlements.slice(0,4).map((s,i)=>({id:`route-${i}`,from:s.id,to:d.settlements[(i+1)%4].id,progress:0,active:true}));
    d.lastDay=Math.floor(Date.now()/DAY)-1;
  }
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function res(){return G.S.res&&typeof G.S.res==='object'?G.S.res:G.S}
  function spend(cost){const r=res();if(!Object.entries(cost).every(([k,v])=>(Number(r[k])||0)>=v))return false;Object.entries(cost).forEach(([k,v])=>r[k]-=v);return true}
  function save(){try{G.save?.();G.updTop?.();G.tvdRefresh?.()}catch(e){}}
  function notify(m){try{G.toast?.(m)}catch(e){}}
  function advanceDay(){
    const d=state(),day=Math.floor(Date.now()/DAY);if(!d||d.lastDay===day)return;
    const days=Math.max(1,day-d.lastDay);d.lastDay=day;
    d.settlements.forEach(s=>{
      if(!s.alive)return;
      const foodNeed=Math.ceil(s.population*.7*days), waterNeed=Math.ceil(s.population*.55*days);
      s.food-=foodNeed;s.water-=waterNeed;
      if(s.food<0||s.water<0){s.morale=clamp(s.morale-10,0,100);s.population=Math.max(1,s.population-Math.max(1,Math.floor(s.population*.03)));s.food=Math.max(0,s.food);s.water=Math.max(0,s.water)}
      else {s.morale=clamp(s.morale+2,0,100);s.population=Math.max(1,Math.round(s.population+(s.morale>=65?s.population*.01:-s.population*.002)))}
      if(s.population>=(20+s.level*20)){s.level++;s.food+=35;s.water+=25;s.morale=clamp(s.morale+4,0,100)}
    });
    d.routes.forEach(r=>{if(r.active){r.progress+=20*days;if(r.progress>=100){r.progress=0;d.log.push({at:Date.now(),type:'trade_route_arrival',route:r.id})}}});
    if(d.log.length>120)d.log.splice(0,d.log.length-120);save();
  }
  function establishOutpost(sector,name='Новый аванпост'){
    const d=state();if(!d)return false;sector=Number(sector);if(d.outposts.some(x=>x.sector===sector)||d.settlements.some(x=>x.sector===sector)){notify('🗺️ В этом секторе уже есть поселение.');return false}
    if(!spend({wood:90,metal:45,food:30,water:20})){notify('🧱 Нужно 90 дерева, 45 металла, 30 еды и 20 воды.');return false}
    const id=`outpost-${sector}-${Date.now().toString(36)}`;const o={id,name,sector,type:'outpost',population:3,level:1,morale:65,food:20,water:15,wood:0,metal:0,fort:35,owner:'player',created:Date.now()};d.outposts.push(o);d.log.push({at:Date.now(),type:'outpost_established',sector,name});save();notify(`🛡️ Основан аванпост «${name}».`);render();return o}
  function supplyOutpost(id){const d=state(),o=d?.outposts.find(x=>x.id===id);if(!o)return false;if(!spend({food:20,water:15,wood:10})){notify('📦 Не хватает припасов для снабжения.');return false}o.food+=40;o.water+=30;o.fort=clamp(o.fort+10,0,100);o.morale=clamp(o.morale+4,0,100);d.log.push({at:Date.now(),type:'outpost_supply',id});save();notify(`📦 Аванпост «${o.name}» снабжён.`);render();return true}
  function reinforceOutpost(id){const d=state(),o=d?.outposts.find(x=>x.id===id);if(!o)return false;if(!spend({metal:30,wood:35})){notify('🧱 Не хватает металла и дерева.');return false}o.fort=clamp(o.fort+20,0,100);o.level=Math.min(5,o.level+1);d.log.push({at:Date.now(),type:'outpost_upgrade',id});save();notify(`🛡️ Аванпост «${o.name}» укреплён.`);render();return true}
  function migrate(settlementId){const d=state(),s=d?.settlements.find(x=>x.id===settlementId);if(!s||s.population<2)return false;const target=d.settlements.find(x=>x.id!==s.id&&x.alive&&x.relations>=0);if(!target){notify('👥 Подходящего поселения для миграции нет.');return false}s.population-=2;target.population+=2;s.morale=clamp(s.morale-3,0,100);target.morale=clamp(target.morale+3,0,100);d.migration.push({at:Date.now(),from:s.id,to:target.id,count:2});d.log.push({at:Date.now(),type:'migration',from:s.name,to:target.name});save();notify(`🚶 Две семьи переехали из «${s.name}» в «${target.name}».`);render();return true}
  function render(){
    const wrap=document.getElementById('twdWrap');if(!wrap)return;let card=document.getElementById('worldSettlementsCard');if(!card){card=document.createElement('div');card.id='worldSettlementsCard';card.className='world-settlements-card';const c=document.getElementById('worldConsequenceCard');(c||document.getElementById('worldNPCCard')||document.getElementById('worldWarCard'))?.after(card)}
    const d=state();if(!d)return;advanceDay();
    const owned=d.outposts.length;card.innerHTML=`<div class="world-settlement-title"><b>🏘️ Поселения мира</b><span>${d.settlements.filter(x=>x.alive).length} поселений · ${owned} аванпостов</span></div><div class="world-settlement-list">${d.settlements.filter(x=>x.alive).slice(0,6).map(s=>`<div class="world-settlement-row"><div><b>${TYPES.find(t=>t.id===s.type)?.icon||'🏘️'} ${s.name}</b><small>Сектор ${s.sector} · 👥 ${s.population} · ❤️ ${s.morale} · ур. ${s.level}</small></div><span class="ws-owner">${s.owner}</span><button class="bs" onclick="G.migrateSettlement('${s.id}')">🚶 Миграция</button></div>`).join('')}</div><div class="world-outpost-title"><b>🛡️ Ваши аванпосты</b></div>${d.outposts.length?d.outposts.map(o=>`<div class="world-outpost-row"><div><b>${o.name}</b><small>Сектор ${o.sector} · 👥 ${o.population} · 🛡️ ${o.fort}% · ур. ${o.level}</small></div><div><button class="bs" onclick="G.supplyOutpost('${o.id}')">📦 Снабдить</button><button class="bgn" onclick="G.reinforceOutpost('${o.id}')">🧱 Укрепить</button></div></div>`).join(''):'<div class="world-settlement-empty">Нет аванпостов. Создайте первый на свободном секторе.</div><div class="world-outpost-create"><button class="bgn" onclick="G.establishWorldOutpost(88,'Северный аванпост')">🏕️ Основать аванпост · сектор 88</button></div>`;
  }
  G.worldSettlementsState=state;G.establishWorldOutpost=establishOutpost;G.supplyOutpost=supplyOutpost;G.reinforceOutpost=reinforceOutpost;G.migrateSettlement=migrate;G.advanceWorldSettlements=advanceDay;
  const old=G.tvdRefresh;if(old)G.tvdRefresh=function(){old.apply(this,arguments);setTimeout(render,0)};
  const show=G.tvdShow;if(show)G.tvdShow=function(on){show.apply(this,arguments);if(on)setTimeout(render,50)};
  setInterval(advanceDay,60000);setTimeout(render,120);
  window.TLP_WorldSettlements={version:'2.9.0',TYPES,state,advanceDay,establishOutpost,supplyOutpost,reinforceOutpost,migrate};
  console.log('[TLP] Living World Stage 2I loaded.');
})();
