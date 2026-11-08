// Private Worker-side lineage only. No kernel, geometric matching, authored
// model, persistent native ordinal, or implied capability lives in this module.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
import {captureBoundaryRef} from '../extrusion/selectedArrangementDescriptor.mjs';
const MAX_BYTES=524288,MAX_KEY=16384,MAX_UNRESOLVED=4096;
const kinds=['vertex','edge','face'],plural=k=>k==='vertex'?'vertices':k==='edge'?'edges':'faces',limit=k=>k==='vertex'?1024:k==='edge'?512:256;
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code});};
const unavailable=message=>fail(message,'SELECTION_UNAVAILABLE');
const integer=(n,max=Number.MAX_SAFE_INTEGER,min=1)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const key=n=>typeof n==='string'&&n.length>0&&n.length<=MAX_KEY;
const text=(n,max)=>typeof n==='string'&&n.length>0&&n.length<=max;
const compare=(a,b)=>a<b?-1:a>b?1:0;
function fields(value,expected){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==expected.length)fail('Expected exact plain lineage fields.');
 const out={};for(const name of expected){const d=Object.getOwnPropertyDescriptor(value,name);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Lineage fields must be own enumerable data.');out[name]=d.value;}return out;
}
function array(value,max){
 if(!Array.isArray(value)||value.length>max||Reflect.ownKeys(value).length!==value.length+1)fail('Expected bounded dense lineage data.');
 return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Lineage arrays must contain own data.');return d.value;});
}
function snapshot(input){
 const encoder=new TextEncoder(),active=new Set();let bytes=0,nodes=0;
 const charge=n=>{bytes+=n;if(bytes>MAX_BYTES)fail('Captured lineage exceeds its UTF-8 budget.','SELECTION_RESOURCE_LIMIT');};
 function visit(value,depth){
  if(depth>24||++nodes>131072)fail('Lineage exceeds its work budget.','SELECTION_RESOURCE_LIMIT');
  if(value===null||typeof value==='boolean'){charge(value===null?4:value?4:5);return value;}
  if(typeof value==='number'){if(!Number.isFinite(value))fail('Lineage numbers must be finite.');charge(JSON.stringify(value).length);return value;}
  if(typeof value==='string'){if(value.length>MAX_KEY)fail('Lineage text exceeds its bound.','SELECTION_RESOURCE_LIMIT');charge(encoder.encode(JSON.stringify(value)).byteLength);return value;}
  if(!value||typeof value!=='object'||active.has(value))fail('Lineage must be acyclic plain data.');
  const list=Array.isArray(value),proto=Object.getPrototypeOf(value),keys=Reflect.ownKeys(value);
  if(!list&&proto!==null&&proto!==Object.prototype)fail('Lineage requires plain data.');
  if(list&&value.length>4096)fail('Lineage array exceeds its work bound.','SELECTION_RESOURCE_LIMIT');
  if(list&&keys.length!==value.length+1||!list&&keys.length>32)fail('Lineage requires bounded dense data.');
  const members=list?Array.from({length:value.length},(_,i)=>String(i)):keys,out=list?[]:{};active.add(value);charge(2+Math.max(0,members.length-1));
  for(const name of members){if(typeof name!=='string'||!list&&(name.length>64||name==='__proto__'))fail('Unsupported lineage data key.');const d=Object.getOwnPropertyDescriptor(value,name);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Lineage fields must be own enumerable data.');if(!list)charge(encoder.encode(JSON.stringify(name)).byteLength+1);out[name]=visit(d.value,depth+1);}
  active.delete(value);return out;
 }
 return visit(input,0);
}
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
function privateAPI(value,version){
 const names=version===1?['plan','resolveEdge','resolveFace']:['plan','resolveVertex','resolveEdge','resolveFace'],api=fields(value,names);
 for(const name of names.filter(x=>x!=='plan'))if(typeof api[name]!=='function')fail('A genuine private selection resolver is required.');
 return api;
}
function descriptor(value,version,origin){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('Expected a selection descriptor.');
 const allowed=['id','role','geometry','curveId','incidentCurveIds','sourceEdgeId','kind',...(version===2?['originFeatureId','boundaryRef','incidentBoundaryRefs']:[])],keys=Reflect.ownKeys(value);
 if(keys.some(k=>typeof k!=='string'||!allowed.includes(k))||!['id','role','geometry',...(version===2?['originFeatureId']:[])].every(k=>keys.includes(k)))fail('Unsupported selection descriptor.');
 const d=fields(value,keys);if(keys.some(k=>d[k]===undefined)||!key(d.id)||!text(d.role,64)||!text(d.geometry,64))fail('Invalid selection descriptor.');
 if(d.curveId!==undefined&&!text(d.curveId,256))fail('Invalid source curve identity.');
 if(d.incidentCurveIds!==undefined){const xs=array(d.incidentCurveIds,2);if(xs.length!==2||!xs.every(x=>text(x,256))||xs[0]>=xs[1])fail('Expected two canonical source curve identities.');d.incidentCurveIds=xs;}
 if(d.boundaryRef!==undefined||d.incidentBoundaryRefs!==undefined){if(d.curveId!==undefined||d.incidentCurveIds!==undefined||d.boundaryRef!==undefined&&d.incidentBoundaryRefs!==undefined)fail('Derived spans cannot masquerade as whole source curves.');if(d.boundaryRef!==undefined)d.boundaryRef=captureBoundaryRef(d.boundaryRef);else{const refs=array(d.incidentBoundaryRefs,2).map(x=>captureBoundaryRef(x));if(refs.length!==2||refs[0].id>=refs[1].id)fail('Expected two canonical source spans.');d.incidentBoundaryRefs=refs;}}
 if(d.sourceEdgeId!==undefined&&!key(d.sourceEdgeId)||d.kind!==undefined&&!['fillet','chamfer-equal'].includes(d.kind))fail('Invalid treatment source metadata.');
 if(version===1)d.originFeatureId=origin;if(!integer(d.originFeatureId))fail('Invalid origin feature identity.');return d;
}
function contexts(values,maxInput=32){
 if(Array.isArray(values)&&values.length>maxInput)fail('Source contexts exceed their bound.','SELECTION_RESOURCE_LIMIT');
 const map=new Map();for(const value of array(values,maxInput)){const c=fields(value,['kind','featureId','regionId']);if(!['sketch-profile','box'].includes(c.kind))unavailable('Only real sketch-profile or box origins are supported.');if(!integer(c.featureId)||(c.kind==='box'?c.regionId!==null:!text(c.regionId,8192)))fail('Invalid source construction context.');const prior=map.get(c.featureId);if(prior&&(prior.kind!==c.kind||prior.regionId!==c.regionId))unavailable('One origin cannot name conflicting source constructions.');map.set(c.featureId,c);}
 if(map.size>32)fail('Source contexts exceed their bound.','SELECTION_RESOURCE_LIMIT');
 if(!map.size)unavailable('A real source construction context is required.');return [...map.values()].sort((a,b)=>a.featureId-b.featureId||compare(a.regionId,b.regionId));
}
function priorRows(values,version,origin){
 const result=[];
 for(const value of array(values,MAX_UNRESOLVED)){
  if(value&&typeof value==='object'&&Object.hasOwn(value,'id')){
   // Authored retirement is policy from a real shell request, not a claim that
   // the kernel deleted topology or produced zero descendants. Preserve the
   // first retiring feature/source across every later v2 operation.
   if(version===2&&Object.getOwnPropertyDescriptor(value,'reason')?.value==='AUTHORED_REMOVAL'){
    const r=fields(value,['kind','id','reason','sourceFeatureId','featureId','originFeatureId']);
    if(r.kind!=='face'||!key(r.id)||!integer(r.sourceFeatureId)||!integer(r.featureId)||!integer(r.originFeatureId)||r.featureId===r.sourceFeatureId||r.featureId===r.originFeatureId)fail('Invalid prior authored face retirement.');
    result.push(r);continue;
   }
   const r=fields(value,['kind','id','reason','candidateCount','reportedDeleted','featureId',...(version===2?['originFeatureId']:[])]);
   if(!kinds.includes(r.kind)||!key(r.id)||!['NO_DESCENDANT','MULTIPLE_DESCENDANTS','MERGED_DESCENDANT'].includes(r.reason)||!integer(r.candidateCount,limit(r.kind),0)||!integer(r.featureId))fail('Invalid prior failure evidence.');
   if(version===1&&(r.kind==='vertex'||typeof r.reportedDeleted!=='boolean')||r.reason==='NO_DESCENDANT'&&r.candidateCount!==0||r.reason==='MULTIPLE_DESCENDANTS'&&r.candidateCount<2||r.reason==='MERGED_DESCENDANT'&&r.candidateCount<1)fail('Prior failure evidence contradicts its schema or reason.');
   if(version===1)r.originFeatureId=origin;if(!integer(r.originFeatureId))fail('Invalid failure origin.');
   if(typeof r.reportedDeleted!=='boolean'){
    const rows=array(r.reportedDeleted,2);if(!rows.length)fail('Expected original deletion evidence.');let previous=-1;
    r.reportedDeleted=rows.map(value=>{const d=fields(value,['input','reportedDeleted']);if(!integer(d.input,1,0)||d.input<=previous||typeof d.reportedDeleted!=='boolean')fail('Invalid original deletion evidence.');previous=d.input;return d;});
   }
   result.push(r);
  }else{
   const r=fields(value,['kind','count','reason']);if(!kinds.includes(r.kind)||version===1&&r.kind==='vertex'||!integer(r.count,limit(r.kind))||!['UNCLAIMED_KERNEL_ENTITY','UNAUTHORED_KERNEL_EDGE'].includes(r.reason)||r.reason==='UNAUTHORED_KERNEL_EDGE'&&r.kind!=='edge')fail('Invalid prior aggregate observation.');
  }
 }
 return result;
}
function readSource(api,plan,version){
 const p=fields(plan,version===1?['version','featureId','regionId','scope','source','edges','faces','unresolved']:['version','featureId','scope','source','sourceContexts','vertices','edges','faces','unresolved']);
 if(p.version!==version||!integer(p.featureId)||p.scope!=='authored-source'||!['prism-construction-history','box-construction-history','kernel-operation-history'].includes(p.source))fail('Unsupported source selection plan.');
 if(version===1&&(!text(p.regionId,8192)||p.source!=='prism-construction-history'))fail('Only an actual initial prism index may be lifted.');
 const origins=version===1?[{kind:'sketch-profile',featureId:p.featureId,regionId:p.regionId}]:contexts(p.sourceContexts),originIds=new Set(origins.map(x=>x.featureId));
 if(['prism-construction-history','box-construction-history'].includes(p.source)&&(origins.length!==1||origins[0].featureId!==p.featureId||origins[0].kind!==(p.source==='box-construction-history'?'box':'sketch-profile')))fail('Initial construction origin must equal its producer and source kind.');
 const descriptors=new Map(),bindings=new Map(),claims=[],used={vertex:new Set(),edge:new Set(),face:new Set()};
 for(const type of kinds)for(const value of array(type==='vertex'&&version===1?[]:p[plural(type)],limit(type))){
  const d=descriptor(value,version,p.featureId);if(descriptors.has(d.id)||!originIds.has(d.originFeatureId))fail('Selection identities require unique actual origins.');
  let index;try{index=api['resolve'+type[0].toUpperCase()+type.slice(1)](d.id);}catch{fail('An advertised source selection does not resolve.');}
  if(!integer(index,limit(type))||used[type].has(index))fail('Source selections require unique native bindings.');
  used[type].add(index);descriptors.set(d.id,{type,descriptor:d});bindings.set(d.id,index);claims.push({kind:type,id:d.id,sourceIndex:index});
 }
 const prior=new Map();for(const r of priorRows(p.unresolved,version,p.featureId)){if(descriptors.has(r.id)||prior.has(r.id)||!originIds.has(r.originFeatureId))fail('Prior unresolved identities must have unique actual origins.');prior.set(r.id,r);}
 return{plan:p,contexts:origins,descriptors,bindings,claims,prior};
}
function finish({featureId,source,sourceContexts,topology,descriptors,unresolved,maps}){
 const output={vertices:[],edges:[],faces:[],unresolved:[]},seen=new Set();
 for(const [id,{type,descriptor:d}]of descriptors){const index=maps[type].get(id);if(!integer(index,topology[plural(type)].length)||seen.has(id))fail('Invalid resolved result membership.');seen.add(id);output[plural(type)].push({...d,geometry:type==='vertex'?'point':topology[plural(type)][index-1].type});}
 for(const row of unresolved){if(seen.has(row.id))fail('One identity cannot resolve and remain unresolved.');seen.add(row.id);output.unresolved.push(row);}
 for(const type of kinds){const count=topology[plural(type)].length-maps[type].size;if(count<0)fail('Result selections exceed native membership.');if(count)output.unresolved.push({kind:type,count,reason:'UNCLAIMED_KERNEL_ENTITY'});output[plural(type)].sort((a,b)=>compare(a.id,b.id));}
 if(output.unresolved.length>MAX_UNRESOLVED)fail('Unresolved observations exceed their bound.','SELECTION_RESOURCE_LIMIT');
 const detailed=output.unresolved.filter(x=>Object.hasOwn(x,'id')).sort((a,b)=>compare(a.kind,b.kind)||compare(a.id,b.id)),aggregate=output.unresolved.filter(x=>!Object.hasOwn(x,'id'));output.unresolved=[...detailed,...aggregate];
 const plan={version:2,featureId,scope:'authored-source',source,sourceContexts,...output};
 if(new TextEncoder().encode(JSON.stringify(plan)).byteLength>MAX_BYTES)fail('Encoded lineage exceeds its UTF-8 budget.','SELECTION_RESOURCE_LIMIT');freeze(plan);
 const resolve=(type,id)=>{if(!key(id))fail('Expected a bounded authored selection ID.','INVALID_SELECTION');const index=maps[type].get(id);if(index===undefined)fail('The selection has no unique current descendant.','UNRESOLVED_SELECTION');return index;};
 return Object.freeze({plan,resolveVertex:id=>resolve('vertex',id),resolveEdge:id=>resolve('edge',id),resolveFace:id=>resolve('face',id)});
}
const emptyMaps=()=>({vertex:new Map(),edge:new Map(),face:new Map()});
const stable=value=>JSON.stringify(function sort(v){if(Array.isArray(v))return v.map(sort);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]));return v;}(value));
const authoredMetadata=item=>{const {geometry,...metadata}=item.descriptor;return stable({type:item.type,...metadata});};

