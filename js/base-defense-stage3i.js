(function(G){
 'use strict';
 const PERSONALITY={
  'hero-lena':{trait:'Эмпат',likes:['медицина','помощь'],dislikes:['жестокость','бросить раненого'],bonus:'healing'},
  'hero-viktor':{trait:'Защитник',likes:['оборона','порядок'],dislikes:['риск без плана','отступление'],bonus:'guard'},
  'hero-sofia':{trait:'Одиночка',likes:['разведка','свобода'],dislikes:['контроль','лишние риски'],bonus:'scout'},
  'hero-roman':{trait:'Боец',likes:['атака','смелость'],dislikes:['слабость','трусость'],bonus:'assault'},
  'hero-irina':{trait:'Практик',likes:['ремонт','экономия'],dislikes:['расточительство','сломанная техника'],bonus:'engineer'}
 };
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function S(){return G.S||(G.S={});}
 function state(){const s=S();s.heroRelationships=s.heroRelationships||{pairs:{},events:[],history:[]};return s.heroRelationships}
 function heroes(){return S().heroes||[]}
 function hid(h){return String(h?.id||'')}
 function get(id){return heroes().find(h=>hid(h)===String(id))}
 function key(a,b){return [String(a),String(b)].sort().join('::')}
 function ensurePair(a,b){const st=state(),k=key(a,b);if(!st.pairs[k]) st.pairs[k]={a:String(a),b:String(b),affinity:0,tension:0,jealousy:0,history:[]};return st.pairs[k]}
 function personality(id){return PERSONALITY[id]||{trait:'Выживший',likes:[],dislikes:[],bonus:'none'}}
 function adjustLoyalty(h,delta,reason){if(!h)return false;h.living=h.living||{};h.living.loyalty=clamp((h.living.loyalty??h.loyalty??70)+delta,0,100);h.loyalty=h.living.loyalty;h.living.mood=clamp((h.living.mood??70)+Math.round(delta*.6),0,100);state().history.push({type:'loyalty',hero:h.id,delta,reason,day:S().day||1,at:Date.now()});return true}
 function interact(a,b,type){const A=get(a),B=get(b);if(!A||!B||a===b)return false;const p=ensurePair(a,b);let d=type==='praise'?8:type==='mission'?5:type==='talk'?3:type==='conflict'?-10:0;p.affinity=clamp(p.affinity+d,-100,100);p.tension=clamp(p.tension+(type==='conflict'?12:-3),0,100);p.history.push({type,delta:d,at:Date.now(),day:S().day||1});if(p.history.length>40)p.history.shift();adjustLoyalty(A,type==='conflict'?-4:2,type);adjustLoyalty(B,type==='conflict'?-4:2,type);return true}
 function conflict(a,b){const p=ensurePair(a,b),A=get(a),B=get(b);if(!A||!B)return false;p.tension=clamp(p.tension+20,0,100);p.affinity=clamp(p.affinity-12,-100,100);p.history.push({type:'conflict',at:Date.now(),day:S().day||1});adjustLoyalty(A,-5,'конфликт');adjustLoyalty(B,-5,'конфликт');state().events.push({type:'conflict',a,b,day:S().day||1,at:Date.now()});return true}
 function reconcile(a,b){const p=ensurePair(a,b),A=get(a),B=get(b);if(!A||!B)return false;p.tension=clamp(p.tension-25,0,100);p.affinity=clamp(p.affinity+15,-100,100);p.history.push({type:'reconcile',at:Date.now(),day:S().day||1});adjustLoyalty(A,5,'примирение');adjustLoyalty(B,5,'примирение');return true}
 function jealousy(favored,other,jealous){const p=ensurePair(favored,jealous);p.jealousy=clamp((p.jealousy||0)+15,0,100);const h=get(jealous);adjustLoyalty(h,-4,'ревность');state().events.push({type:'jealousy',hero:jealous,favored,other,day:S().day||1,at:Date.now()});return true}
 function daily(){heroes().forEach(h=>{const l=h.living||{};const id=hid(h),p=personality(id);if((l.loyalty??h.loyalty??70)<25){l.mood=clamp((l.mood??50)-2,0,100);l.status='unhappy';}else if((l.loyalty??70)>75){l.mood=clamp((l.mood??70)+1,0,100)}})}
 function status(id){const h=get(id),p=personality(id);if(!h)return null;const l=h.living||{};const low=(l.loyalty??h.loyalty??70)<25;return {id,name:h.name||h.n,trait:p.trait,likes:p.likes,dislikes:p.dislikes,loyalty:l.loyalty??h.loyalty??70,mood:l.mood??70,status:l.status||'active',risk:low?'leave_risk':'stable'}}
 function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3HeroRelationshipPanel');if(!host)return;const hs=heroes().filter(h=>PERSONALITY[hid(h)]);host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>❤️ Герои · характер и отношения</b>'+hs.map(h=>{const st=status(hid(h));const p=personality(hid(h));return `<div style="margin-top:8px;padding:8px;background:#111923;border-radius:8px"><b>${p.trait} · ${st.name}</b><br><small>❤️ Лояльность ${Math.round(st.loyalty)} · 😊 ${Math.round(st.mood)} · Любит: ${p.likes.join(', ')} · Не любит: ${p.dislikes.join(', ')}</small><br><button onclick="G.heroRelTalk('${h.id}')">💬 Поговорить</button></div>`}).join('')+'</div>'}
 function save(){try{if(G.save)G.save(true)}catch(e){}}
 G.heroRelationships={PERSONALITY,state,status,ensurePair,interact,conflict,reconcile,jealousy,daily,render};
 G.heroRelTalk=function(id){const h=get(id);if(!h)return false;adjustLoyalty(h,3,'личный разговор');render();save();return true};
 G.heroRelConflict=conflict;G.heroRelReconcile=reconcile;G.heroRelInteract=interact;G.heroRelJealousy=jealousy;
 render();
})(window.G||window);
