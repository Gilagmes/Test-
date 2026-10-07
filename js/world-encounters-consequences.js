/* LAST PORT — LIVING WORLD / STAGE 2H: CONSEQUENCES & WORLD ENCOUNTERS */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G)return;
  const G=window.G, DAY=86400000;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const state=()=>{
    const S=G.S;if(!S)return null;
    S.worldConsequences=S.worldConsequences||{version:1,history:[],active:[],reputation:{},territory:{},flags:{},pending:[]};
    const d=S.worldConsequences;
    ['history','active','pending'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});
    d.reputation=d.reputation||{};d.territory=d.territory||{};d.flags=d.flags||{};
    return d;
  };
  const res=()=>G.S.res&&typeof G.S.res==='object'?G.S.res:G.S;
  function spend(cost){const r=res();for(const k of Object.keys(cost))if((Number(r[k])||0)<cost[k])return false;for(const k of Object.keys(cost))r[k]-=cost[k];return true}
  function add(gain){const r=res();for(const k of Object.keys(gain||{}))r[k]=(Number(r[k])||0)+gain[k]}
  function notify(m){try{G.toast?.(m)}catch(e){}}
  function save(){try{G.save?.();G.updTop?.();G.tvdRefresh?.()}catch(e){}}
  function reputation(id,delta){const d=state();d.reputation[id]=clamp((Number(d.reputation[id])||0)+delta,-100,100);return d.reputation[id]}
  function applyHeroImpact(hero,impact){
    if(!hero)return;
    hero.living=hero.living||{};
    hero.living.mood=clamp((Number(hero.living.mood??70)||70)+(impact.mood||0),0,100);
    hero.living.fatigue=clamp((Number(hero.living.fatigue)||0)+(impact.fatigue||0),0,100);
    hero.living.loyalty=clamp((Number(hero.living.loyalty??hero.loyalty??70)||70)+(impact.loyalty||0),0,100);
    if(impact.health){hero.living.health=clamp((Number(hero.living.health??hero.hp??100)||100)+impact.health,1,Number(hero.living.maxHealth||100));hero.hp=hero.living.health;}
    if(impact.memory){hero.living.memories=Array.isArray(hero.living.memories)?hero.living.memories:[];hero.living.memories.push(impact.memory);if(hero.living.memories.length>20)hero.living.memories.shift();}
  }
  function findHero(id){return (G.S.heroes||[]).find(h=>String(h.id)===String(id))}
  const ENCOUNTERS=[
    {id:'hungry-commune',title:'🏚️ Голодная коммуна',desc:'Небольшая группа просит еду. Помощь может изменить отношение соседей.',faction:'harbor'},
    {id:'ambush-road',title:'🏴 Засада на дороге',desc:'Патруль Железных Волков блокирует маршрут.',faction:'ironwolves'},
    {id:'lost-scout',title:'📡 Потерянный разведчик',desc:'Наблюдатель просит вернуть украденный передатчик.',faction:'watchers'},
    {id:'injured-family',title:'🆘 Семья в ловушке',desc:'Группа мирных людей зажата ходячими.',faction:'harbor'}
  ];
  function rollDaily(){
    const d=state();if(!d)return null;const day=Math.floor(Date.now()/DAY);
    if(d.lastDay===day)return d.pending[0]||null;d.lastDay=day;
    d.pending=[];
    const e=ENCOUNTERS[day%ENCOUNTERS.length];
    const item={id:`wc-${day}`,type:e.id,title:e.title,desc:e.desc,faction:e.faction,sector:[12,27,43,61][day%4],status:'active',created:Date.now()};
    d.pending.push(item);d.active.push(item);d.history.push({at:Date.now(),type:'spawn',event:item.id,sector:item.sector});
    if(d.history.length>120)d.history.shift();return item;
  }
  function resolve(id,choice,heroId){
    const d=state();const e=d?.active.find(x=>x.id===id&&x.status==='active');if(!e)return false;
    let result={choice,rep:0,gain:{},impact:{}};
    if(choice==='help'){
      if(e.type==='hungry-commune'){if(!spend({food:40,water:20})){notify('🍖 Не хватает припасов для помощи.');return false}result.rep=12;result.gain={loyalty:2};}
      else if(e.type==='injured-family'){if(!spend({food:25,water:35})){notify('💧 Не хватает припасов для спасения.');return false}result.rep=15;result.gain={loyalty:3};}
      else if(e.type==='lost-scout'){if(!spend({metal:10})){notify('🔩 Не хватает металла для ремонта передатчика.');return false}result.rep=10;result.gain={metal:15};add(result.gain)}
      else {result.rep=6;result.gain={};}
      if(result.gain.loyalty&&heroId)applyHeroImpact(findHero(heroId),{loyalty:result.gain.loyalty,mood:4,memory:{at:Date.now(),type:'world_help',text:'Помог другим на мировой карте.'}});
      if(result.gain.loyalty){}
    } else if(choice==='trade'){
      if(!spend({food:20})){notify('🍖 Не хватает еды для обмена.');return false}add({metal:15,water:10});result.rep=5;
    } else if(choice==='intimidate'){
      result.rep=-15;result.impact={mood:-3,loyalty:-2};if(heroId)applyHeroImpact(findHero(heroId),result.impact);
      d.flags[`enemy_${e.faction}`]=(Number(d.flags[`enemy_${e.faction}`])||0)+1;
    } else if(choice==='ignore'){
      result.rep=-3;
    } else return false;
    reputation(e.faction,result.rep);e.status='resolved';e.resolution=choice;e.resolvedAt=Date.now();d.pending=d.pending.filter(x=>x.id!==e.id);
    d.history.push({at:Date.now(),type:'resolution',event:e.id,faction:e.faction,choice,rep:result.rep,heroId:heroId||null});
    if(d.history.length>120)d.history.shift();save();notify(`🌍 Решение принято: ${e.title}`);render();return true;
  }
  function affectTerritory(sectorId,delta){
    const d=state();const s=String(sectorId);d.territory[s]=clamp((Number(d.territory[s])||0)+delta,0,100);return d.territory[s]
  }
  function dailyConsequences(){
    const d=state();if(!d)return;const day=Math.floor(Date.now()/DAY);if(d.consequenceDay===day)return;d.consequenceDay=day;
    Object.entries(d.reputation).forEach(([f,r])=>{if(r>=40)affectTerritory(f==='harbor'?12:f==='watchers'?27:61,1);if(r<=-40)affectTerritory(f==='ironwolves'?43:61,-2)});
    (G.S.heroes||[]).forEach(h=>{if(h?.living?.memories?.some(m=>m.type==='world_help'))h.living.mood=clamp((Number(h.living.mood)||70)+1,0,100)});
    rollDaily();save();render();
  }
  function render(){
    const wrap=document.getElementById('twdWrap');if(!wrap)return;let card=document.getElementById('worldConsequencesCard');
    if(!card){card=document.createElement('div');card.id='worldConsequencesCard';card.className='world-consequence-card';const n=document.getElementById('worldNPCCard');(n||wrap.lastElementChild)?.after(card)}
    const d=state();if(!d)return;const e=rollDaily();
    let html='<div class="wc-title"><b>🌍 Мировые последствия</b><span>Решения меняют мир</span></div>';
    if(e)html+=`<div class="wc-event"><div><b>${e.title}</b><small>${e.desc} · сектор ${e.sector}</small></div><div class="wc-actions"><button class="bgn" onclick="G.resolveWorldConsequence('${e.id}','help')">🤝 Помочь</button><button class="bs" onclick="G.resolveWorldConsequence('${e.id}','trade')">💰 Обмен</button><button class="bs" onclick="G.resolveWorldConsequence('${e.id}','ignore')">↩️ Игнорировать</button></div></div>`;
    html+='<div class="wc-reps">'+Object.entries(d.reputation).map(([k,v])=>`<span>${k}: ${v>0?'+':''}${v}</span>`).join('')+'</div>';
    if(d.history.length)html+=`<div class="wc-history">Последнее: ${d.history[d.history.length-1].type==='resolution'?'решение изменило отношения фракции':'новое событие мира'}</div>`;
    card.innerHTML=html;
  }
  G.worldConsequenceState=state;G.spawnWorldConsequence=rollDaily;G.resolveWorldConsequence=resolve;G.affectWorldTerritory=affectTerritory;G.tickWorldConsequences=dailyConsequences;
  const oldRefresh=G.tvdRefresh;if(oldRefresh)G.tvdRefresh=function(){oldRefresh.apply(this,arguments);setTimeout(render,0)};
  setInterval(dailyConsequences,5000);setTimeout(render,100);
  window.TLP_WorldConsequences={version:'2.8.0',ENCOUNTERS,state,rollDaily,resolve,affectTerritory};
  console.log('[TLP] Living World Stage 2H loaded.');
})();
