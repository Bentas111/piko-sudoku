import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('release/publisher.json','utf8'));
const cap=JSON.parse(await readFile('capacitor.config.json','utf8'));
const missing=[];
const ads=JSON.parse(await readFile('src/ads-config.json','utf8'));
if(ads.testing)missing.push('AdMob remains in test mode');
for(const key of ['admobStoreLinked','appAdsTxtVerified','admobReady','adDeviceTestsPassed','privacyDisclosuresReviewed'])if(config[key]!==true)missing.push(key);
for(const key of ['iosAdmobStoreLinked','iosAdmobReady','iosAdDeviceTestsPassed','iosKidsAdComplianceReviewed'])if(config[key]!==true)missing.push(key);
for(const key of ['publisherName','supportEmail','websiteUrl','privacyUrl','productionAppId'])if(!config[key])missing.push(key);
for(const key of ['storeAccountsVerified','assetRightsConfirmed','physicalDeviceTestsPassed','iosArchiveTested'])if(config[key]!==true)missing.push(key);
if(config.monetization==='undecided')missing.push('monetization');
if(cap.appId!==config.productionAppId||cap.appId.endsWith('.preview'))missing.push('production identifiers must be configured in Capacitor AND both native projects');
if(missing.length){console.error('NOT READY FOR STORE SUBMISSION:\n- '+missing.join('\n- '));process.exitCode=1;}
else console.log('Administrative checklist filled. This does not certify store approval, signing or billing correctness. Review release/README.md.');
