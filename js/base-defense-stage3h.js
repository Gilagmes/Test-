(function(G){
 'use strict';
 const REQS={
  'hero-lena':{day:3,food:40,trust:1,trait:'медицинская помощь'},
  'hero-viktor':{day:5,metal:60,trust:0,trait:'оборона'},
  'hero-sofia':{day:4,wood:50,trust:1,trait:'разведка'},
  'hero-roman':{day:7,metal:90,trust:2,trait:'боевой опыт'},
  'hero-irina':{day:6,wood:70,metal:30,trust:1,trait:'ремонт'}
 };
 function S(){return G.S||(G.S={});}
 function st(){const s=S();s.heroRecruitment=s.heroRecruitment||{encounters:{},story:{},history:[]};return s.heroRecruitment}
 function coll(){return S().heroCollection||(S().heroCollection={fragments:{},unlocked:{},recruited:{},history:[]})}
 function find(id){const c=G.heroCollection&&G.heroCollection.CATALOG;return c&&c.find(x=>x.id===id)}
 function resourcesOk(r){const s=S();s.res=s.res||{};return Object.keys(r).every(k=>(s.res[k]||0)>=r[k])}
 function spend(r){const s=S();Object.entries(r).forEach(([k,v])=>{s.res[k]=(s.res[k]||0)-v})}
 function compatibility(id){const s=S(), h=find(id);if(!h)return {ok:false,score:0,reasons:['герой не найден']};let score=50,reasons=[];const active=s.heroes||[];if(active.length<3){score+=10;reasons.push('в коммуне есть место для нового героя')}if((s.trust||0)>=1){score+=10;reasons.push('коммуна имеет доверие')}if(active.some(x=>x.role===h.role)){score-=8;reasons.push('роль уже представлена')}if(active.length>=12){score-=30;reasons.push('коммуна переполнена')}return {ok:score>=50,score,reasons}}
 function canStart(id){const q=REQS[id],s=S();if(!q||!find(id))return {ok:false,reason:'герой не найден'};if((s.day||1)<q.day)return {ok:false,reason:`нужен день ${q.day}`};const costs=Object.fromEntries(Object.entries(q).filter(([k])=>['food','metal','wood'].includes(k)));if(!resourcesOk(costs))return {ok:false,reason:'не хватает ресурсов'};const c=compatibility(id);if(!c.ok)return {ok:false,reason:'низкая совместимость: '+c.reasons.join(', ')};return {ok:true,compatibility:c}}
 function start(id){const s=S(),q=REQS[id],c=coll();if(c.recruited[id])return false;const chk=canStart(id);if(!chk.ok)return false;s.res=s.res||{};spend(Object.fromEntries(Object.entries(q).filter(([k])=>['food','metal','wood'].includes(k))));st().encounters[id]={id,startedDay:s.day||1,progress:0,stage:1,status:'active'};st().history.push({type:'search_started',hero:id,day:s.day||1});save();return true}
 function advance(id,choice='help'){const s=S(),d=st().encounters[id],c=coll();if(!d||d.status!=='active'||c.recruited[id])return false;const h=find(id);if(!h)return false;d.progress+=choice==='help'?2:1;d.stage+=1;if(d.progress>=4){c.fragments[id]=(c.fragments[id]||0)+h.fragments;c.unlocked[id]=true;d.status='found';st().history.push({type:'found',hero:id,day:s.day||1,choice});save();return true}save();return true}
 function recruit(id){const s=S(),c=coll(),d=st().encounters[id];if(c.recruited[id]||!c.unlocked[id]||!d||d.status!=='found')return false;const h=find(id);if(!h)return false;const active=s.heroes||[];if(active.length>=12)return false;const hero={id:'hero-'+id,n:h.name,name:h.name,role:h.role,hp:100,level:1,loyalty:70,living:{mood:78,fatigue:0,health:100,maxHealth:100,loyalty:70,status:'active',xp:0},heroCatalogId:id,rarity:h.rarity,recruitedVia:'story'};s.heroes=active.concat(hero);c.recruited[id]=true;st().history.push({type:'recruited',hero:id,day:s.day||1});save();return true}
 function get(id){const d=st().encounters[id],q=REQS[id],h=find(id),c=compatibility(id);return h?{id,hero:h,requirement:q,encounter:d||null,compatibility:c,recruited:!!coll().recruited[id]}:null}
 function render(){const host=document.getElementById('stage3HeroRecruitmentPanel');if(!host)return;const s=S(),c=coll();host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>🧭 Личные истории героев</b><div style="margin-top:8px">'+((G.heroCollection&&G.heroCollection.CATALOG)||[]).map(h=>{const d=st().encounters[h.id],r=REQS[h.id],done=!!c.recruited[h.id];let action=done?'✅ В коммуне':d&&d.status==='found'?`<button onclick="G.heroRecruitStoryRecruit('${h.id}')">🏠 Рекрутировать</button>`:d&&d.status==='active'?`<button onclick="G.heroRecruitStoryAdvance('${h.id}')">➡️ Продолжить</button>`:`<button onclick="G.heroRecruitStoryStart('${h.id}')">🔎 Начать поиск</button>`;return `<div style="margin-top:7px;padding:8px;background:#111923;border-radius:8px"><b>${h.name}</b> · ${h.role} · день ${r.day}<br><small>${h.desc}</small><br>${action}</div>`}).join('')+'</div>'}
 function save(){try{if(G.save)G.save(true)}catch(e){}}
 G.heroRecruitmentStory={REQS,state:st,start,advance,recruit,canStart,get,compatibility,render};G.heroRecruitStoryStart=start;G.heroRecruitStoryAdvance=advance;G.heroRecruitStoryRecruit=recruit;G.renderHeroRecruitmentStory=render;render();
})(window.G||window);
