(function(root){
 'use strict';
 const chapters=6, stepsPerChapter=3;
 const route=(world,master=false)=>world+':'+(master?'master':'main');
 const stageKey=(world,master,chapter,step)=>route(world,master)+':'+chapter+':'+step;
 function chapterDone(p,world,master,chapter){return Array.from({length:stepsPerChapter},(_,s)=>stageKey(world,master,chapter,s)).every(k=>(p.missions||[]).includes(k));}
 function available(p,world,master,chapter){return chapter===0||chapterDone(p,world,master,chapter-1);}
 function nextStep(p,world,master,chapter){for(let s=0;s<stepsPerChapter;s++)if(!(p.missions||[]).includes(stageKey(world,master,chapter,s)))return s;return 0;}
 function complete(p,puzzle,world){
  p.worldCompleted||={};p.missions||=[];p.stars||=0;p.badges||=[];
  const g=p.game, mission=g.mission, prior=p.album[world]||0;
  p.rounds++;if(g.helped)p.assisted++;
  p.recent.push({size:puzzle.size,assisted:!!g.helped});p.recent=p.recent.slice(-10);
  if(!p.completed.includes(puzzle.id))p.completed.push(puzzle.id);
  const list=p.worldCompleted[world]||(p.worldCompleted[world]=[]);
  let fresh=false;
  if(mission){const k=stageKey(world,mission.master,mission.chapter,mission.step);if(!p.missions.includes(k)){p.missions.push(k);fresh=true;}}
  else if(!list.includes(puzzle.id)){list.push(puzzle.id);fresh=true;}
  if(fresh){p.stars++;p.worldCounts[world]=(p.worldCounts[world]||0)+1;}
  p.album[world]=Math.max(prior,Math.min(6,Math.floor((p.worldCounts[world]||0)/3)));
  const earned=[];
  const award=id=>{if(!p.badges.includes(id)){p.badges.push(id);earned.push(id);}};
  award('first');if(puzzle.size>=4)award('size-'+puzzle.size);
  if(mission&&chapterDone(p,world,mission.master,mission.chapter))award('trip-'+world);
  if(p.album[world]===6)award('album-'+world);
  if(p.completed.filter(id=>id.startsWith('9-')).length>=10)award('master-ten');
  return {fresh,sticker:p.album[world]>prior,badges:earned};
 }
 const api={chapters,stepsPerChapter,route,stageKey,chapterDone,available,nextStep,complete};
 if(typeof module==='object')module.exports=api;else root.PikoProgress=api;
})(typeof window==='undefined'?globalThis:window);
