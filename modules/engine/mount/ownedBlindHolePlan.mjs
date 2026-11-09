// Worker-derived tool only; no saved pose and no Native result fabricated here.
import {captureOwnedBlindHoleIntent} from '../solid/ownedBlindHoleIntent.mjs';
import {preparePolygonProfileExtrusion,polygonProfileRelation} from './polygonProfilePlan.mjs';
import {capturePlanarAttachmentObservation} from './ownedPlanarAttachmentProtocol.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export function planOwnedBlindHole({request,sourceProfile,entry,targetMetrics}){
 const intent=captureOwnedBlindHoleIntent(request),source=preparePolygonProfileExtrusion(sourceProfile),p=source.request,f=p.frame,outer=source.loops[0];
 if(p.version!==3||p.region.boundaryProvenance||p.region.holes.length||outer.kind!=='polygon'||outer.vertices.length!==4||p.region.outer.length!==4||p.region.id!==intent.sourceRegionId)fail('BLIND_UNSUPPORTED_TARGET','A current whole four-Segment rectangle is required.');
 const vs=outer.vertices,xs=vs.map(v=>v[0]),ys=vs.map(v=>v[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 if(new Set(vs.map(v=>JSON.stringify(v))).size!==4||vs.some((v,i)=>{const q=vs[(i+1)%4];return ![minX,maxX].includes(v[0])||![minY,maxY].includes(v[1])||((v[0]===q[0])===(v[1]===q[1]));}))fail('BLIND_UNSUPPORTED_TARGET','The source rectangle must remain exactly axis-aligned in its own frame.');
 if(!(intent.depth<p.depth))fail('BLIND_DEPTH_NOT_INTERIOR','Blind depth must be strictly less than the current part thickness.');
 const actual=capturePlanarAttachmentObservation(entry),top=f.origin.map((n,i)=>n+f.z[i]*p.depth);
 if(actual.frame.origin.some((n,i)=>Math.abs(n-top[i])>1e-9)||actual.frame.z.some((n,i)=>Math.abs(n-f.z[i])>1e-12))fail('BLIND_ENTRY_UNRESOLVED','The actual last cap differs from the current source-derived top.');
 if(targetMetrics?.version!==2||targetMetrics.valid!==true||targetMetrics.solidCount!==1||!(targetMetrics.nativeVolume>0)||!Number.isFinite(targetMetrics.nativeVolume))fail('BLIND_UNSUPPORTED_TARGET','One actual valid positive Native constructor is required.');
 const center=[minX+(maxX-minX)/2,minY+(maxY-minY)/2],radius=intent.diameter/2,circle={kind:'circle',center,radius,area:Math.PI*radius*radius};
 if(polygonProfileRelation(outer,circle)!=='contains')fail('BLIND_HOLE_OUTSIDE_PROFILE','The blind bore must strictly clear the actual source rectangle.');
 const floor=p.depth-intent.depth,toolDepth=intent.depth+1,end=floor+toolDepth;
 if(![floor,toolDepth,end].every(Number.isFinite)||!(floor>0&&floor<p.depth&&end>p.depth&&toolDepth<=1e6))fail('BLIND_FLOOR_UNQUALIFIED','The represented blind floor/tool endpoints are unresolved.');
 const label='derived-blind-tool:'+intent.featureId,toolProfile={op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:f.origin.map((n,i)=>n+f.z[i]*floor),x:[...f.x],y:[...f.y],z:[...f.z]},depth:toolDepth,region:{id:label,outer:[{kind:'circle',id:label+':circle',center,radius}],holes:[]}};
 const tool=preparePolygonProfileExtrusion(toolProfile),world=tool.request.frame.origin.map((n,i)=>n+f.x[i]*center[0]+f.y[i]*center[1]),dot=p=>p.reduce((n,x,i)=>n+(x-f.origin[i])*f.z[i],0),a=dot(world),b=dot(world.map((n,i)=>n+f.z[i]*toolDepth));
 if(!(a>0&&a<p.depth&&b>p.depth)||Math.abs(a-floor)>1e-9)fail('BLIND_FLOOR_UNQUALIFIED','The represented tool does not retain the actual interior floor.');
 const expectedRemovedVolume=Math.PI*radius*radius*intent.depth;
 if(!Number.isFinite(expectedRemovedVolume)||expectedRemovedVolume<=0)fail('BLIND_FLOOR_UNQUALIFIED','Blind removal exceeds the numeric domain.');
 return freeze({toolProfile,expectedRemovedVolume,centerLocal:center,radius,sourceDepth:p.depth,blindDepth:intent.depth,lowerLevel:0,floorLevel:floor,entryLevel:p.depth,frame:f,expectedBounds:source.expected.bounds});
}
