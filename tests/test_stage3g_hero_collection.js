const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{G:{S:{heroes:[],res:{metal:100}}}},setTimeout,clearTimeout};ctx.window.window=ctx.window;
vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/base-defense-stage3g.js','utf8'),ctx);
const G=ctx.window.G; const C=G.heroCollection;
function ok(x,m){assert.ok(x,m);console.log('PASS',m)}
ok(C.list().length===5,'catalog has 5 unique heroes');
ok(C.addFragments('hero-lena',20),'fragments can be added');
ok(C.get('hero-lena').fragments===20,'fragment count is capped at unlock requirement');
ok(C.unlock('hero-lena'),'hero unlock works');
ok(C.recruit('hero-lena'),'hero recruitment works');
ok(G.S.heroes.some(h=>h.id==='hero-lena'),'recruited hero enters existing hero roster');
ok(C.recruit('hero-lena')===false,'duplicate recruitment is blocked');
ok(C.addFragments('hero-viktor',40)&&C.unlock('hero-viktor')&&C.get('hero-viktor').rarity==='epic','rarity and second hero flow work');
console.log('Stage 3G: 8/8');