export function liftPrismSelectionIndexV2(input){
 const args=fields(input,['sourceIndex','featureId','regionId','topology']),api=privateAPI(args.sourceIndex,1),data=snapshot({plan:api.plan,featureId:args.featureId,regionId:args.regionId,topology:args.topology});
 if(!integer(data.featureId)||!text(data.regionId,8192))fail('Expected a genuine initial prism origin.','INVALID_REQUEST');
 const source=readSource(api,data.plan,1),topology=validateOwnedTopology(data.topology);
 if(source.plan.featureId!==data.featureId||source.plan.regionId!==data.regionId)fail('Initial prism lift must retain its actual origin and region.','INVALID_REQUEST');
 if(topology.solidCount!==1)fail('An initial prism must be one actual native solid.');
 const maps=emptyMaps();for(const claim of source.claims){if(!integer(claim.sourceIndex,topology[plural(claim.kind)].length))fail('Prism source binding exceeds actual topology.');maps[claim.kind].set(claim.id,claim.sourceIndex);}
 return finish({featureId:data.featureId,source:'prism-construction-history',sourceContexts:source.contexts,topology,descriptors:source.descriptors,unresolved:[...source.prior.values()],maps});
}

function derive(sources,data,edge,authoredRemoval=false){
 const featureId=data.featureId;if(!integer(featureId))fail('Expected a fresh producer identity.','INVALID_REQUEST');
 const sourceContexts=contexts(sources.flatMap(x=>x.contexts),64);
 if(sources.some(s=>s.plan.featureId===featureId)||sourceContexts.some(c=>c.featureId===featureId))fail('Result producer must differ from source producers and origins.','INVALID_REQUEST');
 const topology=validateOwnedTopology(data.topology);if(edge&&topology.solidCount!==1)fail('Treatment lineage requires one actual native solid.');
 const metadata=new Map(),prior=new Map();
 for(const s of sources)for(const [id,row]of s.prior){if(prior.has(id)&&stable(prior.get(id))!==stable(row))unavailable('Conflicting first-failure histories cannot be repaired.');prior.set(id,row);}
 for(const s of sources)for(const [id,item]of s.descriptors){if(prior.has(id))unavailable('An unresolved identity cannot be repaired from another branch.');if(metadata.has(id)&&authoredMetadata(metadata.get(id))!==authoredMetadata(item))unavailable('One opaque identity cannot change authored origin or metadata.');metadata.set(id,item);}
 let selected=[];
 if(edge){
  if(!['fillet','chamfer-equal'].includes(data.kind))fail('Expected a qualified treatment kind.','INVALID_REQUEST');
  selected=array(data.selectedEdgeIds,16);if(!selected.length||selected.some(id=>!key(id)||sources[0].descriptors.get(id)?.type!=='edge')||new Set(selected).size!==selected.length)fail('Select distinct current authored edges.','INVALID_SELECTION');
 }
 let removed=[];
 if(authoredRemoval){
  if(sources.length!==1||data.ancestries[0]?.version!==2)fail('Shell retirement requires one genuine source and full native history.');
  removed=array(data.removedFaceIds,16);
  if(!removed.length||new Set(removed).size!==removed.length||removed.some(id=>!key(id)||sources[0].descriptors.get(id)?.type!=='face'))fail('Only current discovered source faces can be intentionally removed.','UNRESOLVED_SELECTION');
 }
 for(let i=0;i<sources.length;i++)if(data.ancestries[i]?.version===1&&sources[i].claims.some(x=>x.kind==='vertex'))unavailable('Legacy ancestry cannot observe advertised vertex identities.');
 // The common core receives exactly the genuine source count. It recaptures
 // only this already detached snapshot, never original caller data or APIs.
 const core=reconcileNativeSelectionClaims({sources:sources.map((s,i)=>({claims:s.claims,ancestry:data.ancestries[i]})),topology});
 const maps=emptyMaps(),resolved=new Map(),unresolved=[...prior.values()];
 for(const item of core.resolved){const meta=metadata.get(item.id);maps[item.kind].set(item.id,core['resolve'+item.kind[0].toUpperCase()+item.kind.slice(1)](item.id));resolved.set(item.id,meta);}
 for(const row of core.unresolved)unresolved.push({...row,featureId,originFeatureId:metadata.get(row.id).descriptor.originFeatureId});
 if(authoredRemoval){
  // Reconcile and validate ALL actual kernel relations first. Do not filter the
  // input claims to make merged/split histories look unique. Then retire only
  // the explicitly authored keys, even if the builder maps them to a rim face.
  const retired=new Set(removed);
  for(let i=unresolved.length-1;i>=0;i--)if(retired.has(unresolved[i].id))unresolved.splice(i,1);
  for(const id of removed){
   const descriptor=sources[0].descriptors.get(id).descriptor;
   maps.face.delete(id);resolved.delete(id);
   unresolved.push({kind:'face',id,reason:'AUTHORED_REMOVAL',sourceFeatureId:sources[0].plan.featureId,featureId,originFeatureId:descriptor.originFeatureId});
  }
 }
 if(edge){
  const generators=new Map(),count=data.ancestries[0].sourceCounts.edges;
  for(let i=1;i<=count;i++)for(const target of core.readGenerated(0,'edge',i).faces){let set=generators.get(target);if(!set){set=new Set();generators.set(target,set);}set.add(i);}
  const occupied=new Set(maps.face.values());
  for(const id of selected.slice().sort(compare)){
   const source=sources[0].bindings.get(id),targets=core.readGenerated(0,'edge',source).faces;
   if(targets.length!==1||generators.get(targets[0]).size!==1||occupied.has(targets[0]))continue;
   const next='worker-edge-treatment-selection:1:'+JSON.stringify([featureId,data.kind,'face','blend',id]);
   if(!key(next))fail('Generated blend key exceeds its bound.','SELECTION_RESOURCE_LIMIT');
   if(metadata.has(next)||prior.has(next)||resolved.has(next))unavailable('Generated blend identity collides with authored history.');
   const d={id:next,role:'blend',sourceEdgeId:id,kind:data.kind,originFeatureId:metadata.get(id).descriptor.originFeatureId,geometry:topology.faces[targets[0]-1].type};
   maps.face.set(next,targets[0]);occupied.add(targets[0]);resolved.set(next,{type:'face',descriptor:d});
  }
 }
 return finish({featureId,source:'kernel-operation-history',sourceContexts,topology,descriptors:resolved,unresolved,maps});
}

