// Private constructor naming only. Actual Native first/last/swept membership
// is reused; no old source-cap alias or saved Native ordinal is introduced.
import {createPrismSelectionIndex} from './prismSelectionIndex.mjs';
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code});};
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]);
export function createProfileExtentSelectionIndex({featureId,provenance,topology,prepared}){
 if(prepared?.binding?.featureId!==featureId||prepared.request.source.featureId!==featureId)fail('Extent selection origin differs from its bound request.');
 // This constructor admits NativeV3 polygon/Circle only. Do not silently
 // collapse a future analytic endpoint occurrence to its incident curve pair.
 if(provenance?.sourceBinding?.nativeSlotBindings?.some(loop=>loop.vertices?.some(vertex=>vertex&&Object.hasOwn(vertex,'endpointRoles'))))fail('Analytic endpoint-role provenance is unsupported by the extent constructor.');
 const native=validateOwnedTopology(topology),source=createPrismSelectionIndex(featureId,provenance,native),regionId=prepared.request.region.id;
 if(native.solidCount!==1)fail('Extent constructor selections require one actual Native solid.');
 const f=prepared.originalFace.frame,z=f.z;
 for(const [role,ordinal,level,sign]of [['lower-cap',provenance.data.caps.firstFace,prepared.binding.interval.lower,-1],['upper-cap',provenance.data.caps.lastFace,prepared.binding.interval.upper,1]]){
  const face=native.faces[ordinal-1],origin=f.origin.map((n,i)=>n+z[i]*level);
  if(face?.type!=='plane'||!['FORWARD','REVERSED'].includes(face.orientation)||Math.abs(dot(sub(face.analytic.origin,origin),z))>1e-7)fail('Actual '+role+' support differs from the bound extent.');
  const outward=dot(face.analytic.normal,z)*(face.orientation==='REVERSED'?-1:1);
  if(Math.abs(outward-sign)>1e-12)fail('Actual '+role+' orientation differs from the bound extent.');
  for(const wire of face.wires)for(const use of wire)for(const id of native.edges[use.edge-1].vertices)if(id>0&&Math.abs(dot(sub(native.vertices[id-1].point,origin),z))>1e-7)fail('Actual '+role+' trim differs from its bound support.');
 }
 const edges=[],faces=[],edgeMap=new Map(),faceMap=new Map();
 const roles={'first-cap':'lower-cap','last-cap':'upper-cap','first-boundary':'lower-boundary','last-boundary':'upper-boundary','swept-boundary':'swept-boundary',connector:'connector'};
 for(const [kind,rows,target,map,resolve]of [['edge',source.plan.edges,edges,edgeMap,source.resolveEdge],['face',source.plan.faces,faces,faceMap,source.resolveFace]])for(const row of rows){
  const role=roles[row.role];if(!role)fail('Unexpected original prism role in extent construction.');
  const origin=row.curveId??row.incidentCurveIds??null,id='worker-profile-extent-selection:1:'+JSON.stringify([featureId,regionId,kind,role,origin]);
  if(id.length>16384)fail('Extent selection identity exceeds its existing budget.','SELECTION_RESOURCE_LIMIT');
  if(map.has(id))fail('Duplicate extent source selection.');map.set(id,resolve(row.id));target.push({...row,id,role,originFeatureId:featureId});
 }
 const unresolved=source.plan.unresolved.map(row=>({...row}));
 if(native.vertices.length)unresolved.push({kind:'vertex',count:native.vertices.length,reason:'UNCLAIMED_KERNEL_ENTITY'});
 const plan=freeze({version:2,featureId,scope:'authored-source',source:'profile-extent-construction-history',sourceContexts:[{kind:'sketch-profile-extent',featureId,regionId}],vertices:[],edges,faces,unresolved});
 if(new TextEncoder().encode(JSON.stringify(plan)).byteLength>524288)fail('Extent selections exceed the existing observation budget.','SELECTION_RESOURCE_LIMIT');
 const resolve=(map,id)=>{if(typeof id!=='string'||!id||id.length>16384)fail('Expected an actually discovered extent selection.','INVALID_SELECTION');const ordinal=map.get(id);if(ordinal===undefined)fail('The extent selection has no current unique Native descendant.','UNRESOLVED_SELECTION');return ordinal;};
 return Object.freeze({plan,resolveVertex:()=>fail('No authored extent vertex is advertised.','UNRESOLVED_SELECTION'),resolveEdge:id=>resolve(edgeMap,id),resolveFace:id=>resolve(faceMap,id)});
}
