const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{PikoEngine:require('../src/engine.js')}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../src/data.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync(__dirname+'/../src/state.js','utf8'),ctx);
const D=ctx.window.PIKO_DATA, normalize=raw=>ctx.window.PikoState.normalize(raw,D,i=>({id:i,world:'pets',size:2,completed:[],learned:[],recent:[],album:{},worldCounts:{},rounds:0,assisted:0,game:null}));
test('repairs missing settings and partial profiles without crashing',()=>{
 const r=normalize({version:1,profiles:[null,{world:'bad',album:null,completed:['fake']}],active:99});
 assert.equal(r.active,0);assert.equal(r.profiles[1].world,'pets');assert.equal(r.settings.sound,false);
 assert.equal(r.profiles[1].completed.length,0);
});
test('rejects changes to fixed clues and invalid undo history',()=>{
 const q=D.puzzles.find(q=>q.size===4), values=q.given.slice(), i=values.findIndex(v=>v);
 values[i]=0;
 assert.equal(normalize({version:1,profiles:[{game:{id:q.id,values}}]}).profiles[0].game,null);
 const r=normalize({version:1,profiles:[{game:{id:q.id,values:q.given,history:[{i,prev:0,next:q.given[i]}]}}]});
 assert.equal(r.profiles[0].game.history.length,0);
});
test('preserves valid unfinished game and never trusts forged finished flag',()=>{
 const q=D.puzzles.find(q=>q.size===6),values=q.given.slice(),i=values.findIndex(v=>!v);values[i]=q.solution[i];
 const r=normalize({version:1,profiles:[{game:{id:q.id,values,finished:true,history:[{i,prev:0,next:values[i]}]}}]});
 assert.equal(r.profiles[0].game.finished,false);assert.equal(r.profiles[0].game.history.length,1);
});
