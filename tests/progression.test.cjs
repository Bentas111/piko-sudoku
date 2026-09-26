const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../src/engine.js'),P=require('../src/progress.js'),ctx={window:{PikoEngine:E}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../src/data.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync(__dirname+'/../src/state.js','utf8'),ctx);
const D=ctx.window.PIKO_DATA;
const fresh=()=>({id:0,world:'pets',size:2,completed:[],rounds:0,assisted:0,album:{},worldCounts:{},learned:[],recent:[],game:null,worldCompleted:{},missions:[],badges:[],stars:0});
test('all twelve collections are achievable on 2x2, with no repeat rewards',()=>{
 const p=fresh(),q=D.puzzles.find(q=>q.size===2);
 for(const w of D.worlds)for(let chapter=0;chapter<6;chapter++){
  assert(P.available(p,w.id,false,chapter));
  for(let step=0;step<3;step++){p.game={mission:{master:false,chapter,step},helped:true};assert(P.complete(p,q,w.id).fresh);}
  assert(P.chapterDone(p,w.id,false,chapter));
 }
 assert.equal(p.stars,216);assert(D.worlds.every(w=>p.album[w.id]===6));assert.equal(p.completed.length,1);
 const before=p.stars;p.game={mission:{master:false,chapter:0,step:0}};assert(!P.complete(p,q,'pets').fresh);assert.equal(p.stars,before);
});
test('free play credits the same logical board separately in each world',()=>{
 const p=fresh(),q=D.puzzles[0];p.game={};assert(P.complete(p,q,'pets').fresh);assert(!P.complete(p,q,'pets').fresh);assert(P.complete(p,q,'ocean').fresh);assert.equal(p.stars,2);assert.equal(p.completed.length,1);
});
test('migration preserves three profiles, earned stickers, history and a legacy backup',()=>{
 const q=D.puzzles.find(q=>q.size===6),i=q.given.findIndex(v=>!v),values=Array.from(q.given);values[i]=q.solution[i];
 const raw={version:1,active:2,profiles:[{...fresh(),rounds:18,completed:D.puzzles.slice(0,18).map(q=>q.id),worldCounts:{pets:18},album:{pets:6}},fresh(),{...fresh(),world:'ocean',game:{id:q.id,values,history:[{i,prev:0,next:values[i]}]}}]};
 const r=ctx.window.PikoState.normalize(raw,D,fresh);assert.equal(r.version,2);assert.equal(r.active,2);assert.equal(r.profiles[0].album.pets,6);assert.equal(r.profiles[2].game.history.length,1);assert.equal(r.profiles[2].game.world,'ocean');assert.equal(r.legacyBackup.version,1);
 const roundTrip=ctx.window.PikoState.normalize(JSON.parse(JSON.stringify(r)),D,fresh);assert.equal(roundTrip.profiles[0].album.pets,6);assert.equal(roundTrip.profiles[2].game.values[i],q.solution[i]);
});
test('9x9 box-only conflicts and unsupported sizes are handled',()=>{
 const board=Array(81).fill(0);board[0]=7;assert(E.conflicts(board,9,10,7).some(g=>g.kind==='block'));assert(!E.conflicts(board,9,30,7).length);assert.throws(()=>E.groups(5),RangeError);
});
test('master badge and difficulty proof cover all 30 puzzles',()=>{
 const p=fresh(),qs=D.puzzles.filter(q=>q.size===9);assert.equal(qs.length,30);
 for(let tier=0;tier<3;tier++)assert.equal(qs.filter(q=>q.difficulty===tier).length,10);
 for(const q of qs){assert(E.logicalSolve(q).solved);assert(E.countSolutions(q.given,9)===1);p.game={helped:true};P.complete(p,q,'pets');}
 assert(p.badges.includes('size-9'));assert(p.badges.includes('master-ten'));
});
