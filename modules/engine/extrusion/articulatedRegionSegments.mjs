// Exact endpoint graph interpretation for simple closed boundary blocks.
// Articulation contacts retain every authored curve. No welding, splitting,
// generated IDs or turn-angle choice is applied to the source.
const fail=message=>{throw Object.assign(Error(message),{code:'OPEN_OR_AMBIGUOUS_PROFILE'});};
const key=p=>JSON.stringify(p),same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const order=(a,b)=>a<b?-1:a>b?1:0;
export function separateArticulatedRegionBlocks(segments){
 if(!Array.isArray(segments)||segments.length>512)throw Object.assign(Error('At most512 source segments are qualified.'),{code:'UNSUPPORTED_PROFILE'});
 const vertices=new Map(),edgeIds=new Set();
 for(const curve of segments){
  if(!curve||curve.kind!=='segment'||typeof curve.id!=='string'||!curve.id||edgeIds.has(curve.id)||!Array.isArray(curve.a)||!Array.isArray(curve.b)||curve.a.length!==2||curve.b.length!==2||![...curve.a,...curve.b].every(Number.isFinite)||same(curve.a,curve.b))fail('Expected distinct actual nonzero source Segments.');
  edgeIds.add(curve.id);for(const [from,to] of [[curve.a,curve.b],[curve.b,curve.a]]){const k=key(from),rows=vertices.get(k)||[];rows.push({curve,next:key(to)});vertices.set(k,rows);}
 }
 const discovered=new Map(),low=new Map(),stack=[],blocks=[];let clock=0;
 function visit(vertex,parent){
  discovered.set(vertex,++clock);low.set(vertex,clock);
  for(const {curve,next} of vertices.get(vertex).slice().sort((a,b)=>order(a.curve.id,b.curve.id))){
   if(curve===parent)continue;
   if(!discovered.has(next)){
    stack.push(curve);visit(next,curve);low.set(vertex,Math.min(low.get(vertex),low.get(next)));
    if(low.get(next)>=discovered.get(vertex)){const block=[];let edge;do{edge=stack.pop();if(!edge)fail('Incomplete endpoint block.');block.push(edge);}while(edge!==curve);blocks.push(block);}
   }else if(discovered.get(next)<discovered.get(vertex)){stack.push(curve);low.set(vertex,Math.min(low.get(vertex),discovered.get(next)));}
  }
 }
 for(const vertex of [...vertices.keys()].sort(order))if(!discovered.has(vertex))visit(vertex,null);
 if(stack.length)fail('Incomplete endpoint graph interpretation.');
 const closed=[],bridges=[];
 for(const block of blocks){
  if(block.length===1){bridges.push(block[0]);continue;}
  const endpoints=new Map();for(const curve of block)for(const point of [curve.a,curve.b]){const k=key(point),rows=endpoints.get(k)||[];rows.push(curve);endpoints.set(k,rows);}
  if(block.length<3||[...endpoints.values()].some(rows=>rows.length!==2))fail('Shared edges, chords and non-articulation branches require explicit arrangement.');
  const remaining=new Set(block),first=block.slice().sort((a,b)=>order(a.id,b.id))[0],start=first.a;let point=start;const loop=[];
  do{const choices=endpoints.get(key(point)).filter(c=>remaining.has(c)).sort((a,b)=>order(a.id,b.id));if(!choices.length)fail('Incomplete boundary block.');const curve=choices[0],next=same(curve.a,point)?curve.b:curve.a;loop.push({kind:'segment',id:curve.id,a:point.slice(),b:next.slice()});remaining.delete(curve);point=next;}while(!same(point,start)&&loop.length<=block.length);
  if(remaining.size||!same(point,start)||loop.length!==block.length)fail('Ambiguous boundary block traversal.');closed.push(loop);
 }
 const census=[...closed.flat(),...bridges].map(c=>c.id);
 if(census.length!==segments.length||new Set(census).size!==segments.length||census.some(id=>!edgeIds.has(id)))fail('Source component census must retain every original curve exactly once.');
 // Bridges retain the existing open-chain classifier and isolation proof.
 // A bridge touching a closed block therefore remains an explicit refusal.
 return{closed:closed.sort((a,b)=>order(JSON.stringify(a.map(c=>c.id).sort()),JSON.stringify(b.map(c=>c.id).sort()))),bridges:bridges.sort((a,b)=>order(a.id,b.id))};
}
