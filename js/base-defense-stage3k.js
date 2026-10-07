(function(G){
 'use strict';
 const ARCS={
  'hero-lena':{title:'Цена милосердия',days:3,chapters:[
   {title:'Следы в снегу',text:'Лена замечает следы раненой группы у внешнего сектора.',choices:[{id:'help',label:'Идти спасать',loyalty:4,affinity:3,cost:{food:10}},{id:'wait',label:'Ждать разведку',loyalty:-1,security:2}]},
   {title:'Последний шанс',text:'У спасённого выжившего тяжёлое состояние.',choices:[{id:'medicine',label:'Отдать лекарства',loyalty:6,mood:4,cost:{water:10}},{id:'ration',label:'Сохранить запас',loyalty:-3,resources:2}]},
   {title:'Новая клятва',text:'Лена решает, каким будет правило коммуны.',choices:[{id:'oath',label:'Никого не бросаем',loyalty:8,communeMorale:3},{id:'pragmatic',label:'Сначала безопасность',loyalty:2,communeMorale:1}]}
  ],finals:{help:'mercy',wait:'pragmatic'}},
  'hero-viktor':{title:'Последний рубеж',days:4,chapters:[
   {title:'Тревога',text:'На периметре замечена большая группа.',choices:[{id:'fortify',label:'Укрепить ворота',loyalty:5,cost:{wood:20,metal:15}},{id:'patrol',label:'Выйти навстречу',loyalty:2,risk:1}]},
   {title:'Ночь',text:'Защитникам не хватает людей.',choices:[{id:'hold',label:'Держать линию',loyalty:6,guard:3},{id:'fallback',label:'Отступить к внутренней стене',loyalty:-2,guard:1}]},
   {title:'После боя',text:'Виктор спорит с командованием о цене победы.',choices:[{id:'trust',label:'Доверить ему оборону',loyalty:7,affinity:2},{id:'control',label:'Оставить всё под контролем штаба',loyalty:-4}]}
  ]},
  'hero-sofia':{title:'Тень на маршруте',days:3,chapters:[
   {title:'Чужие следы',text:'София обнаруживает наблюдателей на старой дороге.',choices:[{id:'follow',label:'Проследить',loyalty:5,scout:3},{id:'avoid',label:'Не рисковать',loyalty:1}]},
   {title:'Радиосигнал',text:'Кто-то просит Софию выйти на связь.',choices:[{id:'answer',label:'Ответить',loyalty:6,cost:{fuel:5}},{id:'silence',label:'Сохранить тишину',loyalty:-2,security:2}]},
   {title:'Свободный выбор',text:'София хочет сама определить следующий маршрут.',choices:[{id:'trust',label:'Дать ей свободу',loyalty:8,scout:2},{id:'order',label:'Назначить маршрут',loyalty:-3}]}
  ]},
  'hero-roman':{title:'Кровь за кровь',days:4,chapters:[
   {title:'Засада',text:'Роман узнаёт, что враг захватил припасы.',choices:[{id:'strike',label:'Ударить первым',loyalty:5,attack:3,cost:{food:15}},{id:'negotiate',label:'Предложить обмен',loyalty:1}]},
   {title:'Перелом',text:'Коммуна теряет бойца.',choices:[{id:'revenge',label:'Ответить жёстко',loyalty:3,tension:4},{id:'rescue',label:'Сначала вернуть живых',loyalty:7,morale:3}]},
   {title:'Граница',text:'Роман готов перейти опасную черту.',choices:[{id:'stop',label:'Остановить его',loyalty:4,morale:4},{id:'allow',label:'Разрешить месть',loyalty:-3,tension:8}]}
  ]},
  'hero-irina':{title:'Сердце машины',days:5,chapters:[
   {title:'Сбой',text:'Главный генератор начинает перегреваться.',choices:[{id:'repair',label:'Остановить генератор и чинить',loyalty:6,cost:{metal:20}},{id:'push',label:'Продолжать работу',loyalty:-3,risk:2}]},
   {title:'Выбор',text:'Нужно разобрать часть техники ради деталей.',choices:[{id:'salvage',label:'Разобрать старый станок',loyalty:5,engineer:3},{id:'save',label:'Сохранить станок',loyalty:1}]},
   {title:'Новая система',text:'Ирина предлагает построить резервную сеть.',choices:[{id:'build',label:'Поддержать проект',loyalty:8,communeMorale:3,cost:{wood:20,metal:20}},{id:'delay',label:'Отложить до лучших времён',loyalty:-2}]}
  ]}
 };
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const S=()=>G.S||(G.S={});
 const state=()=>{const s=S();s.heroStoryArcs=s.heroStoryArcs||{active:{},completed:{},history:[],consequences:{}};return s.heroStoryArcs};
 const hero=id=>(S().heroes||[]).find(h=>String(h.id)===String(id)||String(h.heroCatalogId)===String(id));
 const arc=id=>ARCS[id];
 function canStart(id){if(!hero(id)||!arc(id))return{ok:false,reason:'герой не найден'};if(state().completed[id])return{ok:false,reason:'арка завершена'};if(state().active[id])return{ok:false,reason:'арка уже идёт'};return{ok:true}}
 function start(id){const c=canStart(id);if(!c.ok)return false;state().active[id]={hero:id,chapter:0,startedDay:S().day||1,choices:[],status:'active'};state().history.push({type:'started',hero:id,day:S().day||1,at:Date.now()});save();render();return true}
 function spend(cost){if(!cost)return true;const r=S().res||(S().res={});for(const k of Object.keys(cost))if((r[k]||0)<cost[k])return false;for(const k of Object.keys(cost))r[k]-=cost[k];return true}
 function apply(id,ch){const h=hero(id),d=state().active[id];if(!h||!d)return false;h.living=h.living||{};h.living.loyalty=clamp((h.living.loyalty??h.loyalty??70)+(ch.loyalty||0),0,100);h.loyalty=h.living.loyalty;h.living.mood=clamp((h.living.mood??70)+(ch.mood||0),0,100);h.storyBonuses=h.storyBonuses||{};['guard','scout','attack','engineer','affinity','security','morale','tension','resources'].forEach(k=>{if(ch[k])h.storyBonuses[k]=(h.storyBonuses[k]||0)+ch[k]});
  if(ch.morale||ch.security){S().commune=S().commune||{};S().commune.morale=clamp((S().commune.morale||50)+(ch.morale||0)+(ch.security||0),0,100)}
  return true}
 function choose(id,choice){const d=state().active[id],a=arc(id);if(!d||!a||d.status!=='active')return false;const chapter=a.chapters[d.chapter];const minDay=d.startedDay+d.chapter;const now=S().day||1;if(now<minDay)return false;const ch=chapter.choices.find(x=>x.id===choice);if(!ch||!spend(ch.cost))return false;apply(id,ch);d.choices.push({chapter:d.chapter,choice,day:S().day||1});d.chapter++;if(d.chapter>=a.chapters.length){d.status='completed';const final=choice;state().completed[id]={day:S().day||1,choices:d.choices,ending:final};state().consequences[id]={ending:final,loyalty:ch.loyalty||0,day:S().day||1};delete state().active[id];state().history.push({type:'completed',hero:id,ending:final,day:S().day||1,at:Date.now()});}save();render();return true}
 function get(id){return arc(id)?{id,arc:arc(id),hero:hero(id),active:state().active[id]||null,completed:state().completed[id]||null,consequence:state().consequences[id]||null}:null}
 function list(){return Object.keys(ARCS).map(get)}
 function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3HeroStoryArcPanel');if(!host)return;host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>🎬 Сюжетные арки героев</b>'+Object.entries(ARCS).map(([id,a])=>{const h=hero(id),d=state().active[id],done=state().completed[id];if(!h)return '';let body=done?'🏁 Арка завершена · финал: '+done.ending:d?(()=>{const ch=a.chapters[d.chapter];const ready=(S().day||1)>=(d.startedDay+d.chapter);return 'Глава '+(d.chapter+1)+'/'+a.chapters.length+(ready?'<br>'+ch.choices.map(c=>`<button style=\"margin:3px\" onclick=\"G.heroStoryChoose(\'${id}\',\'${c.id}\')\">'+c.label+'</button>`).join(''):'<br>⏳ Следующая глава откроется в день '+(d.startedDay+d.chapter))})():`<button onclick="G.heroStoryStart('${id}')">▶️ Начать арку</button>`;return `<div style="margin-top:8px;padding:8px;background:#111923;border-radius:8px"><b>${h.name||h.n} · ${a.title}</b><br><small>${a.chapters.length} главы · ${a.days} дней</small><br>${body}</div>`}).join('')+'</div>'}
 function save(){try{if(G.save)G.save(true)}catch(e){}}
 G.heroStoryArcs={ARCS,state,canStart,start,choose,get,list,render};G.heroStoryStart=start;G.heroStoryChoose=choose;G.renderHeroStoryArcs=render;render();
})(window.G||window);
