// Actual source/entry-derived TWO-tool plan. No authored tool or cached frame.
import {captureOwnedCounterboreIntent} from '../solid/ownedCounterboreIntent.mjs';
import {preparePolygonProfileExtrusion,polygonProfileRelation} from './polygonProfilePlan.mjs';
import {capturePlanarAttachmentObservation} from './ownedPlanarAttachmentProtocol.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export function planOwnedCounterbore({request,sourceProfile,entry,targetMetrics}){
 const intent=captureOwnedCounterboreIntent(request),source=preparePolygonProfileExtrusion(sourceProfile),p=source.request,f=p.frame,outer=source.loops[0];
 if(p.version!==3||p.region.boundaryProvenance||p.region.holes.length||outer.kind!=='polygon'||outer.vertices.length!==4||p.region.outer.length!==4||p.region.id!==intent.sourceRegionId)fail('COUNTERBORE_UNSUPPORTED_TARGET','A current whole four-Segment rectangle is required.');
 const vs=outer.vertices,xs=vs.map(v=>v[0]),ys=vs.map(v=>v[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 if(new Set(vs.map(v=>JSON.stringify(v))).size!==4||vs.some((v,i)=>{const q=vs[(i+1)%4];return ![minX,maxX].includes(v[0])||![minY,maxY].includes(v[1])||((v[0]===q[0])===(v[1]===q[1]));}))fail('COUNTERBORE_UNSUPPORTED_TARGET','The source rectangle must remain exactly axis-aligned in its own frame.');
 if(!(intent.stepDepth<p.depth))fail('COUNTERBORE_STEP_NOT_INTERIOR','Step depth must be strictly less than the current part thickness.');
 const actual=capturePlanarAttachmentObservation(entry),top=f.origin.map((n,i)=>n+f.z[i]*p.depth);
 if(actual.frame.origin.some((n,i)=>Math.abs(n-top[i])>1e-9)||actual.frame.z.some((n,i)=>Math.abs(n-f.z[i])>1e-12))fail('COUNTERBORE_ENTRY_UNRESOLVED','The actual last cap differs from the current source-derived top.');
 if(targetMetrics?.version!==2||targetMetrics.valid!==true||targetMetrics.solidCount!==1||!(targetMetrics.nativeVolume>0)||!Number.isFinite(targetMetrics.nativeVolume))fail('COUNTERBORE_UNSUPPORTED_TARGET','One actual valid positive Native constructor is required.');
 const center=[minX+(maxX-minX)/2,minY+(maxY-minY)/2],smallRadius=intent.throughDiameter/2,largeRadius=intent.stepDiameter/2;
 for(const radius of[smallRadius,largeRadius])if(polygonProfileRelation(outer,{kind:'circle',center,radius,area:Math.PI*radius*radius})!=='contains')fail('COUNTERBORE_OUTSIDE_PROFILE','Both bore supports must strictly clear the actual source rectangle.');
 const shoulder=p.depth-intent.stepDepth;
 if(!(shoulder>0&&shoulder<p.depth))fail('COUNTERBORE_STEP_NOT_INTERIOR','The represented shoulder is not strictly interior.');
 const dot=point=>point.reduce((n,x,i)=>n+(x-f.origin[i])*f.z[i],0);
 const tool=(label,radius,level,depth)=>{
  const origin=f.origin.map((n,i)=>n+f.z[i]*level),id='derived-counterbore-tool:'+intent.featureId+':'+label;
  const toolProfile={op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin,x:[...f.x],y:[...f.y],z:[...f.z]},depth,region:{id,outer:[{kind:'circle',id:id+':circle',center:[...center],radius}],holes:[]}};
  const prepared=preparePolygonProfileExtrusion(toolProfile),start=origin.map((n,i)=>n+f.x[i]*center[0]+f.y[i]*center[1]),end=start.map((n,i)=>n+f.z[i]*depth),a=dot(start),b=dot(end);
  if(![a,b,depth].every(Number.isFinite)||!(depth>0&&depth<=1e6)||!(b>p.depth)||label==='small'&&!(a<0)||label==='large'&&(!(a>0&&a<p.depth)||Math.abs(a-shoulder)>1e-9))fail('COUNTERBORE_CYLINDERS_UNQUALIFIED','The represented tools do not retain the requested source-relative intervals.');return prepared.request;
 };
 const smallTool=tool('small',smallRadius,-1,p.depth+2),largeTool=tool('large',largeRadius,shoulder,intent.stepDepth+1),firstRemoval=Math.PI*smallRadius*smallRadius*p.depth,secondRemoval=Math.PI*(largeRadius*largeRadius-smallRadius*smallRadius)*intent.stepDepth;
 if(![firstRemoval,secondRemoval].every(v=>Number.isFinite(v)&&v>0))fail('COUNTERBORE_CYLINDERS_UNQUALIFIED','Counterbore removal exceeds the numeric domain.');
 return freeze({smallTool,largeTool,firstRemoval,secondRemoval,centerLocal:center,smallRadius,largeRadius,materialRadius:largeRadius+(Math.min((maxX-minX)/2,(maxY-minY)/2)-largeRadius)/2,sourceDepth:p.depth,stepDepth:intent.stepDepth,shoulderLevel:shoulder,frame:f,expectedBounds:source.expected.bounds});
}
