/* LAST PORT — STAGE 3D: REAL-TIME BATTLE HUD */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G)return;
  const G=window.G;
  const ICON={walker:'🧟',runner:'🏃',brute:'💀',screamer:'📢',armored:'🪖'};
  const LINES={front:'Передняя линия',gate:'Ворота',inner:'Внутренняя линия'};
  const A=(id)=>G.baseDefenseState?.()?.active||null;
  function active(){return G.baseDefenseState?.()?.active||null}
  function alive(a){return (a?.zombies||[]).filter(z=>z.hp>0)}
  function moveFighter(line,id){
    if(!LINES[line]||typeof G.placeDefenseFighter!=='function')return false;
    const ok=G.placeDefenseFighter(line,id);
    if(ok){G.renderDefenseBattleHUD?.();G.renderDefenseCommand?.();G.save?.();}
    return ok;
  }
  function removeFighter(line){const ok=G.unplaceDefenseFighter?.(line);G.renderDefenseBattleHUD?.();return !!ok}
  function pause(){const a=active();if(!a||a.status!=='active')return false;a.status='paused';G.save?.();G.renderDefenseBattleHUD?.();return true}
  function resume(){const a=active();if(!a||a.status!=='paused')return false;a.status='active';G.__defRT=G.__defRT||{};G.__defRT.last=performance?.now?.()||Date.now();G.renderDefenseBattleHUD?.();return true}
  function resetTarget(){G.clearDefenseTarget?.();G.renderDefenseBattleHUD?.();return true}
  function target(id){const ok=G.selectDefenseTarget?.(id);G.renderDefenseBattleHUD?.();return !!ok}
  function bar(hp,max){const p=Math.max(0,Math.min(100,(hp/max)*100));return '<div style="height:5px;background:#263241;border-radius:4px;overflow:hidden;margin-top:3px"><div style="height:100%;width:'+p.toFixed(0)+'%;background:#ef4444"></div></div>'}
  function render(){
    const el=document.getElementById('stage3BattleHUD');if(!el)return;
    const a=active();if(!a){el.innerHTML='';return;}
    const d=G.baseDefenseState?.();const zs=alive(a).slice().sort((x,y)=>y.x-x.x);const selected=a.manualTarget?zs.find(z=>String(z.id)===String(a.manualTarget)):null;
    const placements=d?.placements||{};
    let h='<div style="padding:9px;background:linear-gradient(180deg,#101923,#0b1118);border:1px solid #334155;border-radius:10px;margin-top:6px;color:#e5e7eb">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center"><b>🎮 БОЕВОЙ HUD</b><span style="font-size:10px;color:#94a3b8">Волна '+a.wave+' · '+Math.floor(a.elapsed||0)+'с</span></div>';
    h+='<div style="display:flex;gap:5px;margin-top:6px"><button class="bs" onclick="G.pauseDefenseBattle()" '+(a.status!=='active'?'disabled':'')+'>⏸ Пауза</button><button class="bs" onclick="G.resumeDefenseBattle()" '+(a.status!=='paused'?'disabled':'')+'>▶ Продолжить</button><button class="bs" onclick="G.clearDefenseTarget();G.renderDefenseBattleHUD()">✕ Цель</button></div>';
    h+='<div style="font-size:10px;color:#94a3b8;margin-top:6px">Состояние: '+(a.status==='active'?'🟢 бой':a.status==='paused'?'🟡 пауза':a.status==='won'?'🏆 победа':'🔴 завершён')+' · ☠ '+(a.kills||0)+' · 🎯 '+(a.shots||0)+'</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:7px">';
    Object.entries(LINES).forEach(([k,n])=>{const id=placements[k];const f=(G.S?.survivors||[]).concat(G.S?.heroes||[]).find(x=>String(x.id)===String(id));h+='<div style="padding:6px;background:#17212d;border-radius:7px;font-size:10px"><b>'+n+'</b><div style="margin-top:3px">'+(f?('🪖 '+(f.name||f.n)):'—')+'</div><button class="bs" style="font-size:9px;margin-top:4px" onclick="G.removeDefenseFighter(\''+k+'\')">Снять</button></div>'});
    h+='</div>';
    h+='<div style="margin-top:7px;font-size:10px;color:#94a3b8">Цель: '+(selected?(ICON[selected.type]||'🧟')+' '+selected.type+' · HP '+Math.round(selected.hp)+'/'+Math.round(selected.maxHp):'автоматический приоритет')+'</div>';
    h+='<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px;max-height:190px;overflow:auto">';
    zs.slice(0,10).forEach((z,i)=>{const sel=selected&&String(selected.id)===String(z.id);h+='<button onclick="G.selectDefenseTarget(\''+String(z.id).replace(/'/g,'')+'\');G.renderDefenseBattleHUD()" style="text-align:left;padding:5px;border-radius:6px;border:1px solid '+(sel?'#f59e0b':'#263241')+';background:'+(sel?'#2a2110':'#111923')+';color:#e5e7eb"><div style="display:flex;justify-content:space-between"><span>'+(ICON[z.type]||'🧟')+' '+z.type+' '+(i+1)+'</span><b>'+Math.max(0,Math.round(z.hp))+'</b></div>'+bar(z.hp,z.maxHp)+'<div style="font-size:9px;color:#64748b;margin-top:2px">Позиция '+Math.round(z.x*100)+'%'+(z.stunned>0?' · ⚡ оглушён':'')+'</div></button>'});
    h+='</div>';
    h+='<div style="margin-top:7px;font-size:9px;color:#64748b">Перемещение бойца выполняется через назначение на другую линию в панели обороны. Выбранная цель имеет приоритет автоматического огня.</div></div>';
    el.innerHTML=h;
  }
  function renderAll(){G.renderDefenseBattleHUD?.();G.renderDefenseCommand?.();}
  G.moveDefenseFighter=moveFighter;G.removeDefenseFighter=removeFighter;G.pauseDefenseBattle=pause;G.resumeDefenseBattle=resume;G.renderDefenseBattleHUD=render;G.renderDefenseHUD=render;
  if(G.renderRealtimeDefense&&!G.__stage3DRenderWrapped){const old=G.renderRealtimeDefense;G.renderRealtimeDefense=function(){const r=old.apply(this,arguments);render();return r};G.__stage3DRenderWrapped=true;}
  if(!G.__stage3DRenderLoop){G.__stage3DRenderLoop=true;setInterval(renderAll,500);}
  console.log('[TLP] Stage 3D battle HUD loaded.');
})();
