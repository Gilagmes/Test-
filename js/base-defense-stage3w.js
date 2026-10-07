/* LAST PORT — STAGE 3W: ADVANCED SQUAD TACTICS */
(function(){
 'use strict';
 if(typeof window==='undefined'||!window.G)return;
 const G=window.G;
 function S(){return G.S||(G.S={})}
 function state(){const s=S();s.advancedSquadTactics=s.advancedSquadTactics||{orders:{},focus:{},history:[],enabled:true};return s.advancedSquadTactics}
 function squad(id){return G.squadAI?.state?.().squads?.[String(id)]||null}
 function heroes(){return S().heroes||S().survivors||[]}
 function hero(id){return heroes().find(h=>String(h.id)===String(id))}
 function live(){const a=G.baseDefenseState?.()?.active;return a&&a.status==='active'?a:null}
 const ORDERS={focus:'focus',cover:'cover',flank:'flank',rescue:'rescue',hold:'hold',advance:'advance',retreat:'retreat'};
 function target(id){const a=live();if(!a)return null;const z=(a.zombies||[]).filter(x=>x.hp>0);return z.find(x=>String(x.id)===String(id))||null}
 function nearest(zs,ref){return zs.slice().sort((a,b)=>Math.hypot((a.x||0)-(ref?.x||0),(a.y||0)-(ref?.y||0))-Math.hypot((b.x||0)-(ref?.x||0),(b.y||0)-(ref?.y||0)))[0]||null}
 function setOrder(id,order,opts={}){if(!squad(id)||!ORDERS[order])return false;const st=state();st.orders[String(id)]={order,heroId:opts.heroId?String(opts.heroId):null,targetId:opts.targetId?String(opts.targetId):null,createdAt:Date.now(),expiresAt:opts.duration?Date.now()+Number(opts.duration):null};st.history.unshift({type:'order',squad:String(id),order,heroId:st.orders[String(id)].heroId,targetId:st.orders[String(id)].targetId,day:S().day||1});G.save?.();render();return true}
 function focus(id,targetId){return !!target(targetId)&&setOrder(id,'focus',{targetId})}
 function cover(id,heroId){return !!hero(heroId)&&setOrder(id,'cover',{heroId})}
 function flank(id,targetId){return !!target(targetId)&&setOrder(id,'flank',{targetId})}
 function rescue(id,heroId){return !!hero(heroId)&&setOrder(id,'rescue',{heroId})}
 function hold(id){return setOrder(id,'hold')}
 function advance(id,targetId){return target(targetId)?setOrder(id,'advance',{targetId}):setOrder(id,'advance')}
 function retreat(id){return setOrder(id,'retreat')}
 function clear(id){delete state().orders[String(id)];G.save?.();render();return true}
 function chooseTarget(id,order){const a=live();const q=squad(id);if(!a||!q)return null;const zs=(a.zombies||[]).filter(z=>z.hp>0);if(!zs.length)return null;const ps=G.squadAI?.positions?.(id)||[];const leader=hero(ps[0]?.hero);if(order?.targetId)return target(order.targetId)||nearest(zs,leader);if(order?.order==='focus'||order?.order==='flank'||order?.order==='advance')return zs.slice().sort((x,y)=>(y.hp||0)-(x.hp||0))[0];return nearest(zs,leader)}
 function hp(h){return Number(h?.hp??h?.health??100)}
 function plan(id){const q=squad(id);if(!q||state().enabled===false)return [];const o=state().orders[String(id)]||{order:'auto'};const ps=G.squadAI?.positions?.(id)||[];const a=live();const wounded=ps.map(p=>hero(p.hero)).filter(h=>h&&hp(h)<45).sort((x,y)=>hp(x)-hp(y))[0];let t=chooseTarget(id,o);return ps.map((p,i)=>{let action='hold',targetId=null,reason=o.order||'auto';if(o.order==='focus'){action='attack';targetId=t?.id||null}else if(o.order==='flank'){action=(p.slot==='mid'||p.slot==='front')?'flank':'cover';targetId=t?.id||null}else if(o.order==='cover'){action=p.hero===o.heroId?'protect':'hold'}else if(o.order==='rescue'){action=p.hero===o.heroId?'rescue':'cover';targetId=o.heroId||null}else if(o.order==='retreat'){action='retreat'}else if(o.order==='advance'){action='advance';targetId=t?.id||null}else if(o.order==='hold'){action='hold'}else {action=p.slot==='back'?'cover':p.slot==='mid'?'flank':'attack';targetId=t?.id||null}
 if(wounded&&p.slot==='back'&&o.order!=='retreat') action='cover';
 return {squad:String(id),hero:p.hero,slot:p.slot,action,target:targetId,reason,priority:i===0?'commander':'support'}
 })}
 function switchFormation(id,name){if(!G.squadAI?.setFormation)return false;const ok=G.squadAI.setFormation(id,name);if(ok)state().history.unshift({type:'formation_switch',squad:String(id),name,day:S().day||1});return ok}
 function tick(){if(state().enabled===false)return [];const out=[];for(const id of Object.keys(G.squadAI?.state?.().squads||{})){if(G.squadAI.state().active[id]===false)continue;const o=state().orders[id];if(o?.expiresAt&&o.expiresAt<=Date.now()){delete state().orders[id];continue}out.push(...plan(id))}state().history=state().history.slice(0,200);return out}
 function enable(v=true){state().enabled=!!v;G.save?.();return state().enabled}
 function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3AdvancedTacticsPanel');if(!host)return;const entries=Object.values(state().orders);host.innerHTML='<div style="padding:10px;background:#101923;border:1px solid #475569;border-radius:12px;margin-top:6px"><b>⚔️ ADVANCED SQUAD TACTICS</b>'+(entries.length?entries.map(o=>'<div style="margin-top:7px;padding:7px;background:#17212b;border-radius:8px">Отряд: <b>'+o.order+'</b>'+(o.targetId?' · цель '+o.targetId:'')+(o.heroId?' · герой '+o.heroId:'')+'</div>').join(''):'<div style="margin-top:7px;opacity:.7">Нет активных приказов</div>')+'</div>'}
 G.advancedSquadTactics={ORDERS,state,setOrder,focus,cover,flank,rescue,hold,advance,retreat,clear,plan,switchFormation,tick,enable,render};G.tickAdvancedSquadTactics=tick;render();console.log('[TLP] Stage 3W advanced squad tactics loaded.');
})();
