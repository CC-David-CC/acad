// Worker-only analytic join over the SAME current owned BRep and private index.
import {capturePlanarAttachmentObservation,PLANAR_ATTACHMENT_POLICY} from './ownedPlanarAttachmentProtocol.mjs';
const fail=(code,message,reason)=>{throw Object.assign(Error(message),{code,reason});};
export const ATTACHMENT_DIRECTION_EPS=1e-12;
export const ATTACHMENT_INCIDENCE_MM=1e-9;
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]),mul=(a,n)=>a.map(x=>x*n),add=(a,b)=>a.map((n,i)=>n+b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>{const n=Math.hypot(...v);if(!Number.isFinite(n)||Math.abs(n-1)>ATTACHMENT_DIRECTION_EPS)fail('UNSUPPORTED_FRAME_PARENT','Native attachment direction is unqualified.','DIRECTION_UNQUALIFIED');return mul(v,1/n);};
export function resolveNativePlanarAttachment({topology,index,sourceProfile,request}){
 if(!index?.plan||!sourceProfile||sourceProfile.region.id!==request.sourceRegionId||request.framePolicy!==PLANAR_ATTACHMENT_POLICY)fail('UNRESOLVED_SOURCE','The actual constructor datum is unavailable.','DATUM_CHANGED');
 const descriptors=index.plan.faces.filter(row=>row.id===request.selectionId);
 if(descriptors.length!==1)fail('UNRESOLVED_SOURCE','The authored face has no unique current descendant.',index.plan.unresolved?.find(row=>row.id===request.selectionId)?.reason||'REFERENCE_MISSING');
 const descriptor=descriptors[0];if(descriptor.role!=='last-cap'||descriptor.originFeatureId!==request.originFeatureId)fail('UNSUPPORTED_FRAME_PARENT','Select the actual last cap of the bound selected extrusion.','UNSUPPORTED_CAP');
 if(!index.plan.sourceContexts?.some(row=>row.kind==='sketch-profile'&&row.featureId===request.sourceFeatureId&&row.regionId===request.sourceRegionId))fail('UNRESOLVED_SOURCE','The current face does not inherit the selected constructor.','DATUM_CHANGED');
 let ordinal;try{ordinal=index.resolveFace(request.selectionId);}catch(error){fail('UNRESOLVED_SOURCE','The authored face is unresolved.',error?.code||'REFERENCE_MISSING');}
 const face=topology.faces[ordinal-1];if(!face||face.type!=='plane'||face.support!=='analytic-descriptor')fail('UNSUPPORTED_FRAME_PARENT','The resolved native face is not analytic planar support.','TYPE_CHANGED');
 if(!['FORWARD','REVERSED'].includes(face.orientation))fail('UNSUPPORTED_FRAME_PARENT','Native attachment orientation is unsupported.','ORIENTATION_UNSUPPORTED');
 const source=sourceProfile.frame,n=unit(face.analytic.normal),normal=mul(n,face.orientation==='FORWARD'?1:-1),z=unit(source.z),xDatum=unit(source.x),yDatum=unit(source.y);
 if(dot(normal,z)<0||Math.hypot(...cross(normal,z))>ATTACHMENT_DIRECTION_EPS||Math.abs(dot(xDatum,yDatum))>ATTACHMENT_DIRECTION_EPS)fail('UNSUPPORTED_FRAME_PARENT','Native cap/datum alignment is unqualified.','ALIGNMENT_UNQUALIFIED');
 const denominator=dot(z,n);if(Math.abs(denominator)<1-ATTACHMENT_DIRECTION_EPS)fail('UNSUPPORTED_FRAME_PARENT','Native cap/datum intersection is unqualified.','ALIGNMENT_UNQUALIFIED');
 const origin=add(source.origin,mul(z,dot(sub(face.analytic.origin,source.origin),n)/denominator));
 const projected=sub(xDatum,mul(normal,dot(xDatum,normal))),length=Math.hypot(...projected);if(!Number.isFinite(length)||length<1-ATTACHMENT_DIRECTION_EPS)fail('UNSUPPORTED_FRAME_PARENT','Native in-plane datum is unqualified.','ALIGNMENT_UNQUALIFIED');
 const x=mul(projected,1/length),y=cross(normal,x);
 const points=new Set();for(const wire of face.wires)for(const use of wire){const edge=topology.edges[use.edge-1];for(const vertex of edge.vertices)if(vertex)points.add(vertex);}
 if(Math.abs(dot(sub(origin,face.analytic.origin),n))>ATTACHMENT_INCIDENCE_MM||[...points].some(i=>Math.abs(dot(sub(topology.vertices[i-1].point,face.analytic.origin),n))>ATTACHMENT_INCIDENCE_MM))fail('UNSUPPORTED_FRAME_PARENT','Native plane incidence is unqualified.','INCIDENCE_UNQUALIFIED');
 return capturePlanarAttachmentObservation({version:1,unit:'millimeter',scope:'response-local',quality:'native-owned-planar-attachment',framePolicy:PLANAR_ATTACHMENT_POLICY,role:'last-cap',frame:{origin,x,y,z:normal},plane:{origin:face.analytic.origin,normal:face.analytic.normal,orientation:face.orientation}});
}
