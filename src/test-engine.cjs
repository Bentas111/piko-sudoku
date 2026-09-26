const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('./engine.js'),context={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),context);const D=context.window.PIKO_DATA;
let shown=0,hintMoves=0;const masks=new Set();
for(const p of D.puzzles){
 assert(E.valid(p.solution,p.size),p.id+' solution invalid');assert.equal(E.countSolutions(p.given,p.size),1,p.id+' not unique');
 assert(p.given.every((v,i)=>v===0||v===p.solution[i]),p.id+' wrong clue');
 const sig=p.size+':'+p.given.join(',');assert(!masks.has(sig),'duplicate grid');masks.add(sig);
 const a=Array.from(p.given);let max=a.length;
 while(a.includes(0)&&max--){const h=E.hint(a,p);assert(h&&!h.repair,p.id+' invalid hint');assert.equal(h.value,p.solution[h.cell]);assert(!p.given[h.cell]);assert(!E.conflicts(a,p.size,h.cell,h.value).length);if(h.kind==='show')shown++;a[h.cell]=h.value;hintMoves++;}
 assert(E.valid(a,p.size),p.id+' hints did not finish');
}
assert.equal(E.groups(9).length,27);assert(E.groups(9).every(g=>g.cells.length===9));assert(D.puzzles.filter(p=>p.size===9).every(p=>E.logicalSolve(p).solved));assert.equal(E.groups(2).length,4);assert.equal(E.groups(3).length,6);assert.equal(E.groups(4).filter(g=>g.kind==='block').length,4);assert.equal(E.groups(6).filter(g=>g.kind==='block').length,6);
assert(E.valid([1,2,2,1],2));assert(E.valid([1,2,3,2,3,1,3,1,2],3));assert(!E.valid([1,1,2,1],2));
assert.equal(E.conflicts([1,2,2,0],2,3,1).length,0);assert(E.conflicts([1,2,2,0],2,3,2).length>0);
const sample=D.puzzles.find(p=>p.size===4),bad=Array.from(sample.given),i=bad.findIndex(v=>!v);bad[i]=sample.solution[i]%4+1;assert(E.hint(bad,sample).repair);
for(const w of D.worlds){assert.equal(w.symbols.length,9);assert.equal(new Set(w.symbols.map(s=>s.id)).size,9);for(const s of w.symbols)assert(fs.existsSync(__dirname+'/'+s.src));}
assert.equal(D.puzzles.length,270);assert.equal(D.worlds.length,12);
console.log(JSON.stringify({puzzles:D.puzzles.length,worlds:D.worlds.length,assets:108,uniqueSolutions:'all passed',hintMoves,explicitSolutionFallbacks:shown,rules:'2/3 row-column;4/6/9 row-column-block'},null,2));
