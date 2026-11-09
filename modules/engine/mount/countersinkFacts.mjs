// UNREGISTERED Worker-only finite Native qualification. No public proof flag,
// guessed cohort, persisted indices, mesh support or nominal cone certificate.
import {captureOwnedConeObservation,assertCoupledConeCatalog,captureConicalConstruction,captureConicalData} from './ownedConicalContract.mjs';
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {validateOwnedBooleanResult} from './ownedBooleanContract.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
import {deriveCylinderCutWitness} from './cylinderCutWitness.mjs';
import {inspectFiniteCylinder,FINITE_CYLINDER_REFUSAL_CODES} from './prismaticBoreFacts.mjs';
import {COUNTERSINK_QUALIFICATION as Q} from './ownedCountersinkPlan.mjs';
const fail=(message,code='COUNTERSINK_CONE_UNQUALIFIED')=>{throw Object.assign(Error(message),{code});};
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]),add=(a,b)=>a.map((n,i)=>n+b[i]),mul=(a,n)=>a.map(v=>v*n),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(...a);
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
const point=(plan,r,z)=>plan.frame.origin.map((n,i)=>n+plan.frame.x[i]*(plan.centerLocal[0]+r)+plan.frame.y[i]*plan.centerLocal[1]+plan.frame.z[i]*z);
function inherit(ancestry,topology,index,label){
 if(ancestry?.status!=='available'||!ancestry.data.faces[index-1]||ancestry.data.faces[index-1].generated.faces.length)fail('Actual '+label+' face history is unavailable/generated.');
 const claims=reconcileNativeSelectionClaims({sources:[{claims:[{kind:'face',id:label,sourceIndex:index}],ancestry:ancestry.data}],topology});
 if(!claims.resolved.some(r=>r.id===label))fail('Actual '+label+' was lost, split or merged.');return claims.resolveFace(label);
}
function shell(topology){
 validateOwnedTopology(topology);if(topology.solidCount!==1)fail('One actual single-solid topology is required.');const owners=new Map();
 for(const face of topology.faces){if(!['FORWARD','REVERSED'].includes(face.orientation)||!face.wires.length||face.wires.some(w=>!w.length))fail('Unsupported actual face/wire orientation.');for(const wire of face.wires)for(const use of wire){if(!['FORWARD','REVERSED'].includes(use.orientation))fail('Unsupported actual edge occurrence.');if(!owners.has(use.edge))owners.set(use.edge,[]);owners.get(use.edge).push({face:face.index,...use});}}
 // Exported face/wire uses already include their cumulative traversal.
 for(const edge of topology.edges){const uses=owners.get(edge.index)||[];if(edge.degenerated||uses.length!==2||uses[0].orientation===uses[1].orientation||(uses[0].face===uses[1].face?uses.some(u=>!u.seam):uses.some(u=>u.seam)))fail('Actual topology is not an ordinary closed oriented shell.');}return owners;
}
function shared(owners,edge,a,b){const uses=owners.get(edge)||[];if(a===b||uses.length!==2||uses.some(u=>u.seam)||uses[0].orientation===uses[1].orientation||new Set(uses.map(u=>u.face)).size!==2||!uses.some(u=>u.face===a)||!uses.some(u=>u.face===b))fail('The actual circular rim is not shared by its required two faces.');}
function cap(topology,index,origin,z,outward){
 const f=topology.faces[index-1];if(f?.type!=='plane'||f.support!=='analytic-descriptor'||!['FORWARD','REVERSED'].includes(f.orientation))fail('An actual source cap has no qualified planar support.');const n=mul(f.analytic.normal,f.orientation==='FORWARD'?1:-1);
 if(norm(cross(n,z))>Q.capAlignment||dot(n,z)*outward<=0||Math.abs(dot(sub(origin,f.analytic.origin),f.analytic.normal))>Q.capIncidenceMm)fail('The actual cap differs from its source-derived oriented plane.');return f;
}
function radiusAt(c,center,z,level){
 const p=add(center,mul(z,level)),d=sub(p,c.origin),u=dot(d,c.axis);
 if(norm(cross(d,c.axis))>Q.supportMm)fail('The actual cone axis is not the source-centered axis.');const radius=c.referenceRadius+u*Math.tan(c.semiAngle);if(!Number.isFinite(radius)||radius<=0)fail('The actual finite cone reaches an unqualified zero/signed radius.');return radius;
}
function support(c,center,z,lo,hi,r,R,angle){
 const alignment=dot(c.axis,z),slope=alignment*Math.tan(c.semiAngle);
 if(norm(cross(c.axis,z))>Q.direction||!(slope>0)||Math.abs(2*Math.atan(slope)-angle)>Q.angleRadians||Math.abs(radiusAt(c,center,z,lo)-r)>Q.supportMm||Math.abs(radiusAt(c,center,z,hi)-R)>Q.supportMm)fail('Actual gp_Cone support disagrees with the requested full included angle and source-relative radii.');
}
function circularRim(topology,use,center,z,level,radius){
 const edge=topology.edges[use.edge-1],a=edge?.analytic;
 if(use.seam||edge?.degenerated||edge?.type!=='circle'||edge.vertices[0]<1||edge.vertices[0]!==edge.vertices[1]||Math.abs(edge.range[1]-edge.range[0]-2*Math.PI)>Q.direction||norm(cross(a.axis,z))>Q.capAlignment||Math.abs(a.radius-radius)>Q.supportMm||norm(sub(a.center,add(center,mul(z,level))))>Q.capIncidenceMm)fail('An actual cone rim is not the complete requested coaxial circle.');
 for(const axis of [a.axis,a.x,a.y])if(Math.abs(dot(axis,axis)-1)>Q.capAlignment)fail('Actual circular rim basis is not unit.');
 if(Math.abs(dot(a.x,a.y))>Q.capAlignment||Math.abs(dot(a.x,a.axis))>Q.capAlignment||Math.abs(dot(a.y,a.axis))>Q.capAlignment)fail('Actual circular rim basis is not orthogonal.');
 const t=edge.range[0],p=a.center.map((n,i)=>n+a.radius*(a.x[i]*Math.cos(t)+a.y[i]*Math.sin(t)));
 if(norm(sub(p,topology.vertices[edge.vertices[0]-1].point))>Q.supportMm)fail('Actual circular trim endpoint does not lie on its actual support.');return edge;
}
function finiteCone(topology,c,center,z,lo,hi,r,R,{inward}){
 const face=topology.faces[c.face-1];if(face?.type!=='cone'||face.wires.length!==1||face.wires[0].length!==4)fail('The actual finite cone must have one ordinary four-use trim.');
 const handed=c.direct?1:-1,orientation=face.orientation==='FORWARD'?1:face.orientation==='REVERSED'?-1:0;
 if(orientation*handed!==(inward?-1:1))fail('The actual cone material-side orientation is inconsistent.');
 const uses=face.wires[0],rims=uses.filter(u=>!u.seam).sort((a,b)=>dot(sub(topology.edges[a.edge-1].analytic?.center||[],center),z)-dot(sub(topology.edges[b.edge-1].analytic?.center||[],center),z)),seams=uses.filter(u=>u.seam);
 if(rims.length!==2||rims[0].edge===rims[1].edge||seams.length!==2||seams[0].edge!==seams[1].edge||seams[0].orientation===seams[1].orientation)fail('Actual cone trim lacks two distinct rims and the opposite repeated seam.');
 const lower=circularRim(topology,rims[0],center,z,lo,r),upper=circularRim(topology,rims[1],center,z,hi,R),line=topology.edges[seams[0].edge-1];
 if(line?.degenerated||line?.type!=='line'||!(line.range[1]>line.range[0])||JSON.stringify([...line.vertices].sort((a,b)=>a-b))!==JSON.stringify([lower.vertices[0],upper.vertices[0]].sort((a,b)=>a-b)))fail('The actual cone has no finite generatrix LINE joining its two rim vertices.');
 const start=add(line.analytic.origin,mul(line.analytic.direction,line.range[0])),delta=mul(line.analytic.direction,line.range[1]-line.range[0]),end=add(start,delta);
 if(!line.vertices.every(i=>[start,end].some(p=>norm(sub(p,topology.vertices[i-1].point))<=Q.supportMm)))fail('Actual cone seam endpoints differ from actual LINE support/range.');
 // Whole normalized LINE interval, not sampled endpoints: rho(t)^2-R(t)^2
 // is quadratic. Sum of absolute coefficients bounds it on t in[0,1].
 const d0=sub(start,c.origin),u0=dot(d0,c.axis),u1=dot(delta,c.axis),v0=sub(d0,mul(c.axis,u0)),v1=sub(delta,mul(c.axis,u1)),k=Math.tan(c.semiAngle),b0=c.referenceRadius+k*u0,b1=k*u1;
 const coefficients=[dot(v0,v0)-b0*b0,2*(dot(v0,v1)-b0*b1),dot(v1,v1)-b1*b1],minimumRadius=Math.min(b0,b0+b1),bound=coefficients.reduce((n,x)=>n+Math.abs(x),0);
 if(!(minimumRadius>0)||!coefficients.every(Number.isFinite)||!Number.isFinite(bound)||bound>Q.supportMm*minimumRadius)fail('The actual whole seam LINE interval does not satisfy the SAME gp_Cone support.');
 for(const p of [start,end]){const level=dot(sub(p,center),z);if(level<lo-Q.capIncidenceMm||level>hi+Q.capIncidenceMm)fail('The actual seam leaves the finite requested axial interval.');}
 return freeze({face:c.face,lowerRim:lower.index,upperRim:upper.index,seam:line.index,levels:[lo,hi],radii:[r,R],lineResidualCoefficients:coefficients});
}
export function qualifyConicalTool({observation,construction,request}){
 const o=captureOwnedConeObservation(observation),receipt=captureConicalConstruction(construction,request,o),p=receipt.constructionProvenance,f=p.request.frame,center=f.slice(0,3),z=f.slice(9,12),angle=2*Math.atan((p.request.topRadius-p.request.bottomRadius)/p.request.height),c=o.coneFaces[0],owners=shell(o.topology);
 support(c,center,z,0,p.request.height,p.request.bottomRadius,p.request.topRadius,angle);const finite=finiteCone(o.topology,c,center,z,0,p.request.height,p.request.bottomRadius,p.request.topRadius,{inward:false});
 if(finite.face!==p.faces.wall||finite.lowerRim!==p.edges.bottomRim||finite.upperRim!==p.edges.topRim)fail('The genuine builder roles differ from actual finite cone trim members.');
 cap(o.topology,p.faces.bottomCap,center,z,-1);cap(o.topology,p.faces.topCap,add(center,mul(z,p.request.height)),z,1);shared(owners,finite.lowerRim,p.faces.wall,p.faces.bottomCap);shared(owners,finite.upperRim,p.faces.wall,p.faces.topCap);
 for(const [id,rim] of [[p.faces.bottomCap,finite.lowerRim],[p.faces.topCap,finite.upperRim]]){const face=o.topology.faces[id-1];if(face.wires.length!==1||face.wires[0].length!==1||face.wires[0][0].seam||face.wires[0][0].edge!==rim)fail('An actual constructor cap is not the disk bounded by its actual builder rim.');}
 return freeze({observation:o,construction:receipt,finite});
}
function finiteCylinder(topology,witness,frame){try{return inspectFiniteCylinder(topology,witness,frame);}catch(e){if(!FINITE_CYLINDER_REFUSAL_CODES.includes(e?.code))throw e;fail('The actual shortened cylinder differs from its requested finite interval.');}}
function cylinder(first,toolConstruction,toolRequest){try{return deriveCylinderCutWitness({operation:'subtract',sourceTopologies:first.sourceTopologies,result:first.created,topology:first.topology,toolConstruction,toolRequest});}catch(e){if(!['DRAWING_WITNESS_UNAVAILABLE','DRAWING_WITNESS_UNSUPPORTED_TOOL','DRAWING_WITNESS_INPUT_MISMATCH'].includes(e?.code))throw e;fail('The real first small tool lacks unique cylindrical ancestry.');}}
function actualBoolean(value){if(value.evidence?.nativeValidity?.valid!==true||value.created?.empty||value.created?.solidCount!==1)fail('Actual positive single-solid Native Boolean validity is required.');const validation=validateOwnedBooleanResult(value.created,{sourceTopologies:value.sourceTopologies,topology:value.topology});if(validation.reason!==null)fail('Actual Native Boolean naming is unqualified: '+validation.reason);}
function closeInheritedFaces(source,ancestry,topology,extra){
 const indices=source.faces.map(face=>{
  const id=inherit(ancestry,topology,face.index,'countersink-source-face-'+face.index),actual=topology.faces[id-1];
  if(face.type!==actual.type||face.orientation!==actual.orientation)fail('An inherited source face changed its actual type/orientation.');
  if(face.type==='plane'){
   if(norm(cross(face.analytic.normal,actual.analytic.normal))>Q.capAlignment||Math.abs(dot(sub(face.analytic.origin,actual.analytic.origin),face.analytic.normal))>Q.capIncidenceMm)fail('An inherited actual source plane changed support.');
  }else if(face.type==='cylinder'){
   if(Math.abs(face.analytic.radius-actual.analytic.radius)>Q.supportMm||norm(cross(face.analytic.axis,actual.analytic.axis))>Q.direction||norm(cross(sub(face.analytic.origin,actual.analytic.origin),face.analytic.axis))>Q.supportMm)fail('An inherited actual source cylinder changed support.');
  }else fail('The finite countersink parent contains an unsupported source face type.');return id;
 });
 if(new Set(indices).size!==indices.length||extra.some(id=>indices.includes(id))||new Set([...indices,...extra]).size!==topology.faces.length||topology.faces.some(f=>!indices.includes(f.index)&&!extra.includes(f.index)))fail('Actual face closure contains a lost source or an unclaimed extra floor/shoulder/wall.');return indices;
}
export function qualifyCountersinkFirst({first,toolConstruction,toolRequest,sourceCaps,plan}){
 actualBoolean(first);const c=cylinder(first,toolConstruction,toolRequest),owners=shell(first.topology),f=plan.frame,finite=finiteCylinder(first.topology,c,{...f,depth:plan.sourceDepth});
 if(Math.abs(finite.radius-plan.smallRadius)>Q.supportMm||norm(sub(finite.intersection,point(plan,0,0)))>Q.supportMm)fail('The actual first through cylinder is not the captured source-centered small bore.');
 const bottom=inherit(first.created.ancestryA,first.topology,sourceCaps.first,'countersink-first-cap'),top=inherit(first.created.ancestryA,first.topology,sourceCaps.last,'countersink-last-cap');cap(first.topology,bottom,f.origin,f.z,-1);cap(first.topology,top,add(f.origin,mul(f.z,plan.sourceDepth)),f.z,1);
 const rimAt=level=>{const rows=first.topology.faces[c.resultFace-1].wires.flat().filter(u=>!u.seam&&Math.abs(dot(sub(first.topology.edges[u.edge-1].analytic.center,f.origin),f.z)-level)<=Q.capIncidenceMm);if(rows.length!==1)fail('The actual through cylinder lacks a unique source cap rim.');return rows[0].edge;};
 shared(owners,rimAt(0),c.resultFace,bottom);shared(owners,rimAt(plan.sourceDepth),c.resultFace,top);closeInheritedFaces(first.sourceTopologies[0],first.created.ancestryA,first.topology,[c.resultFace]);
 return freeze({cylinder:c,firstCap:bottom,lastCap:top,topology:captureConicalData(first.topology)});
}
export function qualifyCountersinkFinal({firstFacts,final,toolObservation,resultObservation,frustumConstruction,plan}){
 actualBoolean(final);const tool=qualifyConicalTool({observation:toolObservation,construction:frustumConstruction,request:plan.frustumTool}),result=captureOwnedConeObservation(resultObservation);assertCoupledConeCatalog(tool.observation,final.sourceTopologies[1]);assertCoupledConeCatalog(result,final.topology);
 if(JSON.stringify(firstFacts.topology)!==JSON.stringify(captureConicalData(final.sourceTopologies[0])))fail('Final A is not the actual captured first cut.');
 const topology=result.topology,owners=shell(topology),smallFace=inherit(final.created.ancestryA,topology,firstFacts.cylinder.resultFace,'countersink-small-wall'),coneFace=inherit(final.created.ancestryB,topology,tool.finite.face,'countersink-conical-wall');
 if(result.coneFaces.length!==1||result.coneFaces[0].face!==coneFace||smallFace===coneFace)fail('Final result does not contain the unique actual tool-derived conical wall.');
 const small=topology.faces[smallFace-1],old=firstFacts.cylinder.cylinder;
 if(small?.type!=='cylinder'||Math.abs(small.analytic.radius-old.radius)>Q.supportMm||norm(cross(small.analytic.axis,old.axis))>Q.direction||norm(cross(sub(small.analytic.origin,old.origin),old.axis))>Q.supportMm)fail('The first-cut cylindrical support changed in the second Boolean.');
 const shortened={...firstFacts.cylinder,resultFace:smallFace,cylinder:small.analytic},cylinderExtent=finiteCylinder(topology,shortened,{...plan.frame,depth:plan.transitionLevel}),center=point(plan,0,0),c=result.coneFaces[0];
 support(c,center,plan.frame.z,plan.transitionLevel,plan.sourceDepth,plan.smallRadius,plan.entryRadius,plan.intent.includedAngleRadians);const finite=finiteCone(topology,c,center,plan.frame.z,plan.transitionLevel,plan.sourceDepth,plan.smallRadius,plan.entryRadius,{inward:true});
 const bottom=inherit(final.created.ancestryA,topology,firstFacts.firstCap,'countersink-bottom-cap'),top=inherit(final.created.ancestryA,topology,firstFacts.lastCap,'countersink-entry-cap');cap(topology,bottom,plan.frame.origin,plan.frame.z,-1);cap(topology,top,add(plan.frame.origin,mul(plan.frame.z,plan.sourceDepth)),plan.frame.z,1);
 const cylinderRims=topology.faces[smallFace-1].wires.flat().filter(u=>!u.seam);if(!cylinderRims.some(u=>u.edge===finite.lowerRim))fail('Cone/cylinder transition is not the SAME actual final edge.');const bottomRims=cylinderRims.filter(u=>u.edge!==finite.lowerRim);if(bottomRims.length!==1)fail('The shortened cylinder lacks its unique actual bottom opening.');
 shared(owners,finite.lowerRim,coneFace,smallFace);shared(owners,finite.upperRim,coneFace,top);shared(owners,bottomRims[0].edge,smallFace,bottom);closeInheritedFaces(firstFacts.topology,final.created.ancestryA,topology,[coneFace]);
 return freeze({version:1,unit:'millimeter',scope:'response-local',persistentIds:false,method:'native-coupled-cone-and-sequential-boolean-ancestry',smallFace,coneFace,transitionRim:finite.lowerRim,entryRim:finite.upperRim,bottomRim:bottomRims[0].edge,bottomCap:bottom,topCap:top,cylinderExtent,coneExtent:finite});
}
