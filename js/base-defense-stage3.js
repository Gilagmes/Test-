/* LAST PORT — STAGE 3: COMMUNE DEFENSE 3.0 */
(function(){
  'use strict';
  if(typeof window==='undefined'||!window.G)return;
  const G=window.G;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const ZOMBIES={
    walker:{name:'Ходячий',icon:'🧟',hp:100,speed:1,damage:8,armor:0,threat:1},
    runner:{name:'Бегун',icon:'🏃🧟',hp:75,speed:1.8,damage:11,armor:0,threat:1.4},
    brute:{name:'Тяжёлый',icon:'💀',hp:320,speed:.55,damage:24,armor:.25,threat:3},
    screamer:{name:'Крикун',icon:'📢🧟',hp:120,speed:.9,damage:5,armor:0,threat:2.2},
    armored:{name:'Бронированный',icon:'🪖🧟',hp:260,speed:.7,damage:18,armor:.45,threat:3.2}
  };
  const LINE_TYPES={front:{name:'Передняя линия',emoji:'🛡️',hp:1400,damageMult:.8},gate:{name:'Ворота',emoji:'🚪',hp:1100,damageMult:1},inner:{name:'Внутренняя линия',emoji:'🏠',hp:1800,damageMult:.55}};
  const DEFENDERS=['survivors','heroes'];
  function state(){
    const S=G.S;if(!S)return null;
    S.baseDefense=S.baseDefense||{version:1,lines:{front:{...LINE_TYPES.front},gate:{...LINE_TYPES.gate},inner:{...LINE_TYPES.inner}},placements:{},repairKits:3,wavesDefended:0,totalKills:0,totalDamage:0,battles:[],active:null};
    const d=S.baseDefense;
    d.lines=d.lines||{};Object.keys(LINE_TYPES).forEach(k=>{d.lines[k]={...LINE_TYPES[k],...(d.lines[k]||{})};});
    d.placements=d.placements||{};d.battles=Array.isArray(d.battles)?d.battles:[];d.repairKits=Number(d.repairKits??3);
    return d;
  }
  function save(){try{G.save?.();G.updAll?.();G.updTop?.();G.rPanel?.()}catch(e){}}
  function toast(m){try{G.toast?.(m)}catch(e){}}
  function resources(){return G.S?.res||G.S||{}}
  function spend(k,n){const r=resources();if((Number(r[k])||0)<n)return false;r[k]-=n;return true}
  function fighters(){
    const S=G.S||{}; const out=[];
    (S.survivors||[]).forEach((s,i)=>out.push({id:String(s.id??('survivor-'+i)),name:s.name||s.n||('Выживший '+(i+1)),hp:Number(s.health??s.hp??100),power:Number(s.attack??s.a??20),morale:Number(s.mood??s.loyalty??70),kind:'survivor'}));
    (S.heroes||[]).forEach((h,i)=>out.push({id:String(h.id??('hero-'+i)),name:h.n||h.name||('Герой '+(i+1)),hp:Number(h.hp??100),power:Number(h.a??h.attack??25),morale:80,kind:'hero'}));
    return out;
  }
  function place(line,id){
    const d=state();if(!d||!LINE_TYPES[line])return false;
    const f=fighters().find(x=>x.id===String(id));if(!f)return false;
    Object.keys(d.placements).forEach(k=>{if(d.placements[k]===String(id))delete d.placements[k]});
    d.placements[line]=String(id);save();toast(`🪖 ${f.name} назначен на «${LINE_TYPES[line].name}».`);return true;
  }
  function unplace(line){const d=state();if(!d)return false;delete d.placements[line];save();return true}
  function repair(line,amount=250){
    const d=state(),l=d?.lines?.[line];if(!l)return false;amount=Math.max(1,Math.floor(amount));const max=LINE_TYPES[line].hp*(1+((G.S?.bld?.wall||1)-1)*.12);if(l.hp>=max)return false;
    const wood=Math.ceil(amount/5),metal=Math.ceil(amount/8);const r=resources();if((Number(r.wood)||0)<wood||(Number(r.metal)||0)<metal){toast('❌ Не хватает дерева или металла для ремонта.');return false}r.wood-=wood;r.metal-=metal
    l.hp=clamp(l.hp+amount,0,max);save();toast(`🔧 Линия восстановлена на ${amount} HP.`);return true;
  }
  function repairKit(line){
    const d=state();if(!d||d.repairKits<=0)return false;const l=d.lines[line];if(!l)return false;const max=LINE_TYPES[line].hp*(1+((G.S?.bld?.wall||1)-1)*.12);if(l.hp>=max)return false;d.repairKits--;l.hp=clamp(l.hp+450,0,max);save();toast('🧰 Ремкомплект использован: +450 HP.');return true;
  }
  function waveSize(wave){return Math.min(60,8+Math.floor(Number(wave||1)*2.4))}
  function spawnWave(wave=1){
    const d=state();if(!d)return null;const count=waveSize(wave),z=[];for(let i=0;i<count;i++){
      const r=Math.random();let type=r<.58?'walker':r<.76?'runner':r<.88?'screamer':r<.96?'brute':'armored';const cfg=ZOMBIES[type];z.push({id:`z-${Date.now()}-${i}`,type,hp:cfg.hp,maxHp:cfg.hp});
    }
    d.active={wave:Number(wave),zombies:z,started:Date.now(),kills:0,damage:0,status:'active'};save();return d.active;
  }
  function resolveWave(){
    const d=state(),a=d?.active;if(!d||!a||a.status!=='active')return false;
    let defense=0;Object.entries(d.placements).forEach(([line,id])=>{const f=fighters().find(x=>x.id===id);if(f)defense+=f.power*(f.morale/100)*LINE_TYPES[line].damageMult});
    const towerDps=typeof G.rTowersUI==='function' ? Object.keys(G.S?.guardTowers||{}).reduce((sum,k)=>{const lv=G.S.guardTowers[k]?.lv||0;return sum+lv*120},0):0;
    const wallPower=Object.values(d.lines).reduce((sum,l)=>sum+(l.hp/LINE_TYPES[l.name==='Ворота'?'gate':l.name==='Передняя линия'?'front':'inner'].hp)*30,0);
    const totalPower=Math.max(10,defense+towerDps*.65+wallPower);
    const threat=a.zombies.reduce((s,z)=>s+ZOMBIES[z.type].threat,0);
    const chance=clamp(totalPower/(totalPower+threat*30),.12,.96);const won=Math.random()<chance;
    const killed=won?a.zombies.length:Math.floor(a.zombies.length*chance*.72);const damage=won?Math.max(0,Math.floor(threat*7-totalPower*.025)):Math.max(80,Math.floor(threat*13-totalPower*.04));
    let remaining=damage;for(const line of ['front','gate','inner']){const l=d.lines[line];const absorbed=Math.min(l.hp,Math.ceil(remaining*LINE_TYPES[line].damageMult));l.hp-=absorbed;remaining=Math.max(0,remaining-absorbed*.55);if(remaining<=0)break}
    a.kills=killed;a.damage=damage;a.status=won?'won':'lost';a.ended=Date.now();d.totalKills+=killed;d.totalDamage+=damage;if(won)d.wavesDefended++;
    const report={wave:a.wave,won,kills:killed,damage,threat,defense:Math.round(totalPower),at:Date.now()};d.battles.unshift(report);if(d.battles.length>30)d.battles.pop();
    if(!won&&d.lines.inner.hp<=0){d.lines.inner.hp=1;toast('💥 Внутренняя линия прорвана! Коммуна понесла тяжёлый урон.')}else toast(won?`🛡️ Волна ${a.wave} отбита: ${killed} уничтожено.`:`⚠️ Волна ${a.wave} прорвала оборону. Потери HP: ${damage}.`);
    save();return report;
  }
  function startDefense(wave){const d=state();if(d?.active?.status==='active')return false;spawnWave(Number(wave||((G.S?.wave||1)+1)));return true}
  function status(){const d=state();if(!d)return null;const maxes={};Object.keys(LINE_TYPES).forEach(k=>maxes[k]=LINE_TYPES[k].hp*(1+((G.S?.bld?.wall||1)-1)*.12));return {lines:d.lines,maxes,placements:d.placements,active:d.active,wavesDefended:d.wavesDefended,totalKills:d.totalKills,totalDamage:d.totalDamage}}
  function ui(){
    const d=state();if(!d)return '';
    const fs=fighters();const active=d.active?.status==='active';
    let h='<div class="stage3-defense" style="background:#0b1118;border:1px solid #263241;border-radius:12px;padding:12px;margin:8px 0;color:#e5e7eb">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px">🛡️ Оборона коммуны</b><span style="font-size:10px;color:#94a3b8">Отбито волн: '+d.wavesDefended+' · Убийств: '+d.totalKills+'</span></div>';
    h+='<div style="font-size:10px;color:#94a3b8;margin:5px 0 10px">Три линии обороны. Бойцы удерживают позиции, стены принимают удар, а башни и ловушки усиливают огонь.</div>';
    Object.entries(LINE_TYPES).forEach(([k,c])=>{const l=d.lines[k],max=c.hp*(1+((G.S?.bld?.wall||1)-1)*.12),pct=Math.round(l.hp/max*100),fid=d.placements[k],f=fs.find(x=>x.id===fid);h+='<div style="background:#111923;border:1px solid #273445;border-radius:8px;padding:8px;margin:6px 0"><div style="display:flex;justify-content:space-between"><b>'+c.emoji+' '+c.name+'</b><span>'+Math.round(l.hp)+'/'+Math.round(max)+' HP</span></div><div style="height:6px;background:#263241;border-radius:5px;margin:5px 0"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#ef4444,#f59e0b,#22c55e);border-radius:5px"></div></div><div style="display:flex;gap:5px;flex-wrap:wrap"><select onchange="G.placeDefenseFighter(\''+k+'\',this.value)" style="flex:1;min-width:150px;background:#17212d;color:#ddd;border:1px solid #334155;border-radius:5px;padding:5px"><option value="">'+(f?'🪖 '+f.name:'Назначить бойца')+'</option>'+fs.filter(x=>x.id!==fid).map(x=>'<option value="'+x.id+'">'+x.name+' · '+x.power+' силы</option>').join('')+'</select><button class="bs" onclick="G.repairDefenseLine(\''+k+'\',250)">🔧 Ремонт</button><button class="bs" onclick="G.useDefenseKit(\''+k+'\')">🧰 '+d.repairKits+'</button></div></div>'});
    h+='<div style="display:flex;gap:6px;margin-top:8px"><button class="bgn" onclick="G.startDefenseWave('+(Number(G.S?.wave||0)+1)+')" '+(active?'disabled':'')+'>⚔️ Начать волну</button>'+(active?'<button class="bgn" onclick="G.resolveDefenseWave()">💥 Завершить бой</button>':'')+'<button class="bs" onclick="G.renderDefensePanel()">↻ Обновить</button></div>';
    if(d.battles[0]){const r=d.battles[0];h+='<div style="margin-top:8px;padding:7px;background:#111923;border-radius:7px;font-size:10px">Последний бой: волна '+r.wave+' · '+(r.won?'🟢 победа':'🔴 прорыв')+' · ☠ '+r.kills+' · 💥 '+r.damage+' урона · ⚔ '+r.defense+' силы</div>'}
    return h+'</div>';
  }
  function render(){const el=document.getElementById('stage3DefensePanel');if(el)el.innerHTML=ui()}
  G.baseDefenseState=state;G.placeDefenseFighter=place;G.unplaceDefenseFighter=unplace;G.repairDefenseLine=repair;G.useDefenseKit=repairKit;G.spawnDefenseWave=spawnWave;G.startDefenseWave=startDefense;G.resolveDefenseWave=resolveWave;G.getDefenseStatus=status;G.renderDefensePanel=render;G.rDefenseStage3UI=ui;
  if(G.SUBS&&Array.isArray(G.SUBS.base)&&!G.SUBS.base.includes('defense3')){G.SUBS.base.push('defense3');G.SL=G.SL||{};G.SL.defense3='🛡️Оборона'}
  const oldPanel=G.rPanel;if(oldPanel&&!G.__stage3PanelWrapped){G.__stage3PanelWrapped=true;G.rPanel=function(){oldPanel.apply(this,arguments);setTimeout(()=>{if(G.S?.sub==='defense3'){let p=document.getElementById('pn');if(p){p.innerHTML=ui()}}},0)}}
  console.log('[TLP] Stage 3 Defense loaded.');
})();
