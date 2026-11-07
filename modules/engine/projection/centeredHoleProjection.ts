// Private candidate projection. Caller must authenticate the live mount's
// exact response and its parent indexed-map equivalence before invoking.
import {assembleBoundedDrilledSolid} from './drilledSolidAssembly';
import {deriveDrilledRoles} from './drilledRoles.mjs';
import {captureCandidateDrilledProjection} from 'engine/extrusion/candidateDrilledProjectionInvariant.mjs';
const fail=():never=>{throw Error('Invalid centered-hole projection or identity collision');};
const stable=(parts:any[])=>'worker-prism:1:'+JSON.stringify(parts);
export function projectBoundCenteredHole({topology,parentTopology,parentModel,intent,occupiedIds,sideIds}:any){
 if(!(occupiedIds instanceof Set)||occupiedIds.size>16384||!parentModel||!Array.isArray(parentModel.faces)||parentModel.faces.length!==6||!Array.isArray(parentTopology?.faces)||parentTopology.faces.length!==6||!intent?.target||parentModel.id!==intent.target.bodyId)fail();
 let chars=0;const occupied=new Set<string>();for(const id of occupiedIds){if(typeof id!=='string'||!id||id.length>16384||(chars+=id.length)>1048576)fail();occupied.add(id);}
 const {parentFeatureId,regionId}=intent.target,featureId=intent.featureId;if(parentModel.id!==stable([parentFeatureId,'body']))fail();
 const parentKeys=parentModel.faces.map((face:any,i:number)=>{if(parentTopology.faces[i]?.id!=='face:'+i||face.root!==parentModel)fail();const key=face.topology?.data?.portableIdentity?.key;if(!key||face.id!==stable([parentFeatureId,'face',key.role,key.source]))fail();return key;});
 const roles=deriveDrilledRoles({topology,parentKeys,parentFeatureId,holeFeatureId:featureId,regionId});
 const model=assembleBoundedDrilledSolid(topology,true),allowed=new Set([parentModel.id,...parentModel.faces.map((f:any)=>f.id)]);if(allowed.size!==7)fail();for(const id of allowed)occupied.delete(id);
 const all=new Set<string>();const add=(id:string)=>{if(typeof id!=='string'||!id||id.length>1024||occupied.has(id)||all.has(id))fail();all.add(id);};
 model.id=parentModel.id;add(model.id);
 for(const {key,resultFace} of roles.faces){const face=model.faces[resultFace-1],id=stable([parentFeatureId,'face',key.role,key.source]);if(!face)fail();face.id=id;face.topology.data.id=id;face.topology.data.portableIdentity={stability:'authored',key};}
 const source={parentFeatureId,regionId};const wall=model.faces[roles.wall.resultFace-1];if(!wall)fail();wall.id=stable([featureId,'face','HOLE_WALL',source]);wall.topology.data.id=wall.id;wall.topology.data.portableIdentity={stability:'authored',key:{featureId,kind:'face',role:'HOLE_WALL',source}};
 const edgeByLocal=new Map<number,any>();for(const edge of model.edges){let tuple:any;try{tuple=JSON.parse(edge.id.slice('worker-prism:1:'.length));}catch{fail();}if(!Array.isArray(tuple)||tuple[0]!=='transient'||tuple[2]!=='edge'||!Number.isInteger(tuple[3])||edgeByLocal.has(tuple[3]))fail();edgeByLocal.set(tuple[3],edge);}
 for(const rim of roles.rims){const edge=edgeByLocal.get(rim.resultEdge);if(!edge)fail();const id=stable([featureId,'edge',rim.role,source]);edge.id=id;edge.topology.data.id=id;edge.topology.data.portableIdentity={stability:'authored',key:{featureId,kind:'edge',role:rim.role,source}};edge.ext.workerIdentity=Object.freeze({stability:'authored'});}
 for(const item of [...model.faces,...model.edges,...model.vertices])add(item.id);
 model.ext.workerGeometry=Object.freeze({version:1,representation:'worker-owned-occ-drilled',engine:'occ',legacyPointerCompatible:false,durableVertexReferences:false,durableConnectorReferences:false});
 if(sideIds!==undefined)model.ext.fourCornerSideIds=Object.freeze({...sideIds});
 const checkProjection=captureCandidateDrilledProjection(model);return {model,checkProjection};
}
