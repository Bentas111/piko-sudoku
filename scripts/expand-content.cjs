// Deterministic, offline content build. Existing puzzle IDs are retained.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),E=require('../src/engine.js');
const base=path.join(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(base,'src/data.js'),'utf8'),ctx);const D=ctx.window.PIKO_DATA;
const library=JSON.parse(fs.readFileSync(path.join(base,'src/asset-sources.json'),'utf8')).source;
const extras={pets:[[4,'Chomik','Hamster'],[9,'Mysz','Mouse'],[11,'Ara','Macaw']],ocean:[[3,'Rekin','Shark'],[4,'Płaszczka','Manta ray'],[7,'Orka','Orca']],vehicles:[[1,'Wóz strażacki','Fire engine'],[17,'Motocykl','Motorcycle'],[38,'Balon','Hot air balloon']],fruit:[[22,'Ananas','Pineapple'],[24,'Arbuz','Watermelon'],[27,'Winogrona','Grapes']],dinosaurs:[[7,'Parazaurolof','Parasaurolophus'],[8,'Spinozaur','Spinosaurus'],[36,'Mikroraptor','Microraptor']],space:[[1,'Słońce','Sun'],[6,'Jowisz','Jupiter'],[3,'Wenus','Venus']],farm:[[4,'Koza','Goat'],[6,'Osioł','Donkey'],[11,'Indyk','Turkey']],forest:[[7,'Dzik','Wild boar'],[8,'Wilk','Wolf'],[9,'Borsuk','Badger']],safari:[[10,'Surykatka','Meerkat'],[11,'Guziec','Warthog'],[7,'Gepard','Cheetah']],birds:[[14,'Maskonur','Puffin'],[16,'Koliber','Hummingbird'],[34,'Łabędź','Swan']],garden:[[24,'Dmuchawiec','Dandelion'],[29,'Palma','Palm tree'],[37,'Łopatka','Garden trowel']],fantasy:[[22,'Kryształowy golem','Crystal golem'],[27,'Księżyc','Moon creature'],[29,'Ognik','Flame sprite']]};
for(const w of D.worlds){for(const [num,pl,en] of extras[w.id]){const id=w.id+'-'+String(num).padStart(2,'0');if(!w.symbols.some(s=>s.id===id))w.symbols.push({id,pl,en,src:'assets/'+id+'.png'});fs.copyFileSync(path.join(library,w.id,id+'.png'),path.join(base,'src/assets',id+'.png'));}}
let seed=20092026;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const buckets=[[],[],[]];let attempts=0;
while(buckets.some(b=>b.length<10)&&attempts++<600){
 const axes=()=>shuffle([0,1,2]).flatMap(b=>shuffle([0,1,2]).map(i=>b*3+i));
 const rows=axes(),cols=axes(),digits=shuffle([1,2,3,4,5,6,7,8,9]);
 const solution=rows.flatMap(r=>cols.map(c=>digits[(r*3+Math.floor(r/3)+c)%9]));
 const given=solution.slice(),target=attempts%3===0?35:attempts%3===1?46:55;
 for(const i of shuffle(Array.from({length:81},(_,i)=>i))){if(given.filter(v=>!v).length>=target)break;const old=given[i];given[i]=0;if(!E.logicalSolve({size:9,given,solution}).solved)given[i]=old;}
 const proof=E.logicalSolve({size:9,given,solution}),hidden=proof.steps.filter(s=>s.kind==='hidden').length;
 const score=proof.steps.length+hidden*4,tier=score<=40?0:score<=64?1:2;
 if(buckets[tier].length<10&&E.countSolutions(given,9)===1)buckets[tier].push({size:9,given,solution,difficulty:tier,logic:{steps:proof.steps.length,hidden,score}});
}
if(buckets.some(b=>b.length!==10))throw Error('Not enough verified difficulty tiers: '+buckets.map(b=>b.length));
D.puzzles=D.puzzles.filter(q=>q.size!==9).concat(buckets.flatMap((b,t)=>b.map((q,i)=>({...q,id:'9-'+String(t*10+i+1).padStart(3,'0'),order:t*10+i+1}))));
fs.writeFileSync(path.join(base,'src/data.js'),'window.PIKO_DATA='+JSON.stringify(D)+';\n');
fs.writeFileSync(path.join(base,'src/asset-sources.json'),JSON.stringify({source:library,assets:D.worlds.flatMap(w=>w.symbols.map(s=>s.id))},null,2)+'\n');
fs.writeFileSync(path.join(base,'release/puzzles-9-validation.json'),JSON.stringify({seed:20092026,attempts,tiers:buckets.map((b,i)=>({tier:i,count:b.length,scores:b.map(q=>q.logic.score)}))},null,2));
console.log(JSON.stringify({puzzles:D.puzzles.length,images:D.worlds.reduce((n,w)=>n+w.symbols.length,0),attempts,tiers:buckets.map(b=>b.length)}));
