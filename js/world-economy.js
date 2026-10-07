/* LAST PORT — LIVING WORLD / STAGE 2C: ECONOMY, CARAVANS & TERRITORY */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G) return;
  const G=window.G;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const RES=['food','water','wood','metal'];
  const BASE={food:2,water:2,wood:2,metal:3};
  const MISSIONS=[
    {id:'supply-harbor',faction:'harbor',title:'Запасы для Гавани',need:{food:50,water:30},reward:{wood:80,metal:20},rep:10},
    {id:'road-patrol',faction:'roadkeepers',title:'Безопасная дорога',need:{wood:40,metal:25},reward:{food:80,water:40},rep:8},
    {id:'watcher-signal',faction:'watchers',title:'Передать координаты',need:{water:20},reward:{metal:60,gems:3},rep:12}
  ];
  function state(){
    const S=G.S;if(!S)return null;
    S.worldEconomy=S.worldEconomy||{version:1,market:{},caravans:[],missions:{},territory:{},log:[],lastDay:-1};
    const d=S.worldEconomy;
    d.market=d.market||{};d.caravans=Array.isArray(d.caravans)?d.caravans:[];d.missions=d.missions||{};d.territory=d.territory||{};d.log=Array.isArray(d.log)?d.log:[];
    RES.forEach(k=>{if(typeof d.market[k]!=='number')d.market[k]=BASE[k]});
    return d;
  }
  function resources(){return G.S.res&&typeof G.S.res==='object'?G.S.res:G.S}
  function save(){try{G.save?.();G.updTop?.();G.tvdRefresh?.()}catch(e){}}
  function notify(m){try{G.toast?.(m)}catch(e){}}
  function add(k,n){const r=resources();r[k]=(Number(r[k])||0)+n}
  function take(k,n){const r=resources();if((Number(r[k])||0)<n)return false;r[k]-=n;return true}
  function canPay(cost){return Object.entries(cost).every(([k,v])=>(Number(resources()[k])||0)>=v)}
  function record(type,data){const d=state();d.log.push({at:Date.now(),type,...data});if(d.log.length>100)d.log.shift()}
  function buy(resource,qty=10){
    const d=state();if(!d||!BASE[resource])return false;qty=Math.max(1,Math.floor(qty));const cost=Math.ceil(d.market[resource]*qty);if(!take('gems',cost)){notify(`💎 Нужно ${cost} жетонов влияния.`);return false}add(resource,qty);record('buy',{resource,qty,cost});save();notify(`🛒 Куплено: ${qty} ${resource} за 💎${cost}.`);return true;
  }
  function sell(resource,qty=10){
    const d=state();if(!d||!BASE[resource])return false;qty=Math.max(1,Math.floor(qty));if(!take(resource,qty)){notify(`Недостаточно ресурса: ${resource}.`);return false}const gain=Math.max(1,Math.floor(d.market[resource]*qty*.6));add('gems',gain);record('sell',{resource,qty,gain});save();notify(`📦 Продано: ${qty} ${resource} за 💎${gain}.`);return true;
  }
  function refreshCaravans(){
    const d=state(),day=Math.floor(Date.now()/86400000);if(d.lastDay===day)return;
    d.lastDay=day;
    const ids=['harbor','roadkeepers','watchers'];
    d.caravans=ids.map((f,i)=>({id:`caravan-${day}-${i}`,faction:f,goods:{food:20+i*10,water:15,wood:20,metal:10},arrived:false,day}));
    Object.keys(d.market).forEach(k=>d.market[k]=clamp(Number((BASE[k]*(.85+Math.random()*.5)).toFixed(2)),1,8));
    MISSIONS.forEach(m=>{d.missions[m.id]={...m,status:d.missions[m.id]?.status==='completed'?'completed':'available'}});
    save();
  }
  function tradeCaravan(id){
    const d=state(),c=d?.caravans.find(x=>x.id===id);if(!c||c.arrived)return false;const f=G.worldFactions?.find(x=>x.id===c.faction);if(!f)return false;
    const cost={food:10,water:5};if(!canPay(cost)){notify('🚚 Не хватает припасов для каравана.');return false}
    take('food',10);take('water',5);Object.entries(c.goods).forEach(([k,v])=>add(k,v));c.arrived=true;G.changeFactionRep?.(c.faction,4,'караванная торговля');record('caravan',{faction:c.faction,id:c.id});save();notify(`🚚 Караван «${f.name}» прибыл. Обмен завершён.`);return true;
  }
  function completeMission(id){
    const d=state(),m=MISSIONS.find(x=>x.id===id);if(!d||!m||d.missions[id]?.status==='completed')return false;if(d.missions[id]?.status==='completed')return false;if(!canPay(m.need)){notify('📋 Недостаточно ресурсов для задания.');return false}
    Object.entries(m.need).forEach(([k,v])=>take(k,v));Object.entries(m.reward).forEach(([k,v])=>add(k,v));d.missions[id].status='completed';G.changeFactionRep?.(m.faction,m.rep,'выполнено задание');record('mission',{id,faction:m.faction});save();notify(`📜 Задание «${m.title}» выполнено.`);render();return true;
  }
  function claimSector(id){
    const d=state(),n=Number(id);if(!d)return false;const f=G.worldFactionSectors?.find(x=>x.id===n);if(!f)return false;const t=d.territory[n]||{owner:'neutral',fort:25,underAttack:false};
    if(t.owner==='player')return false;if(f.status==='hostile' && (G.worldFactionState?.().rep[f.faction]||0)<-10){notify('⚔️ Сектор охраняется враждебной фракцией. Сначала ослабьте её влияние.');return false}
    t.owner='player';t.fort=50;t.underAttack=false;d.territory[n]=t;G.changeFactionRep?.(f.faction,3,'переход сектора под контроль');record('claim',{sector:n,faction:f.faction});save();notify(`🛡️ Сектор ${n} закреплён за вашей коммуной.`);render();return true;
  }
  function defendSector(id,power=20){const d=state(),n=Number(id),t=d?.territory[n];if(!t||t.owner!=='player')return false;t.fort=clamp((t.fort||0)+Math.max(1,Number(power)||20),0,100);t.underAttack=false;record('defend',{sector:n,power});save();notify(`🛡️ Оборона сектора ${n} усилена.`);render();return true}
  function render(){
    const wrap=document.getElementById('twdWrap');if(!wrap)return;let card=document.getElementById('worldEconomyCard');if(!card){card=document.createElement('div');card.id='worldEconomyCard';card.className='world-economy-card';document.getElementById('worldFactionsCard')?.after(card)}
    const d=state();if(!d)return;refreshCaravans();
    card.innerHTML=`<div class="world-economy-title"><b>📦 Экономика мира</b><span>Караваны и рынок</span></div><div class="world-market">${RES.map(k=>`<div><b>${k}</b><small>💎 ${d.market[k]}/ед.</small><button class="bs" onclick="G.worldBuy('${k}',10)">+10</button><button class="bs" onclick="G.worldSell('${k}',10)">−10</button></div>`).join('')}</div><div class="world-caravans"><b>🚚 Караваны сегодня</b>${d.caravans.map(c=>`<div><span>${c.faction}</span><button class="bgn" onclick="G.tradeCaravan('${c.id}')" ${c.arrived?'disabled':''}>${c.arrived?'✓ Обменён':'Обменять'}</button></div>`).join('')}</div><div class="world-missions"><b>📜 Задания фракций</b>${MISSIONS.map(m=>{const st=d.missions[m.id]?.status||'available';return `<div><span>${m.title}</span><button class="bgn" onclick="G.completeWorldMission('${m.id}')" ${st==='completed'?'disabled':''}>${st==='completed'?'✓ Выполнено':'Выполнить'}</button></div>`}).join('')}</div>`;
  }
  G.worldBuy=buy;G.worldSell=sell;G.tradeCaravan=tradeCaravan;G.worldEconomyState=state;G.completeWorldMission=completeMission;G.claimWorldSector=claimSector;G.defendWorldSector=defendSector;G.refreshWorldEconomy=refreshCaravans;
  const oldRefresh=G.tvdRefresh;if(oldRefresh)G.tvdRefresh=function(){oldRefresh.apply(this,arguments);setTimeout(render,0)};
  const oldShow=G.tvdShow;if(oldShow)G.tvdShow=function(on){oldShow.apply(this,arguments);if(on)setTimeout(render,40)};
  window.TLP_WorldEconomy={version:'2.2.0',BASE,MISSIONS,state,refreshCaravans};
  refreshCaravans();
  console.log('[TLP] Living World Stage 2C loaded.');
})();
