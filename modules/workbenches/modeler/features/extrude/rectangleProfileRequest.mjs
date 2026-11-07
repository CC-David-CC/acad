import {rectangleProfile, validateSegmentLoop} from './profilePlan.mjs';
import {resolveAuthoredRegions} from './authoredRegions.mjs';

// Computational request only: it is not a project format or a kernel result.
// The coordinator must independently bind revision, digest, frame and engine to
// its current accepted document and validate solver admission before dispatch.
const MAX_TEXT=1024*1024, MAX_ID=256, MAX_COORD=1e7, FRAME_TOL=1e-9;
const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===keys.slice().sort().join(',');
const triple=v=>Array.isArray(v)&&v.length===3&&[0,1,2].every(i=>Object.hasOwn(v,i)&&finite(v[i])&&Math.abs(v[i])<=MAX_COORD);
const pair=p=>p&&exact(p,['x','y'])&&finite(p.x)&&finite(p.y)&&Math.abs(p.x)<=MAX_COORD&&Math.abs(p.y)<=MAX_COORD;
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
function checkFrame(f){
 if(!exact(f,['origin','x','y','z'])||![f.origin,f.x,f.y,f.z].every(triple))fail('INVALID_FRAME','A bounded XY frame is required.');
 const basis=[[1,0,0],[0,1,0],[0,0,1]];
 if(![f.x,f.y,f.z].every((axis,i)=>axis.every((n,j)=>Math.abs(n-basis[i][j])<=FRAME_TOL)))fail('UNSUPPORTED_FRAME','Only principal XY frames are supported.');
 const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=[f.x[1]*f.y[2]-f.x[2]*f.y[1],f.x[2]*f.y[0]-f.x[0]*f.y[2],f.x[0]*f.y[1]-f.x[1]*f.y[0]];
 if([f.x,f.y,f.z].some(a=>Math.abs(dot(a,a)-1)>FRAME_TOL)||Math.abs(dot(f.x,f.y))>FRAME_TOL||Math.abs(dot(f.x,f.z))>FRAME_TOL||Math.abs(dot(f.y,f.z))>FRAME_TOL||cross.some((n,i)=>Math.abs(n-f.z[i])>FRAME_TOL))fail('INVALID_FRAME','The frame must be right-handed and orthonormal.');
}
export async function prepareRectangleExtrusion(input) {
 if(!exact(input,['version','unit','engine','revision','sketchDigest','faceId','regionId','frame','depth','sketchJSON']))fail('INVALID_REQUEST','Invalid rectangle extrusion request.');
 const request={};for(const key of Object.keys(input)){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Request fields must be data.');request[key]=d.value;}
 if(request.engine!=='occ')fail('UNSUPPORTED_ENGINE','Only the OCC research path is supported.');
 if((request.version!==1 && request.version!==2) || request.unit!=='millimeter' || typeof request.revision!=='string' || !request.revision || request.revision.length>256 ||
    typeof request.faceId!=='string'||!request.faceId||request.faceId.length>MAX_ID || typeof request.regionId!=='string'||request.regionId.length>8192 ||
    typeof request.sketchDigest!=='string'||!/^[a-f0-9]{64}$/.test(request.sketchDigest) ||
    typeof request.sketchJSON!=='string'||request.sketchJSON.length>MAX_TEXT || !finite(request.depth)||request.depth<=0||request.depth>1e6) fail('INVALID_REQUEST','Invalid rectangle extrusion request.');
 // Capture all caller-owned data before the asynchronous digest.
 const {version,revision,sketchDigest,faceId,regionId,depth,sketchJSON}=request;
 if(!exact(request.frame,['origin','x','y','z']))fail('INVALID_FRAME','A bounded XY frame is required.');
 const frame={};for(const key of ['origin','x','y','z']){
  const field=Object.getOwnPropertyDescriptor(request.frame,key),array=field?.value;
  if(!field?.enumerable||!Object.hasOwn(field,'value')||!Array.isArray(array)||array.length!==3||Reflect.ownKeys(array).sort().join(',')!=='0,1,2,length')fail('INVALID_FRAME','Frame fields must be dense data.');
  frame[key]=[0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(array,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_FRAME','Frame coordinates must be data.');return d.value});
 }
 checkFrame(frame);
 const digest=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON)));
 if(digest!==sketchDigest)fail('STALE_SKETCH','The authored sketch bytes changed.');
 let sketch;try{sketch=JSON.parse(sketchJSON)}catch{fail('INVALID_SKETCH','The authored sketch is not valid JSON.')}
 if(!sketch||sketch.version!==3||!Array.isArray(sketch.objects)||sketch.objects.length>10000||!sketch.metadata?.boundaryFrame)fail('UNSUPPORTED_SKETCH','A bounded four-edge profile sketch is required.');
 if(!Array.isArray(sketch.stages)||sketch.stages.length!==1||!Array.isArray(sketch.stages[0]?.constraints)||sketch.stages[0].constraints.length>128||!Array.isArray(sketch.stages[0]?.generators)||sketch.stages[0].generators.length)fail('UNSUPPORTED_SKETCH','One supported authored sketch stage is required.');
 // The sketch worker has already reconstructed/checked every equation. This
 // geometry planner still requires a four-edge rectangle. These known driving
 // relations do not change that profile class or authorize snapping. Admission
 // hints alone are not solver proof: the coordinator reconstructs the current
 // sketch in the real sketch Worker before sending its digest-bound result here.
 const allowed=new Set(['PCoincident','Horizontal','Vertical','LockPoint','SegmentLength','LengthRelation','Collinear','AxisSymmetry','SignedDistanceX','SignedDistanceY','ProjectedDistance']);
 if(sketch.stages[0].constraints.some(c=>!c||!allowed.has(c.typeId)||c.admission?.version!==1||!['accepted','redundant'].includes(c.admission.state)))fail('UNSUPPORTED_CONSTRAINT','Sketch constraints must have supported accepted or redundant admission.');
 checkFrame(sketch.metadata.boundaryFrame);
 for(const key of ['origin','x','y','z'])if(!frame[key].every((v,i)=>Math.abs(v-sketch.metadata.boundaryFrame[key][i])<=FRAME_TOL))fail('STALE_FRAME','The sketch face frame changed.');
 // Reference geometry cannot add a profile boundary. Every ordinary curve
 // remains part of this narrow classifier, so a new loop is never dropped.
 const profileObjects=sketch.objects.filter(o=>o?.role!=='construction'&&o?.type!=='Point');
 if(profileObjects.length!==4||sketch.objects.some(o=>!o||![null,'construction'].includes(o.role)||o.stage!==0||
   (o.role==='construction'&&!['Point','Segment','Arc','Circle','Ellipse','EllipticalArc','BezierCurve','BSpline'].includes(o.type))))fail('UNSUPPORTED_PROFILE','Four ordinary rectangle edges and optional reference geometry are required.');
 const ids=new Set(),edges=profileObjects.map(o=>{
  if(!o||o.type!=='Segment'||o.role!==null||o.stage!==0||typeof o.id!=='string'||!o.id||o.id.length>MAX_ID||ids.has(o.id)||!exact(o.data,['a','b'])||!pair(o.data.a)||!pair(o.data.b))fail('UNSUPPORTED_PROFILE','Exactly four distinct finite straight edges are required.');
  ids.add(o.id);return {id:faceId+'/'+o.id,a:{...o.data.a},b:{...o.data.b}};
 });
 const profile=rectangleProfile(edges);if(!profile)fail('UNSUPPORTED_PROFILE','The selected profile is not an axis-aligned rectangle.');
 let ordered;
 if(version===1){
  const {minX,maxX,minY,maxY}=profile,corners=[{x:minX,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY}];
  ordered=corners.map((a,i)=>{
   const b=corners[(i+1)%4],matches=edges.filter(e=>same(e.a,a)&&same(e.b,b)||same(e.b,a)&&same(e.a,b));
   if(matches.length!==1)fail('OPEN_OR_AMBIGUOUS_PROFILE','Edges must form one exact closed rectangle.');
   const edge=matches[0];return {id:edge.id,a:{...a},b:{...b},reversed:!same(edge.a,a)};
  });
 } else {
 // Preserve authored coordinates. The existing classifier admits up to its
 // 1e-7 mm axis/corner tolerance; it does not authorize snapping or joining.
 // Walk exact endpoint connections, with a stable start and edge ordering.
 const points=edges.flatMap(e=>[e.a,e.b]);
 const start=points.reduce((a,b)=>b.x<a.x||(b.x===a.x&&b.y<a.y)?b:a);
 const remaining=[...edges];let current=start;ordered=[];
 for(let i=0;i<4;i++){
  const candidates=remaining.filter(e=>same(e.a,current)||same(e.b,current)).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  if(candidates.length!==(i===0?2:1))fail('OPEN_OR_AMBIGUOUS_PROFILE','Edges must form one exact closed rectangle.');
  const edge=candidates[0],reversed=!same(edge.a,current),next=reversed?edge.a:edge.b;
  if(same(current,next)||(i<3&&same(next,start)))fail('OPEN_OR_AMBIGUOUS_PROFILE','Edges must form one exact closed rectangle.');
  ordered.push({id:edge.id,a:{...current},b:{...next},reversed});remaining.splice(remaining.indexOf(edge),1);current=next;
 }
 if(!same(current,start)||remaining.length)fail('OPEN_OR_AMBIGUOUS_PROFILE','Edges must form one exact closed rectangle.');
 // Use a translated area sum to avoid cancellation from a large origin.
 const area=ordered.reduce((sum,e)=>sum+(e.a.x-start.x)*(e.b.y-start.y)-(e.b.x-start.x)*(e.a.y-start.y),0);
 if(!Number.isFinite(area)||area===0)fail('INVALID_PROFILE','The rectangle has no oriented area.');
 if(area<0)ordered=ordered.reverse().map(e=>({id:e.id,a:e.b,b:e.a,reversed:!e.reversed}));
 }
 try{validateSegmentLoop(ordered);}catch{fail('INVALID_PROFILE','The rectangle is open, self-intersecting, or too small.')}
 let selected;try{if(!regionId.startsWith('sketch-region:'))throw Error();selected=JSON.parse(regionId.slice('sketch-region:'.length));
  const resolved=resolveAuthoredRegions(faceId,[edges.map(e=>e.id)],[profile],[selected],'separate');
  if(resolved.regions.length!==1||resolved.regions[0].descriptor.holes.length||'sketch-region:'+JSON.stringify(resolved.regions[0].descriptor)!==regionId)throw Error();
 }catch{fail('STALE_REGION','The selected region is unavailable or changed.');}
 const world=p=>frame.origin.map((n,i)=>n+frame.x[i]*p.x+frame.y[i]*p.y);
 return {version,op:'sketch.region.extrude.prepare',unit:'millimeter',engine:'occ',revision,sketchDigest,faceId,regionId,
  frame,depth,direction:frame.z.map(n=>n/Math.hypot(...frame.z)),bodyPolicy:'separate',edges:ordered,worldVertices:ordered.map(edge=>world(edge.a))};
}
