/* LAST PORT — STAGE 3C: HERO CONTROL & ACTIVE ABILITIES */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G)return;
  const G=window.G;
  const ABILITIES={
    heal:{name:'Полевой медик',icon:'❤️',cost:20,cooldown:12,desc:'Восстанавливает 180 HP внутренней линии.',apply(a,d){const l=d?.lines?.inner;if(!l)return false;const max=1800*(1+((G.S?.bld?.wall||1)-1)*.12);l.hp=Math.min(max,l.hp+180);return true;}},
    grenade:{name:'Осколочная граната',icon:'💣',cost:25,cooldown:10,desc:'Наносит 180 урона ближайшему скоплению.',apply(a,d,t){if(!t)return false;let hit=0;(a.zombies||[]).filter(z=>z.hp>0).sort((x,y)=>x.x-y.x).slice(0,3).forEach(z=>{const dmg=180*(1-(z.armor||0));z.hp=Math.max(0,z.hp-dmg);if(z.hp<=0){a.kills++;d.totalKills++;}hit+=dmg;});a.damage=(a.damage||0);a.abilityDamage=(a.abilityDamage||0)+hit;return true;}},
    rally:{name:'Боевой приказ',icon:'⚔️',cost:30,cooldown:16,desc:'Усиливает урон бойцов на 40% на 8 секунд.',apply(a){a.buffs=a.buffs||{};a.buffs.rally=8;return true;}},
    stun:{name:'Шоковая ловушка',icon:'⚡',cost:18,cooldown:14,desc:'Останавливает до 3 ближайших зомби на 4 секунды.',apply(a){let n=0;(a.zombies||[]).filter(z=>z.hp>0).sort((x,y)=>x.x-y.x).forEach(z=>{if(n<3){z.stunned=Math.max(z.stunned||0,4);n++;}});return n>0;}}
  };
  function D(){return G.baseDefenseState?G.baseDefenseState():null;}
  function active(){return D()?.active||null;}
  function ensure(a){a.manualTarget=a.manualTarget||null;a.cooldowns=a.cooldowns||{};a.buffs=a.buffs||{};a.abilityDamage=Number(a.abilityDamage||0);return a;}
  function energy(){G.S=G.S||{};G.S.commandEnergy=Number(G.S.commandEnergy??100);return G.S.commandEnergy;}
  function useEnergy(n){if(energy()<n)return false;G.S.commandEnergy-=n;return true;}
  function targets(a){return (a?.zombies||[]).filter(z=>z.hp>0)}
  function selectTarget(id){const a=active();if(!a||a.status!=='active')return false;const z=targets(a).find(x=>String(x.id)===String(id));if(!z)return false;ensure(a).manualTarget=String(id);return true;}
  function clearTarget(){const a=active();if(!a)return false;a.manualTarget=null;return true;}
  function useAbility(name){const a=active(),cfg=ABILITIES[name];if(!a||a.status!=='active'||!cfg)return false;ensure(a);const cd=Number(a.cooldowns[name]||0);if(cd>0||energy()<cfg.cost)return false;const t=a.manualTarget?targets(a).find(z=>String(z.id)===String(a.manualTarget)):targets(a).sort((x,y)=>x.x-y.x)[0];if(!cfg.apply(a,D(),t))return false;if(!useEnergy(cfg.cost))return false;a.cooldowns[name]=cfg.cooldown;G.save?.();G.updAll?.();G.renderRealtimeDefense?.();return true;}
  function tickAbilities(dt){const a=active();if(!a)return;ensure(a);Object.keys(ABILITIES).forEach(k=>{a.cooldowns[k]=Math.max(0,(a.cooldowns[k]||0)-dt)});a.buffs.rally=Math.max(0,(a.buffs.rally||0)-dt);}
  function patchTick(){if(G.__stage3CTick)return;const old=G.tickRealtimeDefense;if(typeof old!=='function')return;G.tickRealtimeDefense=function(dt){tickAbilities(Number(dt)||0);return old.apply(this,arguments)};G.__stage3CTick=true;}
  function render(){const el=document.getElementById('stage3CommandPanel');if(!el)return;const a=active();if(!a||a.status!=='active'){el.innerHTML='';return;}ensure(a);const zs=targets(a);const target=a.manualTarget?zs.find(z=>String(z.id)===String(a.manualTarget)):null;let h='<div style="padding:8px;background:#101923;border:1px solid #334155;border-radius:8px;margin-top:6px"><div style="display:flex;justify-content:space-between"><b>🎖️ Командование</b><span>⚡ '+Math.floor(energy())+'/100</span></div>';
    h+='<div style="font-size:10px;color:#94a3b8;margin:4px 0">'+(target?'🎯 Цель: '+target.type+' · HP '+Math.round(target.hp):'🎯 Автоцель: ближайший враг')+'</div><div style="display:flex;gap:4px;flex-wrap:wrap">';
    zs.slice().sort((x,y)=>x.x-y.x).slice(0,6).forEach(z=>{h+='<button class="bs" onclick="G.selectDefenseTarget(\''+String(z.id).replace(/'/g,'')+'\')" style="font-size:10px">'+(z.type==='runner'?'🏃':z.type==='brute'?'💀':z.type==='armored'?'🪖':'🧟')+' '+Math.max(0,Math.round(z.hp))+'</button>'});
    h+='</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">';Object.entries(ABILITIES).forEach(([k,c])=>{const cd=a.cooldowns[k]||0;h+='<button class="bgn" onclick="G.useDefenseAbility(\''+k+'\')" '+(cd>0||energy()<c.cost?'disabled':'')+' style="font-size:10px">'+c.icon+' '+c.name+' · '+(cd>0?Math.ceil(cd)+'с':c.cost+'⚡')+'</button>'});
    h+='</div>'+(a.buffs.rally>0?'<div style="font-size:10px;color:#fbbf24;margin-top:5px">⚔️ Боевой приказ: '+Math.ceil(a.buffs.rally)+'с</div>':'')+'</div>';el.innerHTML=h;}
  G.selectDefenseTarget=selectTarget;G.clearDefenseTarget=clearTarget;G.useDefenseAbility=useAbility;G.tickDefenseAbilities=tickAbilities;G.getDefenseAbilities=()=>({abilities:ABILITIES,energy:energy(),active:active()});G.renderDefenseCommand=render;patchTick();
  if(G.__defRTLoop&&!G.__stage3CRenderLoop){G.__stage3CRenderLoop=true;const oldRender=G.renderRealtimeDefense;G.renderRealtimeDefense=function(){oldRender?.();render()};}
  console.log('[TLP] Stage 3C hero control loaded.');
})();
