/* LAST PORT — LIVING WORLD MAP / STAGE 2A */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G) return;
  const G=window.G;
  const DAY=86400000;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const now=()=>Date.now();
  function state(){
    const S=G.S;
    if(!S) return null;
    if(!S.worldLive) S.worldLive={version:1,encounterDay:-1,encounter:null,completed:[],scouted:[],travel:0};
    S.worldLive.completed=Array.isArray(S.worldLive.completed)?S.worldLive.completed:[];
    S.worldLive.scouted=Array.isArray(S.worldLive.scouted)?S.worldLive.scouted:[];
    return S.worldLive;
  }
  const ENCOUNTERS=[
    {id:'sos',icon:'📡',title:'SOS из ангара',text:'Слабый сигнал: группа выживших заперта внутри старого ангара.',reward:{food:120,water:80,gems:8}},
    {id:'caravan',icon:'🚚',title:'Караван в тумане',text:'Торговцы остановились у дороги и предлагают обмен припасов.',reward:{wood:140,metal:60,gems:5}},
    {id:'camp',icon:'⛺',title:'Следы лагеря',text:'Разведчики нашли свежий костёр. Люди ушли совсем недавно.',reward:{food:90,wood:100,gems:6}},
    {id:'horde',icon:'🧟',title:'Движение орды',text:'Большая группа ходячих пересекает трассу. Можно изучить маршрут.',reward:{metal:100,food:100,gems:10}}
  ];
  function ensureEncounter(){
    const d=state(); if(!d) return null;
    const day=Math.floor(now()/DAY);
    if(d.encounterDay!==day){
      d.encounterDay=day;
      d.encounter=ENCOUNTERS[day%ENCOUNTERS.length].id;
    }
    return ENCOUNTERS.find(x=>x.id===d.encounter)||ENCOUNTERS[0];
  }
  function reward(r){
    const S=G.S; Object.keys(r).forEach(k=>{S[k]=(S[k]||0)+r[k]});
    try{G.save?.();G.updTop?.();}catch(e){}
  }
  G.resolveWorldEncounter=function(action){
    const d=state(),e=ensureEncounter(); if(!d||!e)return false;
    if(d.completed.includes(e.id)) return false;
    if(action==='help' && e.id==='horde') return false;
    reward(e.reward); d.completed.push(e.id);
    try{G.toast?.(`${e.icon} ${e.title}: задача выполнена. Награды получены.`)}catch(x){}
    try{G.tvdRefresh?.()}catch(x){}
    return true;
  };
  G.scoutWorldEncounter=function(){
    const d=state(),e=ensureEncounter(); if(!d||!e)return false;
    if((G.S.energy||0)<10){G.toast?.('⚡ Нужно 10 энергии для разведки.');return false;}
    G.S.energy-=10;
    if(!d.scouted.includes(e.id))d.scouted.push(e.id);
    G.toast?.(`🔭 Разведка: ${e.text}`);
    G.save?.(); G.updTop?.(); return true;
  };
  function injectEncounter(){
    const wrap=document.getElementById('twdWrap'); if(!wrap)return;
    let card=document.getElementById('worldLiveEncounter');
    const e=ensureEncounter(),d=state(); if(!e||!d)return;
    const done=d.completed.includes(e.id),scouted=d.scouted.includes(e.id);
    const html=`<div class="world-live-event-head"><span>${e.icon}</span><div><b>${e.title}</b><small>${scouted?e.text:'Неизвестный сигнал · отправьте разведку'}</small></div><span class="world-live-badge">${done?'ВЫПОЛНЕНО':'СОБЫТИЕ ДНЯ'}</span></div><div class="world-live-event-actions">${!done?`<button class="bs" onclick="G.scoutWorldEncounter()" ${scouted?'disabled':''}>🔭 Разведать · ⚡10</button><button class="bgn" onclick="G.resolveWorldEncounter('help')">🧭 Отправить помощь</button>`:'<span class="world-live-done">✓ Событие этого дня завершено</span>'}</div>`;
    if(!card){card=document.createElement('div');card.id='worldLiveEncounter';card.className='world-live-event';const hd=wrap.querySelector('.tvd-hd');hd?.after(card);}
    card.innerHTML=html;
  }
  const oldShow=G.tvdShow;
  if(oldShow) G.tvdShow=function(on){oldShow.apply(this,arguments);if(on){setTimeout(injectEncounter,30)}};
  const oldRefresh=G.tvdRefresh;
  if(oldRefresh) G.tvdRefresh=function(){oldRefresh.apply(this,arguments);setTimeout(injectEncounter,0)};
  const oldTab=G.tab;
  if(oldTab){
    G.tab=function(tab,sub){
      const result=oldTab.apply(this,arguments);
      if(tab==='map'){
        if(G.tvdShow) G.tvdShow(true);
        setTimeout(injectEncounter,60);
      }else if(G.tvdShow){G.tvdShow(false);}
      return result;
    };
  }
  window.TLP_WorldLive={version:'2.0.0',ENCOUNTERS,ensureEncounter,state};
  console.log('[TLP] Living World Map Stage 2A loaded.');
})();
