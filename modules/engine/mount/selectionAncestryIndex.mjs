// Pure Worker-side naming from one captured native operation. Native indices
// exist only in private resolver closures; neither this plan nor history owns
// a native shape, guessed geometric match or alternate authored document.
import {validateOwnedTopology,capturePrismConnectorEndpointRoles} from './ownedTopologyContract.mjs';
const MAX_BYTES=524288,MAX_KEY=16384,MAX_UNRESOLVED=4096;
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code});};
const key=v=>typeof v==='string'&&v.length>0&&v.length<=MAX_KEY;
const integer=(v,max,min=0)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const kinds=['edge','face'],plural=k=>k==='edge'?'edges':'faces',limit=k=>k==='edge'?512:256;
const record=(v,keys)=>{
 if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('Expected exact ancestry data fields.');
 const out={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Ancestry fields must be data.');out[k]=d.value;}return out;
};
const array=(v,max)=>{
 if(!Array.isArray(v)||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail('Expected bounded dense ancestry arrays.');
 return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Ancestry arrays must contain data.');return d.value;});
};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
function descriptor(v){
 if(!v||typeof v!=='object'||Array.isArray(v))fail('Expected an authored selection descriptor.');
 const allowed=['id','role','geometry','curveId','incidentCurveIds','endpointRoles','sourceEdgeId','kind'],keys=Reflect.ownKeys(v);
 if(keys.some(k=>typeof k!=='string'||!allowed.includes(k))||!['id','role','geometry'].every(k=>keys.includes(k)))fail('Unsupported authored selection descriptor.');
 const d=record(v,keys);if(!key(d.id)||typeof d.role!=='string'||!d.role||d.role.length>64||typeof d.geometry!=='string'||!d.geometry||d.geometry.length>64)fail('Invalid authored selection identity.');
 if(keys.some(k=>d[k]===undefined))fail('Selection descriptor fields must have explicit values.');
 if(d.curveId!==undefined&&(typeof d.curveId!=='string'||!d.curveId||d.curveId.length>256))fail('Invalid source curve identity.');
 if(d.incidentCurveIds!==undefined){d.incidentCurveIds=array(d.incidentCurveIds,2);if(d.incidentCurveIds.length!==2||!d.incidentCurveIds.every(x=>typeof x==='string'&&x&&x.length<=256)||d.incidentCurveIds[0]>=d.incidentCurveIds[1])fail('Expected two canonical incident curve identities.');}
 if(d.endpointRoles!==undefined){if(d.role!=='connector'||d.curveId!==undefined||d.boundaryRef!==undefined||d.incidentBoundaryRefs!==undefined)fail('Endpoint occurrences require an actual whole-curve connector.');d.endpointRoles=capturePrismConnectorEndpointRoles(d.endpointRoles,d.incidentCurveIds);}
 if(d.sourceEdgeId!==undefined&&!key(d.sourceEdgeId)||d.kind!==undefined&&!['fillet','chamfer-equal'].includes(d.kind))fail('Invalid treatment source identity.');return d;
}
function captureAncestry(input,topology){
 const a=record(input,['version','scope','persistentIds','sourceCounts','resultCounts','edges','faces']);
 if(a.version!==1||a.scope!=='response-local'||a.persistentIds!==false)fail('Expected response-local native ancestry.');
 const counts={};for(const name of['sourceCounts','resultCounts']){counts[name]=record(a[name],['edges','faces']);for(const k of kinds)if(!integer(counts[name][plural(k)],limit(k)))fail('Native ancestry counts exceed their bounds.');}
 for(const k of kinds)if(counts.resultCounts[plural(k)]!==topology[plural(k)].length)fail('Native ancestry and result catalog differ.');
 const targets=v=>{const t=record(v,['edges','faces']);for(const k of kinds){const xs=array(t[plural(k)],limit(k)),seen=new Set();for(const n of xs){if(!integer(n,counts.resultCounts[plural(k)],1)||seen.has(n))fail('Native ancestry target indices must be unique result members.');seen.add(n);}t[plural(k)]=xs;}return t;};
 const rows={};for(const k of kinds){const xs=array(a[plural(k)],limit(k));if(xs.length!==counts.sourceCounts[plural(k)])fail('Native ancestry omits input members.');
  rows[k]=xs.map((value,i)=>{const r=record(value,['source','same','modified','generated','reportedDeleted']);if(r.source!==i+1||typeof r.reportedDeleted!=='boolean')fail('Native ancestry sources must be complete ordered members.');for(const field of['same','modified','generated'])r[field]=targets(r[field]);if(r.same[plural(k==='edge'?'face':'edge')].length)fail('An unchanged shape cannot change topology kind.');return r;});
 }
 return{rows,counts};
}
function priorUnresolved(values){
 const out=[];for(const value of array(values,MAX_UNRESOLVED+2)){
  if(value&&typeof value==='object'&&Object.hasOwn(value,'id')){
   const r=record(value,['kind','id','reason','candidateCount','reportedDeleted','featureId']);
   if(!kinds.includes(r.kind)||!key(r.id)||!['NO_DESCENDANT','MULTIPLE_DESCENDANTS','MERGED_DESCENDANT'].includes(r.reason)||!integer(r.candidateCount,limit(r.kind))||typeof r.reportedDeleted!=='boolean'||!integer(r.featureId,Number.MAX_SAFE_INTEGER,1))fail('Invalid prior unresolved selection.');out.push(r);
  }else{const r=record(value,['kind','count','reason']);if(!kinds.includes(r.kind)||!integer(r.count,limit(r.kind),1)||!['UNAUTHORED_KERNEL_EDGE','UNCLAIMED_KERNEL_ENTITY'].includes(r.reason))fail('Invalid unclaimed selection observation.');}
 }
 return out;
}

export function deriveSelectionAncestryIndex(input){
 const {sourceIndex,ancestry,topology,featureId,kind,selectedEdgeIds}=record(input,['sourceIndex','ancestry','topology','featureId','kind','selectedEdgeIds']);
 if(!integer(featureId,Number.MAX_SAFE_INTEGER,1)||!['fillet','chamfer-equal'].includes(kind))fail('Expected a current treatment identity and kind.','INVALID_REQUEST');
 const api=record(sourceIndex,['plan','resolveEdge','resolveFace']);if(typeof api.resolveEdge!=='function'||typeof api.resolveFace!=='function')fail('A private source selection index is required.');
 const source=record(api.plan,['version','featureId','regionId','scope','source','edges','faces','unresolved']);
 if(source.version!==1||!integer(source.featureId,Number.MAX_SAFE_INTEGER,1)||typeof source.regionId!=='string'||!source.regionId||source.regionId.length>8192||source.scope!=='authored-source'||!['prism-construction-history','kernel-operation-history'].includes(source.source))fail('Unsupported authored source selection plan.');
 const catalog=validateOwnedTopology(topology);if(catalog.solidCount!==1)fail('Edge treatment propagation requires one valid native solid.');
 const captured=captureAncestry(ancestry,catalog),seenKeys=new Set(),inputMaps={edge:new Map(),face:new Map()},items=[];
 for(const type of kinds){const used=new Set();for(const value of array(source[plural(type)],limit(type))){const d=descriptor(value);if(seenKeys.has(d.id))fail('Source selection identities must be unique.');seenKeys.add(d.id);let index;
   try{index=(type==='edge'?api.resolveEdge:api.resolveFace)(d.id);}catch{fail('An advertised source selection does not resolve.');}
   if(!integer(index,captured.counts.sourceCounts[plural(type)],1)||used.has(index))fail('Source selections must bind unique actual input members.');used.add(index);inputMaps[type].set(d.id,index);
   const row=captured.rows[type][index-1],candidates=new Set([...row.same[plural(type)],...row.modified[plural(type)]]);items.push({type,descriptor:d,index,row,candidates});
  }}
 const unresolved=priorUnresolved(source.unresolved);for(const r of unresolved){if(seenKeys.has(r.id))fail('An unresolved source identity cannot also be resolved.');seenKeys.add(r.id);}
 let selected;try{selected=array(selectedEdgeIds,16);}catch{fail('Expected one to sixteen semantic edge identities.','INVALID_SELECTION');}
 if(!selected.length||selected.some(id=>!key(id)||!inputMaps.edge.has(id))||new Set(selected).size!==selected.length)fail('Select distinct current authored edges.','INVALID_SELECTION');
 const claims={edge:new Map(),face:new Map()};for(const item of items)for(const target of item.candidates){let owners=claims[item.type].get(target);if(!owners){owners=new Set();claims[item.type].set(target,owners);}owners.add(item.descriptor.id);}
 const output={edges:[],faces:[],unresolved:[]},maps={edge:new Map(),face:new Map()},used={edge:new Set(),face:new Set()},outIds=new Set();
 const header={version:1,featureId,regionId:source.regionId,scope:'authored-source',source:'kernel-operation-history',edges:[],faces:[],unresolved:[]};
 const encoder=new TextEncoder();let bytes=encoder.encode(JSON.stringify(header)).byteLength;
 const append=(list,value)=>{const encoded=encoder.encode(JSON.stringify(value)).byteLength+(output[list].length?1:0);if(bytes+encoded>MAX_BYTES||list==='unresolved'&&output.unresolved.length>=MAX_UNRESOLVED+2)fail('Selection ancestry exceeds its bounded observation budget.','SELECTION_RESOURCE_LIMIT');bytes+=encoded;output[list].push(value);};
 const add=(type,d,index)=>{
  if(!key(d.id))fail('Encoded selection identity exceeds its bound.','SELECTION_RESOURCE_LIMIT');
  if(outIds.has(d.id)||used[type].has(index))fail('Resolved selection identities and native targets must be unique.');
  const value={...d,geometry:catalog[plural(type)][index-1].type};append(plural(type),value);maps[type].set(d.id,index);used[type].add(index);outIds.add(d.id);
 };
 for(const r of unresolved){append('unresolved',r);outIds.add(r.id);}
 for(const item of items){const count=item.candidates.size,merged=[...item.candidates].some(target=>claims[item.type].get(target).size>1);
  if(count===1&&!merged)add(item.type,item.descriptor,[...item.candidates][0]);
  else{const r={kind:item.type,id:item.descriptor.id,reason:merged?'MERGED_DESCENDANT':count?'MULTIPLE_DESCENDANTS':'NO_DESCENDANT',candidateCount:count,reportedDeleted:item.row.reportedDeleted,featureId};append('unresolved',r);outIds.add(r.id);}
 }
 // Generated faces are not descendants of an old edge identity. Check all
 // source-edge attribution rows, not just the caller's selected seeds.
 const generators=new Map();for(const row of captured.rows.edge)for(const target of row.generated.faces){let set=generators.get(target);if(!set){set=new Set();generators.set(target,set);}set.add(row.source);}
 for(const id of selected.slice().sort()){
  const index=inputMaps.edge.get(id),generated=captured.rows.edge[index-1].generated.faces;if(generated.length!==1)continue;
  const target=generated[0];if(generators.get(target).size!==1||used.face.has(target))continue;
  const next='worker-edge-treatment-selection:1:'+JSON.stringify([featureId,kind,'face','blend',id]);
  add('face',{id:next,role:'blend',sourceEdgeId:id,kind},target);
 }
 for(const type of kinds){const count=catalog[plural(type)].length-used[type].size;if(count)append('unresolved',{kind:type,count,reason:'UNCLAIMED_KERNEL_ENTITY'});}
 const compare=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;output.edges.sort(compare);output.faces.sort(compare);
 const plan=freeze({...header,...output});if(encoder.encode(JSON.stringify(plan)).byteLength>MAX_BYTES)fail('Encoded selection ancestry exceeds its observation budget.','SELECTION_RESOURCE_LIMIT');
 const resolve=(type,id)=>{if(!key(id))fail('Expected a discovered authored selection identity.','INVALID_SELECTION');const index=maps[type].get(id);if(index===undefined)fail('The authored selection has no unique current descendant.','UNRESOLVED_SELECTION');return index;};
 return Object.freeze({plan,resolveEdge:id=>resolve('edge',id),resolveFace:id=>resolve('face',id)});
}
