// Worker-only sufficient isolation proof. No proximity welding, arrangements,
// source rewriting, Native allocation or inferred material/region identities.
import {segmentRelation} from './simplePolygon.mjs';
import {separateArticulatedRegionBlocks} from './articulatedRegionSegments.mjs';
import {POLYGON_PROFILE_CLEARANCE_MM} from '../mount/polygonProfilePlan.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'OPEN_OR_AMBIGUOUS_PROFILE'});};
const pointKey=p=>JSON.stringify(p),same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const order=(a,b)=>a<b?-1:a>b?1:0;
const bits=new DataView(new ArrayBuffer(8));
function up(value){
 if(!Number.isFinite(value))fail('Component bounds are not finite.');
 if(value===0)return Number.MIN_VALUE;
 bits.setFloat64(0,value,false);let hi=bits.getUint32(0,false),lo=bits.getUint32(4,false);
 if(value>0){if(lo===0xffffffff){lo=0;hi++;}else lo++;}
 else if(lo===0){lo=0xffffffff;hi--;}else lo--;
 bits.setUint32(0,hi,false);bits.setUint32(4,lo,false);return bits.getFloat64(0,false);
}
const down=value=>-up(-value);
function bounds(profile){
 if(profile.kind==='circle')return{min:profile.center.map(v=>down(v-profile.radius)),max:profile.center.map(v=>up(v+profile.radius))};
 if(profile.kind==='polygon')return boundsOfPoints(profile.vertices);
 fail('Unknown closed-component bounds.');
}
function boundsOfPoints(points){return{min:[0,1].map(i=>Math.min(...points.map(p=>p[i]))),max:[0,1].map(i=>Math.max(...points.map(p=>p[i])))};}
function separated(a,b){
 // Outward round the circle support and the clearance addition. A successful
 // strict inequality encloses represented binary64 geometry plus clearance.
 return[0,1].some(i=>up(a.max[i]+POLYGON_PROFILE_CLEARANCE_MM)<b.min[i]||up(b.max[i]+POLYGON_PROFILE_CLEARANCE_MM)<a.min[i]);
}
export function partitionSelectedSegments(segments,{allowArticulatedRegions=false}={}){
 if(allowArticulatedRegions){
  const blocks=separateArticulatedRegionBlocks(segments),rest=partitionSelectedSegments(blocks.bridges);
  if(rest.closed.length)fail('A bridge cannot become a hidden closed boundary.');
  return{closed:blocks.closed,open:rest.open};
 }
 if(!Array.isArray(segments)||segments.length>512)throw Object.assign(Error('At most512 source segments are qualified.'),{code:'UNSUPPORTED_PROFILE'});
 const endpoints=new Map();
 for(const c of segments)for(const p of[c.a,c.b]){const k=pointKey(p),rows=endpoints.get(k)||[];rows.push(c);endpoints.set(k,rows);}
 if([...endpoints.values()].some(rows=>rows.length>2))fail('Branched ordinary source components require explicit arrangement.');
 const remaining=new Set(segments),closed=[],open=[];
 while(remaining.size){
  const first=[...remaining].sort((a,b)=>order(a.id,b.id))[0],component=new Set(),pending=[first];
  while(pending.length){const c=pending.pop();if(component.has(c))continue;component.add(c);for(const p of[c.a,c.b])for(const next of endpoints.get(pointKey(p)))if(!component.has(next))pending.push(next);}
  const ends=[...component].flatMap(c=>[c.a,c.b]).filter(p=>endpoints.get(pointKey(p)).length===1);
  if(ends.length!==0&&ends.length!==2)fail('Ordinary components must be simple closed loops or open chains.');
  const start=ends.length?ends.slice().sort((a,b)=>order(pointKey(a),pointKey(b)))[0]:first.a,ordered=[];let current=start;
  while(true){
   const choices=endpoints.get(pointKey(current)).filter(c=>component.has(c)&&remaining.has(c)).sort((a,b)=>order(a.id,b.id));
   if(!choices.length)break;
   const c=choices[0],end=same(c.a,current)?c.b:c.a;ordered.push({kind:'segment',id:c.id,a:current.slice(),b:end.slice()});remaining.delete(c);current=end;
   if(ordered.length>component.size)fail('Ordinary component traversal is ambiguous.');
  }
  if(ordered.length!==component.size||same(current,start)!==(ends.length===0))fail('Ordinary component traversal is incomplete.');
  if(!ends.length){closed.push(ordered);continue;}
  // An open endpoint graph can still enclose cells through geometric contacts.
  // Refuse every nonadjacent contact and adjacent backtracking, exactly.
  for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
   const a=ordered[i],b=ordered[j],r=segmentRelation(a.a,a.b,b.a,b.b);
   if(j===i+1?r!=='touching':r!=='separate')fail('Self-contacting or overlapping open chains require explicit arrangement.');
  }
  open.push(ordered);
 }
 return{closed,open};
}
export function analyzeIsolatedOpenComponents({loops,profiles,open,qualifiedToLocal}){
 if(loops.length!==profiles.length)fail('Incomplete closed-component preparation.');
 const closedBounds=profiles.map(bounds),openBounds=open.map(chain=>boundsOfPoints(chain.flatMap(c=>[c.a,c.b])));
 for(let i=0;i<openBounds.length;i++){
  if(closedBounds.some(box=>!separated(openBounds[i],box)))fail('An open component is not certified separate from every closed component.');
  for(let j=0;j<i;j++)if(!separated(openBounds[i],openBounds[j]))fail('Open components are not certified mutually separate.');
 }
 const ids=chain=>chain.map(c=>{if(!qualifiedToLocal.has(c.id))fail('Component source identity is unavailable.');return qualifiedToLocal.get(c.id);}).sort(order);
 const canonical=rows=>rows.sort((a,b)=>order(JSON.stringify(a.curveIds),JSON.stringify(b.curveIds)));
 return{version:1,policy:'v3-extrusion-isolated-open-chains',clearanceMm:POLYGON_PROFILE_CLEARANCE_MM,
  closedComponents:canonical(loops.map((loop,i)=>({kind:profiles[i].kind,curveIds:ids(loop)}))),
  openComponents:canonical(open.map(chain=>({kind:'open-chain',curveIds:ids(chain),reason:'OPEN_NON_BOUNDARY',separation:'outward-aabb-clearance'})))};
}
