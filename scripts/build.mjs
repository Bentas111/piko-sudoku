import { build } from 'esbuild';
import { mkdir, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
await mkdir('www', { recursive: true });
for (const f of ['app.js','engine.js','state.js','progress.js','data.js','locales.js','style.css']) await copyFile(`src/${f}`, `www/${f}`);
await cp('src/assets', 'www/assets', { recursive: true });
const html = (await readFile('src/index.html','utf8'))
  .replace('<script src="app.js"></script>', '<script src="native.js"></script>');
await writeFile('www/index.html', html);
await build({ entryPoints: ['src/native.js'], outfile: 'www/native.js', bundle: true, minify: true, format: 'iife', target: ['es2020'] });
console.log('Built offline web assets and native bridge.');
