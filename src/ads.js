import { AdMob, BannerAdPluginEvents, BannerAdSize, BannerAdPosition, MaxAdContentRating } from '@capacitor-community/admob';
import config from './ads-config.json';
import { createAdPolicy } from './ads-policy.cjs';

export function installAds(platform='android') {
  if(!['android','ios'].includes(platform))return;
  const testBannerId=platform==='ios'?config.iosTestBannerId:config.testBannerId;
  const bannerId=platform==='ios'?config.iosBannerId:config.androidBannerId;
  const policy=createAdPolicy(config);
  let screen='home',ready=null,requested=false,token=null,operations=Promise.resolve();
  const enqueue=fn=>{const result=operations.then(fn);operations=result.catch(()=>{});return result;};
  function reserve(value){document.body.classList.toggle('piko-ad-space',value);}
  async function hide(){
    policy.cancel();token=null;reserve(false);
    await enqueue(async()=>{if(requested){requested=false;try{await AdMob.removeBanner();}catch{}}});
  }
  async function init(){
    // UMP child flag is independent of the flag sent to the ad SDK.
    const consent=await AdMob.requestConsentInfo({tagForUnderAgeOfConsent:true});
    if(!consent.canRequestAds)throw new Error('Ads not permitted');
    await AdMob.initialize({initializeForTesting:config.testing,tagForChildDirectedTreatment:true,tagForUnderAgeOfConsent:true,maxAdContentRating:MaxAdContentRating.General});
    await AdMob.setApplicationMuted({muted:true});
  }
  async function request(nextToken){
    token=nextToken;
    try{
      if(!ready)ready=init().catch(e=>{ready=null;throw e;});
      await ready;
      if(!policy.current(nextToken)||document.hidden)return;
      await enqueue(async()=>{
        if(!policy.current(nextToken)||document.hidden)return;
        if(requested){await AdMob.removeBanner();requested=false;}
        if(!policy.current(nextToken)||document.hidden)return;
        reserve(true);requested=true;
        await AdMob.showBanner({adId:config.testing?testBannerId:bannerId,isTesting:config.testing,npa:true,adSize:BannerAdSize.BANNER,position:BannerAdPosition.BOTTOM_CENTER,margin:8});
      });
    }catch{if(policy.current(nextToken))await hide();}
  }
  AdMob.addListener(BannerAdPluginEvents.FailedToLoad,()=>{hide();}).catch(()=>{});
  AdMob.addListener(BannerAdPluginEvents.Loaded,()=>{
    if(token===null||!policy.current(token)||document.hidden||!['result','settings'].includes(screen))hide();
  }).catch(()=>{});
  window.PikoAds={
    testing:config.testing,
    screen(info){
      if(window.PikoClub?.active){hide();return;}
      if(screen!==info.view){hide();screen=info.view;}
      const next=policy.claim(info);if(next!==null)request(next);
    },
    hide,
    test(){if(config.testing&&screen==='settings'){const next=policy.claim({view:'settings',test:true});request(next);}},
    async privacy(){await hide();try{await AdMob.showPrivacyOptionsForm();}catch{}}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
  window.addEventListener('piko:lifecycle',e=>{if(!e.detail.isActive)hide();});
  window.addEventListener('piko:club',e=>{if(e.detail.active)hide();});
}
