(function(G){'use strict';
 const R=()=>{const s=G.S||(G.S={});s.res=s.res||{};return s.res}, S=()=>G.S||(G.S={});
 const ITEMS={
  knife:{name:'Нож',slot:'weapon',rarity:'common',in:{metal:2,parts:1},max:100,bonus:{damage:3}},
  rifle:{name:'Винтовка',slot:'weapon',rarity:'rare',in:{metal:5,parts:3,ammo:2},max:100,bonus:{damage:10}},
  armor:{name:'Бронежилет',slot:'armor',rarity:'rare',in:{metal:5,parts:3},max:120,bonus:{armor:8}},
  medkit:{name:'Медкомплект',slot:'utility',rarity:'common',in:{medicine:2,parts:1},max:100,bonus:{healing:10}},
  toolkit:{name:'Инструментальный набор',slot:'tool',rarity:'rare',in:{tools:2,parts:2},max:100,bonus:{engineering:8}}
 };
 function state(){const s=S();s.equipment=s.equipment||{inventory:[],equipped:{},history:[]};return s.equipment}
 function canPay(c){const r=R();return Object.entries(c).every(([k,v])=>(Number(r[k])||0)>=v)}
 function take(c){if(!canPay(c))return false;const r=R();Object.entries(c).forEach(([k,v])=>r[k]-=v);return true}
 function craft(id,quality='standard'){const it=ITEMS[id],q=state();if(!it||!take(it.in))return false;const mult=quality==='excellent'?1.2:quality==='poor'?.85:1;const item={id:id+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),type:id,name:it.name,slot:it.slot,rarity:it.rarity,quality,durability:Math.round(it.max*mult),maxDurability:Math.round(it.max*mult),bonus:{...it.bonus}};q.inventory.push(item);q.history.push({type:'crafted',item:item.id,day:S().day||1});return item}
 function hero(id){return (S().heroes||[]).find(h=>String(h.id)===String(id))}
 function equip(heroId,itemId){const h=hero(heroId),q=state(),item=q.inventory.find(x=>x.id===itemId);if(!h||!item)return false;q.equipped[heroId]=q.equipped[heroId]||{};const old=q.equipped[heroId][item.slot];q.equipped[heroId][item.slot]=item.id;q.history.push({type:'equipped',hero:heroId,item:item.id,old,day:S().day||1});return true}
 function repair(itemId){const q=state(),item=q.inventory.find(x=>x.id===itemId),cost=item?{parts:Math.max(1,Math.ceil((item.maxDurability-item.durability)/25))}:null;if(!item||!cost||item.durability>=item.maxDurability||!take(cost))return false;item.durability=item.maxDurability;q.history.push({type:'repaired',item:item.id,day:S().day||1});return true}
 function useDurability(heroId,slot,amount=1){const q=state(),id=q.equipped[heroId]?.[slot],item=q.inventory.find(x=>x.id===id);if(!item)return false;item.durability=Math.max(0,item.durability-(Number(amount)||1));return item.durability>0}
 function stats(heroId){const q=state(),e=q.equipped[heroId]||{},out={damage:0,armor:0,healing:0,engineering:0};Object.values(e).forEach(id=>{const i=q.inventory.find(x=>x.id===id);if(i&&i.durability>0)Object.entries(i.bonus||{}).forEach(([k,v])=>out[k]=(out[k]||0)+v)});return out}
 function get(){return JSON.parse(JSON.stringify(state()))}
 function render(){if(typeof document==='undefined')return;const host=document.getElementById('stage3EquipmentPanel');if(!host)return;const q=state();host.innerHTML='<div style="padding:10px;background:#0d1520;border:1px solid #334155;border-radius:12px"><b>🎒 Снаряжение</b><br><small>Предметов: '+q.inventory.length+' · Экипировано героев: '+Object.keys(q.equipped).length+'</small></div>'}
 G.equipment={ITEMS,state,craft,equip,repair,useDurability,stats,get,render};G.craftEquipment=craft;G.equipEquipment=equip;G.repairEquipment=repair;render();
})(window.G||window);
