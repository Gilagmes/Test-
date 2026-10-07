(function(G){
 'use strict';
 const QUESTS={
  'hero-lena':{title:'Последний пациент',steps:[['find','Найти лекарства для раненых','food',25],['help','Помочь раненому выжившему','water',20],['return','Вернуться в медпункт',null,0]],reward:{loyalty:12,mood:8,heal:15}},
  'hero-viktor':{title:'Стена не падёт',steps:[['repair','Укрепить внешний периметр','wood',35],['guard','Пережить ночную атаку','metal',20],['return','Доложить о состоянии обороны',null,0]],reward:{loyalty:12,guard:10}},
  'hero-sofia':{title:'Тихий маршрут',steps:[['scout','Разведать опасный сектор','food',20],['signal','Передать координаты коммуне','water',15],['return','Вернуться незаметно',null,0]],reward:{loyalty:10,mood:10,scout:10}},
  'hero-roman':{title:'Цена смелости',steps:[['fight','Отбить засаду','food',30],['protect','Защитить отступление','metal',30],['return','Вернуться в лагерь',null,0]],reward:{loyalty:14,attack:10}},
  'hero-irina':{title:'Снова заработает',steps:[['repair','Починить генератор','metal',35],['build','Собрать резервную систему','wood',40],['return','Запустить оборудование',null,0]],reward:{loyalty:12,engineer:10}}
 };
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function S(){return G.S||(G.S={})}
 function st(){const s=S();s.heroPersonalQuests=s.heroPersonalQuests||{active:{},completed:{},history:[]};return s.heroPersonalQuests}
 function h(id){return (S().heroes||[]).find(x=>String(x.id)===String(id)||String(x.heroCatalogId)===String(id))}
 function q(id){return QUESTS[id]}
 function canStart(id){const hero=h(id),quest=q(id);if(!hero||!quest)return {ok:false,reason:'герой не найден'};if(st().completed[id])return {ok:false,reason:'квест уже завершён'};if(st().active[id])return {ok:false,reason:'квест уже идёт'};return {ok:true}}
 function start(id){const c=canStart(id);if(!c.ok)return false;st().active[id]={hero:id,step:0,startedDay:S().day||1,choices:[],status:'active'};st().history.push({type:'started',hero:id,day:S().day||1,at:Date.now()});save();render();return true}
 function spend(type,n){if(!type||!n)return true;const s=S();s.res=s.res||{};if((s.res[type]||0)<n)return false;s.res[type]-=n;return true}
 function applyReward(hero,r){hero.living=hero.living||{};hero.living.loyalty=clamp((hero.living.loyalty??hero.loyalty??70)+(r.loyalty||0),0,100);hero.loyalty=hero.living.loyalty;hero.living.mood=clamp((hero.living.mood??70)+(r.mood||0),0,100);hero.questRewards=hero.questRewards||{};Object.keys(r).filter(k=>!['loyalty','mood'].includes(k)).forEach(k=>hero.questRewards[k]=(hero.questRewards[k]||0)+r[k]);}
 function advance(id,choice='complete'){const d=st().active[id],quest=q(id),hero=h(id);if(!d||d.status!=='active'||!quest||!hero)return false;const step=quest.steps[d.step];if(!step)return false;if(step[3]&&step[2]&&!spend(step[2],step[3]))return false;d.choices.push({step:d.step,choice,day:S().day||1});d.step++;if(d.step>=quest.steps.length){d.status='completed';st().completed[id]={day:S().day||1,choices:d.choices};applyReward(hero,quest.reward);delete st().active[id];st().history.push({type:'completed',hero:id,day:S().day||1,reward:quest.reward,at:Date.now()});save();render();return true}save();render();return true}
 function get(id){const quest=q(id);return quest?{id,quest,active:st().active[id]||null,completed:st().completed[id]||null,hero:h(id)||null}:null}
 function list(){return Object.keys(QUESTS).map(get)}
 function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3HeroQuestPanel');if(!host)return;host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>📖 Личные квесты героев</b>'+Object.entries(QUESTS).map(([id,quest])=>{const hero=h(id),d=st().active[id],done=st().completed[id];if(!hero)return '';let action=done?'✅ Завершено':d?`<button onclick="G.heroQuestAdvance('${id}')">➡️ ${quest.steps[d.step]?.[1]||'Продолжить'}</button>`:`<button onclick="G.heroQuestStart('${id}')">▶️ Начать</button>`;return `<div style="margin-top:8px;padding:8px;background:#111923;border-radius:8px"><b>${hero.name||hero.n} · ${quest.title}</b><br><small>${d?'Этап '+(d.step+1)+'/'+quest.steps.length:done?'История завершена':quest.steps[0][1]}</small><br>${action}</div>`}).join('')+'</div>'}
 function save(){try{if(G.save)G.save(true)}catch(e){}}
 G.heroPersonalQuests={QUESTS,state:st,start,advance,get,list,render};G.heroQuestStart=start;G.heroQuestAdvance=advance;G.renderHeroPersonalQuests=render;render();
})(window.G||window);
