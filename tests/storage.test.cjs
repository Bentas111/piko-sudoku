const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createStorage}=require('../src/storage.cjs');
test('serializes writes and persists the newest snapshot',async()=>{
 let release, saved, calls=[];
 const s=createStorage({get:async()=> 'initial',set:async(k,v)=>{calls.push(v);if(v==='older')await new Promise(r=>release=r);saved=v;}});
 await s.init('key');assert.equal(s.getItem(),'initial');
 s.setItem('key','older');s.setItem('key','newer');
 await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['older']);
 release();await s.flush();assert.equal(saved,'newer');
});
test('failed writes report failure and a later write recovers',async()=>{
 const statuses=[];let saved;
 const s=createStorage({get:async()=>null,set:async(k,v)=>{if(v==='bad')throw Error('disk');saved=v;},notify:v=>statuses.push(v)});
 await s.init('key');s.setItem('key','bad');await assert.rejects(s.flush());
 s.setItem('key','good');await s.flush();assert.equal(saved,'good');assert.deepEqual(statuses,[false,true]);
});
test('failed initial read cannot overwrite an existing native save',async()=>{
 let writes=0;const s=createStorage({get:async()=>{throw Error('locked');},set:async()=>writes++});
 await assert.rejects(s.init('key'));assert.throws(()=>s.getItem());assert.throws(()=>s.setItem('key','blank'));assert.equal(writes,0);
});
