// Worker-only additive consumer of the ACTUAL private extent preparation.
// Callers must obtain it from selectedExtentProfiles for the current source
// token; plain input data is not a live-source or Native ownership certificate.
import {captureOwnedHoleIntent} from '../solid/ownedHoleIntent.mjs';
import {captureOwnedBlindHoleIntent} from '../solid/ownedBlindHoleIntent.mjs';
import {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost} from '../solid/ownedLinearHolePatternIntent.mjs';
import {polygonProfileRelation,preparePolygonProfileExtrusion} from './polygonProfilePlan.mjs';
import {capturePlanarAttachmentObservation,PROFILE_EXTENT_ATTACHMENT_POLICY} from './ownedPlanarAttachmentProtocol.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const freeze=v=>{if(v&&typeof v==='object'){for(const item of Object.values(v))freeze(item);Object.freeze(v);}return v;};
function rectangle(prepared,regionId,blind=false){
 const code=blind?'BLIND_UNSUPPORTED_TARGET':'UNSUPPORTED_PROFILE',face=prepared.originalFace,r=prepared.request,interval=prepared.binding.interval;
 if(r.region.id!==regionId)fail(blind?code:'STALE_SOURCE','The actual source region changed.');
 const outer=face.loops[0];
 if(r.region.boundaryProvenance||r.region.holes.length||outer.kind!=='polygon'||outer.vertices.length!==4||r.region.outer.length!==4)fail(code,'One whole four-Segment rectangle without source holes is required.');
 const vs=outer.vertices,x=vs.map(p=>p[0]),y=vs.map(p=>p[1]),minX=Math.min(...x),maxX=Math.max(...x),minY=Math.min(...y),maxY=Math.max(...y);
 if(new Set(vs.map(p=>JSON.stringify(p))).size!==4||vs.some((p,i)=>{const q=vs[(i+1)%4];return ![minX,maxX].includes(p[0])||![minY,maxY].includes(p[1])||((p[0]===q[0])===(p[1]===q[1]));}))fail(code,'The source must remain exactly axis-aligned in its own sketch frame.');
 return {outer,minX,maxX,minY,maxY,frame:face.frame,interval};
}
function target(metrics,blind=false){
 const code=blind?'BLIND_UNSUPPORTED_TARGET':'UNSUPPORTED_TARGET',b=metrics?.nativeBounds;
 if(metrics?.version!==2||metrics.valid!==true||metrics.solidCount!==1||!Number.isFinite(metrics.nativeVolume)||metrics.nativeVolume<=0||!b||!['min','max'].every(k=>Array.isArray(b[k])&&b[k].length===3&&b[k].every(Number.isFinite))||b.min.some((n,i)=>n>=b.max[i]))fail(code,'One actual valid positive measured Native solid is required.');
 return b;
}
function tool(profile,blind=false){
 // Keep the existing positive V3 TOOL envelope. This is actual cutter intent,
 // never a shifted fake source profile. Large translated tools can refuse.
 try{preparePolygonProfileExtrusion(profile);}catch{fail(blind?'BLIND_FLOOR_UNQUALIFIED':'TOOL_DOMAIN','The actual derived cutter exceeds the existing V3 tool domain.');}return profile;
}
export function planExtentThroughHoles({request,prepared,targetMetrics}){
 const intent=captureOwnedHoleIntent(request),r=rectangle(prepared,intent.sourceRegionId),{outer,minX,maxX,minY,maxY,frame:f,interval}=r,bounds=target(targetMetrics),radius=intent.diameter/2;
 const slots=intent.kind==='centered-through'?['center']:['MIN_X_MIN_Y','MAX_X_MIN_Y','MAX_X_MAX_Y','MIN_X_MAX_Y'];
 const centersLocal=intent.kind==='centered-through'?[[minX+(maxX-minX)/2,minY+(maxY-minY)/2]]:[[minX+intent.offsetX,minY+intent.offsetY],[maxX-intent.offsetX,minY+intent.offsetY],[maxX-intent.offsetX,maxY-intent.offsetY],[minX+intent.offsetX,maxY-intent.offsetY]];
 const circles=centersLocal.map(center=>({kind:'circle',center,radius,area:Math.PI*radius*radius}));
 if(circles.some(c=>polygonProfileRelation(outer,c)!=='contains'))fail('HOLE_OUTSIDE_PROFILE','Each hole must strictly clear the actual rectangle.');
 for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++)if(polygonProfileRelation(circles[i],circles[j])!=='separate')fail('HOLES_OVERLAP','Every bore must remain strictly separated.');
 const levels=[];for(let i=0;i<8;i++){const point=[0,1,2].map(axis=>(i&(1<<axis)?bounds.max:bounds.min)[axis]);levels.push(dot(point.map((n,j)=>n-f.origin[j]),f.z));}
 const min=Math.min(...levels),max=Math.max(...levels),start=min-1,end=max+1,depth=end-start;
 if(![min,max,start,end,depth].every(Number.isFinite)||!(start<min&&min<max&&max<end&&depth>0&&depth<=1e6))fail('TOOL_DOMAIN','The actual Native target span has no supported through tool.');
 const expectedRemovedVolume=circles.length*Math.PI*radius*radius*interval.span;if(!Number.isFinite(expectedRemovedVolume)||expectedRemovedVolume<=0)fail('TOOL_DOMAIN','Prismatic bore removal is unrepresentable.');
 const toolProfiles=centersLocal.map((center,i)=>{
  const label='derived-extent-through:'+intent.featureId+':'+slots[i],frame={origin:f.origin.map((n,j)=>n+f.z[j]*start),x:[...f.x],y:[...f.y],z:[...f.z]},profile=tool({op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth,region:{id:label,outer:[{kind:'circle',id:label+':circle',center:[...center],radius}],holes:[]}});
  const first=frame.origin.map((n,j)=>n+f.x[j]*center[0]+f.y[j]*center[1]),last=first.map((n,j)=>n+f.z[j]*depth),a=dot(first.map((n,j)=>n-f.origin[j]),f.z),b=dot(last.map((n,j)=>n-f.origin[j]),f.z);
  if(![...first,...last,a,b].every(Number.isFinite)||!(a<min&&b>max))fail('TOOL_DOMAIN','Represented tool endpoints do not cross the actual target.');return profile;
 });
 return freeze({version:1,sourceRegionId:prepared.request.region.id,slots,centersLocal,radius,toolProfiles,expectedRemovedVolume,axialSpan:{min,max},scope:'extent-rectangle-native-aabb-through'});
}
export function planExtentBlindHole({request,prepared,entry,targetMetrics}){
 const intent=captureOwnedBlindHoleIntent(request),r=rectangle(prepared,intent.sourceRegionId,true),{outer,minX,maxX,minY,maxY,frame:f,interval}=r;target(targetMetrics,true);
 if(!(intent.depth<interval.span))fail('BLIND_DEPTH_NOT_INTERIOR','Blind depth must be strictly below the actual total material span.');
 const actual=capturePlanarAttachmentObservation(entry),upper=f.origin.map((n,i)=>n+f.z[i]*interval.upper);
 if(actual.framePolicy!==PROFILE_EXTENT_ATTACHMENT_POLICY||actual.role!=='upper-cap'||actual.frame.origin.some((n,i)=>Math.abs(n-upper[i])>1e-9)||actual.frame.z.some((n,i)=>Math.abs(n-f.z[i])>1e-12))fail('BLIND_ENTRY_UNRESOLVED','The actual upper cap differs from its source-owned interval.');
 const center=[minX+(maxX-minX)/2,minY+(maxY-minY)/2],radius=intent.diameter/2,circle={kind:'circle',center,radius,area:Math.PI*radius*radius};
 if(polygonProfileRelation(outer,circle)!=='contains')fail('BLIND_HOLE_OUTSIDE_PROFILE','The blind cutter must strictly clear the actual rectangle.');
 const floor=interval.upper-intent.depth,toolDepth=intent.depth+1,end=floor+toolDepth;
 if(![floor,toolDepth,end].every(Number.isFinite)||!(interval.lower<floor&&floor<interval.upper&&end>interval.upper&&toolDepth<=1e6))fail('BLIND_FLOOR_UNQUALIFIED','The represented blind floor/tool endpoint is unresolved.');
 const label='derived-extent-blind:'+intent.featureId,toolProfile=tool({op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:f.origin.map((n,i)=>n+f.z[i]*floor),x:[...f.x],y:[...f.y],z:[...f.z]},depth:toolDepth,region:{id:label,outer:[{kind:'circle',id:label+':circle',center,radius}],holes:[]}},true);
 const world=toolProfile.frame.origin.map((n,i)=>n+f.x[i]*center[0]+f.y[i]*center[1]),a=dot(world.map((n,i)=>n-f.origin[i]),f.z),b=dot(world.map((n,i)=>n+f.z[i]*toolDepth-f.origin[i]),f.z);
 if(!(a>interval.lower&&a<interval.upper&&b>interval.upper)||Math.abs(a-floor)>1e-9)fail('BLIND_FLOOR_UNQUALIFIED','The actual tool does not retain an interior floor.');
 const expectedRemovedVolume=Math.PI*radius*radius*intent.depth;if(!Number.isFinite(expectedRemovedVolume)||expectedRemovedVolume<=0)fail('BLIND_FLOOR_UNQUALIFIED','Blind removal is unrepresentable.');
 return freeze({toolProfile,expectedRemovedVolume,centerLocal:center,radius,sourceDepth:interval.span,blindDepth:intent.depth,lowerLevel:interval.lower,floorLevel:floor,entryLevel:interval.upper,frame:f,expectedBounds:prepared.expected.bounds});
}
export function planExtentLinearHolePattern({request,seed,existingHoles,prepared,targetMetrics}){
 const intent=captureOwnedLinearHolePatternIntent(request),original=captureOwnedHoleIntent(seed),cost=linearHolePatternNativeCost(intent.count);
 if(original.kind!=='centered-through')fail('UNSUPPORTED_SEED','Select an actual successful centered-through seed.');
 if(intent.seedFeatureId!==original.featureId||intent.engineRevision!==original.engineRevision||intent.featureId===original.sourceFeatureId)fail('STALE_SOURCE','The actual pattern seed/source identity changed.');
 if(!Array.isArray(existingHoles)||existingHoles.length<1||existingHoles.length>16||Reflect.ownKeys(existingHoles).length!==existingHoles.length+1)fail('INVALID_REQUEST','Expected bounded genuine hole records.');
 const ids=new Set(),holes=[];
 for(let i=0;i<existingHoles.length;i++){
  const d=Object.getOwnPropertyDescriptor(existingHoles,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Actual hole records must be dense own data.');
  const hole=captureOwnedHoleIntent(d.value);
  if(hole.featureId===intent.featureId||ids.has(hole.featureId)||['engineRevision','sourceFeatureId','sourceFaceId','sourceRegionId'].some(k=>hole[k]!==original[k]))fail('STALE_SOURCE','The actual known holes do not share one unique current source.');
  ids.add(hole.featureId);holes.push(hole);
 }
 const matches=holes.filter(h=>h.featureId===original.featureId);if(matches.length!==1||JSON.stringify(matches[0])!==JSON.stringify(original))fail('STALE_SOURCE','The centered seed changed from its genuine successful record.');
 const plans=holes.map(request=>planExtentThroughHoles({request,prepared,targetMetrics})),seedPlan=plans[holes.findIndex(h=>h.featureId===original.featureId)],r=rectangle(prepared,original.sourceRegionId),center=seedPlan.centersLocal[0],radius=seedPlan.radius;
 const existing=plans.flatMap(p=>p.centersLocal.map(center=>({kind:'circle',center,radius:p.radius,area:Math.PI*p.radius*p.radius}))),centersLocal=Array.from({length:intent.count},(_,i)=>[center[0]+i*intent.spacing,center[1]]),circles=centersLocal.slice(1).map(center=>({kind:'circle',center,radius,area:Math.PI*radius*radius}));
 if(centersLocal.some(p=>p.some(n=>!Number.isFinite(n))))fail('PATTERN_DOMAIN','Copied source-local centers are not representable.');
 if(circles.some(c=>polygonProfileRelation(r.outer,c)!=='contains'))fail('PATTERN_OUTSIDE_PROFILE','Every actual copy must strictly clear the rectangle.');
 for(let i=0;i<existing.length;i++)for(let j=i+1;j<existing.length;j++)if(polygonProfileRelation(existing[i],existing[j])!=='separate')fail('PATTERN_OVERLAP','Actual known holes do not remain strictly separated.');
 for(let i=0;i<circles.length;i++){
  if(existing.some(c=>polygonProfileRelation(circles[i],c)!=='separate'))fail('PATTERN_OVERLAP','A copied hole overlaps or touches an existing hole.');
  for(let j=i+1;j<circles.length;j++)if(polygonProfileRelation(circles[i],circles[j])!=='separate')fail('PATTERN_OVERLAP','Copied holes overlap or touch.');
 }
 const f=r.frame,toolProfiles=circles.map((circle,i)=>{
  const profile=structuredClone(seedPlan.toolProfiles[0]),label='derived-extent-pattern:'+intent.featureId+':'+(i+1);profile.region={id:label,outer:[{kind:'circle',id:label+':circle',center:[...circle.center],radius}],holes:[]};
  try{preparePolygonProfileExtrusion(profile);}catch{fail('PATTERN_DOMAIN','A copied actual cutter exceeds the existing construction domain.');}
  const p=profile.frame.origin.map((n,j)=>n+f.x[j]*circle.center[0]+f.y[j]*circle.center[1]),q=p.map((n,j)=>n+f.z[j]*profile.depth),lo=dot(p.map((n,j)=>n-f.origin[j]),f.z),hi=dot(q.map((n,j)=>n-f.origin[j]),f.z);
  if(![...p,...q,lo,hi].every(Number.isFinite)||!(lo<seedPlan.axialSpan.min&&hi>seedPlan.axialSpan.max))fail('PATTERN_DOMAIN','A copied tool does not cross the entire actual target.');return profile;
 });
 const expectedRemovedVolume=circles.length*Math.PI*radius*radius*r.interval.span;if(!Number.isFinite(expectedRemovedVolume)||expectedRemovedVolume<=0)fail('PATTERN_DOMAIN','Copied bore removal is unrepresentable.');
 return freeze({version:1,scope:'extent-source-local-centered-hole-linear-pattern',seedFeatureId:original.featureId,sourceRegionId:original.sourceRegionId,centersLocal,radius,toolProfiles,expectedRemovedVolume,axialSpan:{...seedPlan.axialSpan},nativeResultCost:cost});
}
