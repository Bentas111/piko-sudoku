(function(root){
 'use strict';
 const sizes=[2,3,4,6,9], blocks={2:null,3:null,4:[2,2],6:[2,3],9:[3,3]}, cache=new Map();
 function groups(n){
  if(!sizes.includes(n))throw new RangeError('Unsupported board size');
  if(cache.has(n))return cache.get(n);
  const out=[];
  for(let r=0;r<n;r++)out.push({kind:'row',cells:Array.from({length:n},(_,c)=>r*n+c)});
  for(let c=0;c<n;c++)out.push({kind:'col',cells:Array.from({length:n},(_,r)=>r*n+c)});
  const shape=blocks[n];
  if(shape){const [h,w]=shape;for(let r=0;r<n;r+=h)for(let c=0;c<n;c+=w)out.push({kind:'block',cells:Array.from({length:n},(_,i)=>(r+Math.floor(i/w))*n+c+i%w)});}
  out.forEach(g=>{Object.freeze(g.cells);Object.freeze(g);});Object.freeze(out);cache.set(n,out);return out;
 }
 function conflicts(board,n,i,v){return groups(n).filter(g=>g.cells.includes(i)).map(g=>({...g,other:g.cells.find(j=>j!==i&&board[j]===v)})).filter(g=>g.other!==undefined);}
 const peerCache=new Map();
 function candidates(board,n,i){if(!peerCache.has(n))peerCache.set(n,Array.from({length:n*n},(_,j)=>[...new Set(groups(n).filter(g=>g.cells.includes(j)).flatMap(g=>g.cells))].filter(k=>k!==j)));const used=new Set(peerCache.get(n)[i].map(j=>board[j]));return Array.from({length:n},(_,k)=>k+1).filter(v=>!used.has(v));}
 function valid(board,n){return board.length===n*n&&board.every(v=>Number.isInteger(v)&&v>=1&&v<=n)&&groups(n).every(g=>new Set(g.cells.map(i=>board[i])).size===n);}
 function countSolutions(board,n,limit=2){
  const a=board.slice();let count=0;
  if(a.length!==n*n||a.some((v,i)=>!Number.isInteger(v)||v<0||v>n||(v&&conflicts(a,n,i,v).length)))return 0;
  function rec(){let best=-1,opts=null;for(let i=0;i<a.length;i++){if(a[i])continue;const c=candidates(a,n,i);if(!c.length)return;if(!opts||c.length<opts.length){best=i;opts=c;}}
   if(best<0){count++;return;}for(const v of opts){a[best]=v;rec();a[best]=0;if(count>=limit)return;}}
  rec();return count;
 }
 function hint(board,puzzle){
  const n=puzzle.size;
  for(let i=0;i<board.length;i++)if(board[i]&&board[i]!==puzzle.solution[i])return {repair:true,cell:i};
  const gs=groups(n);
  for(const g of gs){const empty=g.cells.filter(i=>!board[i]);if(empty.length===1)return {cell:empty[0],value:puzzle.solution[empty[0]],groups:[g],kind:'missing'};}
  for(let i=0;i<board.length;i++)if(!board[i]){const c=candidates(board,n,i);if(c.length===1)return {cell:i,value:c[0],groups:gs.filter(g=>g.cells.includes(i)),kind:'single'};}
  for(const g of gs)for(let v=1;v<=n;v++){if(g.cells.some(i=>board[i]===v))continue;const options=g.cells.filter(i=>!board[i]&&candidates(board,n,i).includes(v));if(options.length===1)return {cell:options[0],value:v,groups:[g],kind:'hidden'};}
  const i=board.findIndex(v=>!v);return i<0?null:{cell:i,value:puzzle.solution[i],groups:[],kind:'show'};
 }
 function logicalSolve(puzzle){const a=puzzle.given.slice(),steps=[];while(a.includes(0)){const h=hint(a,puzzle);if(!h||h.repair||h.kind==='show')return {solved:false,steps};steps.push({kind:h.kind,cell:h.cell,value:h.value});a[h.cell]=h.value;}return {solved:valid(a,puzzle.size),steps};}
 const api={sizes,blocks,groups,conflicts,candidates,valid,countSolutions,hint,logicalSolve};
 if(typeof module!=='undefined')module.exports=api;else root.PikoEngine=api;
})(typeof window==='undefined'?globalThis:window);
