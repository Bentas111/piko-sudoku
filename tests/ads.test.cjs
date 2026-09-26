const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createAdPolicy}=require('../src/ads-policy.cjs');
test('ads require a fresh third result, cooldown, and never follow a timer into gameplay',()=>{
 let time=0;const p=createAdPolicy({now:()=>time});
 assert.equal(p.claim({view:'result',key:'early',rounds:3}),null);
 time=120000;
 assert.equal(p.claim({view:'game',key:'game',rounds:3}),null);
 assert.equal(p.claim({view:'result',key:'early',rounds:3}),null);
 assert.equal(p.claim({view:'result',key:'two',rounds:2}),null);
 const token=p.claim({view:'result',key:'six',rounds:6});assert.equal(typeof token,'number');
 assert.equal(p.claim({view:'result',key:'six',rounds:6}),null);
 assert.equal(p.claim({view:'result',key:'nine',rounds:9}),null);
 p.cancel();assert.equal(p.current(token),false);
 time=240000;assert.equal(typeof p.claim({view:'result',key:'twelve',rounds:12}),'number');
});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({consent,show,platform='android',testing=true,clubActive=false}={}){
 const calls=[],events={},docEvents={},winEvents={};let reserved=false;
 const AdMob={requestConsentInfo:async opts=>{calls.push(['consent',opts]);return consent?consent():{canRequestAds:true};},initialize:async opts=>calls.push(['initialize',opts]),setApplicationMuted:async()=>{},showBanner:async opts=>{calls.push(['show',opts]);if(show)await show();},removeBanner:async()=>{calls.push(['remove']);},addListener:async(n,fn)=>events[n]=fn,showPrivacyOptionsForm:async()=>{}};
 const context={AdMob,BannerAdPluginEvents:{FailedToLoad:'failed',Loaded:'loaded'},BannerAdSize:{BANNER:'BANNER'},BannerAdPosition:{BOTTOM_CENTER:'BOTTOM_CENTER'},MaxAdContentRating:{General:'General'},config:{testing,testBannerId:'test-unit',iosTestBannerId:'ios-test',androidBannerId:'android-live',iosBannerId:'ios-live'},createAdPolicy,window:{PikoClub:{active:clubActive},addEventListener:(n,fn)=>winEvents[n]=fn},document:{hidden:false,body:{classList:{toggle:(_,v)=>reserved=v}},addEventListener:(n,fn)=>docEvents[n]=fn}};
 const source=fs.readFileSync(__dirname+'/../src/ads.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export function','function');
 context.config.cooldownMs=0;
 vm.runInNewContext(source+'\ninstallAds('+JSON.stringify(platform)+');',context);
 context.window.PikoAds.screen({view:'settings'});
 return {calls,context,api:context.window.PikoAds,reserved:()=>reserved};
}
test('navigation cancels an ad while privacy initialization is pending',async()=>{
 let resolve;const h=setup({consent:()=>new Promise(r=>resolve=r)});
 h.api.test();await tick();h.api.screen({view:'game'});resolve({canRequestAds:true});await tick();
 assert.equal(h.calls.filter(x=>x[0]==='show').length,0);assert.equal(h.reserved(),false);
});
test('an active Piko Club subscription prevents every ad request',async()=>{
 const h=setup({clubActive:true});h.api.screen({view:'result',key:'finished',rounds:3});h.api.test();await tick();
 assert.equal(h.calls.some(x=>['consent','initialize','show'].includes(x[0])),false);
});
test('SDK show/remove operations stay ordered during close and a repeated test',async()=>{
 let resolve;const h=setup({show:()=>new Promise(r=>resolve=r)});
 h.api.test();await tick();const closing=h.api.hide();h.api.test();await tick();
 assert.equal(h.calls.filter(x=>x[0]==='show').length,1);
 resolve();await closing;await tick();
 assert.deepEqual(h.calls.filter(x=>['show','remove'].includes(x[0])).map(x=>x[0]),['show','remove','show']);
 resolve();await tick();await h.api.hide();assert.equal(h.reserved(),false);
});
test('denied privacy eligibility never initializes or requests advertising',async()=>{
 const h=setup({consent:()=>({canRequestAds:false})});h.api.test();await tick();
 assert.equal(h.calls.some(x=>['initialize','show'].includes(x[0])),false);
});
test('test requests use child flags, G, test ID and non-personalized ads',async()=>{
 const h=setup();h.api.test();await tick();
 assert.equal(h.calls.find(x=>x[0]==='consent')[1].tagForUnderAgeOfConsent,true);
 const opts=h.calls.find(x=>x[0]==='initialize')[1];
 assert.equal(opts.tagForChildDirectedTreatment,true);assert.equal(opts.tagForUnderAgeOfConsent,true);assert.equal(opts.maxAdContentRating,'General');
 const ad=h.calls.find(x=>x[0]==='show')[1];assert.equal(ad.adId,'test-unit');assert.equal(ad.npa,true);
 h.context.document.hidden=true;await h.api.hide();assert.equal(h.reserved(),false);
});
test('iOS test banner is distinct from Android and duplicate tests replace the view',async()=>{
 const h=setup({platform:'ios'});h.api.test();await tick();h.api.test();await tick();
 const shows=h.calls.filter(x=>x[0]==='show');assert.equal(shows.length,2);
 assert.equal(shows[0][1].adId,'ios-test');assert.equal(shows[1][1].adId,'ios-test');
 assert.deepEqual(h.calls.filter(x=>['show','remove'].includes(x[0])).map(x=>x[0]),['show','remove','show']);
});
test('production routing uses each platform unit and disables parent test button action',async()=>{
 for(const platform of ['android','ios']){
  const h=setup({platform,testing:false});h.api.test();await tick();assert.equal(h.calls.length,0);
  h.api.screen({view:'result',key:'finished',rounds:3});await tick();
  const ad=h.calls.find(x=>x[0]==='show')[1];assert.equal(ad.adId,platform+'-live');assert.equal(ad.isTesting,false);
 }
});
