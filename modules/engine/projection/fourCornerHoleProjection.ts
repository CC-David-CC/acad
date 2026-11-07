// Projection of a mount-authenticated four-corner response. Native indices are
// local to this response; only proven face/tool relations receive stable IDs.
import {assembleBoundedFourCornerSolid} from './fourCornerSolidAssembly';
import {captureCandidateFourCornerProjection} from 'engine/extrusion/candidateFourCornerProjectionInvariant.mjs';
const fail=():never=>{throw Error('Invalid four-corner projection or identity collision');};
const stable=(parts:any[])=>'worker-prism:1:'+JSON.stringify(parts);
export function projectBoundFourCornerHoles({topology,parentTopology,parentModel,intent,occupiedIds}:any){
 if(!(occupiedIds instanceof Set)||occupiedIds.size>16384||!parentModel||!Array.isArray(parentModel.faces)||parentModel.faces.length!==7||!Array.isArray(parentTopology?.faces)||parentTopology.faces.length!==7||!intent?.target||parentModel.id!==intent.target.bodyId)fail();
 const occupied=new Set<string>();let chars=0;for(const id of occupiedIds){if(typeof id!=='string'||!id||id.length>16384||(chars+=id.length)>1048576)fail();occupied.add(id);}
 if(!Array.isArray(topology.parentFaces)||topology.parentFaces.length!==7||!Array.isArray(topology.fourCornerTools)||topology.fourCornerTools.length!==4)fail();
 const parentKeys=parentModel.faces.map((face:any)=>{const key=face.topology?.data?.portableIdentity?.key;if(face.root!==parentModel||!key||!['face'].includes(key.kind)||![intent.target.parentFeatureId,intent.centerFeatureId].includes(key.featureId)||face.id!==stable([key.featureId,'face',key.role,key.source]))fail();return key;});
 if(parentKeys.filter((key:any)=>key.featureId===intent.centerFeatureId&&key.role==='HOLE_WALL').length!==1)fail();
 const descendants=new Set<number>();
 for(const rel of topology.parentFaces){const ids=[...rel.same,...rel.modified];if(ids.length!==1||!Number.isSafeInteger(ids[0])||ids[0]<1||ids[0]>11||descendants.has(ids[0]))fail();descendants.add(ids[0]);}
 const model=assembleBoundedFourCornerSolid(topology),allowed=new Set([parentModel.id,...parentModel.faces.map((f:any)=>f.id)]);
 for(const id of allowed)occupied.delete(id);
 const all=new Set<string>();const add=(id:string)=>{if(typeof id!=='string'||!id||id.length>1024||occupied.has(id)||all.has(id))fail();all.add(id);};
 model.id=parentModel.id;add(model.id);
 for(let i=0;i<7;i++){const key=parentKeys[i],rel=topology.parentFaces[i],face=model.faces[(rel.same[0]??rel.modified[0])-1],id=stable([key.featureId,'face',key.role,key.source]);if(!face)fail();face.id=id;face.topology.data.id=id;face.topology.data.portableIdentity={stability:'authored',key};}
 const edgeByLocal=new Map<number,any>();for(const edge of model.edges){let tuple:any;try{tuple=JSON.parse(edge.id.slice('worker-prism:1:'.length));}catch{fail();}if(!Array.isArray(tuple)||tuple[0]!=='transient'||tuple[2]!=='edge'||!Number.isInteger(tuple[3])||edgeByLocal.has(tuple[3]))fail();edgeByLocal.set(tuple[3],edge);}
 const corners=['MIN_X_MIN_Y','MAX_X_MIN_Y','MAX_X_MAX_Y','MIN_X_MAX_Y'],seen=new Set<number>();
 for(const tool of topology.fourCornerTools){const index=tool.inputIndex;if(!Number.isInteger(index)||index<0||index>3||seen.has(index))fail();seen.add(index);const cylinder=tool.faces.filter((x:any)=>x.type==='cylinder');if(cylinder.length!==1||cylinder[0].modified.length!==1||cylinder[0].generatedEdges.length!==2)fail();const resultFace=cylinder[0].modified[0];if(descendants.has(resultFace))fail();descendants.add(resultFace);const face=model.faces[resultFace-1],source={parentFeatureId:intent.target.parentFeatureId,centerFeatureId:intent.centerFeatureId,regionId:intent.target.regionId,corner:corners[index]},id=stable([intent.featureId,'face','CORNER_WALL',source]);if(!face)fail();face.id=id;face.topology.data.id=id;face.topology.data.portableIdentity={stability:'authored',key:{featureId:intent.featureId,kind:'face',role:'CORNER_WALL',source}};
  for(const rimId of cylinder[0].generatedEdges){const edge=edgeByLocal.get(rimId);if(!edge)fail();const matching=parentKeys.map((key:any,i:number)=>({key,history:topology.parentFaces[i]})).filter((entry:any)=>['BASE','LID'].includes(entry.key.role)&&entry.history.generatedEdges.includes(rimId));if(matching.length!==1)fail();const role=matching[0].key.role+'_RIM',edgeId=stable([intent.featureId,'edge',role,source]);edge.id=edgeId;edge.topology.data.id=edgeId;edge.topology.data.portableIdentity={stability:'authored',key:{featureId:intent.featureId,kind:'edge',role,source}};edge.ext.workerIdentity=Object.freeze({stability:'authored'});}
 }
 if(seen.size!==4||descendants.size!==11)fail();for(const object of [...model.faces,...model.edges,...model.vertices])add(object.id);
 model.ext.workerGeometry=Object.freeze({version:1,representation:'worker-owned-occ-four-corner',engine:'occ',legacyPointerCompatible:false,durableVertexReferences:false,durableConnectorReferences:false});
 return {model,checkProjection:captureCandidateFourCornerProjection(model)};
}
