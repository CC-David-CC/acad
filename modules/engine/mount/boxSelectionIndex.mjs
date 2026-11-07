// Private initial-constructor binding only. Arbitrary JSON is not a Native proof.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {shellData} from './ownedShellProtocol.mjs';
const roles=Object.freeze(['X_MIN','X_MAX','Y_MIN','Y_MAX','Z_MIN','Z_MAX']);
const fail=message=>{throw Object.assign(Error(message),{code:'ENGINE_FAILURE'});};
export function createBoxSelectionIndex({featureId,construction,topology}){
 if(!Number.isSafeInteger(featureId)||featureId<1)fail('Invalid actual box origin');
 const native=validateOwnedTopology(topology),c=shellData(construction,['version','scope','persistentIds','kind','faces']);
 if(c.version!==1||c.scope!=='response-local'||c.persistentIds!==false||c.kind!=='box-builder-face-provenance'||native.solidCount!==1||native.vertices.length!==8||native.edges.length!==12||native.faces.length!==6||!Array.isArray(c.faces)||c.faces.length!==6||Reflect.ownKeys(c.faces).length!==7)fail('Invalid native box construction membership');
 const bindings=new Map(),seenRoles=new Set(),seenIndices=new Set(),faces=[];
 for(let i=0;i<6;i++){
  const d=Object.getOwnPropertyDescriptor(c.faces,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Expected native face rows');
  const r=shellData(d.value,['role','face']);if(!roles.includes(r.role)||seenRoles.has(r.role)||!Number.isSafeInteger(r.face)||r.face<1||r.face>6||seenIndices.has(r.face)||native.faces[r.face-1].type!=='plane')fail('Box constructor face roles are not a unique complete census');
  seenRoles.add(r.role);seenIndices.add(r.face);const id='worker-box-face:1:'+JSON.stringify([featureId,r.role]);bindings.set(id,r.face);faces.push(Object.freeze({id,role:r.role,geometry:'plane',originFeatureId:featureId}));
 }
 faces.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const plan=Object.freeze({version:2,featureId,scope:'authored-source',source:'box-construction-history',sourceContexts:Object.freeze([Object.freeze({kind:'box',featureId,regionId:null})]),vertices:Object.freeze([]),edges:Object.freeze([]),faces:Object.freeze(faces),unresolved:Object.freeze([Object.freeze({kind:'vertex',count:8,reason:'UNCLAIMED_KERNEL_ENTITY'}),Object.freeze({kind:'edge',count:12,reason:'UNCLAIMED_KERNEL_ENTITY'})])});
 const unavailable=()=>{throw Object.assign(Error('The box has no authored selection of this kind'),{code:'UNRESOLVED_SELECTION'});};
 return Object.freeze({plan,resolveVertex:unavailable,resolveEdge:unavailable,resolveFace(id){if(typeof id!=='string'||!bindings.has(id))return unavailable();return bindings.get(id);}});
}
