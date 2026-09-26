(function(root){
  'use strict';
  const count = v => Number.isSafeInteger(v) && v >= 0 ? v : 0;
  function normalize(raw, data, makeProfile) {
    if (!raw || ![1,2].includes(raw.version) || !Array.isArray(raw.profiles) || !raw.profiles.length || raw.profiles.length > 3) return null;
    const sizes=[2,3,4,6,9],worldIds=new Set(data.worlds.map(w=>w.id));
    const puzzles = new Map(data.puzzles.map(q => [q.id,q]));
    const profiles = raw.profiles.map((source,i) => {
      const p = makeProfile(i), s = source && typeof source === 'object' ? source : {};
      if (data.worlds.some(w => w.id === s.world)) p.world = s.world;
      if (sizes.includes(s.size)) p.size = s.size;
      p.completed = [...new Set((Array.isArray(s.completed) ? s.completed : []).filter(id => puzzles.has(id)))];
      p.learned = [...new Set((Array.isArray(s.learned) ? s.learned : []).filter(n => sizes.includes(n)))];
      p.worldCompleted={};p.missions=[];p.badges=[];p.stars=0;
      p.difficulty=[0,1,2].includes(s.difficulty)?s.difficulty:0;
      const missionValid=k=>{if(typeof k!=='string')return false;const [w,route,c,step,...rest]=k.split(':');return !rest.length&&worldIds.has(w)&&['main','master'].includes(route)&&/^[0-5]$/.test(c)&&/^[0-2]$/.test(step);};
      p.missions=[...new Set((Array.isArray(s.missions)?s.missions:[]).filter(missionValid))];
      const badgeIds=new Set(['first','size-4','size-6','size-9','master-ten',...data.worlds.flatMap(w=>['trip-'+w.id,'album-'+w.id])]);
      p.badges=[...new Set((Array.isArray(s.badges)?s.badges:[]).filter(id=>badgeIds.has(id)))];
      p.rounds = Math.max(count(s.rounds), p.completed.length);
      p.assisted = Math.min(count(s.assisted), p.rounds);
      p.recent = (Array.isArray(s.recent) ? s.recent : []).filter(x => x && sizes.includes(x.size)).slice(-10).map(x => ({size:x.size,assisted:!!x.assisted}));
      for (const w of data.worlds) {
        p.worldCompleted[w.id]=[...new Set((Array.isArray(s.worldCompleted?.[w.id])?s.worldCompleted[w.id]:[]).filter(id=>puzzles.has(id)))];
        p.worldCounts[w.id] = Math.min(count(s.worldCounts?.[w.id]),p.rounds);
        p.album[w.id] = Math.min(6, count(s.album?.[w.id]));
        p.worldCounts[w.id]=Math.max(p.worldCounts[w.id],p.album[w.id]*3);
      }
      p.stars=p.missions.length+Object.values(p.worldCompleted).reduce((sum,ids)=>sum+ids.length,0);
      const g = s.game, q = puzzles.get(g?.id);
      if (q && Array.isArray(g.values) && g.values.length === q.size*q.size && g.values.every((v,j) => Number.isInteger(v) && v>=0 && v<=q.size && (!q.given[j] || q.given[j]===v))) {
        const cleanNotes=notes=>Array.from({length:q.size*q.size},(_,i)=>[...new Set((Array.isArray(notes?.[i])?notes[i]:[]).filter(v=>Number.isInteger(v)&&v>=1&&v<=q.size))]);
        const history = Array.isArray(g.history) ? g.history : [];
        const replay = g.values.slice();
        let validHistory = history.length <= 10000;
        for (let h=history.length-1; validHistory && h>=0; h--) {
          const x=history[h];
          if (!x || !Number.isInteger(x.i) || x.i<0 || x.i>=replay.length || q.given[x.i] || ![x.prev,x.next].every(v=>Number.isInteger(v)&&v>=0&&v<=q.size) || replay[x.i]!==x.next) validHistory=false;
          else replay[x.i]=x.prev;
        }
        const gameWorld=worldIds.has(g.world)?g.world:p.world;
        const solved=root.PikoEngine.valid(g.values,q.size);
        // A completed board without a recorded completion is reopened with one cell empty.
        const values=g.values.slice();
        if(solved&&!p.completed.includes(q.id))values[q.given.findIndex(v=>!v)]=0;
        let mission=null;
        if(g.mission&&typeof g.mission.master==='boolean'&&Number.isInteger(g.mission.chapter)&&Number.isInteger(g.mission.step)&&missionValid(gameWorld+':'+(g.mission.master?'master':'main')+':'+g.mission.chapter+':'+g.mission.step)&&(g.mission.master===(q.size===9)))mission={master:g.mission.master,chapter:g.mission.chapter,step:g.mission.step};
        const recorded=raw.version===1?p.completed.includes(q.id):mission?p.missions.includes(gameWorld+':'+(mission.master?'master':'main')+':'+mission.chapter+':'+mission.step):p.worldCompleted[gameWorld].includes(q.id);
        if(solved&&!recorded)values[q.given.findIndex(v=>!v)]=0;
        p.game={id:q.id,world:gameWorld,values,history:validHistory&&!solved?history.map(x=>({i:x.i,prev:x.prev,next:x.next,...(x.notes?{notes:cleanNotes(x.notes)}:{})})):[],notes:cleanNotes(g.notes),helped:!!g.helped,finished:solved&&recorded,isNew:false,mission,symbolOffset:count(g.symbolOffset)%9};
      }
      return p;
    });
    const s=raw.settings||{};
    return {version:2,...(raw.version===1?{legacyBackup:raw}:raw.legacyBackup?{legacyBackup:raw.legacyBackup}:{}),lang:['pl','en','de','es','fr'].includes(raw.lang)?raw.lang:'pl',active:Number.isInteger(raw.active)&&profiles[raw.active]?raw.active:0,profiles,settings:{sound:s.sound===true,music:s.music===true,motion:s.motion===true,reminder:[0,5,10,15].includes(s.reminder)?s.reminder:0}};
  }
  root.PikoState={normalize};
  if(typeof module==='object')module.exports={normalize};
})(typeof window!=='undefined'?window:globalThis);
