/* LAST PORT — LIVING WORLD / STAGE 2D: TERRITORIAL WAR */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G) return;
  const G=window.G, clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const ATTACKERS=['ironwolves'];
  function state(){
    const S=G.S;if(!S)return null;
    S.worldWar=S.worldWar||{version:1,garrisons:{},sieges:[],battles:[],reinforcements:[],lastDay:-1,casualties:0};
    const d=S.worldWar;
    d.garrisons=d.garrisons||{};d.sieges=Array.isArray(d.sieges)?d.sieges:[];d.battles=Array.isArray(d.battles)?d.battles:[];d.reinforcements=Array.isArray(d.reinforcements)?d.reinforcements:[];d.casualties=Number(d.casualties||0);
    return d;
  }
  function territory(){return G.worldEconomyState?.()?.territory||{};}
  function resources(){return G.S.res&&typeof G.S.res==='object'?G.S.res:G.S;}
  function take(k,n){const r=resources();if((Number(r[k])||0)<n)return false;r[k]-=n;return true}
  function save(){try{G.save?.();G.updTop?.();G.tvdRefresh?.()}catch(e){}}
  function notify(m){try{G.toast?.(m)}catch(e){}}
  function ensureSector(id){const d=state(),n=Number(id),t=territory()[n];if(!d||!t||t.owner!=='player')return null;d.garrisons[n]=d.garrisons[n]||{troops:40,morale:75,level:1};return d.garrisons[n];}
  function recruit(id,count=10){const g=ensureSector(id);if(!g)return false;count=Math.max(1,Math.floor(count));const cost=count*2;if(!take('food',cost)||!take('metal',Math.ceil(count*.5))){notify('🪖 Не хватает еды или металла для гарнизона.');return false}g.troops=clamp(g.troops+count,0,200);g.morale=clamp(g.morale+3,0,100);save();notify(`🪖 Гарнизон сектора ${id}: +${count} бойцов.`);return true}
  function fortify(id,amount=15){const t=territory()[Number(id)];if(!t||t.owner!=='player')return false;if(!take('wood',amount)||!take('metal',Math.ceil(amount/2))){notify('🧱 Не хватает ресурсов для укрепления.');return false}t.fort=clamp((t.fort||0)+amount,0,100);save();notify(`🧱 Укрепления сектора ${id} усилены.`);return true}
  function reinforce(from,to,count=10){const a=ensureSector(from),b=ensureSector(to);if(!a||!b||Number(from)===Number(to))return false;count=Math.max(1,Math.floor(count));if(a.troops<count){notify('🪖 В исходном гарнизоне недостаточно бойцов.');return false}a.troops-=count;const d=state();d.reinforcements.push({id:`r-${Date.now()}`,from:Number(from),to:Number(to),count,eta:Date.now()+30000,status:'marching'});save();notify(`🚚 Подкрепление из сектора ${from} отправлено в ${to}.`);return true}
  function startSiege(id){const n=Number(id),t=territory()[n],d=state();if(!t||t.owner!=='player'||!d)return false;if(d.sieges.some(s=>s.sector===n&&s.status==='active'))return false;const g=ensureSector(n);const enemy=20+Math.floor(Math.random()*31);d.sieges.push({id:`siege-${Date.now()}`,sector:n,attacker:'ironwolves',enemy,garrison:g.troops,morale:g.morale,started:Date.now(),status:'active'});t.underAttack=true;notify(`⚔️ Сектор ${n} осаждён Железными Волками!`);save();render();return true}
  function resolveSiege(id,action='defend'){const d=state(),s=d?.sieges.find(x=>x.id===id&&x.status==='active');if(!s)return false;const t=territory()[s.sector],g=ensureSector(s.sector);if(!t||!g)return false;let playerPower=g.troops*(0.6+g.morale/250)+(t.fort||0)*.7;let enemyPower=s.enemy*(.9+Math.random()*.5);if(action==='reinforce')playerPower+=25;if(action==='retreat')playerPower*=.35;const won=playerPower>=enemyPower;if(won){const losses=Math.min(g.troops,Math.max(1,Math.floor(s.enemy*.15)));g.troops-=losses;g.morale=clamp(g.morale+5,0,100);t.fort=clamp((t.fort||0)-Math.floor(s.enemy*.25),0,100);t.underAttack=false;s.status='won';s.losses=losses;d.casualties+=losses;G.changeFactionRep?.('ironwolves',5,'отражена осада');notify(`🛡️ Сектор ${s.sector} защищён. Потери: ${losses}.`)}else{const losses=Math.min(g.troops,Math.max(1,Math.floor(g.troops*.35)));g.troops-=losses;g.morale=clamp(g.morale-20,0,100);d.casualties+=losses;t.owner='neutral';t.underAttack=false;s.status='lost';s.losses=losses;G.changeFactionRep?.('ironwolves',-5,'потеря сектора');notify(`💥 Сектор ${s.sector} потерян. Гарнизон понёс потери: ${losses}.`)}save();render();return won}
  function attackSector(id){const n=Number(id),f=G.worldFactionSectors?.find(x=>x.id===n),d=state();if(!f||!d)return false;const t=territory()[n]||{owner:f.faction,fort:50,underAttack:false};if(f.faction!=='ironwolves'){notify('⚔️ Атаковать можно только враждебные сектора.');return false}if(t.owner==='player'){notify('Этот сектор уже ваш.');return false}if(!take('food',30)||!take('metal',20)){notify('⚔️ Нужны 30 еды и 20 металла для похода.');return false}const enemy=40+Math.floor((t.fort||50)*.4),player=50+Math.floor(Math.random()*31);const won=player>=enemy;if(won){t.owner='player';t.fort=40;territory()[n]=t;d.garrisons[n]={troops:Math.max(10,player-enemy+20),morale:70,level:1};G.changeFactionRep?.(f.faction,10,'захвачен вражеский сектор');notify(`🏴 Захвачен сектор ${n}!`)}else{notify(`⚔️ Атака на сектор ${n} отбита.`)}d.battles.push({sector:n,won,at:Date.now(),player,enemy});if(d.battles.length>50)d.battles.shift();save();render();return won}
  function tick(){const d=state();if(!d)return;const now=Date.now();d.reinforcements.forEach(r=>{if(r.status==='marching'&&r.eta<=now){const g=ensureSector(r.to);if(g){g.troops+=r.count;g.morale=clamp(g.morale+2,0,100)}r.status='arrived'}});if(d.lastDay!==Math.floor(now/86400000)){d.lastDay=Math.floor(now/86400000);Object.keys(territory()).forEach(k=>{const t=territory()[k];if(t.owner==='player'&&t.underAttack){const g=ensureSector(k);if(g&&g.troops>0)g.morale=clamp(g.morale-5,0,100)}})} }
  function render(){
    const wrap=document.getElementById('twdWrap');if(!wrap)return;
    let card=document.getElementById('worldWarCard');
    if(!card){card=document.createElement('div');card.id='worldWarCard';card.className='world-war-card';document.getElementById('worldEconomyCard')?.after(card)}
    tick();const d=state(),terr=territory();
    const own=Object.entries(terr).filter(([id,t])=>t.owner==='player');
    const active=d.sieges.filter(s=>s.status==='active');
    let html='<div class="world-war-title"><b>⚔️ Территориальная война</b><span>'+own.length+' наших секторов · потери '+d.casualties+'</span></div>';
    if(own.length){
      html+=own.map(([id,t])=>{
        const g=ensureSector(id),siege=active.find(s=>s.sector===Number(id));
        let actions='<button class="bs" onclick="G.recruitWorldGarrison('+id+',10)">+10 бойцов</button><button class="bs" onclick="G.fortifyWorldSector('+id+',15)">+укрепление</button>';
        if(own.length>1)actions+='<button class="bs" onclick="G.reinforceWorldSector('+own[0][0]+','+id+',10)">подкрепление</button>';
        if(siege)actions+='<button class="bgn" onclick="G.resolveWorldSiege(\''+siege.id+'\',\'defend\')">🛡️ Отбить атаку</button>';
        return '<div class="war-sector"><b>Сектор '+id+'</b><span>🪖 '+g.troops+' · 🧠 '+g.morale+'% · 🧱 '+(t.fort||0)+'</span><div>'+actions+'</div></div>';
      }).join('');
    } else html+='<small>Захватите сектор, чтобы создать гарнизон.</small>';
    html+='<div class="war-actions"><button class="bgn" onclick="G.startWorldSiege('+(own[0]?.[0]||0)+')" '+(own.length?'':'disabled')+'>⚠️ Симулировать осаду</button><button class="bs" onclick="G.attackWorldSector(43)">⚔️ Атаковать сектор 43</button></div>';
    card.innerHTML=html;
  }

  G.worldWarState=state;G.recruitWorldGarrison=recruit;G.fortifyWorldSector=fortify;G.reinforceWorldSector=reinforce;G.startWorldSiege=startSiege;G.resolveWorldSiege=resolveSiege;G.attackWorldSector=attackSector;G.tickWorldWar=tick;
  const oldRefresh=G.tvdRefresh;if(oldRefresh)G.tvdRefresh=function(){oldRefresh.apply(this,arguments);setTimeout(render,0)};
  const oldShow=G.tvdShow;if(oldShow)G.tvdShow=function(on){oldShow.apply(this,arguments);if(on)setTimeout(render,60)};
  setInterval(tick,5000);
  window.TLP_WorldWar={version:'2.3.0',state,ensureSector,tick};
  console.log('[TLP] Living World Stage 2D loaded.');
})();
