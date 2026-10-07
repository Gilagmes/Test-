/* LAST PORT — STAGE 3B: REAL-TIME DEFENSE */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G)return;
  const G=window.G;
  const TYPES={
    walker:{name:'Ходячий',icon:'🧟',hp:100,speed:0.055,damage:8,armor:0},
    runner:{name:'Бегун',icon:'🏃🧟',hp:75,speed:0.105,damage:11,armor:0},
    brute:{name:'Тяжёлый',icon:'💀',hp:320,speed:0.032,damage:24,armor:.25},
    screamer:{name:'Крикун',icon:'📢🧟',hp:120,speed:0.048,damage:5,armor:0},
    armored:{name:'Бронированный',icon:'🪖🧟',hp:260,speed:0.040,damage:18,armor:.45}
  };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function S(){return G.S||{};}
  function D(){return G.baseDefenseState?G.baseDefenseState():null;}
  function fighters(){const s=S(),a=[];(s.survivors||[]).forEach((x,i)=>a.push({id:String(x.id??'survivor-'+i),name:x.name||x.n||'Выживший',damage:Number(x.attack??x.a??20),range:.38,rate:900,accuracy:.82,kind:'survivor'}));(s.heroes||[]).forEach((x,i)=>a.push({id:String(x.id??'hero-'+i),name:x.n||x.name||'Герой',damage:Number(x.a??x.attack??25),range:.46,rate:700,accuracy:.9,kind:'hero'}));return a;}
  function spawn(wave){const d=D();if(!d)return null;const n=Math.min(70,8+Math.floor(Number(wave||1)*2.4)),z=[];for(let i=0;i<n;i++){const r=Math.random(),type=r<.55?'walker':r<.75?'runner':r<.88?'screamer':r<.96?'brute':'armored',t=TYPES[type];z.push({id:'rt-'+Date.now()+'-'+i,type,hp:t.hp,maxHp:t.hp,x:0,stunned:0});}d.active={wave:Number(wave||1),zombies:z,started:Date.now(),kills:0,damage:0,status:'active',elapsed:0,shots:0};G.__defRT={last:performance?.now?.()||Date.now(),acc:0};return d.active;}
  function chooseTarget(a){const live=(a?.zombies||[]).filter(z=>z.hp>0);if(!live.length)return null;if(a.manualTarget){const manual=live.find(z=>String(z.id)===String(a.manualTarget));if(manual)return manual;}return live.reduce((best,z)=>!best||z.x>best.x?z:best,null);}
  function towerDamage(){const gs=S().guardTowers||{};return Object.values(gs).reduce((n,t)=>n+Number(t.lv||0)*5,0);}
  function tick(dt){const d=D(),a=d?.active;if(!a||a.status!=='active')return null;dt=clamp(Number(dt)||0,.001,.25);a.elapsed=(a.elapsed||0)+dt;let baseDmg=0;
    a.zombies.forEach(z=>{if(z.hp<=0)return;if(z.stunned>0){z.stunned-=dt;return;}z.x+=TYPES[z.type].speed*dt;const line=z.x<.42?'front':z.x<.72?'gate':'inner';if(z.x>=1){const l=d.lines.inner;if(l){const hit=TYPES[z.type].damage*dt;l.hp=Math.max(0,l.hp-hit);a.damage=(a.damage||0)+hit;}z.x=.99;}else if(line==='front'||line==='gate'){const l=d.lines[line];if(l&&l.hp<1)z.x=Math.min(1,z.x+.06*dt);}});
    const placed=d.placements||{};Object.keys(placed).forEach(line=>{const f=fighters().find(x=>x.id===String(placed[line]));if(!f)return;const target=chooseTarget(a);if(!target||target.hp<=0)return;f._cd=(f._cd||0)-dt*1000;if(f._cd<=0&&target.x<=f.range){f._cd=f.rate;const rally=a.buffs?.rally>0?1.4:1;const dmg=f.damage*rally*(Math.random()<f.accuracy?1:0)*(1-(TYPES[target.type].armor||0));if(dmg>0){target.hp=Math.max(0,target.hp-dmg);a.shots=(a.shots||0)+1;if(target.hp<=0){a.kills++;d.totalKills++;}}}});
    const td=towerDamage()*dt; if(td>0){const target=chooseTarget(a);if(target){target.hp=Math.max(0,target.hp-td);if(target.hp<=0){a.kills++;d.totalKills++;}}}
    if(a.zombies.every(z=>z.hp<=0)){a.status='won';finish(a,true);}
    else if(a.elapsed>90){a.status='lost';finish(a,false);}
    return a;
  }
  function finish(a,won){const d=D();if(!d||a._finished)return; a._finished=true;a.ended=Date.now();if(won)d.wavesDefended++;const report={wave:a.wave,won,kills:a.kills||0,damage:Math.round(a.damage||0),realtime:true,shots:a.shots||0,at:Date.now()};d.battles=Array.isArray(d.battles)?d.battles:[];d.battles.unshift(report);d.battles=d.battles.slice(0,30);try{G.save?.();G.updAll?.();G.rPanel?.()}catch(e){}try{G.toast?.(won?`🛡️ Волна ${a.wave} полностью уничтожена.`:`⚠️ Волна ${a.wave} прорвалась к коммуне.`)}catch(e){}}
  function start(wave){const d=D();if(d?.active?.status==='active')return false;spawn(Number(wave||((S().wave||0)+1)));return true;}
  function stop(){const d=D();if(d?.active?.status==='active'){d.active.status='paused';try{G.save?.()}catch(e){}}}
  function render(){const el=document.getElementById('stage3RealtimePanel');if(!el)return;const a=D()?.active;el.innerHTML=a?`<div style="padding:8px;background:#111923;border:1px solid #334155;border-radius:8px;font-size:11px"><b>⚔️ Реальный бой</b><div style="margin-top:5px">Волна ${a.wave} · ☠ ${a.kills||0} · 🎯 ${a.shots||0} · ⏱ ${Math.floor(a.elapsed||0)}с</div><div style="margin-top:6px;height:8px;background:#263241;border-radius:5px;overflow:hidden"><div style="height:100%;width:${Math.round(((a.zombies||[]).filter(z=>z.hp>0).length/Math.max(1,a.zombies.length))*100)}%;background:#ef4444"></div></div></div>`:'';}
  function loop(now){const rt=G.__defRT;if(rt){const last=rt.last||now;rt.last=now;if(D()?.active?.status==='active')tick((now-last)/1000);}render();requestAnimationFrame(loop);}
  G.startRealtimeDefense=start;G.stopRealtimeDefense=stop;G.tickRealtimeDefense=tick;G.spawnRealtimeDefense=spawn;G.getRealtimeDefense=()=>D()?.active||null;G.renderRealtimeDefense=render;
  if(!G.__defRTLoop){G.__defRTLoop=true;requestAnimationFrame(loop);}
  console.log('[TLP] Stage 3B realtime defense loaded.');
})();