export function deriveBooleanSelectionIndexV2(input){
 const args=fields(input,['sources','ancestries','topology','featureId']),indices=array(args.sources,2),ancestries=array(args.ancestries,2);
 if(indices.length!==2||ancestries.length!==2)fail('Exactly two genuine Boolean inputs are required.');
 const apis=indices.map(x=>privateAPI(x,2)),data=snapshot({plans:apis.map(x=>x.plan),ancestries,topology:args.topology,featureId:args.featureId});
 return derive(apis.map((api,i)=>readSource(api,data.plans[i],2)),data,false);
}
export function deriveEdgeSelectionIndexV2(input){
 const args=fields(input,['sourceIndex','ancestry','topology','featureId','kind','selectedEdgeIds']),api=privateAPI(args.sourceIndex,2),data=snapshot({plan:api.plan,ancestries:[args.ancestry],topology:args.topology,featureId:args.featureId,kind:args.kind,selectedEdgeIds:args.selectedEdgeIds});
 return derive([readSource(api,data.plan,2)],data,true);
}

// Inherit only the named target's identities (e.g. a semantic-hole Cut A).
// The caller separately validates the real tool/other native input history;
// it is not a named source here, and generated walls/rims acquire no new IDs.
export function deriveInheritedSelectionIndexV2(input){
 const args=fields(input,['sourceIndex','ancestry','topology','featureId']),api=privateAPI(args.sourceIndex,2),data=snapshot({plan:api.plan,ancestries:[args.ancestry],topology:args.topology,featureId:args.featureId});
 return derive([readSource(api,data.plan,2)],data,false);
}

// Same genuine ancestry path as other v2 operations, with the shell's captured
// authored removals applied to the new private binding map after reconciliation.
export function deriveShellSelectionIndexV2(input){
 const args=fields(input,['sourceIndex','ancestry','topology','featureId','removedFaceIds']),api=privateAPI(args.sourceIndex,2),data=snapshot({plan:api.plan,ancestries:[args.ancestry],topology:args.topology,featureId:args.featureId,removedFaceIds:args.removedFaceIds});
 return derive([readSource(api,data.plan,2)],data,false,true);
}
