// Private same-invocation Native facts. Never authored topology or a THRU flag.
import {deriveCylinderCutWitness} from './cylinderCutWitness.mjs';
import {validatePrismProvenance,validateOwnedTopology} from './ownedTopologyContract.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
import {preparePolygonProfileExtrusion} from './polygonProfilePlan.mjs';
import {inspectFiniteCylinder,FINITE_CYLINDER_REFUSAL_CODES} from './prismaticBoreFacts.mjs';
const fail=(message,code='COUNTERBORE_CYLINDERS_UNQUALIFIED')=>{throw Object.assign(Error(message),{code});};
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const witnessCodes=['DRAWING_WITNESS_UNAVAILABLE','DRAWING_WITNESS_UNSUPPORTED_TOOL','DRAWING_WITNESS_INPUT_MISMATCH'];
function toolCylinder(input){try{return deriveCylinderCutWitness(input);}catch(e){if(!witnessCodes.includes(e?.code))throw e;fail('The actual circular tool has no unique qualified cylindrical descendant.');}}
function inheritedFace(ancestry,topology,sourceIndex,label,code='COUNTERBORE_CYLINDERS_UNQUALIFIED'){
 if(ancestry?.status!=='available'||ancestry.data.faces[sourceIndex-1]?.generated.faces.length)fail('Actual '+label+' ancestry is unavailable or generated.',code);
 const claims=reconcileNativeSelectionClaims({sources:[{claims:[{kind:'face',id:label,sourceIndex}],ancestry:ancestry.data}],topology});if(!claims.resolved.some(r=>r.id===label))fail('Actual '+label+' is lost, split or merged.',code);return claims.resolveFace(label);
}
function shell(topology){
 validateOwnedTopology(topology);if(topology.solidCount!==1)fail('The result must be one actual valid solid.');
 const owners=new Map();for(const face of topology.faces){if(!['FORWARD','REVERSED'].includes(face.orientation)||!face.wires.length)fail('An actual face has unsupported orientation or no wires.');for(const wire of face.wires){if(!wire.length)fail('An actual wire is empty.');for(const use of wire){if(!['FORWARD','REVERSED'].includes(use.orientation))fail('An actual edge occurrence is unsupported.');if(!owners.has(use.edge))owners.set(use.edge,[]);owners.get(use.edge).push({face:face.index,...use});}}}
 // Native catalog uses TopExp_Explorer(face,WIRE) + WireExplorer(W,face):
 // their default cumulative orientation already applies face/wire traversal.
 // Do not multiply face orientation into these exported uses a second time.
 for(const edge of topology.edges){
  const rows=owners.get(edge.index)||[];
  if(edge.degenerated||rows.length!==2||rows[0].orientation===rows[1].orientation)fail('Native edge incidence is not a closed oriented shell.');
  if(rows[0].face===rows[1].face?rows.some(r=>!r.seam):rows.some(r=>r.seam))fail('Native seam/ordinary incidence is inconsistent.');
 }

 return owners;
}
function extent(topology,cylinder,frame){try{return inspectFiniteCylinder(topology,cylinder,frame);}catch(e){if(!FINITE_CYLINDER_REFUSAL_CODES.includes(e?.code))throw e;fail('An actual cylindrical interval differs from the requested finite span.');}}
function rim(topology,cylinder,frame,level){
 const rows=topology.faces[cylinder.resultFace-1].wires.flat().filter(u=>!u.seam&&topology.edges[u.edge-1].type==='circle'&&Math.abs(dot(sub(topology.edges[u.edge-1].analytic.center,frame.origin),frame.z)-level)<=1e-9);
 if(rows.length!==1)fail('The actual cylinder has no unique requested rim.');return rows[0].edge;
}
function planar(topology,id,origin,axis,outward,code){const face=topology.faces[id-1];if(face?.type!=='plane'||face.support!=='analytic-descriptor'||!['FORWARD','REVERSED'].includes(face.orientation))fail('An actual cap is not an ordinary analytic plane.',code);const a=face.analytic,n=a.normal.map(x=>x*(face.orientation==='FORWARD'?1:-1));if(Math.hypot(...cross(n,axis))>1e-12||dot(n,axis)*outward<=0||Math.abs(dot(sub(origin,a.origin),a.normal))>1e-9)fail('An actual cap differs from its source-relative plane.',code);return face;}
function shared(owners,edge,first,second,code){const rows=owners.get(edge)||[];if(rows.length!==2||rows.some(r=>r.seam)||rows[0].orientation===rows[1].orientation||new Set(rows.map(r=>r.face)).size!==2||!rows.some(r=>r.face===first)||!rows.some(r=>r.face===second))fail('The actual rim is not shared by its two required faces.',code);}
const world=(plan,r,z)=>plan.frame.origin.map((n,i)=>n+plan.frame.x[i]*(plan.centerLocal[0]+r)+plan.frame.y[i]*plan.centerLocal[1]+plan.frame.z[i]*z);
function classifyPoints(plan,classify,rows,code){
 if(typeof classify!=='function')fail('Actual Native point corroboration is unavailable.',code);const seen=new Map();for(const [r,z,expected]of rows){const p=world(plan,r,z);if(p.some(n=>!Number.isFinite(n)||Math.abs(n)>4e6))fail('A derived probe is not representable.',code);const key=JSON.stringify(p);if(seen.has(key)&&seen.get(key)!==expected)fail('Distinct required probes collapse to one represented point.',code);seen.set(key,expected);if(classify(p)!==expected)fail('Actual Native boundary/material/void observations do not corroborate the stepped cut.',code);}
}
export function qualifyCounterboreFirst({first,toolConstruction,toolRequest,plan,sourceCaps,classify}){
 if(first.evidence?.nativeValidity?.valid!==true)fail('The actual first cut is not Native-valid.');
 const cylinder=toolCylinder({operation:'subtract',sourceTopologies:first.sourceTopologies,result:first.created,topology:first.topology,toolConstruction,toolRequest}),f=plan.frame,top=f.origin.map((n,i)=>n+f.z[i]*plan.sourceDepth),owners=shell(first.topology);
 const finite=extent(first.topology,cylinder,{...f,depth:plan.sourceDepth}),bottom=inheritedFace(first.created.ancestryA,first.topology,sourceCaps.first,'counter-source-first-cap'),last=inheritedFace(first.created.ancestryA,first.topology,sourceCaps.last,'counter-source-last-cap');
 if(bottom===last||bottom===cylinder.resultFace||last===cylinder.resultFace)fail('The first through cylinder/caps are not distinct.');planar(first.topology,bottom,f.origin,f.z,-1,'COUNTERBORE_CYLINDERS_UNQUALIFIED');planar(first.topology,last,top,f.z,1,'COUNTERBORE_CYLINDERS_UNQUALIFIED');
 const lower=rim(first.topology,cylinder,f,0),upper=rim(first.topology,cylinder,f,plan.sourceDepth);shared(owners,lower,cylinder.resultFace,bottom,'COUNTERBORE_CYLINDERS_UNQUALIFIED');shared(owners,upper,cylinder.resultFace,last,'COUNTERBORE_CYLINDERS_UNQUALIFIED');
 classifyPoints(plan,classify,[[0,0,'outside'],[0,plan.sourceDepth,'outside'],[0,plan.sourceDepth/2,'outside'],[(plan.smallRadius+plan.largeRadius)/2,plan.sourceDepth/2,'inside']],'COUNTERBORE_CYLINDERS_UNQUALIFIED');
 return Object.freeze({cylinder,firstCap:bottom,lastCap:last,finite});
}
export function qualifyCounterboreFinal({firstFacts,final,largeConstruction,largeRequest,plan,classify}){
 if(final.evidence?.nativeValidity?.valid!==true)fail('The actual final cut is not Native-valid.');
 const topology=final.topology,f=plan.frame,s=plan.shoulderLevel,origin=f.origin.map((n,i)=>n+f.z[i]*s),owners=shell(topology),smallFace=inheritedFace(final.created.ancestryA,topology,firstFacts.cylinder.resultFace,'counter-small-wall'),old=firstFacts.cylinder.cylinder,actual=topology.faces[smallFace-1];
 if(actual?.type!=='cylinder'||Math.abs(actual.analytic.radius-old.radius)>1e-7||Math.hypot(...cross(actual.analytic.axis,old.axis))>1e-8||Math.hypot(...cross(sub(actual.analytic.origin,old.origin),old.axis))>1e-7)fail('The real first-cut small wall changed cylindrical support.');
 const small=Object.freeze({...firstFacts.cylinder,resultFace:smallFace,cylinder:actual.analytic}),large=toolCylinder({operation:'subtract',sourceTopologies:final.sourceTopologies,result:final.created,topology,toolConstruction:largeConstruction,toolRequest:largeRequest});
 if(small.resultFace===large.resultFace)fail('The two actual cylindrical intervals were conflated.');
 const smallExtent=extent(topology,small,{...f,depth:s}),largeExtent=extent(topology,large,{...f,origin,depth:plan.stepDepth});
 if(Math.abs(smallExtent.radius-plan.smallRadius)>1e-7||Math.abs(largeExtent.radius-plan.largeRadius)>1e-7||!(smallExtent.radius<largeExtent.radius))fail('Actual step radii do not retain the requested strict order.');
 const prepared=preparePolygonProfileExtrusion(largeRequest),construction=validatePrismProvenance(largeConstruction,final.sourceTopologies[1],prepared);
 if(construction.status!=='available')fail('Actual large-tool first cap is unavailable.','COUNTERBORE_SHOULDER_UNQUALIFIED');
 const shoulder=inheritedFace(final.created.ancestryB,topology,construction.data.caps.firstFace,'counter-annular-shoulder','COUNTERBORE_SHOULDER_UNQUALIFIED'),face=planar(topology,shoulder,origin,f.z,1,'COUNTERBORE_SHOULDER_UNQUALIFIED');
 if([small.resultFace,large.resultFace].includes(shoulder)||face.wires.length!==2||face.wires.some(w=>w.length!==1||w[0].seam||!['FORWARD','REVERSED'].includes(w[0].orientation)))fail('The actual shoulder is not a two-wire annulus.','COUNTERBORE_SHOULDER_UNQUALIFIED');
 const inner=rim(topology,small,f,s),outer=rim(topology,large,f,s),edges=face.wires.map(w=>w[0].edge);
 if(inner===outer||new Set(edges).size!==2||!edges.includes(inner)||!edges.includes(outer))fail('The shoulder does not retain both actual shared stepped-wall rims.','COUNTERBORE_SHOULDER_UNQUALIFIED');
 shared(owners,inner,shoulder,small.resultFace,'COUNTERBORE_SHOULDER_UNQUALIFIED');shared(owners,outer,shoulder,large.resultFace,'COUNTERBORE_SHOULDER_UNQUALIFIED');
 for(const edge of edges.map(i=>topology.edges[i-1]))if(edge.type!=='circle'||edge.vertices[0]!==edge.vertices[1]||Math.abs(dot(sub(edge.analytic.center,origin),f.z))>1e-9||Math.hypot(...cross(edge.analytic.axis,f.z))>1e-12)fail('An actual annular boundary differs from the shoulder support.','COUNTERBORE_SHOULDER_UNQUALIFIED');
 const bottom=inheritedFace(final.created.ancestryA,topology,firstFacts.firstCap,'counter-final-first-cap'),top=inheritedFace(final.created.ancestryA,topology,firstFacts.lastCap,'counter-final-last-cap');
 planar(topology,bottom,f.origin,f.z,-1,'COUNTERBORE_CYLINDERS_UNQUALIFIED');planar(topology,top,f.origin.map((n,i)=>n+f.z[i]*plan.sourceDepth),f.z,1,'COUNTERBORE_CYLINDERS_UNQUALIFIED');
 shared(owners,rim(topology,small,f,0),small.resultFace,bottom,'COUNTERBORE_CYLINDERS_UNQUALIFIED');shared(owners,rim(topology,large,f,plan.sourceDepth),large.resultFace,top,'COUNTERBORE_CYLINDERS_UNQUALIFIED');
 const ring=(plan.smallRadius+plan.largeRadius)/2,clear=plan.materialRadius;if(!(plan.smallRadius<ring&&ring<plan.largeRadius&&clear>plan.largeRadius))fail('The represented annulus/material probes are indistinguishable.','COUNTERBORE_SHOULDER_UNQUALIFIED');
 classifyPoints(plan,classify,[[0,0,'outside'],[0,plan.sourceDepth,'outside'],[0,s/2,'outside'],[0,s+plan.stepDepth/2,'outside'],[ring,s/2,'inside'],[ring,s,'boundary'],[ring,s+plan.stepDepth/2,'outside'],[plan.smallRadius,s/2,'boundary'],[plan.largeRadius,s+plan.stepDepth/2,'boundary'],[clear,s/2,'inside'],[clear,s+plan.stepDepth/2,'inside']],'COUNTERBORE_SHOULDER_UNQUALIFIED');
 return Object.freeze({version:1,unit:'millimeter',scope:'response-local',persistentIds:false,termination:'small-through-large-interior-step',small,large,shoulder,innerRim:inner,outerRim:outer,bottomCap:bottom,topCap:top,smallExtent,largeExtent});
}
