// Worker-only facts from the actual SAME tool/cut/source. No public ordinals.
import {deriveCylinderCutWitness} from './cylinderCutWitness.mjs';
import {validatePrismProvenance} from './ownedTopologyContract.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
import {preparePolygonProfileExtrusion} from './polygonProfilePlan.mjs';
import {inspectFiniteCylinder,FINITE_CYLINDER_REFUSAL_CODES} from './prismaticBoreFacts.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'BLIND_FLOOR_UNQUALIFIED'});};
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function qualifyBlindHoleFacts({sourceTopologies,result,topology,toolConstruction,toolRequest,plan,classify}){
 let cylinder;
 try{cylinder=deriveCylinderCutWitness({operation:'subtract',sourceTopologies,result,topology,toolConstruction,toolRequest});}
 catch(e){if(!['DRAWING_WITNESS_UNAVAILABLE','DRAWING_WITNESS_UNSUPPORTED_TOOL','DRAWING_WITNESS_INPUT_MISMATCH'].includes(e?.code))throw e;fail('The actual blind cylinder has no unique qualified descendant.');}
 const tool=preparePolygonProfileExtrusion(toolRequest),construction=validatePrismProvenance(toolConstruction,sourceTopologies[1],tool);
 if(construction.status!=='available'||result.ancestryB.status!=='available')fail('The actual blind floor construction/history is unavailable.');
 const floorSource=construction.data.caps.firstFace,history=result.ancestryB.data;
 if(history.faces[floorSource-1].generated.faces.length)fail('The blind floor generated mapping is outside this domain.');
 const claims=reconcileNativeSelectionClaims({sources:[{claims:[{kind:'face',id:'private-blind-floor',sourceIndex:floorSource}],ancestry:history}],topology});
 if(!claims.resolved.some(row=>row.id==='private-blind-floor'))fail('The actual blind floor has no unique surviving descendant.');
 const floorIndex=claims.resolveFace('private-blind-floor'),floor=topology.faces[floorIndex-1],f=plan.frame,origin=tool.request.frame.origin,depth=plan.blindDepth;
 if(floor.type!=='plane'||floor.support!=='analytic-descriptor'||!['FORWARD','REVERSED'].includes(floor.orientation)||floor.wires.length!==1)fail('The actual blind floor is not an ordinary analytic plane.');
 const a=floor.analytic,normal=a.normal.map(n=>n*(floor.orientation==='FORWARD'?1:-1));
 if(Math.hypot(...cross(normal,f.z))>1e-12||dot(normal,f.z)<=0||Math.abs(dot(sub(origin,a.origin),a.normal))>1e-9)fail('The actual blind floor plane differs from the derived floor.');
 let extent;try{extent=inspectFiniteCylinder(topology,cylinder,{...f,origin,depth});}catch(e){if(!FINITE_CYLINDER_REFUSAL_CODES.includes(e?.code))throw e;fail('The actual blind cylinder does not have the requested finite extent.');}
 const rims=topology.faces[cylinder.resultFace-1].wires.flat().filter(use=>!use.seam).map(use=>use.edge),floorEdges=floor.wires[0].map(use=>use.edge);
 const lower=rims.filter(i=>{const edge=topology.edges[i-1];return edge.type==='circle'&&Math.abs(dot(sub(edge.analytic.center,origin),f.z))<=1e-9;});
 if(lower.length!==1||floorEdges.length!==1||floorEdges[0]!==lower[0]||topology.edges[lower[0]-1].vertices.some(i=>Math.abs(dot(sub(topology.vertices[i-1].point,a.origin),a.normal))>1e-9))fail('The blind floor boundary is not the actual lower cylindrical rim.');
 const point=z=>f.origin.map((n,i)=>n+f.x[i]*plan.centerLocal[0]+f.y[i]*plan.centerLocal[1]+f.z[i]*z);
 if(typeof classify!=='function'||classify(point(plan.floorLevel))!=='boundary'||classify(point(plan.floorLevel+depth/2))!=='outside'||classify(point(plan.floorLevel/2))!=='inside')fail('Native blind floor/material/void classifications did not corroborate the cut.');
 return Object.freeze({version:1,unit:'millimeter',scope:'response-local',persistentIds:false,termination:'flat-bottom',cylinder,floorFace:floorIndex,entryLevel:plan.entryLevel,floorLevel:plan.floorLevel,depth,extent:Object.freeze(extent)});
}
