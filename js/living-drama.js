/* LAST PORT — LIVING COMMUNE / STAGE 1C: DRAMA, FAMILIES & LOSS */
(function(){
  'use strict';
  if(typeof window==='undefined' || !window.G) return;
  const G=window.G;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const now=()=>Date.now();
  const heroId=h=>String(h?.id??h?.key??h?.n??h?.name??'');
  const heroName=h=>h?.n||h?.name||h?.id||'Выживший';
  const getHero=id=>(G.S?.heroes||[]).find(h=>heroId(h)===String(id));
  function state(){
    if(!G.S) return null;
    if(!G.S.livingDrama) G.S.livingDrama={version:1,pairs:{},grief:[],stories:[],dead:[],lastDay:Math.floor(now()/86400000)};
    const d=G.S.livingDrama;
    d.pairs=d.pairs||{}; d.grief=Array.isArray(d.grief)?d.grief:[]; d.stories=Array.isArray(d.stories)?d.stories:[]; d.dead=Array.isArray(d.dead)?d.dead:[];
    return d;
  }
  const key=(a,b)=>[String(a),String(b)].sort().join('::');
  function pair(a,b){ const d=state(),k=key(a,b); if(!d)return null; if(!d.pairs[k]) d.pairs[k]={a:String(a),b:String(b),type:'none',commitment:0,jealousy:0,startedAt:0}; return d.pairs[k]; }
  function rel(a,b){ return G.getLivingRelationship?G.getLivingRelationship(a,b):null; }
  function toast(m){try{G.toast?.(m)}catch(e){} try{G.save?.()}catch(e){} try{G.renderLivingCommune?.()}catch(e){}}
  function logEvent(e){const d=state();d.grief.unshift(e);if(d.grief.length>60)d.grief.length=60;}

  G.setLivingRomance=function(a,b){
    const ha=getHero(a),hb=getHero(b);if(!ha||!hb||String(a)===String(b))return false;
    const r=rel(a,b); if(!r || r.score<40){toast('💬 Для отношений нужно больше доверия.');return false;}
    const p=pair(a,b);p.type='romance';p.commitment=clamp(Math.max(p.commitment||0,20)+10,0,100);p.startedAt=p.startedAt||now();p.jealousy=0;
    toast(`❤️ ${heroName(ha)} и ${heroName(hb)} начали сближаться.`);return true;
  };
  G.setLivingFamily=function(a,b,type){
    const ha=getHero(a),hb=getHero(b);if(!ha||!hb||String(a)===String(b))return false;
    const allowed=new Set(['partner','sibling','parent','child']); if(!allowed.has(type))return false;
    const p=pair(a,b);p.type=type;p.commitment=100;p.startedAt=p.startedAt||now();toast(`👨‍👩‍👧 Связь ${heroName(ha)} и ${heroName(hb)}: ${type}.`);return true;
  };
  G.breakLivingRomance=function(a,b){const p=pair(a,b);if(!p||p.type!=='romance')return false;p.type='ex';p.commitment=0;p.jealousy=0;const ha=getHero(a),hb=getHero(b);if(ha?.living)ha.living.mood=clamp((ha.living.mood||0)-12,0,100);if(hb?.living)hb.living.mood=clamp((hb.living.mood||0)-12,0,100);toast(`💔 ${heroName(ha)} и ${heroName(hb)} расстались.`);return true;};

  G.processLivingJealousy=function(){
    const d=state(),hs=G.S?.heroes||[];
    Object.values(d.pairs).forEach(p=>{
      if(p.type!=='romance')return;
      const a=getHero(p.a),b=getHero(p.b);if(!a||!b)return;
      const scoreAB=rel(p.a,p.b)?.score||0;
      const others=hs.filter(h=>heroId(h)!==p.a&&heroId(h)!==p.b);
      for(const x of others){
        const sx=rel(p.a,heroId(x))?.score||0;
        if(sx>=60){p.jealousy=clamp((p.jealousy||0)+1,0,100);if(p.jealousy>=70){a.living.mood=clamp(a.living.mood-2,0,100);b.living.mood=clamp(b.living.mood-1,0,100);if(G.livingConflict)G.livingConflict(p.a,heroId(x));p.jealousy=20;break;}}
      }
      if(scoreAB>=75)p.commitment=clamp((p.commitment||0)+1,0,100);
    });
  };

  G.loseLivingHero=function(id,cause){
    const d=state(),h=getHero(id);if(!h||h.living?.status==='dead')return false;
    h.living=h.living||{};h.living.status='dead';h.living.deadAt=now();h.living.deathCause=cause||'Погиб во время вылазки';
    d.dead.unshift({id:heroId(h),name:heroName(h),cause:h.living.deathCause,at:now()});
    const survivors=G.S.heroes||[];
    survivors.forEach(x=>{
      if(heroId(x)===heroId(h)||x.living?.status==='dead')return;
      const r=rel(heroId(h),heroId(x));const score=r?.score||0;
      if(score>=40){
        x.living=x.living||{};x.living.grief=clamp((x.living.grief||0)+(score>=75?45:25),0,100);x.living.mood=clamp((x.living.mood||0)-(score>=75?30:16),0,100);x.living.status='grieving';
        logEvent({type:'loss',dead:heroId(h),survivor:heroId(x),score,at:now(),resolved:false});
      }
    });
    Object.keys(d.pairs).forEach(k=>{const p=d.pairs[k];if(p.a===heroId(h)||p.b===heroId(h)){p.type='widowed';p.commitment=0;p.jealousy=0;}});
    toast(`🕯️ ${heroName(h)} погиб. Коммуна переживает потерю.`);return true;
  };
  G.resolveLivingGrief=function(id,action){
    const h=getHero(id);if(!h?.living)return false;const g=h.living.grief||0;if(g<=0)return false;
    if(action==='talk'){h.living.grief=clamp(g-18,0,100);h.living.mood=clamp((h.living.mood||0)+8,0,100);}
    else if(action==='memorial'){h.living.grief=clamp(g-30,0,100);h.living.loyalty=clamp((h.living.loyalty||0)+8,0,100);}
    else if(action==='rest'){h.living.grief=clamp(g-12,0,100);h.living.fatigue=clamp((h.living.fatigue||0)-15,0,100);}
    if(h.living.grief<15 && h.living.status==='grieving')h.living.status='active';
    toast(`🕯️ ${heroName(h)} постепенно справляется с утратой.`);return true;
  };

  const STORIES={
    family:{title:'Дом, который держится вместе',steps:[
      {text:'В коммуне замечают, что близкие люди проводят всё больше времени вместе. Это укрепляет их, но остальные начинают чувствовать себя лишними.',choices:[['support','Поддержать близких',8],['balance','Сохранить баланс коммуны',3]]},
      {text:'Нагрузка растёт. Пара просит работать вместе, хотя это не всегда выгодно для производства.',choices:[['allow','Разрешить',10],['duty','Поставить работу выше личного',-8]]},
      {text:'Напряжение спало. Теперь близкие отношения стали опорой коммуны.',choices:[['close','Укрепить связь',15],['public','Сделать её примером для всех',8]]}
    ]},
    mourning:{title:'После потери',steps:[
      {text:'После смерти товарища один из выживших почти перестал разговаривать.',choices:[['talk','Поговорить с ним',10],['space','Дать время',5]]},
      {text:'Воспоминание возвращается во сне. Горе начинает влиять на работу.',choices:[['memorial','Создать памятное место',12],['duty','Вернуть к обычной работе',-6]]},
      {text:'Память остаётся, но боль уже не парализует человека.',choices:[['remember','Сохранить память',10],['move','Попробовать начать заново',6]]}
    ]}
  };
  function startStory(type,actor){
    const d=state();if(d.stories.some(s=>s.type===type&&s.active))return false;const h=getHero(actor);if(!h)return false;
    d.stories.push({id:`${type}-${now()}`,type,actor:heroId(h),step:0,active:true,startedAt:now(),choices:[]});toast(`📖 Началась история: ${STORIES[type].title}`);return true;
  }
  G.startLivingStory=startStory;
  G.resolveLivingStory=function(id,choice){
    const d=state(),s=d.stories.find(x=>x.id===id&&x.active);if(!s)return false;const def=STORIES[s.type],step=def.steps[s.step],h=getHero(s.actor);if(!h)return false;
    const picked=step.choices.find(x=>x[0]===choice);if(!picked)return false;const delta=picked[2];h.living.mood=clamp((h.living.mood||0)+Math.round(delta/2),0,100);h.living.loyalty=clamp((h.living.loyalty||0)+Math.max(0,Math.round(delta/3)),0,100);s.choices.push({step:s.step,choice,at:now()});s.step++;
    if(s.step>=def.steps.length){s.active=false;s.completedAt=now();toast(`📖 История завершена: ${def.title}`);}else toast(`📖 История продолжается: день ${s.step+1}.`);return true;
  };
  G.renderLivingDrama=function(){
    const d=state(),hs=G.S.heroes||[],dead=d.dead||[],pairs=Object.values(d.pairs).filter(p=>p.type&&p.type!=='none');
    let html='<div class="living-drama"><div class="drama-title"><b>📖 Личные истории</b><small>Отношения, любовь, ревность и потери теперь оставляют последствия.</small></div>';
    if(!pairs.length) html+='<div class="drama-note">💬 Близкие связи появятся по мере развития отношений.</div>';
    pairs.forEach(p=>{const a=getHero(p.a),b=getHero(p.b);if(!a||!b)return;html+=`<div class="drama-row"><b>${p.type==='romance'?'❤️':p.type==='widowed'?'🕯️':'👨‍👩‍👧'} ${heroName(a)} ↔ ${heroName(b)}</b><span>${p.type==='romance'?'Пара':p.type==='widowed'?'Вдова/вдовец':'Семья'} · привязанность ${p.commitment||0}% ${p.jealousy?`· ревность ${p.jealousy}%`:''}</span></div>`});
    hs.filter(h=>h.living?.grief>0).forEach(h=>{html+=`<div class="drama-row grief"><b>🕯️ ${heroName(h)} переживает утрату</b><span>Горе ${Math.round(h.living.grief)}%</span><div class="drama-actions"><button onclick="G.resolveLivingGrief('${heroId(h)}','talk')">💬 Поговорить</button><button onclick="G.resolveLivingGrief('${heroId(h)}','memorial')">🕯️ Мемориал</button><button onclick="G.resolveLivingGrief('${heroId(h)}','rest')">🛏️ Отдых</button></div></div>`});
    if(dead.length)html+='<div class="drama-dead"><b>🪦 Память коммуны</b>'+dead.slice(0,5).map(x=>`<div>🕯️ ${x.name} — ${x.cause}</div>`).join('')+'</div>';
    d.stories.filter(s=>s.active).forEach(s=>{const def=STORIES[s.type],step=def.steps[s.step],h=getHero(s.actor);if(!h)return;html+=`<div class="drama-story"><b>📖 ${def.title}</b><small>${step.text}</small>${step.choices.map(c=>`<button onclick="G.resolveLivingStory('${s.id}','${c[0]}');G.renderLivingCommune?.()">${c[1]}</button>`).join('')}</div>`});
    html+='</div>';return html;
  };
  const oldRender=G.renderLivingCommune;
  if(typeof oldRender==='function')G.renderLivingCommune=function(){const base=oldRender.apply(this,arguments);return base+G.renderLivingDrama();};
  const oldTick=G.TLP_LivingCommune?.applyDailyTick;
  setInterval(()=>{try{G.processLivingJealousy();}catch(e){}},60000);
  setTimeout(()=>{try{state();const hs=G.S?.heroes||[];if(hs.length>=2){const p=pair(heroId(hs[0]),heroId(hs[1]));if(p.type==='none' && (rel(hs[0].id,hs[1].id)?.score||0)>=70)startStory('family',heroId(hs[0]));}}catch(e){}},1800);
  window.TLP_LivingDrama={version:'1.0.0',state,pair,startStory,STORIES};
  console.log('[TLP] Living Drama Stage 1C loaded.');
})();
