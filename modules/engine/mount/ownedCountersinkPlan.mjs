// UNREGISTERED numeric-only Worker plan, not a feature/capability/owner issuer.
import {captureNumericCountersinkIntent} from '../solid/ownedCountersinkIntent.mjs';
export {captureNumericCountersinkIntent,COUNTERSINK_NUMERIC_KEYS} from '../solid/ownedCountersinkIntent.mjs';
import {preparePolygonProfileExtrusion,polygonProfileRelation} from './polygonProfilePlan.mjs';
import {capturePlanarAttachmentObservation} from './ownedPlanarAttachmentProtocol.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export const COUNTERSINK_QUALIFICATION=Object.freeze({supportMm:1e-7,direction:1e-8,angleRadians:1e-12,capIncidenceMm:1e-9,capAlignment:1e-12});
export function planOwnedCountersink({request,sourceProfile,entry,targetMetrics}){
 const intent=captureNumericCountersinkIntent(request),source=preparePolygonProfileExtrusion(sourceProfile),p=source.request,f=p.frame,outer=source.loops[0];
 if(p.version!==3||p.region.boundaryProvenance||p.region.holes.length||outer.kind!=='polygon'||outer.vertices.length!==4||p.region.outer.length!==4||p.region.id!==intent.sourceRegionId)fail('COUNTERSINK_UNSUPPORTED_TARGET','A current whole four-Segment rectangular selected constructor is required.');
 const vs=outer.vertices,xs=vs.map(v=>v[0]),ys=vs.map(v=>v[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 if(new Set(vs.map(v=>JSON.stringify(v))).size!==4||vs.some((v,i)=>{const q=vs[(i+1)%4];return ![minX,maxX].includes(v[0])||![minY,maxY].includes(v[1])||((v[0]===q[0])===(v[1]===q[1]));}))fail('COUNTERSINK_UNSUPPORTED_TARGET','The captured source must remain exactly axis-aligned in its own frame.');
 const actual=capturePlanarAttachmentObservation(entry),top=f.origin.map((n,i)=>n+f.z[i]*p.depth);
 if(actual.frame.origin.some((n,i)=>Math.abs(n-top[i])>1e-9)||actual.frame.z.some((n,i)=>Math.abs(n-f.z[i])>1e-12))fail('COUNTERSINK_ENTRY_UNRESOLVED','The actual selected last cap differs from the current source-derived entry.');
 if(targetMetrics?.version!==2||targetMetrics.valid!==true||targetMetrics.solidCount!==1||!Number.isFinite(targetMetrics.nativeVolume)||targetMetrics.nativeVolume<=0)fail('COUNTERSINK_UNSUPPORTED_TARGET','One actual valid positive Native constructor is required.');
 const center=[minX+(maxX-minX)/2,minY+(maxY-minY)/2],r=intent.throughDiameter/2,R=intent.entryDiameter/2,k=Math.tan(intent.includedAngleRadians/2),h=(R-r)/k,s=p.depth-h;
 if(![k,h,s].every(Number.isFinite)||!(k>0&&h>0&&h<p.depth&&s>0&&s<p.depth))fail('COUNTERSINK_DEPTH_NOT_INTERIOR','The represented conical depth must remain strictly interior; no clipping or through-all conversion is permitted.');
 for(const radius of [r,R])if(polygonProfileRelation(outer,{kind:'circle',center,radius,area:Math.PI*radius*radius})!=='contains')fail('COUNTERSINK_OUTSIDE_PROFILE','Both actual opening circles must strictly clear the captured source rectangle.');
 const id='derived-countersink-small:'+intent.featureId,small=preparePolygonProfileExtrusion({op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:f.origin.map((n,i)=>n-f.z[i]),x:[...f.x],y:[...f.y],z:[...f.z]},depth:p.depth+2,region:{id,outer:[{kind:'circle',id:id+':circle',center:[...center],radius:r}],holes:[]}});
 const origin=f.origin.map((n,i)=>n+f.x[i]*center[0]+f.y[i]*center[1]+f.z[i]*s),height=h+1,topRadius=R+k,frame=[...origin,...f.x,...f.y,...f.z];
 if(![height,topRadius].every(v=>Number.isFinite(v)&&v>0&&v<=1e6)||!(height>h&&topRadius>R&&topRadius>r))fail('COUNTERSINK_TOOL_UNQUALIFIED','The actual frustum overrun is not representable within the retained constructor domain.');
 for(const [level,radius] of [[0,r],[height,topRadius]])for(let j=0;j<3;j++){
  const c=origin[j]+level*f.z[j],extent=radius*Math.hypot(f.x[j],f.y[j]);if(![c-extent,c+extent].every(v=>Number.isFinite(v)&&Math.abs(v)<=4e6))fail('COUNTERSINK_TOOL_UNQUALIFIED','The actual derived frustum exceeds retained coordinate bounds.');
 }
 const representedSlope=(topRadius-r)/height;
 if(!(representedSlope>0)||Math.abs(2*Math.atan(representedSlope)-intent.includedAngleRadians)>1e-12||Math.abs(r+representedSlope*h-R)>1e-7)fail('COUNTERSINK_TOOL_UNQUALIFIED','The represented overrun tool cannot preserve the requested angle and entry radius.');
 // Same exact polynomial as R²+R*r-2*r², factored to avoid subtracting
 // nearly equal squared radii. It remains an expected increment, not metrics.
 const firstRemoval=Math.PI*r*r*p.depth,secondRemoval=Math.PI*h*(R-r)*(R+2*r)/3;
 if(![firstRemoval,secondRemoval].every(v=>Number.isFinite(v)&&v>0))fail('COUNTERSINK_TOOL_UNQUALIFIED','The two independent removal increments are not positive finite values.');
 return freeze({intent,smallTool:small.request,frustumTool:{frame,bottomRadius:r,topRadius,height},firstRemoval,secondRemoval,centerLocal:center,smallRadius:r,entryRadius:R,slope:k,sinkDepth:h,transitionLevel:s,sourceDepth:p.depth,frame:f,expectedBounds:source.expected.bounds,plannedNativeResults:4,plannedPartResults:5});
}
