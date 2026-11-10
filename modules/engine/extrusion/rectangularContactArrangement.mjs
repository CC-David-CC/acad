// Worker-only, whole-source contact proof. No source loop assignment is made
// for indistinguishable duplicate shared sides. Every actual owner survives.
import {analyzeSimplePolygon} from './simplePolygon.mjs';
import {contactArrangementPolicy,canonicalArrangement,canonicalBoundaryCycle,sourceSpanId,arrangementRegionIdentity,captureArrangementDescriptor,captureArrangementAnalysis} from './selectedArrangementDescriptor.mjs';
const fail=(message,code='UNSUPPORTED_REGION_TOPOLOGY')=>{throw Object.assign(Error(message),{code});};
const cmp=(a,b)=>a<b?-1:a>b?1:0,pointCmp=(a,b)=>a[0]-b[0]||a[1]-b[1],key=p=>JSON.stringify(p),edgeKey=(a,b)=>JSON.stringify([a,b].sort(pointCmp));
const on=(p,c)=>c.a[0]===c.b[0]?p[0]===c.a[0]&&p[1]>=Math.min(c.a[1],c.b[1])&&p[1]<=Math.max(c.a[1],c.b[1]):p[1]===c.a[1]&&p[0]>=Math.min(c.a[0],c.b[0])&&p[0]<=Math.max(c.a[0],c.b[0]);
function rectangle(walk){
 const points=walk.map(h=>h.a),min=[0,1].map(i=>Math.min(...points.map(p=>p[i]))),max=[0,1].map(i=>Math.max(...points.map(p=>p[i])));
 if(!min.every((v,i)=>v<max[i])||walk.some(h=>h.a[0]===h.b[0]?![min[0],max[0]].includes(h.a[0]):![min[1],max[1]].includes(h.a[1])))return null;
 const corners=[[min[0],min[1]],[max[0],min[1]],[max[0],max[1]],[min[0],max[1]]];
 if(corners.some(c=>!points.some(p=>p[0]===c[0]&&p[1]===c[1])))return null;
 return {min,max,sides:corners.map((p,i)=>edgeKey(p,corners[(i+1)%4]))};
}
export async function deriveRectangleContactArrangement({faceId,segments,qualifiedToLocal}){
 if(segments.length!==8||segments.some(c=>c.kind!=='segment'||!((c.a[0]===c.b[0])!==(c.a[1]===c.b[1]))))return null;
 const local=c=>qualifiedToLocal.get(c.id),curves=segments.slice().sort((a,b)=>cmp(local(a),local(b))),sourceCurveIds=curves.map(local);
 if(sourceCurveIds.some(id=>typeof id!=='string'||!id)||new Set(sourceCurveIds).size!==8)fail('Contact source must retain all eight actual identities.');
 const sourceIds=new Set(sourceCurveIds),events=new Map(),add=p=>events.set(key(p),p.slice());
 for(const c of curves){add(c.a);add(c.b);}
 for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
  const c=curves[i],d=curves[j],cv=c.a[0]===c.b[0],dv=d.a[0]===d.b[0];
  if(cv!==dv){const v=cv?c:d,h=cv?d:c,p=[v.a[0],h.a[1]];if(on(p,c)&&on(p,d))add(p);}
  else if(cv?c.a[0]===d.a[0]:c.a[1]===d.a[1])for(const p of[c.a,c.b,d.a,d.b])if(on(p,c)&&on(p,d))add(p);
 }
 if(events.size>16)return null;
 const spans=new Map(),intervals=new Map(curves.map(c=>[local(c),[]]));
 for(const c of curves){const axis=c.a[0]===c.b[0]?1:0,points=[...events.values()].filter(p=>on(p,c)).sort((a,b)=>a[axis]-b[axis]);
  if(points.length<2||points[0][axis]!==Math.min(c.a[axis],c.b[axis])||points.at(-1)[axis]!==Math.max(c.a[axis],c.b[axis]))return null;
  for(let i=0;i+1<points.length;i++){const a=points[i],b=points[i+1],k=edgeKey(a,b);let span=spans.get(k);if(!span){span={a,b,owners:[],cells:[]};spans.set(k,span);}span.owners.push(local(c));intervals.get(local(c)).push(k);}
 }
 if(spans.size>32||[...spans.values()].some(s=>s.owners.length>2))return null;
 const outgoing=new Map(),halfedges=[],direction=(a,b)=>b[0]>a[0]?0:b[1]>a[1]?1:b[0]<a[0]?2:3;
 for(const span of spans.values()){const a={span,a:span.a,b:span.b,used:false},b={span,a:span.b,b:span.a,used:false};a.twin=b;b.twin=a;for(const h of[a,b]){h.direction=direction(h.a,h.b);const rows=outgoing.get(key(h.a))||[];rows.push(h);outgoing.set(key(h.a),rows);halfedges.push(h);}}
 for(const rows of outgoing.values()){rows.sort((a,b)=>a.direction-b.direction);if(new Set(rows.map(h=>h.direction)).size!==rows.length)return null;}
 const reached=new Set(),pending=[[...outgoing.keys()].sort()[0]];while(pending.length){const p=pending.pop();if(reached.has(p))continue;reached.add(p);for(const h of outgoing.get(p))pending.push(key(h.b));}
 if(reached.size!==events.size)return null; // Disconnected/gapped old paths stay unchanged.
 const faces=[];halfedges.sort((a,b)=>pointCmp(a.a,b.a)||pointCmp(a.b,b.b));
 for(const start of halfedges){if(start.used)continue;const walk=[];let h=start;
  do{if(h.used||walk.length>=32)return null;h.used=true;walk.push(h);const rows=outgoing.get(key(h.b)),at=rows.indexOf(h.twin);if(at<0)return null;h=rows[(at+rows.length-1)%rows.length];}while(h!==start);
  let polygon;try{polygon=analyzeSimplePolygon(walk.map(h=>h.a));}catch(error){if(['ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA','INVALID_PROFILE'].includes(error.code))return null;throw error;}
  if(polygon.winding>0){const box=rectangle(walk);if(!box)return null;faces.push({walk,box,area:polygon.area});}
 }
 if(faces.length!==2||spans.size-events.size+1!==2||halfedges.some(h=>!h.used))return null;
 const [a,b]=faces.map(f=>f.box),lo=[0,1].map(i=>Math.max(a.min[i],b.min[i])),hi=[0,1].map(i=>Math.min(a.max[i],b.max[i]));
 if(!((lo[0]===hi[0]&&lo[1]<hi[1])||(lo[1]===hi[1]&&lo[0]<hi[0])))return null;
 const actual=curves.map(c=>edgeKey(c.a,c.b)).sort(),expected=faces.flatMap(f=>f.box.sides).sort();
 if(canonicalArrangement(actual)!==canonicalArrangement(expected))return null;
 // The exact whole-source contact domain is established. All remaining
 // failures refuse, never silently fall back to another interpretation.
 for(const face of faces)for(const h of face.walk)h.span.cells.push(face);
 if([...spans.values()].some(s=>s.cells.length<1||s.cells.length>2||s.owners.length!==s.cells.length)||[...spans.values()].filter(s=>s.cells.length===2).length!==1)fail('Contact incidence or shared-owner coverage is ambiguous.');
 const eventRefs=new Map(),seen=new Set();for(const [k,p]of events){const ref={incidentCurveIds:curves.filter(c=>on(p,c)).map(local).sort()},identity=canonicalArrangement(ref);if(ref.incidentCurveIds.length<2||seen.has(identity))fail('Actual source incidence does not uniquely bind a contact event.');seen.add(identity);eventRefs.set(k,ref);}
 const refs=[];for(const span of spans.values()){
  if(span.a[0]===span.b[0]&&span.a[1]===span.b[1])fail('Source contact spans require distinct represented endpoints.');
  const sourceSpan={kind:'source-span',owners:span.owners.slice().sort(),ends:[eventRefs.get(key(span.a)),eventRefs.get(key(span.b))].sort((a,b)=>cmp(canonicalArrangement(a),canonicalArrangement(b)))},id=await sourceSpanId(sourceSpan);span.ref={id,sourceSpan};refs.push(span.ref);
 }
 refs.sort((a,b)=>cmp(a.id,b.id));
 const cells=faces.map(face=>{const descriptor=captureArrangementDescriptor({version:3,kind:'axis-rectangle-contact-cell',sourceCurveIds,outerBoundaryRefs:canonicalBoundaryCycle(face.walk.map(h=>h.span.ref)),holeBoundaryRefs:[]},sourceIds);return{regionId:arrangementRegionIdentity(faceId,descriptor),descriptor,outer:face.walk.map(h=>({kind:'segment',id:h.span.ref.id,a:h.a.slice(),b:h.b.slice()})),area:face.area};}).sort((a,b)=>cmp(a.regionId,b.regionId));
 const sourceAnalysis=captureArrangementAnalysis({version:3,policy:contactArrangementPolicy,sourceCurveIds,spans:refs,sourceIntervals:[...intervals].map(([curveId,keys])=>({curveId,spanIds:keys.map(k=>spans.get(k).ref.id)})),cells:cells.map(c=>c.regionId)},sourceIds,cells);
 return {cells,sourceAnalysis};
}
