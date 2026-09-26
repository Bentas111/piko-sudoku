const fs=require('node:fs');
for(const f of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(f,'utf8'));p.version='0.5.0';if(p.packages?.[''])p.packages[''].version='0.5.0';fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');}
for(const f of ['ios/App/App.xcodeproj/project.pbxproj','release/piko-ios.yml']){let s=fs.readFileSync(f,'utf8').replaceAll('MARKETING_VERSION = 0.4.0','MARKETING_VERSION = 0.5.0').replaceAll('MARKETING_VERSION=0.4.0','MARKETING_VERSION=0.5.0').replaceAll('CURRENT_PROJECT_VERSION = 4','CURRENT_PROJECT_VERSION = 5');fs.writeFileSync(f,s);}
let g=fs.readFileSync('android/app/build.gradle','utf8').replace('versionCode 4','versionCode 5').replace('versionName "0.4.0"','versionName "0.5.0"');fs.writeFileSync('android/app/build.gradle',g);
let t=fs.readFileSync('tests/ios-config.test.cjs','utf8').replace("assert.equal(config.buildSettings.MARKETING_VERSION,'0.4.0')","assert.equal(config.buildSettings.MARKETING_VERSION,JSON.parse(read('package.json')).version)");fs.writeFileSync('tests/ios-config.test.cjs',t);
let te=fs.readFileSync('src/test-engine.cjs','utf8').replace('4/6 row-column-block','4/6/9 row-column-block');fs.writeFileSync('src/test-engine.cjs',te);
// A standalone offline preview uses the same shipped app, with embedded assets.
let html=fs.readFileSync('src/index.html','utf8'),css=fs.readFileSync('src/style.css','utf8');
const dataUrl=p=>{const ext=p.split('.').pop(),mime=ext==='png'?'image/png':ext==='mp3'?'audio/mpeg':'font/woff2';return 'data:'+mime+';base64,'+fs.readFileSync('src/'+p).toString('base64');};
css=css.replace(/url\('([^']+)'\)/g,(_,p)=>`url('${dataUrl(p)}')`);
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>');
for(const file of ['data.js','engine.js','progress.js','state.js','locales.js','app.js']){let js=fs.readFileSync('src/'+file,'utf8');js=js.replace(/assets\/[a-z0-9-]+\.png/g,p=>dataUrl(p)).replace(/assets\/audio\/[a-z0-9-]+\.mp3/g,p=>dataUrl(p));html=html.replace(`<script src="${file}"></script>`,'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>');}
fs.writeFileSync('../Piko Sudoku 0.5.html',html);
