// Pure Worker-side reconciliation only. This is not a public selection plan,
// native validity test, geometry match, persistent-ID store or document model.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
export const MAX_BOOLEAN_SELECTION_BYTES=524288;
const kinds=['vertex','edge','face'],plural=k=>k==='vertex'?'vertices':k==='edge'?'edges':'faces',limit=k=>k==='vertex'?1024:k==='edge'?512:256;
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code})};
const integer=(n,max,min=0)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const key=id=>typeof id==='string'&&id.length>0&&id.length<=16384;
const record=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))fail('Expected exact Boolean selection fields.');return value};
// Bound and detach the ENTIRE input, including topology, before validation can
// read nested members. Accessors/toJSON/custom prototypes are never invoked.
function capture(input){
 const encoder=new TextEncoder(),active=new Set();let bytes=0,nodes=0;
 const charge=n=>{bytes+=n;if(bytes>MAX_BOOLEAN_SELECTION_BYTES)fail('Captured Boolean selection observation exceeds its byte budget.','SELECTION_RESOURCE_LIMIT')};
 function visit(value,depth){
  if(depth>24||++nodes>131072)fail('Boolean selection observation exceeds its work budget.','SELECTION_RESOURCE_LIMIT');
  if(value===null||typeof value==='boolean'){charge(value===null?4:value?4:5);return value}
  if(typeof value==='number'){if(!Number.isFinite(value))fail('Boolean selection numbers must be finite.');charge(JSON.stringify(value).length);return value}
  if(typeof value==='string'){if(value.length>16384)fail('Boolean selection text exceeds its bound.','SELECTION_RESOURCE_LIMIT');charge(encoder.encode(JSON.stringify(value)).byteLength);return value}
  if(!value||typeof value!=='object'||active.has(value))fail('Boolean selections must be acyclic plain data.');
  const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
  if(!array&&proto!==null&&proto!==Object.prototype)fail('Boolean selections must be plain data.');
  if(array&&value.length>4096)fail('Boolean selection arrays exceed their work bound.','SELECTION_RESOURCE_LIMIT');
  const keys=Reflect.ownKeys(value);if(array&&keys.length!==value.length+1||!array&&keys.length>32)fail('Expected bounded dense Boolean selection data.');
  active.add(value);const out=array?[]:{};charge(2+Math.max(0,(array?value.length:keys.length)-1));
  const members=array?Array.from({length:value.length},(_,i)=>String(i)):keys;
  for(const name of members){if(typeof name!=='string'||!array&&(name.length>64||name==='__proto__'))fail('Unsupported Boolean selection data key.');const d=Object.getOwnPropertyDescriptor(value,name);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Boolean selection fields must be own enumerable data.');if(!array)charge(encoder.encode(JSON.stringify(name)).byteLength+1);out[name]=visit(d.value,depth+1)}
  active.delete(value);return out;
 }
 return visit(input,0);
}
function freeze(value){if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value)}return value}
function ancestry(value,topology){
 const supported=value?.version===2?kinds:['edge','face'],names=supported.map(plural);
 const a=record(value,['version','scope','persistentIds','sourceCounts','resultCounts',...names]);
 if(![1,2].includes(a.version)||a.scope!=='response-local'||a.persistentIds!==false)fail('Expected response-local native ancestry version1 or2.');
 for(const name of['sourceCounts','resultCounts']){record(a[name],names);for(const kind of supported)if(!integer(a[name][plural(kind)],limit(kind)))fail('Boolean ancestry counts exceed their bounds.');}
 for(const kind of supported)if(a.resultCounts[plural(kind)]!==topology[plural(kind)].length)fail('Boolean ancestry and actual result membership differ.');
 function targets(value){const out=record(value,names);for(const kind of supported){const xs=out[plural(kind)];if(!Array.isArray(xs)||xs.length>limit(kind)||xs.some(n=>!integer(n,a.resultCounts[plural(kind)],1))||new Set(xs).size!==xs.length)fail('Boolean ancestry targets must be unique actual output members.');}return out}
 for(const kind of supported){const rows=a[plural(kind)];if(!Array.isArray(rows)||rows.length!==a.sourceCounts[plural(kind)])fail('Boolean ancestry must cover every ordered source member.');for(let i=0;i<rows.length;i++){const row=record(rows[i],['source','same','modified','generated','reportedDeleted']);if(row.source!==i+1||typeof row.reportedDeleted!=='boolean')fail('Expected complete ordered Boolean ancestry rows.');for(const field of['same','modified','generated'])targets(row[field]);if(supported.some(other=>other!==kind&&row.same[plural(other)].length))fail('Unchanged topology cannot change kind.');}}
 return a;
}
function reconcileSelectionClaims(input,minimumSources){
 const args=record(capture(input),['sources','topology']);if(!Array.isArray(args.sources)||args.sources.length<minimumSources||args.sources.length>2)fail(minimumSources===2?'Exactly two Boolean source snapshots are required.':'One or two native source snapshots are required.');
 const topology=validateOwnedTopology(args.topology),groups=new Map(),histories=[];
 for(let inputIndex=0;inputIndex<args.sources.length;inputIndex++){
  const source=record(args.sources[inputIndex],['claims','ancestry']),history=ancestry(source.ancestry,topology);if(inputIndex&&history.version!==histories[0].version)fail('Boolean source ancestry versions must match.');histories.push(history);
  if(!Array.isArray(source.claims)||source.claims.length>1792)fail('Boolean source selections exceed their bound.');
  const ids=new Set(),indices={vertex:new Set(),edge:new Set(),face:new Set()};
  for(const value of source.claims){const claim=record(value,['kind','id','sourceIndex']),kind=claim.kind;if(!kinds.includes(kind)||!key(claim.id)||!integer(claim.sourceIndex,history.sourceCounts[plural(kind)],1)||ids.has(claim.id)||indices[kind].has(claim.sourceIndex))fail('Source selections require unique IDs and actual source indices per kind.');ids.add(claim.id);indices[kind].add(claim.sourceIndex);
   let group=groups.get(claim.id);if(group&&group.kind!==kind)fail('The same authored selection cannot change topology kind between inputs.');if(!group){group={kind,id:claim.id,candidates:new Set(),reportedDeleted:[]};groups.set(claim.id,group)}
   const row=history[plural(kind)][claim.sourceIndex-1];for(const target of[...row.same[plural(kind)],...row.modified[plural(kind)]])group.candidates.add(target);group.reportedDeleted.push({input:inputIndex,reportedDeleted:row.reportedDeleted});
  }
 }
 const owners={vertex:new Map(),edge:new Map(),face:new Map()};for(const group of groups.values())for(const target of group.candidates){let ids=owners[group.kind].get(target);if(!ids){ids=new Set();owners[group.kind].set(target,ids)}ids.add(group.id)}
 const resolved=[],unresolved=[],maps={vertex:new Map(),edge:new Map(),face:new Map()};
 for(const group of groups.values()){
  const count=group.candidates.size,merged=[...group.candidates].some(target=>owners[group.kind].get(target).size>1);
  if(count===1&&!merged){const index=[...group.candidates][0];maps[group.kind].set(group.id,index);resolved.push({kind:group.kind,id:group.id,geometry:group.kind==='vertex'?'point':topology[plural(group.kind)][index-1].type})}
  else unresolved.push({kind:group.kind,id:group.id,reason:merged?'MERGED_DESCENDANT':count?'MULTIPLE_DESCENDANTS':'NO_DESCENDANT',candidateCount:count,reportedDeleted:group.reportedDeleted});
 }
 const compare=(a,b)=>a.kind<b.kind?-1:a.kind>b.kind?1:a.id<b.id?-1:a.id>b.id?1:0;resolved.sort(compare);unresolved.sort(compare);
 const unclaimed={vertices:topology.vertices.length-maps.vertex.size,edges:topology.edges.length-maps.edge.size,faces:topology.faces.length-maps.face.size},observation={resolved,unresolved,unclaimed};
 if(new TextEncoder().encode(JSON.stringify(observation)).byteLength>MAX_BOOLEAN_SELECTION_BYTES)fail('Returned Boolean selection observation exceeds its byte budget.','SELECTION_RESOURCE_LIMIT');freeze(observation);
 const resolve=(kind,id)=>{if(!key(id))fail('Expected a current authored selection ID.','INVALID_SELECTION');const index=maps[kind].get(id);if(index===undefined)fail('The selection has no unique inherited Boolean descendant.','UNRESOLVED_SELECTION');return index};
 const readGenerated=(inputIndex,kind,sourceIndex)=>{if(!integer(inputIndex,histories.length-1)||!kinds.includes(kind)||!integer(sourceIndex,histories[inputIndex].sourceCounts[plural(kind)],1))fail('Expected a current private ancestry source member.','INVALID_SELECTION');return freeze(histories[inputIndex][plural(kind)][sourceIndex-1].generated)};
 return Object.freeze({...observation,resolveVertex:id=>resolve('vertex',id),resolveEdge:id=>resolve('edge',id),resolveFace:id=>resolve('face',id),readGenerated});
}

// One capture and the same invariant core for a genuine one-input treatment
// or two-input Boolean. No synthetic source/history is introduced here.
export function reconcileNativeSelectionClaims(input){return reconcileSelectionClaims(input,1)}
// Keep the original Boolean API strictly two-input.
export function reconcileBooleanSelectionClaims(input){return reconcileSelectionClaims(input,2)}
