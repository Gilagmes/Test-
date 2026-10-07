/* LAST PORT — LIVING WORLD / STAGE 2B: FACTIONS & SETTLEMENTS */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G) return;
  const G=window.G;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const FACTIONS=[
    {id:'harbor',icon:'🏘️',name:'Гавань',type:'friendly',desc:'Мирная коммуна, которая помогает беженцам.',rep:15,color:'#4ade80',trade:{food:1.1,water:1.15,wood:.8,metal:1.05}},
    {id:'roadkeepers',icon:'🚚',name:'Дорожники',type:'trader',desc:'Караванщики контролируют старые трассы.',rep:0,color:'#fbbf24',trade:{food:.9,water:1.0,wood:1.15,metal:.9}},
    {id:'ironwolves',icon:'⚔️',name:'Железные Волки',type:'hostile',desc:'Вооружённая группировка, требующая дань.',rep:-25,color:'#ef4444',trade:null},
    {id:'watchers',icon:'📡',name:'Наблюдатели',type:'neutral',desc:'Радиоразведчики, которым нужны сведения о мёртвых зонах.',rep:5,color:'#38bdf8',trade:{food:1,water:1,wood:1,metal:.85}}
  ];
  const SECTORS=[{id:12,faction:'harbor',status:'ally'},{id:27,faction:'roadkeepers',status:'trade'},{id:43,faction:'ironwolves',status:'hostile'},{id:61,faction:'watchers',status:'neutral'}];
  function state(){
    const S=G.S;if(!S)return null;
    S.worldFactions=S.worldFactions||{version:1,rep:{},diplomacy:{},controlled:[],trades:0,events:[],visited:[]};
    const d=S.worldFactions;
    d.rep=d.rep||{}; d.diplomacy=d.diplomacy||{}; d.controlled=Array.isArray(d.controlled)?d.controlled:[];
    d.trades=Number(d.trades||0); d.events=Array.isArray(d.events)?d.events:[]; d.visited=Array.isArray(d.visited)?d.visited:[];
    FACTIONS.forEach(f=>{if(typeof d.rep[f.id]!=='number')d.rep[f.id]=f.rep; if(!d.diplomacy[f.id])d.diplomacy[f.id]=d.rep[f.id]>=20?'allied':d.rep[f.id]<=-20?'hostile':'neutral';});
    return d;
  }
  function faction(id){return FACTIONS.find(f=>f.id===id)||FACTIONS[0]}
  function addRes(key,n){const S=G.S;if(S.res&&typeof S.res[key]==='number')S.res[key]+=n;else S[key]=(S[key]||0)+n}
  function notify(msg){try{G.toast?.(msg)}catch(e){}}
  function changeRep(id,delta,reason){const d=state();if(!d)return false;const f=faction(id);d.rep[id]=clamp((d.rep[id]||0)+delta,-100,100);d.diplomacy[id]=d.rep[id]>=60?'allied':d.rep[id]>=20?'friendly':d.rep[id]<=-60?'war':d.rep[id]<=-20?'hostile':'neutral';d.events.push({at:Date.now(),faction:id,delta,reason});if(d.events.length>50)d.events.shift();try{G.save?.()}catch(e){}return true}
  G.worldFactionState=state;
  G.worldFactions=FACTIONS;
  G.worldFactionSectors=SECTORS;
  G.changeFactionRep=changeRep;
  G.visitFaction=function(id){const d=state(),f=faction(id);if(!d)return false;if(!d.visited.includes(id))d.visited.push(id);notify(`${f.icon} Вы прибыли к поселению «${f.name}».`);render();return true};
  G.tradeWithFaction=function(id){const d=state(),f=faction(id);if(!d||!f.trade)return false;const S=G.S;if((S.gems||0)<5 && !(S.res&&S.res.gems>=5)){notify('💎 Нужно 5 жетонов влияния для сделки.');return false;}if(S.res&&typeof S.res.gems==='number')S.res.gems-=5;else S.gems-=5;addRes('food',Math.round(20*f.trade.food));addRes('water',Math.round(20*f.trade.water));addRes('wood',Math.round(15*f.trade.wood));changeRep(id,3,'выгодная торговля');d.trades++;notify(`🤝 Сделка с «${f.name}» завершена.`);try{G.updTop?.();G.save?.()}catch(e){}render();return true};
  G.diplomacyFaction=function(id,action){const d=state(),f=faction(id);if(!d)return false;if(action==='gift'){if((G.S.food||0)<30 && !(G.S.res&&G.S.res.food>=30)){notify('🍖 Нужно 30 еды для подарка.');return false}if(G.S.res&&typeof G.S.res.food==='number')G.S.res.food-=30;else G.S.food-=30;changeRep(id,12,'подарок соседям');notify(`🎁 «${f.name}» оценили подарок.`)}else if(action==='warn'){changeRep(id,-8,'жёсткое предупреждение');notify(`⚠️ Вы предупредили «${f.name}».`)}else return false;render();return true};
  G.claimFactionSector=function(sector){const d=state();if(!d||d.controlled.includes(sector))return false;const entry=SECTORS.find(s=>s.id===Number(sector));if(!entry)return false;const rep=d.rep[entry.faction]||0;if(entry.status==='hostile'&&rep<20){notify('⚔️ Сначала улучшите отношения или подготовьте отряд.');return false}d.controlled.push(Number(sector));changeRep(entry.faction,entry.status==='hostile'?8:5,'контроль сектора');notify(`🗺️ Сектор ${sector} теперь под вашим контролем.`);render();return true};
  function render(){const wrap=document.getElementById('twdWrap');if(!wrap)return;let card=document.getElementById('worldFactionsCard');if(!card){card=document.createElement('div');card.id='worldFactionsCard';card.className='world-factions-card';const ev=document.getElementById('worldLiveEncounter');(ev||wrap.querySelector('.tvd-hd'))?.after(card)}const d=state();if(!d)return;card.innerHTML=`<div class="world-factions-title"><b>🌍 Живые поселения</b><span>${d.controlled.length} сектора под контролем</span></div><div class="world-factions-list">${FACTIONS.map(f=>{const r=d.rep[f.id]||0;const rel=d.diplomacy[f.id];return `<div class="world-faction"><div class="world-faction-main"><span class="wf-icon">${f.icon}</span><div><b>${f.name}</b><small>${f.desc}</small></div><span class="wf-rel ${rel}">${rel}</span></div><div class="wf-meta"><span>Репутация ${r}</span><div class="wf-actions"><button class="bs" onclick="G.visitFaction('${f.id}')">Посетить</button>${f.trade?`<button class="bgn" onclick="G.tradeWithFaction('${f.id}')">Торговать · 💎5</button>`:`<button class="bs" onclick="G.diplomacyFaction('${f.id}','warn')">Переговоры</button>`}<button class="bs" onclick="G.diplomacyFaction('${f.id}','gift')">🎁 +репутация</button></div></div></div>`}).join('')}</div>`}
  const oldRefresh=G.tvdRefresh;if(oldRefresh)G.tvdRefresh=function(){oldRefresh.apply(this,arguments);setTimeout(render,0)};
  const oldShow=G.tvdShow;if(oldShow)G.tvdShow=function(on){oldShow.apply(this,arguments);if(on)setTimeout(render,30)};
  window.TLP_WorldFactions={version:'2.1.0',FACTIONS,SECTORS,state,faction};
  console.log('[TLP] Living World Stage 2B loaded.');
})();
