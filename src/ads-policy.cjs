// No timers trigger impressions: only a new, eligible completion can request a banner.
function createAdPolicy({everyRounds=3,cooldownMs=120000,now=Date.now}={}) {
  const seen=new Set();let last=now(),epoch=0;
  return {
    cancel(){return ++epoch;},
    current(token){return token===epoch;},
    claim({view,key,rounds,test=false}){
      if(test&&view==='settings')return ++epoch;
      if(view!=='result'||!key||seen.has(key))return null;
      seen.add(key);
      if(rounds<everyRounds||rounds%everyRounds!==0||now()-last<cooldownMs)return null;
      last=now();return ++epoch;
    }
  };
}
module.exports={createAdPolicy};
