/* LAST PORT — STAGE 3G: HERO COLLECTION & RECRUITMENT */
(function(){
'use strict';
if(typeof window==='undefined'||!window.G)return;
const G=window.G;
const CATALOG=[
{id:'hero-lena',name:'Лена',role:'Медик',rarity:'rare',fragments:20,desc:'Полевой врач. Лечит союзников и ускоряет восстановление.'},
{id:'hero-viktor',name:'Виктор',role:'Страж',rarity:'epic',fragments:40,desc:'Бывший охранник. Отлично держит переднюю линию.'},
{id:'hero-sofia',name:'София',role:'Разведчик',rarity:'rare',fragments:25,desc:'Разведчица. Высокая точность и скорость огня.'},
{id:'hero-roman',name:'Роман',role:'Штурмовик',rarity:'epic',fragments:50,desc:'Штурмовик. Высокий урон по плотным волнам.'},
{id:'hero-irina',name:'Ирина',role:'Инженер',rarity:'legendary',fragments:80,desc:'Инженер. Усиливает оборонительные сооружения.'}
];
const RARITY={common:{name:'Обычный',need:10},rare:{name:'Редкий',need:20},epic:{name:'Эпический',need:40},legendary:{name:'Легендарный',need:80}};
function state(){G.S.heroCollection=G.S.heroCollection||{fragments:{},unlocked:{},recruited:{},history:[]};return G.S.heroCollection}
function find(id){return CATALOG.find(x=>x.id===id)}
function ensureCatalog(){
 const s=state();
 CATALOG.forEach(h=>{if(s.fragments[h.id]==null)s.fragments[h.id]=0});
 return s;
}
function addFragments(id,n,source='reward'){
 const h=find(id),s=ensureCatalog();if(!h||n<=0)return false;
 s.fragments[id]=Math.min((s.fragments[id]||0)+Number(n),h.fragments);
 s.history.push({type:'fragments',hero:id,amount:Number(n),source,at:Date.now()});
 G.save?.();render();return true;
}
function unlock(id){
 const h=find(id),s=ensureCatalog();if(!h||s.unlocked[id])return false;
 if(Number(s.fragments[id]||0)<h.fragments)return false;
 s.fragments[id]=0;s.unlocked[id]=true;
 s.history.push({type:'unlock',hero:id,at:Date.now()});G.save?.();render();return true;
}
function recruit(id){
 const h=find(id),s=ensureCatalog();if(!h||!s.unlocked[id]||s.recruited[id])return false;
 const arr=G.S.heroes||(G.S.heroes=[]);
 if(arr.some(x=>String(x.id)===id)) {s.recruited[id]=true;return true;}
 const hero={id:id,n:h.name,name:h.name,role:h.role,health:100,loyalty:70,hero:true,level:1,lv:1,rarity:h.rarity,progress:{xp:0,level:1,skillPoints:0,tree:{damage:0,survival:0,tactics:0},rarity:h.rarity,gear:{},gearStats:{attack:0,hp:0,accuracy:0}}};
 arr.push(hero);s.recruited[id]=true;s.history.push({type:'recruit',hero:id,at:Date.now()});
 G.save?.();render();return true;
}
function get(id){const h=find(id),s=ensureCatalog();if(!h)return null;return { ...h,fragments:s.fragments[id]||0,unlocked:!!s.unlocked[id],recruited:!!s.recruited[id],required:h.fragments}}
function list(){ensureCatalog();return CATALOG.map(h=>get(h.id))}
function grantRandom(n=1,source='collection_reward'){
 const locked=CATALOG.filter(h=>!state().unlocked[h.id]);
 if(!locked.length)return [];
 const out=[];for(let i=0;i<n;i++){const h=locked[Math.floor(Math.random()*locked.length)];addFragments(h.id,Math.max(1,Math.ceil(h.fragments*.1)),source);out.push(h.id)}return out;
}
function render(){
 if(typeof document==='undefined')return; const el=document.getElementById('stage3HeroCollectionPanel');if(!el)return;
 const items=list();
 el.innerHTML='<div style="padding:8px;background:#0f1720;border:1px solid #334155;border-radius:9px;margin-top:6px"><b>🧩 КОЛЛЕКЦИЯ ГЕРОЕВ</b>'+
 items.map(h=>`<div style="margin-top:7px;padding:7px;background:#111923;border-radius:7px"><b>${h.name}</b> · ${h.role} · ${RARITY[h.rarity].name}<br><small>${h.desc}</small><br><small>🧩 ${h.fragments}/${h.required}</small> ${h.recruited?'· ✅ В отряде':h.unlocked?'· 🔓 Открыт':'· 🔒 Не открыт'}</div>`).join('')+'</div>';
}
G.heroCollection={CATALOG,RARITY,state,addFragments,unlock,recruit,get,list,grantRandom,render};
G.heroCollectionAddFragments=addFragments;G.heroCollectionUnlock=unlock;G.heroCollectionRecruit=recruit;G.getHeroCollection=get;G.getHeroCollectionList=list;G.renderHeroCollection=render;
ensureCatalog();render();
console.log('[TLP] Stage 3G hero collection loaded.');
})();
