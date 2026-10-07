(function(G){'use strict';
 const EVENTS=[
  {id:'camp-conversation',title:'Тихий разговор у костра',kind:'social',need:1,choices:[{id:'listen',label:'Выслушать героя',loyalty:4,morale:2},{id:'dismiss',label:'Отправить отдыхать',loyalty:-2,fatigue:-3}]},
  {id:'shared-supplies',title:'Спор из-за запасов',kind:'conflict',need:1,choices:[{id:'fair',label:'Разделить поровну',loyalty:3,tension:-4,morale:2},{id:'priority',label:'Отдать приоритет раненым',medical:2,loyalty:1,tension:2},{id:'strict',label:'Ввести жёсткий лимит',loyalty:-4,tension:7,security:2}]},
  {id:'hero-jealousy',title:'Тень ревности',kind:'relationship',need:2,choices:[{id:'talk',label:'Поговорить со всеми',loyalty:3,tension:-5,jealousy:-8},{id:'favor',label:'Поддержать одного героя',loyalty:5,tension:6,jealousy:4},{id:'ignore',label:'Не вмешиваться',loyalty:-3,tension:8}]},
  {id:'injured-helper',title:'Помощь после тяжёлого дня',kind:'care',need:1,choices:[{id:'help',label:'Оказать помощь',food:-5,loyalty:5,morale:3,medical:1},{id:'delegate',label:'Поручить медику',loyalty:2,medical:2},{id:'rest',label:'Пусть отдыхает один',loyalty:-2,fatigue:-5}]},
  {id:'commune-celebration',title:'Маленький праздник',kind:'morale',need:3,choices:[{id:'celebrate',label:'Устроить праздник',food:-8,morale:8,loyalty:4,tension:-6},{id:'modest',label:'Скромно отметить',food:-3,morale:4,loyalty:2},{id:'work',label:'Продолжить работу',loyalty:-2,security:1}]}
 ];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const S=()=>G.S||(G.S={});
 function state(){const s=S();s.livingHeroEvents=s.livingHeroEvents||{active:null,lastDay:0,cooldowns:{},history:[],stats:{triggered:0,resolved:0}};return s.livingHeroEvents}
 function heroes(){return S().heroes||[]}
 function save(){try{if(G.save)G.save(true)}catch(e){}}
 function available(){const d=S().day||1,st=state();return EVENTS.filter(e=>d>=e.need && (st.cooldowns[e.id]||0)<d)}
 function participants(){return heroes().filter(h=>h && (h.living?.status||h.status||'active')!=='dead')}
 function pickEvent(id){const e=EVENTS.find(x=>x.id===id)||available()[Math.floor(Math.random()*Math.max(1,available().length))];if(!e)return null;const ps=participants();if(!ps.length)return null;const st=state();st.active={id:e.id,heroId:ps[Math.floor(Math.random()*ps.length)].id,day:S().day||1};st.cooldowns[e.id]=(S().day||1)+1;st.stats.triggered++;st.history.push({type:'started',event:e.id,hero:st.active.heroId,day:S().day||1,at:Date.now()});save();render();return st.active}
 function trigger(id){const st=state();if(st.active)return false;return !!pickEvent(id)}
 function resolve(choiceId){const st=state(),a=st.active;if(!a)return false;const e=EVENTS.find(x=>x.id===a.id);if(!e)return false;const c=e.choices.find(x=>x.id===choiceId)||e.choices[0];const s=S(),h=heroes().find(x=>String(x.id)===String(a.heroId));if(!c)return false;
  ['food','wood','metal','stone','water'].forEach(k=>{if(c[k])s[k]=Math.max(0,(s[k]||0)+c[k])});
  s.commune=s.commune||{};s.commune.morale=clamp((s.commune.morale??50)+(c.morale||0),0,100);s.commune.security=clamp((s.commune.security??50)+(c.security||0),0,100);s.commune.productionBonuses=s.commune.productionBonuses||{};if(c.medical)s.commune.productionBonuses.medical=(s.commune.productionBonuses.medical||0)+c.medical;
  if(h){h.living=h.living||{};h.living.loyalty=clamp((h.living.loyalty??h.loyalty??70)+(c.loyalty||0),0,100);h.loyalty=h.living.loyalty;h.living.fatigue=clamp((h.living.fatigue??0)+(c.fatigue||0),0,100);h.eventMemories=h.eventMemories||[];h.eventMemories.push({event:e.id,choice:c.id,day:s.day||1});if(h.eventMemories.length>30)h.eventMemories.shift()}
  if(G.heroRelationships){if(c.tension<0){Object.keys(G.heroRelationships.state().pairs||{}).forEach(k=>G.heroRelationships.state().pairs[k].tension=clamp((G.heroRelationships.state().pairs[k].tension||0)+c.tension,0,100));}if(c.jealousy<0){Object.keys(G.heroRelationships.state().pairs||{}).forEach(k=>G.heroRelationships.state().pairs[k].jealousy=clamp((G.heroRelationships.state().pairs[k].jealousy||0)+c.jealousy,0,100));}}
  st.history.push({type:'resolved',event:e.id,hero:a.heroId,choice:c.id,day:s.day||1,at:Date.now()});st.stats.resolved++;st.active=null;save();render();return true}
 function daily(){const d=S().day||1,st=state();if(st.lastDay===d)return false;st.lastDay=d;if(!st.active && Math.random()<0.45)pickEvent();return !!st.active}
 function get(){return JSON.parse(JSON.stringify(state()))}
 function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3HeroEventsPanel');if(!host)return;const st=state(),a=st.active,e=a&&EVENTS.find(x=>x.id===a.id),h=a&&heroes().find(x=>String(x.id)===String(a.heroId));host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>🎭 Жизнь коммуны</b><br><small>Случайные события между героями и выжившими.</small>'+(e?'<div style="margin-top:8px;padding:8px;background:#111923;border-radius:8px"><b>'+e.title+'</b><br><small>Участник: '+(h?.name||h?.n||'выживший')+'</small>'+e.choices.map(c=>'<br><button style="margin-top:5px" onclick="G.heroEventResolve(\''+c.id+'\')">'+c.label+'</button>').join('')+'</div>':'<div style="margin-top:8px">⏳ Новых событий сейчас нет.</div>')+'<div style="margin-top:8px">Событий: '+st.stats.resolved+' · День: '+(S().day||1)+'</div></div>'}
 G.heroEvents={EVENTS,state,available,trigger,resolve,daily,get,render};G.heroEventTrigger=trigger;G.heroEventResolve=resolve;G.heroEventDaily=daily;G.renderHeroEvents=render;render();
})(window.G||window);
