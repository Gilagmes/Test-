(function(G){
 'use strict';
 const EFFECTS={
  'hero-lena':{
   mercy:{morale:6,foodRate:1,medical:2,loyalty:3,flags:['mercy'],event:'Лена открыла лазарет для всех.'},
   pragmatic:{security:4,medical:1,loyalty:1,flags:['triage'],event:'Лена ввела жёсткий медицинский приоритет.'}
  },
  'hero-viktor':{
   hold:{security:8,guard:3,morale:2,flags:['fortress'],event:'Виктор укрепил оборонительный рубеж.'},
   fallback:{security:3,guard:1,morale:-2,flags:['fallback'],event:'Виктор научил коммуну отступать организованно.'},
   trust:{security:5,guard:4,morale:4,flags:['commander'],event:'Виктор получил полномочия по обороне.'},
   control:{security:2,guard:1,morale:-1,flags:['centralized'],event:'Штаб сохранил полный контроль над обороной.'}
  },
  'hero-sofia':{
   follow:{scout:5,security:2,flags:['observer_routes'],event:'София открыла безопасные разведывательные маршруты.'},
   avoid:{security:1,scout:2,flags:['cautious_scout'],event:'София снизила риск разведки.'},
   answer:{scout:4,reputation:2,flags:['radio_contact'],event:'София установила новый радиоконтакт.'},
   silence:{security:3,scout:1,flags:['radio_silence'],event:'София усилила радиодисциплину.'},
   trust:{scout:6,morale:3,flags:['free_scout'],event:'София получила свободу выбора маршрутов.'},
   order:{security:2,scout:2,morale:-1,flags:['ordered_scout'],event:'Разведка Софии перешла под прямые приказы.'}
  },
  'hero-roman':{
   strike:{attack:5,security:1,morale:-1,flags:['aggressive'],event:'Роман сделал коммуну опаснее для врагов.'},
   negotiate:{reputation:3,morale:2,flags:['negotiator'],event:'Роман доказал, что силу можно сочетать с переговорами.'},
   revenge:{attack:4,tension:4,morale:-2,flags:['vengeance'],event:'Жажда мести Романа усилила напряжение.'},
   rescue:{attack:2,morale:6,loyalty:2,flags:['rescue_first'],event:'Роман поставил спасение людей выше мести.'},
   stop:{security:3,morale:5,tension:-4,flags:['restrained'],event:'Коммуна остановила Романа до опасной черты.'},
   allow:{attack:7,morale:-5,tension:8,flags:['blood_debt'],event:'Коммуна разрешила Роману ответить кровью.'}
  },
  'hero-irina':{
   repair:{engineer:5,security:2,metalRate:2,flags:['stable_power'],event:'Ирина стабилизировала энергосистему.'},
   push:{engineer:2,security:-2,morale:-2,flags:['overload'],event:'Ирина предупреждает о перегрузке техники.'},
   salvage:{engineer:6,metalRate:3,flags:['salvage'],event:'Ирина наладила разбор старой техники.'},
   save:{engineer:2,metalRate:1,flags:['preserved_workshop'],event:'Ирина сохранила станок для будущего.'},
   build:{engineer:7,morale:5,security:4,woodRate:1,metalRate:1,flags:['backup_grid'],event:'Ирина создала резервную инженерную сеть.'},
   delay:{engineer:1,morale:-1,flags:['deferred_grid'],event:'Проект резервной сети отложен.'}
  }
 };
 const S=()=>G.S||(G.S={});
 const state=()=>{const s=S();s.communeConsequences=s.communeConsequences||{applied:{},flags:[],history:[],stats:{morale:0,security:0,attack:0,scout:0,engineer:0,guard:0,medical:0,reputation:0,foodRate:0,woodRate:0,metalRate:0}};return s.communeConsequences};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const hero=id=>(S().heroes||[]).find(h=>String(h.id)===String(id)||String(h.heroCatalogId)===String(id));
 function add(obj,k,v){if(!v)return;obj.stats[k]=(obj.stats[k]||0)+v;}
 function apply(id,ending,source){
  const st=state(); if(st.applied[id]) return false;
  const fx=(EFFECTS[id]||{})[ending]||{};
  if(!fx) return false;
  Object.keys(st.stats).forEach(k=>add(st,k,fx[k]));
  (fx.flags||[]).forEach(f=>{if(!st.flags.includes(f))st.flags.push(f)});
  const s=S(); s.commune=s.commune||{}; s.commune.morale=clamp((s.commune.morale??50)+(fx.morale||0),0,100);
  s.commune.security=clamp((s.commune.security??50)+(fx.security||0),0,100);
  s.commune.reputation=clamp((s.commune.reputation??0)+(fx.reputation||0),-100,100);
  s.commune.productionBonuses=s.commune.productionBonuses||{};
  ['foodRate','woodRate','metalRate','medical'].forEach(k=>{if(fx[k])s.commune.productionBonuses[k]=(s.commune.productionBonuses[k]||0)+fx[k]});
  const h=hero(id); if(h){h.storyBonuses=h.storyBonuses||{};['attack','scout','engineer','guard','medical','security'].forEach(k=>{if(fx[k])h.storyBonuses[k]=(h.storyBonuses[k]||0)+fx[k]});if(fx.loyalty){h.living=h.living||{};h.living.loyalty=clamp((h.living.loyalty??h.loyalty??70)+fx.loyalty,0,100);h.loyalty=h.living.loyalty}}
  st.applied[id]={ending,day:s.day||1,event:fx.event||'',source:source||'story'};
  st.history.push({type:'consequence',hero:id,ending,day:s.day||1,event:fx.event||'',at:Date.now()});
  try{if(G.save)G.save(true)}catch(e){}
  render(); return true;
 }
 function sync(){const arcs=S().heroStoryArcs; if(!arcs||!arcs.completed)return 0;let n=0;Object.keys(arcs.completed).forEach(id=>{const c=arcs.completed[id];if(c&&c.ending&&!state().applied[id]){if(apply(id,c.ending,'story-completion'))n++}});return n}
 function get(id){sync();const st=state();return {id,applied:st.applied[id]||null,stats:st.stats,flags:st.flags,history:st.history.filter(x=>x.hero===id)}}
 function list(){sync();return Object.keys(EFFECTS).map(id=>({id,hero:hero(id),consequence:state().applied[id]||null,effects:EFFECTS[id]}))}
 function render(){if(typeof document==='undefined')return;sync();const host=document.getElementById('stage3HeroConsequencePanel');if(!host)return;const st=state();host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>🏠 Последствия историй</b><br><small>Решения героев теперь меняют саму коммуну.</small>'+Object.keys(EFFECTS).map(id=>{const a=st.applied[id],h=hero(id);if(!h&&!a)return '';return '<div style="margin-top:8px;padding:8px;background:#111923;border-radius:8px"><b>'+((h&&h.name)||id)+'</b><br>'+(a?('✓ '+a.event+' · день '+a.day):'⏳ Арка ещё не завершена')+'</div>'}).join('')+'<div style="margin-top:8px">🛡️ Безопасность: '+(S().commune?.security??50)+' · ❤️ Мораль: '+(S().commune?.morale??50)+' · ⭐ Репутация: '+(S().commune?.reputation??0)+'</div></div>'}
 G.heroCommuneConsequences={EFFECTS,state,apply,sync,get,list,render};G.syncHeroCommuneConsequences=sync;G.renderHeroCommuneConsequences=render;sync();render();
})(window.G||window);
