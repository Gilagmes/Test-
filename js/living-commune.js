/* ==========================================================================
 * LAST PORT — LIVING COMMUNE / STAGE 1
 * Persistent survivor needs, relationships, conflicts and personal events.
 * Designed as an additive layer over the existing G.S.heroes system.
 * ========================================================================== */
(function(){
  'use strict';
  if(typeof window === 'undefined' || !window.G) return;
  const G = window.G;

  const TRAITS = [
    {id:'steady', n:'Хладнокровный', i:'🧊', d:'меньше страдает от паники и тяжёлых событий'},
    {id:'empathetic', n:'Эмпатичный', i:'💚', d:'быстрее восстанавливает отношения'},
    {id:'ambitious', n:'Амбициозный', i:'🔥', d:'лучше работает, но быстрее устаёт'},
    {id:'loyal', n:'Верный', i:'🤝', d:'сильнее держится за коммуну'},
    {id:'loner', n:'Одиночка', i:'🌑', d:'хуже переносит конфликты, любит отдых в одиночестве'}
  ];

  const EVENTS = [
    {id:'argument', icon:'⚡', title:'Ссора у мастерской', kind:'conflict', text:'Двое выживших спорят из-за распределения работы.', chance:0.22},
    {id:'help', icon:'🤝', title:'Взаимопомощь', kind:'bond', text:'Один выживший помогает другому закончить тяжёлую работу.', chance:0.18},
    {id:'memory', icon:'🕯️', title:'Тяжёлое воспоминание', kind:'mood', text:'Старое воспоминание выбивает выжившего из рабочего ритма.', chance:0.16},
    {id:'goodnews', icon:'📻', title:'Хорошие новости', kind:'mood', text:'Рация приносит редкую хорошую новость из внешнего мира.', chance:0.14},
    {id:'injury', icon:'🩸', title:'Травма на работе', kind:'injury', text:'Небольшая травма заставляет выжившего временно снизить нагрузку.', chance:0.10}
  ];

  const COMPATIBILITY = {
    steady:{steady:10,empathetic:6,ambitious:-2,loyal:8,loner:4},
    empathetic:{steady:6,empathetic:12,ambitious:3,loyal:10,loner:-2},
    ambitious:{steady:-2,empathetic:3,ambitious:5,loyal:2,loner:-8},
    loyal:{steady:8,empathetic:10,ambitious:2,loyal:9,loner:-3},
    loner:{steady:4,empathetic:-2,ambitious:-8,loyal:-3,loner:7}
  };
  const REL_STAGES=[
    {min:80,id:'bonded',name:'Неразлучные',icon:'🫶'},
    {min:55,id:'close',name:'Близкие друзья',icon:'💚'},
    {min:25,id:'friends',name:'Друзья',icon:'🙂'},
    {min:-15,id:'neutral',name:'Нейтрально',icon:'😐'},
    {min:-45,id:'tense',name:'Напряжение',icon:'😠'},
    {min:-75,id:'rivals',name:'Соперники',icon:'⚔️'},
    {min:-101,id:'enemies',name:'Враги',icon:'💢'}
  ];
  const TRAIT_IDS = new Set(TRAITS.map(x=>x.id));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const now=()=>Date.now();

  function heroName(h){ return h?.n || h?.name || h?.id || 'Выживший'; }
  function heroId(h){ return String(h?.id ?? h?.key ?? heroName(h)); }

  function ensureState(){
    const s=G.S;
    if(!s) return null;
    if(!Array.isArray(s.heroes)) s.heroes=[];
    if(!s.livingCommune) s.livingCommune={version:1, relationships:{}, events:[], lastTick:now(), pending:null};
    const lc=s.livingCommune;
    lc.relationships=lc.relationships||{};
    lc.events=Array.isArray(lc.events)?lc.events:[];
    lc.lastTick=lc.lastTick||now();

    s.heroes.forEach((h,idx)=>{
      if(!h.id) h.id='survivor-'+idx+'-'+heroName(h).toLowerCase().replace(/[^a-zа-я0-9]+/gi,'-');
      h.living=h.living||{};
      const l=h.living;
      if(!Number.isFinite(l.mood)) l.mood=78;
      if(!Number.isFinite(l.fatigue)) l.fatigue=12;
      if(!Number.isFinite(l.health)) l.health=Number.isFinite(h.hp)?h.hp:100;
      if(!Number.isFinite(l.maxHealth)) l.maxHealth=100;
      if(!Number.isFinite(l.loyalty)) l.loyalty=Number.isFinite(h.loyalty)?h.loyalty:70;
      if(!l.trait || !TRAIT_IDS.has(l.trait)) l.trait=TRAITS[idx%TRAITS.length].id;
      if(!l.status) l.status='active';
      if(!Number.isFinite(l.lastAction)) l.lastAction=now();
      if(!Number.isFinite(l.xp)) l.xp=0;
    });

    // Build symmetric relationship records without overwriting existing values.
    for(let i=0;i<s.heroes.length;i++) for(let j=i+1;j<s.heroes.length;j++){
      const a=heroId(s.heroes[i]),b=heroId(s.heroes[j]);
      const k=pairKey(a,b);
      if(!lc.relationships[k]) lc.relationships[k]={a,b,value:0,history:[], affinity:compatibility(s.heroes[i],s.heroes[j]), interactions:0, jealousy:0, lastInteraction:0};
      else { const r=lc.relationships[k]; if(!Number.isFinite(r.affinity)) r.affinity=compatibility(s.heroes[i],s.heroes[j]); if(!Number.isFinite(r.interactions)) r.interactions=0; if(!Number.isFinite(r.jealousy)) r.jealousy=0; }
    }
    return lc;
  }

  function compatibility(a,b){
    const ta=a?.living?.trait||TRAITS[0].id, tb=b?.living?.trait||TRAITS[0].id;
    return (COMPATIBILITY[ta]?.[tb] ?? 0);
  }
  function relStage(v){ return REL_STAGES.find(x=>v>=x.min)||REL_STAGES[REL_STAGES.length-1]; }
  function relationshipScore(a,b){ const r=getRel(a,b); return r?clamp(Math.round(r.value+(r.affinity||0)*0.7),-100,100):0; }
  function relationshipSummary(a,b){ const r=getRel(a,b); if(!r)return null; const score=relationshipScore(a,b), stage=relStage(score); return {value:r.value,score,affinity:r.affinity||0,stage:stage.id,label:stage.name,icon:stage.icon,jealousy:r.jealousy||0,interactions:r.interactions||0}; }
  function pairKey(a,b){ return [String(a),String(b)].sort().join('::'); }
  function getHero(id){ return (G.S?.heroes||[]).find(h=>heroId(h)===String(id)); }
  function getRel(a,b){
    const lc=ensureState(); if(!lc || String(a)===String(b)) return null;
    const k=pairKey(a,b);
    return lc.relationships[k]||(lc.relationships[k]={a:String(a),b:String(b),value:0,history:[]});
  }
  function relLabel(v){ return v>=60?'Доверие':v>=20?'Симпатия':v>-20?'Нейтрально':v>-60?'Напряжение':'Вражда'; }
  function relIcon(v){ return v>=60?'💚':v>=20?'🙂':v>-20?'😐':v>-60?'😠':'💢'; }
  function trait(id){ return TRAITS.find(x=>x.id===id)||TRAITS[0]; }

  function touchRel(a,b,delta,reason){
    const r=getRel(a,b); if(!r) return;
    const ha=getHero(a),hb=getHero(b);
    let d=delta;
    if(ha?.living?.trait==='empathetic' || hb?.living?.trait==='empathetic') d=Math.round(d*1.25);
    r.value=clamp((r.value||0)+d,-100,100);
    r.interactions=(r.interactions||0)+1; r.lastInteraction=now();
    r.history.push({at:now(),delta:d,reason:reason||'interaction'});
    if(r.history.length>30) r.history.shift();
  }

  function notify(msg){
    try{ if(G.toast) G.toast(msg); }catch(e){}
    try{ if(G.updTop) G.updTop(); }catch(e){}
    try{ if(G.save) G.save(); }catch(e){}
  }

  function applyDailyTick(){
    const lc=ensureState(); if(!lc) return;
    const t=now();
    const elapsed=Math.min(6,Math.floor((t-lc.lastTick)/60000));
    if(elapsed<=0) return;
    for(let step=0;step<elapsed;step++){
      (G.S.heroes||[]).forEach(h=>{
        const l=h.living;
        const assigned=Object.values(G.S.heroBldAssign||{}).includes(h.id) || Object.values(G.S.htask||{}).includes(h.id);
        if(assigned){
          l.fatigue=clamp(l.fatigue+(l.trait==='ambitious'?3:2),0,100);
          l.mood=clamp(l.mood-(l.fatigue>75?2:0),0,100);
        }else{
          l.fatigue=clamp(l.fatigue-(l.trait==='loner'?3:2),0,100);
          l.mood=clamp(l.mood+(l.fatigue<35?1:0),0,100);
        }
        if(l.injuryUntil && l.injuryUntil>t){ l.mood=clamp(l.mood-1,0,100); }
        else if(l.injuryUntil && l.injuryUntil<=t){ l.injuryUntil=0; l.status='active'; notify(`🩹 ${heroName(h)} восстановился после травмы.`); }
        if(l.mood<30) l.status='distressed';
        else if(!l.injuryUntil) l.status='active';
      });
    }
    lc.lastTick=t;
    maybeEvent();
    try{ if(G.save) G.save(); }catch(e){}
  }

  function maybeEvent(){
    const lc=ensureState(); if(!lc || lc.pending) return;
    if(Math.random()>0.34) return;
    const heroes=(G.S.heroes||[]).filter(h=>h?.living?.status!=='injured');
    if(heroes.length<1) return;
    const e=pick(EVENTS);
    if(e.kind==='conflict' && heroes.length<2) return;
    const a=pick(heroes), b=heroes.length>1?pick(heroes.filter(h=>heroId(h)!==heroId(a))):null;
    lc.pending={id:e.id,a:heroId(a),b:b?heroId(b):null,created:now()};
    lc.events.push({at:now(),event:e.id,a:heroId(a),b:b?heroId(b):null,state:'pending'});
    if(lc.events.length>40) lc.events.shift();
    notify(`${e.icon} Новое событие коммуны: ${e.title}`);
    showEventAlert();
  }

  function showEventAlert(){
    const lc=ensureState(); if(!lc?.pending) return;
    let el=document.getElementById('livingCommuneAlert');
    if(!el){ el=document.createElement('button'); el.id='livingCommuneAlert'; el.className='living-alert'; el.onclick=()=>G.openLivingEvent(); document.body.appendChild(el); }
    const e=EVENTS.find(x=>x.id===lc.pending.id)||EVENTS[0];
    el.textContent=`${e.icon} ${e.title}`; el.style.display='block';
  }
  function hideEventAlert(){ const el=document.getElementById('livingCommuneAlert'); if(el) el.style.display='none'; }

  G.openLivingEvent=function(){
    const lc=ensureState(); if(!lc?.pending) return;
    const e=EVENTS.find(x=>x.id===lc.pending.id)||EVENTS[0],a=getHero(lc.pending.a),b=getHero(lc.pending.b);
    let m=document.getElementById('livingEventModal');
    if(!m){m=document.createElement('div');m.id='livingEventModal';m.className='living-modal';document.body.appendChild(m);}
    let choices;
    if(e.kind==='conflict') choices=[
      ['mediate','🕊️ Разнять и поговорить','Умерить конфликт ценой времени.',0,8],
      ['backa',`🤝 Поддержать ${heroName(a)}`,'Повысить лояльность выбранного выжившего, но ухудшить отношения пары.',5,-10],
      ['ignore','🚪 Не вмешиваться','Конфликт останется внутри группы.',-5,-5]
    ];
    else if(e.kind==='bond') choices=[
      ['praise','👏 Поощрить взаимопомощь','Оба получают настроение и укрепляют связь.',8,10],
      ['reward','🎁 Выдать общий бонус','Потратить немного продовольствия ради доверия.',12,16]
    ];
    else if(e.kind==='injury') choices=[
      ['rest','🛏️ Отправить на отдых','Травма заживает быстрее.',10,0],
      ['work','⚠️ Оставить на лёгкой работе','Ресурсы важнее, но настроение падает.',-10,-3]
    ];
    else choices=[
      ['listen','👂 Выслушать','Помочь пережить событие.',8,4],
      ['duty','🛡️ Напомнить о долге коммуне','Поддержать дисциплину.',-3,2]
    ];
    m.innerHTML=`<div class="living-card"><div class="living-head"><div><b>${e.icon} ${e.title}</b><small>${e.text}</small></div><button onclick="document.getElementById('livingEventModal').remove()">✕</button></div><div class="living-people">${a?`${trait(a.living.trait).i} ${heroName(a)}`:''}${b?` <span>↔</span> ${trait(b.living.trait).i} ${heroName(b)}`:''}</div><div class="living-choices">${choices.map(c=>`<button onclick="G.resolveLivingEvent('${c[0]}')"><b>${c[1]}</b><small>${c[2]}</small></button>`).join('')}</div></div>`;
    m.style.display='flex';
  };

  G.resolveLivingEvent=function(choice){
    const lc=ensureState(); if(!lc?.pending) return;
    const p=lc.pending,a=getHero(p.a),b=getHero(p.b); if(!a) return;
    const e=EVENTS.find(x=>x.id===p.id)||EVENTS[0];
    const al=a.living, bl=b?.living;
    if(e.kind==='conflict'){
      if(choice==='mediate'){al.mood=clamp(al.mood+5,0,100);if(bl)bl.mood=clamp(bl.mood+5,0,100);touchRel(a.id,b.id,10,'mediation');}
      else if(choice==='backa'){al.loyalty=clamp(al.loyalty+5,0,100);al.mood=clamp(al.mood+8,0,100);if(bl)bl.mood=clamp(bl.mood-4,0,100);touchRel(a.id,b.id,-10,'sided with one survivor');}
      else {al.mood=clamp(al.mood-5,0,100);if(bl)bl.mood=clamp(bl.mood-5,0,100);touchRel(a.id,b.id,-5,'ignored conflict');}
    } else if(e.kind==='bond'){
      const d=choice==='reward'?16:10; al.mood=clamp(al.mood+8,0,100);if(bl)bl.mood=clamp(bl.mood+8,0,100);touchRel(a.id,b.id,d,'mutual help');
      if(choice==='reward' && G.S.res) G.S.res.food=Math.max(0,(G.S.res.food||0)-10);
    } else if(e.kind==='injury'){
      al.mood=clamp(al.mood+(choice==='rest'?10:-10),0,100);al.fatigue=clamp(al.fatigue+(choice==='rest'?-20:8),0,100);if(choice==='rest') al.injuryUntil=now()+45000;
    } else {
      al.mood=clamp(al.mood+(choice==='listen'?8:-3),0,100);al.loyalty=clamp(al.loyalty+(choice==='listen'?4:2),0,100);
    }
    lc.events.push({at:now(),event:e.id,a:p.a,b:p.b,choice});
    if(lc.events.length>40) lc.events.shift();
    lc.pending=null;hideEventAlert();
    const modal=document.getElementById('livingEventModal');if(modal)modal.remove();
    notify(`✅ Решение принято. ${heroName(a)}: настроение ${Math.round(al.mood)}%.`);
  };

  G.getLivingRelationship=function(a,b){ ensureState(); return relationshipSummary(a,b); };
  G.livingDate=function(a,b){
    const ha=getHero(a),hb=getHero(b); if(!ha||!hb||String(a)===String(b)) return; ensureState();
    const r=getRel(a,b); const score=relationshipScore(a,b);
    if(score<25){ notify(`💬 Между ${heroName(ha)} и ${heroName(hb)} пока недостаточно доверия.`); return; }
    touchRel(a,b,score>=60?12:8,'shared personal time'); ha.living.mood=clamp(ha.living.mood+8,0,100); hb.living.mood=clamp(hb.living.mood+8,0,100);
    r.jealousy=clamp((r.jealousy||0)-2,0,100); notify(`💚 ${heroName(ha)} и ${heroName(hb)} провели время вместе.`); G.renderLivingCommune?.();
  };
  G.livingConflict=function(a,b){
    const ha=getHero(a),hb=getHero(b); if(!ha||!hb)return; ensureState(); const r=getRel(a,b);
    touchRel(a,b,-12,'heated argument'); ha.living.mood=clamp(ha.living.mood-7,0,100); hb.living.mood=clamp(hb.living.mood-7,0,100);
    r.jealousy=clamp((r.jealousy||0)+5,0,100); notify(`⚡ ${heroName(ha)} и ${heroName(hb)} серьёзно поссорились.`); G.renderLivingCommune?.();
  };

  G.livingRest=function(id){ const h=getHero(id);if(!h)return;ensureState();h.living.fatigue=clamp(h.living.fatigue-30,0,100);h.living.mood=clamp(h.living.mood+6,0,100);h.living.status='resting';h.living.lastAction=now();notify(`🛏️ ${heroName(h)} отдыхает. Усталость −30.`);G.renderLivingCommune?.(); };
  G.livingTalk=function(a,b){ const ha=getHero(a),hb=getHero(b);if(!ha||!hb)return;ensureState();touchRel(a,b,8,'personal conversation');ha.living.mood=clamp(ha.living.mood+4,0,100);hb.living.mood=clamp(hb.living.mood+4,0,100);notify(`💬 ${heroName(ha)} и ${heroName(hb)} поговорили. Отношения улучшились.`);G.renderLivingCommune?.(); };
  G.livingReconcile=function(a,b){ const ha=getHero(a),hb=getHero(b);if(!ha||!hb)return;ensureState();touchRel(a,b,18,'reconciliation');ha.living.mood=clamp(ha.living.mood+6,0,100);hb.living.mood=clamp(hb.living.mood+6,0,100);notify(`🕊️ ${heroName(ha)} и ${heroName(hb)} помирились.`);G.renderLivingCommune?.(); };

  G.renderLivingCommune=function(){
    ensureState();const s=G.S,hs=s.heroes||[],lc=s.livingCommune;
    const avg=(key)=>hs.length?Math.round(hs.reduce((n,h)=>n+(h.living?.[key]||0),0)/hs.length):0;
    let html=`<div class="living-wrap"><div class="living-summary"><div><b>❤️ Живая коммуна</b><small>Люди здесь — не просто рабочие. Их состояние и отношения меняют эффективность базы.</small></div><div class="living-stats"><span>😊 ${avg('mood')}</span><span>⚡ ${avg('fatigue')}</span><span>🤝 ${avg('loyalty')}</span></div></div>`;
    html+=hs.map(h=>{const l=h.living,t=trait(l.trait);const status=l.injuryUntil&&l.injuryUntil>now()?'🩹 травма':l.status==='distressed'?'😟 стресс':l.status==='resting'?'🛏️ отдыхает':'🟢 активен';
      return `<div class="living-hero"><div class="living-avatar">${h.i||h.icon||'🧍'}</div><div class="living-main"><div class="living-title"><b>${heroName(h)}</b><span>${t.i} ${t.n}</span><em>${status}</em></div><div class="living-bars"><label>😊<i><u style="width:${l.mood}%"></u></i>${Math.round(l.mood)}</label><label>⚡<i><u style="width:${l.fatigue}%"></u></i>${Math.round(l.fatigue)}</label><label>🤝<i><u style="width:${l.loyalty}%"></u></i>${Math.round(l.loyalty)}</label></div><small>${t.d}</small><div class="living-actions"><button onclick="G.livingRest('${heroId(h)}')">🛏️ Отдых</button><button onclick="G.openLivingPair('${heroId(h)}')">💬 Отношения</button></div></div></div>`;
    }).join('');
    html+='</div>';return html;
  };

  G.openLivingPair=function(id){
    ensureState();const hs=(G.S.heroes||[]).filter(h=>heroId(h)!==String(id));if(!hs.length)return;
    let m=document.getElementById('livingPairModal');if(!m){m=document.createElement('div');m.id='livingPairModal';m.className='living-modal';document.body.appendChild(m);}
    const a=getHero(id);m.innerHTML=`<div class="living-card"><div class="living-head"><div><b>💬 Отношения: ${heroName(a)}</b><small>Выберите другого выжившего для разговора, совместного времени или примирения.</small></div><button onclick="document.getElementById('livingPairModal').remove()">✕</button></div><div class="living-choices">${hs.map(b=>{const r=getRel(id,heroId(b)), sum=relationshipSummary(id,heroId(b));return `<button onclick="G.livingTalk('${id}','${heroId(b)}');document.getElementById('livingPairModal').remove()"><b>${sum.icon} ${heroName(b)} · ${sum.label} (${sum.score>0?'+':''}${sum.score})</b><small>💬 Поговорить · совместимость ${sum.affinity>0?'+':''}${sum.affinity}</small></button><button onclick="G.livingDate('${id}','${heroId(b)}');document.getElementById('livingPairModal').remove()"><b>🫶 Провести время вместе</b><small>Требует хотя бы небольшой симпатии</small></button><button onclick="G.livingConflict('${id}','${heroId(b)}');document.getElementById('livingPairModal').remove()"><b>⚡ Спровоцировать конфликт</b><small>Тестовая механика конфликта — ухудшает связь</small></button><button onclick="G.livingReconcile('${id}','${heroId(b)}');document.getElementById('livingPairModal').remove()"><b>🕊️ Примирение с ${heroName(b)}</b><small>Сильнее улучшает отношения</small></button>`}).join('')}</div></div>`;m.style.display='flex';
  };

  // Integrate with the existing Heroes tab without replacing existing systems.
  const oldSubs=(G.SUBS&&G.SUBS.heroes)?G.SUBS.heroes.slice():[];
  if(G.SUBS && Array.isArray(G.SUBS.heroes) && !G.SUBS.heroes.includes('life')) G.SUBS.heroes.push('life');
  if(G.SL) G.SL.life='❤️Коммуна';
  const oldPanel=G.rPanel;
  if(typeof oldPanel==='function'){
    G.rPanel=function(){
      if(this.S && this.S.tab==='heroes' && this.S.sub==='life'){
        const pn=document.getElementById('pn'); if(pn) pn.innerHTML=G.renderLivingCommune();
        return;
      }
      return oldPanel.apply(this,arguments);
    };
  }

  // Add a lightweight button to the existing Heroes navigation when possible.
  const oldTab=G.tab;
  if(typeof oldTab==='function') G.tab=function(tab,sub){ return oldTab.apply(this,arguments); };

  ensureState();
  setInterval(applyDailyTick,30000);
  setTimeout(()=>{ensureState();applyDailyTick();if(G.S?.livingCommune?.pending)showEventAlert();},1200);

  window.TLP_LivingCommune={
    version:'1.0.0',
    ensureState,applyDailyTick,getRel,relationshipSummary,relationshipScore,compatibility,relStage,trait,EVENTS,TRAITS,
    open:G.openLivingEvent
  };
  console.log('[TLP] Living Commune Stage 1 loaded.');
})();
