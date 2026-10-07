/* LAST PORT — STAGE 3E: HERO COMBAT SYSTEM */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G)return;
  const G=window.G;
  const CLASSES={
    assault:{name:'Штурмовик',icon:'⚔️',damage:1.25,accuracy:1.02,range:0.50,skill:'burst'},
    medic:{name:'Медик',icon:'❤️',damage:.82,accuracy:1.05,range:.46,skill:'heal'},
    scout:{name:'Разведчик',icon:'🔭',damage:1.05,accuracy:1.18,range:.62,skill:'mark'},
    guardian:{name:'Страж',icon:'🛡️',damage:.92,accuracy:.98,range:.40,skill:'guard'},
    engineer:{name:'Инженер',icon:'🔧',damage:1.00,accuracy:1.08,range:.52,skill:'overclock'}
  };
  const SKILLS={
    burst:{name:'Шквальный огонь',icon:'💥',cost:25,cd:14,desc:'Наносит 260 урона выбранной цели.'},
    heal:{name:'Боевой медик',icon:'❤️',cost:22,cd:12,desc:'Лечит внутреннюю линию на 260 HP.'},
    mark:{name:'Метка разведчика',icon:'🎯',cost:18,cd:10,desc:'Помечает цель: +35% урона по ней на 8 секунд.'},
    guard:{name:'Стальная линия',icon:'🛡️',cost:24,cd:16,desc:'Снижает урон по внутренней линии на 35% на 8 секунд.'},
    overclock:{name:'Перегрузка',icon:'⚡',cost:26,cd:15,desc:'Ускоряет огонь бойцов на 45% на 7 секунд.'}
  };
  function D(){return G.baseDefenseState?.()||null} function A(){return D()?.active||null}
  function heroes(){return (G.S?.heroes||[]).concat(G.S?.survivors||[])}
  function profile(h){
    const raw=String(h?.combatClass||h?.class||h?.cls||h?.role||h?.specialty||'').toLowerCase();
    let key=raw.includes('мед')||raw.includes('med')? 'medic':raw.includes('развед')||raw.includes('scout')?'scout':raw.includes('мех')||raw.includes('инж')||raw.includes('eng')?'engineer':raw.includes('защит')||raw.includes('страж')||raw.includes('guard')?'guardian':'assault';
    const c=CLASSES[key]; return {id:String(h?.id),class:key,name:c.name,icon:c.icon,skill:c.skill,damage:c.damage,accuracy:c.accuracy,range:c.range,level:Number(h?.lv||h?.level||1)};
  }
  function ensure(a){a.heroCombat=a.heroCombat||{selected:null,cooldowns:{},buffs:{},history:[],comboCount:0};a.heroCombat.cooldowns=a.heroCombat.cooldowns||{};a.heroCombat.buffs=a.heroCombat.buffs||{};a.heroCombat.history=a.heroCombat.history||[];return a.heroCombat}
  function energy(){G.S=G.S||{};G.S.commandEnergy=Number(G.S.commandEnergy??100);return G.S.commandEnergy}
  function spend(n){if(energy()<n)return false;G.S.commandEnergy-=n;return true}
  function getPlaced(){const d=D(),ids=Object.values(d?.placements||{}).filter(Boolean).map(String);return heroes().filter(h=>ids.includes(String(h.id)))}
  function selected(){const a=A(),hc=a&&ensure(a);if(!hc)return null;return getPlaced().find(h=>String(h.id)===String(hc.selected))||getPlaced()[0]||null}
  function selectHero(id){const a=A();if(!a||a.status!=='active')return false;const h=getPlaced().find(x=>String(x.id)===String(id));if(!h)return false;ensure(a).selected=String(id);G.renderHeroCombat?.();G.renderDefenseBattleHUD?.();return true}
  function target(a){const live=(a?.zombies||[]).filter(z=>z.hp>0);if(!live.length)return null;const id=a.manualTarget;return live.find(z=>String(z.id)===String(id))||live.sort((x,y)=>y.x-x.x)[0]}
  function useSkill(){const a=A(),h=selected();if(!a||a.status!=='active'||!h)return false;const p=profile(h),s=SKILLS[p.skill],hc=ensure(a),cd=Number(hc.cooldowns[h.id]||0);if(cd>0||energy()<s.cost)return false;const d=D(),t=target(a);let ok=false;
    if(p.skill==='burst'&&t){const dmg=260*(1+Math.max(0,p.level-1)*.06);t.hp=Math.max(0,t.hp-dmg);a.abilityDamage=(a.abilityDamage||0)+dmg;if(t.hp<=0){a.kills++;d.totalKills++}ok=true}
    if(p.skill==='heal'){const l=d.lines?.inner;if(l){const max=1800*(1+((G.S?.bld?.wall||1)-1)*.12);l.hp=Math.min(max,l.hp+260);ok=true}}
    if(p.skill==='mark'&&t){hc.buffs.mark={id:String(t.id),time:8};ok=true}
    if(p.skill==='guard'){hc.buffs.guard=8;ok=true}
    if(p.skill==='overclock'){hc.buffs.overclock=7;ok=true}
    if(!ok||!spend(s.cost))return false;hc.cooldowns[h.id]=s.cd;hc.history.unshift({hero:h.id,skill:p.skill,at:Date.now()});hc.history=hc.history.slice(0,20);G.save?.();G.renderHeroCombat?.();return true;
  }
  function combo(){const a=A();if(!a||a.status!=='active')return false;const ps=getPlaced().map(profile);if(ps.length<2||new Set(ps.map(p=>p.class)).size<2)return false;const hc=ensure(a);if((hc.cooldowns.combo||0)>0||energy()<35)return false;const t=target(a);if(!t)return false;const dmg=320;t.hp=Math.max(0,t.hp-dmg);a.abilityDamage=(a.abilityDamage||0)+dmg;if(t.hp<=0){a.kills++;D().totalKills++}hc.cooldowns.combo=20;hc.comboCount++;if(!spend(35))return false;hc.history.unshift({hero:'combo',skill:'synergy',at:Date.now()});G.save?.();G.renderHeroCombat?.();return true}
  function tick(dt){const a=A();if(!a)return;const hc=ensure(a);Object.keys(hc.cooldowns).forEach(k=>hc.cooldowns[k]=Math.max(0,(hc.cooldowns[k]||0)-dt));Object.keys(hc.buffs).forEach(k=>{if(typeof hc.buffs[k]==='number')hc.buffs[k]=Math.max(0,hc.buffs[k]-dt);});if(hc.buffs.mark?.time>0)hc.buffs.mark.time=Math.max(0,hc.buffs.mark.time-dt);}
  function patch(){if(G.__stage3ETick)return;const old=G.tickRealtimeDefense;if(typeof old!=='function')return;G.tickRealtimeDefense=function(dt){tick(Number(dt)||0);return old.apply(this,arguments)};G.__stage3ETick=true}
  function render(){const el=document.getElementById('stage3HeroCombatPanel');if(!el)return;const a=A();if(!a||a.status!=='active'){el.innerHTML='';return}const hc=ensure(a),ps=getPlaced(),sel=selected();let h='<div style="padding:8px;background:#111923;border:1px solid #334155;border-radius:9px;margin-top:6px"><div style="display:flex;justify-content:space-between"><b>🦸 ГЕРОИ БОЯ</b><span>⚡ '+Math.floor(energy())+'</span></div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">';ps.forEach(x=>{const p=profile(x),on=sel&&String(sel.id)===String(x.id);h+='<button class="bs" onclick="G.selectCombatHero(\''+String(x.id).replace(/'/g,'')+'\')" style="border:1px solid '+(on?'#f59e0b':'#334155')+'">'+p.icon+' '+(x.name||x.n)+'<br><small>'+p.name+'</small></button>'});h+='</div>';if(sel){const p=profile(sel),s=SKILLS[p.skill],cd=hc.cooldowns[sel.id]||0;h+='<div style="font-size:10px;color:#94a3b8;margin-top:5px">'+p.icon+' '+p.name+' · уровень '+p.level+' · '+s.desc+'</div><div style="display:flex;gap:4px;margin-top:5px"><button class="bgn" onclick="G.useHeroCombatSkill()" '+(cd>0||energy()<s.cost?'disabled':'')+'>'+s.icon+' '+s.name+' · '+(cd>0?Math.ceil(cd)+'с':s.cost+'⚡')+'</button><button class="bgn" onclick="G.useHeroCombatCombo()" '+(hc.cooldowns.combo>0||energy()<35||ps.length<2?'disabled':'')+'>🤝 Синергия · '+(hc.cooldowns.combo>0?Math.ceil(hc.cooldowns.combo)+'с':'35⚡')+'</button></div>'}h+='<div style="font-size:9px;color:#64748b;margin-top:5px">У каждого класса свой боевой профиль и навык. Синергия доступна при двух разных классах.</div></div>';el.innerHTML=h}
  G.getHeroCombatProfile=profile;G.getHeroCombatProfiles=()=>heroes().map(profile);G.selectCombatHero=selectHero;G.useHeroCombatSkill=useSkill;G.useHeroCombatCombo=combo;G.renderHeroCombat=render;G.getHeroCombatState=()=>A()?ensure(A()):null;G.heroCombatTick=tick;patch();
  if(G.renderRealtimeDefense&&!G.__stage3ERenderWrapped){const old=G.renderRealtimeDefense;G.renderRealtimeDefense=function(){const r=old.apply(this,arguments);render();return r};G.__stage3ERenderWrapped=true}
  if(!G.__stage3ERenderLoop){G.__stage3ERenderLoop=true;setInterval(()=>{render()},500)}
  console.log('[TLP] Stage 3E hero combat loaded.');
})();
