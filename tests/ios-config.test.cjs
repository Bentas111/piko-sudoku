const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),xcode=require('xcode');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('Xcode Debug and Release have separate iOS app IDs and synchronized build version',()=>{
 const project=xcode.project(path.join(root,'ios/App/App.xcodeproj/project.pbxproj'));project.parseSync();
 const configs=Object.values(project.pbxXCBuildConfigurationSection()).filter(v=>v.buildSettings?.INFOPLIST_FILE);
 assert.equal(configs.length,2);
 for(const config of configs){
  const expected=config.name==='Debug'?'ca-app-pub-3940256099942544~1458002511':JSON.parse(read('src/ads-config.json')).iosAppId;
  assert.equal(config.buildSettings.ADMOB_APP_ID.replaceAll('"',''),expected);
  assert.equal(config.buildSettings.MARKETING_VERSION,JSON.parse(read('package.json')).version);
 }
 assert.match(read('ios/App/App/Info.plist'),/<key>GADApplicationIdentifier<\/key>\s*<string>\$\(ADMOB_APP_ID\)<\/string>/);
});
test('iOS registers AdMob and applies child configuration without asking for ATT',()=>{
 assert.match(read('ios/App/CapApp-SPM/Package.swift'),/CapacitorCommunityAdmob/);
 const app=read('ios/App/App/AppDelegate.swift');
 for(const flag of ['tagForChildDirectedTreatment = true','tagForUnderAgeOfConsent = true','setPublisherFirstPartyIDEnabled(false)'])assert.ok(app.includes(flag));
 assert.doesNotMatch(read('ios/App/App/Info.plist'),/NSUserTrackingUsageDescription/);
 assert.doesNotMatch(read('src/ads.js'),/requestTrackingAuthorization/);
});
