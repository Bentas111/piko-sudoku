const fs=require('node:fs');const m=JSON.parse(fs.readFileSync('release/aso/metadata.json','utf8'));
fs.copyFileSync('release/aso/metadata.json','release/aso/metadata-before-0.5.json');
for(const [lang,d] of Object.entries(m)){
 const pl=lang==='pl-PL';d.shortDescription=pl?'Sudoku obrazkowe: od 2×2 do 9×9, przygody, odznaki i gra offline.':'Picture sudoku: 2×2 to 9×9 puzzles, adventures, badges and offline play.';
 d.promotionalText=pl?'Od pierwszego 2×2 po wyzwanie 9×9. Odkrywaj 12 światów, kończ wyprawy i zbieraj obrazki oraz odznaki. 270 plansz i gra offline.':'From a first 2×2 puzzle to a 9×9 challenge. Explore 12 worlds, complete adventures and collect pictures and badges. 270 puzzles, playable offline.';
 for(const field of ['appleDescription','googleDescription']){
 let s=d[field].replaceAll('240','270').replaceAll('72 ilustracje','108 ilustracji').replaceAll('72 illustrations','108 illustrations');
 const extra=pl?'\n• ★ 9×9: dodatkowe wyzwanie z blokami 3×3. 30 plansz w trzech stopniach trudności, notatki i powiększanie bloków.':'\n• ★ 9×9: an optional challenge with 3×3 boxes. 30 puzzles in three difficulty levels, notes and enlarged boxes.';
 s=s.replace(pl?'• 4×4 i 6×6: większe plansze z dodatkową zasadą bloków.':'• 4×4 and 6×6: larger sudoku boards with an extra box rule.',(pl?'• 4×4 i 6×6: większe plansze z dodatkową zasadą bloków.':'• 4×4 and 6×6: larger sudoku boards with an extra box rule.')+extra);
 s=s.replace(pl?'na planszach 4×4 i 6×6':'na planszach 4×4, 6×6 i 9×9',pl?'na planszach 4×4, 6×6 i 9×9':'on 4×4, 6×6 and 9×9');
 if(!pl)s=s.replace('on 4×4 and 6×6 boards','on 4×4, 6×6 and 9×9 boards');
 const section=pl?'PRZYGODY, GWIAZDKI I ODZNAKI\nKażdy świat ma sześć wypraw po trzy etapy. Rozwiązuj plansze, odkrywaj obrazki i zbieraj gwiazdki. Podpowiedzi nie odbierają nagród. Album możesz ukończyć nawet na planszach 2×2; 9×9 to opcjonalne wyzwanie. W swobodnej grze samodzielnie wybierasz świat i rozmiar.\n\n':'ADVENTURES, STARS AND BADGES\nEach world has six adventures with three stages each. Solve puzzles, discover pictures and collect stars. Hints never take rewards away. You can complete your album on 2×2 grids; 9×9 is an optional challenge. Free play lets you choose your world and grid size.\n\n';
 s=s.replace(pl?'GRAJ W SWOIM TEMPIE':'PLAY AT YOUR OWN PACE',section+(pl?'GRAJ W SWOIM TEMPIE':'PLAY AT YOUR OWN PACE'));d[field]=s;
 }
 for(const [key,value] of Object.entries(d))fs.writeFileSync(`release/aso/${lang}-${key}.txt`,value+'\n');
}
fs.writeFileSync('release/aso/metadata.json',JSON.stringify(m,null,2)+'\n');
const limits={title:30,subtitle:30,keywords:100,promotionalText:170,shortDescription:80,appleDescription:4000,googleDescription:4000};const counts={};for(const [l,d]of Object.entries(m)){counts[l]={};for(const[k,v]of Object.entries(d)){counts[l][k]=[...v].length;if([...v].length>limits[k])throw Error(l+' '+k+' too long');}}
fs.writeFileSync('release/aso/validation.json',JSON.stringify(counts,null,2));
fs.writeFileSync('release/store-copy-pl-en.md','# Piko 0.5 — ASO PL/EN\n\n'+Object.entries(m).map(([l,d])=>'## '+l+'\n\n'+Object.entries(d).map(([k,v])=>'### '+k+'\n\n'+v+'\n').join('\n')).join('\n'));
console.log(counts);
