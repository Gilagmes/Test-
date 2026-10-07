/* LAST PORT — STAGE 3T: HERO LOADOUTS & COMBAT BUILDS */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G)return;
  const G=window.G;
  const SLOT_ORDER=['weapon','armor','utility','tool'];
  const PRESETS={
    assault:{name:'Штурм',icon:'⚔️',mods:{damage:1.25,armor:.95,healing:.9,engineering:.9}},
    defense:{name:'Оборона',icon:'🛡️',mods:{damage:1.05,armor:1.25,healing:1.0,engineering:.95}},
    expedition:{name:'Экспедиция',icon:'🧭',mods:{damage:1.05,armor:1.05,healing:1.1,engineering:1.15}},
    medical:{name:'Медик',icon:'🩺',mods:{damage:.9,armor:1.0,healing:1.35,engineering:1.0}},
    engineering:{name:'Инженер',icon:'🔧',mods:{damage:.9,armor:1.0,healing:1.0,engineering:1.35}}
  };
  const ROLE_DEFAULT={Штурмовик:'assault',Страж:'defense',Разведчик:'expedition',Медик:'medical',Инженер:'engineering',assault:'assault',guard:'defense',scout:'expedition',medic:'medical',engineer:'engineering'};
  function S(){return G.S||(G.S={})}
  function heroes(){return S().heroes||S().survivors||[]}
  function hero(id){return heroes().find(h=>String(h.id)===String(id))}
  function eq(){const s=S();s.equipment=s.equipment||{inventory:[],equipped:{},history:[]};return s.equipment}
  function state(){const s=S();s.loadouts=s.loadouts||{presets:{},active:{},history:[]};return s.loadouts}
  function rolePreset(h){return ROLE_DEFAULT[h?.role]||ROLE_DEFAULT[h?.class]||'assault'}
  function ensure(id){const h=hero(id);if(!h)return null;const q=state();q.presets[id]=q.presets[id]||{};q.active[id]=q.active[id]||rolePreset(h);S().equipment=S().equipment||{inventory:[],equipped:{},history:[]};return {hero:h,loadouts:q,equipment:eq()}}
  function item(id){return eq().inventory.find(x=>x.id===id)}
  function setPreset(id,preset){if(!PRESETS[preset]||!hero(id))return false;const x=ensure(id);x.loadouts.active[id]=preset;x.loadouts.history.push({type:'preset',hero:id,preset,day:S().day||1});G.save?.();render();return true}
  function savePreset(id,name){const x=ensure(id);if(!name)return false;const e=x.equipment.equipped[id]||{};x.loadouts.presets[id][String(name)]={name:String(name),slots:{...e},preset:x.loadouts.active[id]||rolePreset(x.hero),day:S().day||1};x.loadouts.history.push({type:'saved',hero:id,name:String(name),day:S().day||1});G.save?.();render();return true}
  function applyPreset(id,name){const x=ensure(id),p=x.loadouts.presets[id]?.[String(name)];if(!p)return false;const equipped=x.equipment.equipped[id]||(x.equipment.equipped[id]={});for(const slot of SLOT_ORDER){if(p.slots[slot]&&item(p.slots[slot]))equipped[slot]=p.slots[slot];else if(slot in p.slots)delete equipped[slot]}x.loadouts.active[id]=p.preset||x.loadouts.active[id];x.loadouts.history.push({type:'applied',hero:id,name:String(name),day:S().day||1});G.save?.();render();return true}
  function equipSlot(id,slot,itemId){if(!SLOT_ORDER.includes(slot)||!hero(id)||!item(itemId))return false;const x=ensure(id);const it=item(itemId);if(it.slot!==slot)return false;x.equipment.equipped[id]=x.equipment.equipped[id]||{};x.equipment.equipped[id][slot]=itemId;x.loadouts.history.push({type:'slot',hero:id,slot,item:itemId,day:S().day||1});G.save?.();render();return true}
  function unequip(id,slot){if(!SLOT_ORDER.includes(slot))return false;const x=ensure(id),e=x.equipment.equipped[id];if(!e||!e[slot])return false;delete e[slot];x.loadouts.history.push({type:'unequip',hero:id,slot,day:S().day||1});G.save?.();render();return true}
  function profile(id){const x=ensure(id);if(!x)return null;const e=x.equipment.equipped[id]||{},base=(G.equipment?.stats?G.equipment.stats(id):{damage:0,armor:0,healing:0,engineering:0});const p=PRESETS[x.loadouts.active[id]||rolePreset(x.hero)]||PRESETS.assault;const stats={};for(const k of ['damage','armor','healing','engineering'])stats[k]=Math.round((Number(base[k])||0)*p.mods[k]);const synergy=Object.values(e).filter(Boolean).length;stats.synergy=synergy>=4?10:synergy>=3?6:synergy>=2?3:0;if(stats.synergy)stats.damage+=Math.round(stats.damage*stats.synergy/100);return {id:String(id),name:x.hero.n||x.hero.name||id,preset:x.loadouts.active[id],presetName:p.name,slots:{...e},stats,synergy};}
  function all(id){const x=ensure(id);return Object.values(x.loadouts.presets[id]||{}).map(v=>({...v,valid:SLOT_ORDER.every(s=>!v.slots[s]||!!item(v.slots[s]))}));}
  function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3LoadoutPanel');if(!host)return;const hs=heroes();host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px;margin-top:6px"><b>⚔️ БОЕВЫЕ СБОРКИ</b>'+hs.map(h=>{const p=profile(h.id);return '<div style="margin-top:7px;padding:8px;background:#111923;border-radius:8px"><b>'+p.name+'</b> · '+p.presetName+' · синергия '+p.synergy+'%<br><small>⚔️ '+p.stats.damage+' · 🛡️ '+p.stats.armor+' · 🩺 '+p.stats.healing+' · 🔧 '+p.stats.engineering+'</small></div>'}).join('')+'</div>'}
  G.heroLoadouts={PRESETS,SLOT_ORDER,state,ensure,setPreset,savePreset,applyPreset,equipSlot,unequip,profile,all,render};
  G.setHeroLoadout=setPreset;G.saveHeroLoadout=savePreset;G.applyHeroLoadout=applyPreset;G.getHeroLoadout=profile;
  if(G.equipment?.render){const old=G.equipment.render;G.equipment.render=function(){old.apply(this,arguments);render()}}
  render();console.log('[TLP] Stage 3T hero loadouts loaded.');
})();
