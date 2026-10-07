(function(G){'use strict';
 const R=()=>{const s=G.S||(G.S={});s.res=s.res||{wood:0,metal:0,stone:0,food:0,water:0,fuel:0};return s.res}, S=()=>G.S||(G.S={});
 const RECIPES={
  tools:{name:'Инструменты',building:'workshop',in:{metal:2,wood:2},out:{tools:1},time:2},
  parts:{name:'Детали',building:'workshop',in:{metal:3},out:{parts:2},time:2},
  medicine:{name:'Лекарства',building:'hospital',in:{water:2,food:1,parts:1},out:{medicine:2},time:2},
  ammo:{name:'Боеприпасы',building:'workshop',in:{metal:2,parts:1},out:{ammo:4},time:2},
  weapon:{name:'Оружие',building:'workshop',in:{metal:4,parts:2},out:{weapon:1},time:4},
  armor:{name:'Броня',building:'workshop',in:{metal:5,parts:3},out:{armor:1},time:5}
 };
 function state(){const s=S();s.productionChains=s.productionChains||{queue:[],history:[],active:null,nextId:1};return s.productionChains}
 function canPay(c){const r=R();return Object.entries(c).every(([k,v])=>(Number(r[k])||0)>=v)}
 function take(c){const r=R();if(!canPay(c))return false;Object.entries(c).forEach(([k,v])=>r[k]-=v);return true}
 function add(c){const r=R();Object.entries(c).forEach(([k,v])=>r[k]=(Number(r[k])||0)+v)}
 function buildingOk(type){const b=S().buildings||[];if(!b.length)return true;return b.some(x=>x&&((x.type||x.kind||x.id)===type||(x.type||'').toLowerCase()===type))}
 function start(recipeId,qty=1,heroId=null){const rec=RECIPES[recipeId],q=state();qty=Math.max(1,Math.floor(qty));if(!rec)return false;if(!buildingOk(rec.building))return false;for(let i=0;i<qty;i++){if(!canPay(rec.in))return false;take(rec.in);q.queue.push({id:q.nextId++,recipe:recipeId,heroId,remaining:rec.time});}return true}
 function tick(hours=1){const q=state();let done=0;hours=Math.max(1,Number(hours)||1);for(let h=0;h<hours;h++){if(!q.active&&q.queue.length)q.active=q.queue.shift();if(!q.active)continue;const item=q.active,rec=RECIPES[item.recipe];item.remaining-=1;if(item.remaining<=0){add(rec.out);q.history.push({type:'completed',recipe:item.recipe,heroId:item.heroId,day:S().day||1});done++;q.active=null}}try{G.save&&G.save(true)}catch(e){}render();return done}
 function get(){return JSON.parse(JSON.stringify(state()))}
 function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3ProductionPanel');if(!host)return;const q=state();host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>🏭 Производственные цепочки</b><br><small>'+ (q.active?('В работе: '+RECIPES[q.active.recipe].name+' · '+q.active.remaining+'ч'):'Простой')+' · Очередь: '+q.queue.length+'</small></div>'}
 G.productionChains={RECIPES,state,start,tick,get,render};G.productionStart=start;G.productionTick=tick;render();
})(window.G||window);
