import {parentPort} from 'node:worker_threads';import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {reconcileBooleanSelectionClaims,MAX_BOOLEAN_SELECTION_BYTES} from '../../../modules/engine/mount/booleanSelectionClaims.mjs';
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex'),names=['vertices','edges','faces'],kinds=['vertex','edge','face'],plural=kind=>names[kinds.indexOf(kind)];
const load=name=>fs.readFileSync(new URL(name,import.meta.url)),matrix=load('./matrix-r3/observations.jsonl').toString().trim().split('\n').map(JSON.parse),plate=load('./plate-r1/observations.jsonl').toString().trim().split('\n').map(JSON.parse),oracle=JSON.parse(load('./oracle.json')),source=JSON.parse(load('./native-source-pins.json'));
const producer=JSON.parse(load('./native-producer-pins.json'));assert.equal(producer.sourceCommit,source.nativeSource);assert.equal(producer.sourcesAfterExclusiveOwnerBuilds['ownedBooleanHistoryV1.hpp'].sha256,source.headerSHA256);for(const name of ['matrix-r3','plate-r1'])assert.equal(producer.runtime[name]['observations.jsonl'].sha256,source[name].observationsSHA256);
assert.equal(sha(load('./matrix-r3/observations.jsonl').toString()),source['matrix-r3'].observationsSHA256);assert.equal(sha(load('./plate-r1/observations.jsonl').toString()),source['plate-r1'].observationsSHA256);
const observations=[],failures=[],summary={matrixSuccesses:0,matrixRefusals:0,emptyOutputs:0,multiSolidOutputs:0,sameOriginalLinks:0,resolved:0,NO_DESCENDANT:0,MULTIPLE_DESCENDANTS:0,MERGED_DESCENDANT:0,generatedVertexTargets:0,edgeGeneratedVertexTargets:0,plateCuts:0,plateCornerBindings:0,rawSameKindSplitRelations:0,isolatedNativeSplits:0};
const get=(r,kind,id)=>r[kind==='vertex'?'resolveVertex':kind==='edge'?'resolveEdge':'resolveFace'](id);
const claims=(catalog,prefix)=>kinds.flatMap(kind=>catalog[plural(kind)].map(row=>({kind,id:`${prefix}:${kind}:${row.index}`,sourceIndex:row.index})));
function preservation(input){assert.equal(input.serializedBRepEqual,true);assert.equal(input.beforeBRepBytes,input.afterBRepBytes);assert.deepEqual(input.beforeCatalog,input.afterCatalog);assert.deepEqual(input.beforeTolerances,input.afterTolerances)}
function certificate(cert,catalog,raw){
 assert.deepEqual(Object.keys(cert).sort(),['version','scope','persistentIds','kind','method','copyGeometry','copyMesh','sourceCounts','workingCounts',...names].sort());assert.equal(cert.version,1);assert.equal(cert.scope,'response-local');assert.equal(cert.persistentIds,false);assert.equal(cert.kind,'verified-detached-native-copy');
 const empty=names.every(k=>catalog[k].length===0);assert.equal(cert.method,empty?'TopoDS_Shape.EmptyCopied':'BRepBuilderAPI_Copy');assert.equal(cert.copyGeometry,!empty);assert.equal(cert.copyMesh,!empty);
 for(const name of names){assert.equal(cert.sourceCounts[name],catalog[name].length);assert.equal(cert.workingCounts[name],catalog[name].length);assert.equal(raw.sourceCounts[name],catalog[name].length);assert.equal(cert[name].length,catalog[name].length);const used=new Set();for(let i=0;i<cert[name].length;i++){const entry=cert[name][i];assert.deepEqual(Object.keys(entry).sort(),['source','target']);assert.equal(entry.source,i+1);assert(Number.isSafeInteger(entry.target)&&entry.target>0&&entry.target<=cert.workingCounts[name]);assert(!used.has(entry.target));used.add(entry.target)}assert.equal(used.size,cert.workingCounts[name]);}
 // These are separate reported original→working certificates. Raw Boolean
 // source indices are ALREADY composed to originals; never relabel as IsSame.
}
function inspectRecord(row,sourceClaims){
 const result=row.result;assert(result);preservation(row.inputA);preservation(row.inputB);assert.equal(result.ancestryA.status,'available');assert.equal(result.ancestryB.status,'available');
 const a=result.ancestryA.data,b=result.ancestryB.data;assert.equal(a.version,2);assert.equal(b.version,2);certificate(result.sourceCopyA,row.inputA.beforeCatalog,a);certificate(result.sourceCopyB,row.inputB.beforeCatalog,b);
 const input={sources:[{claims:sourceClaims[0],ancestry:a},{claims:sourceClaims[1],ancestry:b}],topology:result.catalog},before=JSON.stringify(input),r=reconcileBooleanSelectionClaims(input);assert.equal(JSON.stringify(input),before);
 for(const [inputIndex,raw]of[a,b].entries())for(const kind of kinds){const name=plural(kind);for(const entry of raw[name]){
  assert.deepEqual(entry.same,{vertices:[],edges:[],faces:[]});summary.sameOriginalLinks+=names.reduce((n,k)=>n+entry.same[k].length,0);
  assert.deepEqual(r.readGenerated(inputIndex,kind,entry.source),entry.generated);if(new Set([...entry.same[name],...entry.modified[name]]).size>1)summary.rawSameKindSplitRelations++;summary.generatedVertexTargets+=entry.generated.vertices.length;if(kind==='edge')summary.edgeGeneratedVertexTargets+=entry.generated.vertices.length;
 }}
 for(const item of r.resolved){const index=get(r,item.kind,item.id);assert(index>0&&index<=result.catalog[plural(item.kind)].length);assert.equal(item.geometry,item.kind==='vertex'?'point':result.catalog[plural(item.kind)][index-1].type)}
 for(const item of r.unresolved)assert.throws(()=>get(r,item.kind,item.id),{code:'UNRESOLVED_SELECTION'});
 const data={resolved:r.resolved,unresolved:r.unresolved,unclaimed:r.unclaimed};assert.doesNotMatch(JSON.stringify(data),/"(?:sourceIndex|nativeIndex|index|ptr|ref)"\s*:/);assert(new TextEncoder().encode(JSON.stringify(data)).byteLength<=MAX_BOOLEAN_SELECTION_BYTES);
 observations.push({case:row.case,operation:row.operation,status:'PASS',inputSnapshotHashes:{a:sha(row.inputA.beforeCatalog),b:sha(row.inputB.beforeCatalog)},sourceCopyHashes:{a:sha(result.sourceCopyA),b:sha(result.sourceCopyB)},ancestryHashes:{a:sha(a),b:sha(b)},resultCatalogSHA256:sha(result.catalog),inputBytes:new TextEncoder().encode(before).byteLength,resolved:r.resolved.length,unresolvedCounts:Object.fromEntries(['NO_DESCENDANT','MULTIPLE_DESCENDANTS','MERGED_DESCENDANT'].map(reason=>[reason,r.unresolved.filter(x=>x.reason===reason).length])),resultSolidCount:result.metrics.solidCount});
 return r;
}
for(const row of matrix){try{
 if(row.refusal){assert(['BOOLEAN_INVALID_REQUEST','BOOLEAN_NON_SOLID_INPUT'].includes(row.refusal));assert(!row.result);preservation(row.inputA);preservation(row.inputB);summary.matrixRefusals++;continue}
 const shared=row.case.startsWith('same-handle-');if(shared)assert.deepEqual(row.inputA.beforeCatalog,row.inputB.beforeCatalog);
 const r=inspectRecord(row,[claims(row.inputA.beforeCatalog,`fixture:${row.case}:${shared?'shared':'A'}`),claims(row.inputB.beforeCatalog,`fixture:${row.case}:${shared?'shared':'B'}`)]),expected=oracle.rows.find(x=>x.case===row.case);assert(expected);
 assert.deepEqual(r.resolved.map(x=>({kind:x.kind,id:x.id,index:get(r,x.kind,x.id)})),expected.resolved);assert.deepEqual(r.unresolved,expected.unresolved);
 summary.matrixSuccesses++;summary.resolved+=r.resolved.length;for(const reason of['NO_DESCENDANT','MULTIPLE_DESCENDANTS','MERGED_DESCENDANT'])summary[reason]+=r.unresolved.filter(x=>x.reason===reason).length;
 if(row.result.metrics.empty){summary.emptyOutputs++;assert.equal(r.resolved.length,0);assert.deepEqual(r.unclaimed,{vertices:0,edges:0,faces:0})}if(row.result.metrics.solidCount>1)summary.multiSolidOutputs++;
 if(shared&&row.operation!==1){assert.equal(r.resolved.length,26);assert.equal(r.unresolved.length,0)}
 }catch(error){failures.push({case:row.case,message:error.message,code:error.code??null,stack:error.stack})}}
// With ALL original members claimed, genuine split candidates also collide
// with other identities and correctly get MERGED precedence. A subset of the
// same real source selections isolates the actual split without changing any
// native history/catalog or inventing a generated descendant.
let isolatedSplitControl;
try{
 const row=matrix.find(x=>x.case==='overlap-ab-0'),raw=row.result.ancestryA.data,split=raw.edges.find(x=>new Set([...x.same.edges,...x.modified.edges]).size>1);assert(split);assert.equal(split.source,9);assert.deepEqual(split.modified.edges,[5,13]);
 const id='fixture:isolated-native-overlap-split',r=reconcileBooleanSelectionClaims({sources:[{claims:[{kind:'edge',id,sourceIndex:split.source}],ancestry:raw},{claims:[],ancestry:row.result.ancestryB.data}],topology:row.result.catalog});assert.equal(r.unresolved.length,1);assert.equal(r.unresolved[0].reason,'MULTIPLE_DESCENDANTS');assert.equal(r.unresolved[0].candidateCount,2);assert.equal(r.unresolved[0].reportedDeleted[0].reportedDeleted,false);assert.throws(()=>r.resolveEdge(id),{code:'UNRESOLVED_SELECTION'});summary.isolatedNativeSplits++;
 isolatedSplitControl={case:row.case,scope:'subset of fixture-local claims over unchanged actual native rows/catalog',sourceInput:'A',sourceIndex:split.source,nativeCandidates:split.modified.edges,unresolved:r.unresolved};
}catch(error){failures.push({case:'isolated actual split',message:error.message,stack:error.stack})}
const plateChains=[];
for(const [label,width,height]of[['plate100x50',100,50],['plate150x30',150,30]])try{
 const initial=plate.find(x=>x.case===label+'-initial');assert(initial);assert.equal(initial.cornerEdges.length,4);const cornerIds=initial.cornerEdges.map((_,i)=>`native-fixture-construction-corner:${i}`),initialClaims=claims(initial.catalog,`fixture:${label}:initial`);for(let i=0;i<4;i++){const index=initial.cornerEdges[i],entry=initialClaims.find(x=>x.kind==='edge'&&x.sourceIndex===index);entry.id=cornerIds[i];const edge=initial.catalog.edges[index-1],expected=[[0,0],[width,0],[width,height],[0,height]][i];assert.deepEqual(edge.vertices.map(v=>initial.catalog.vertices[v-1].point),[[...expected,0],[...expected,20]])}
 let current=initialClaims,lastCatalog=initial.catalog;const checkpoints=[];
 for(let step=0;step<5;step++){
  const row=plate.find(x=>x.case===label+'-hole-'+step),lineage=plate.find(x=>x.case===label+'-lineage-'+step);assert.deepEqual(row.inputA.beforeCatalog,lastCatalog);
  const r=inspectRecord(row,[current,claims(row.inputB.beforeCatalog,`fixture:${label}:tool-${step}`)]),corners=cornerIds.map(id=>r.resolveEdge(id));assert.deepEqual(corners,lineage.outputCorners);
  assert.deepEqual(current.filter(x=>cornerIds.includes(x.id)).map(x=>x.sourceIndex),lineage.inputCorners);current=r.resolved.map(x=>({kind:x.kind,id:x.id,sourceIndex:get(r,x.kind,x.id)}));lastCatalog=row.result.catalog;summary.plateCuts++;summary.plateCornerBindings+=4;checkpoints.push({step,cornerIds,corners,resultHash:sha(lastCatalog)});
 }
 assert.deepEqual(lastCatalog,plate.find(x=>x.case===label+'-holes-5').catalog);assert(plate.find(x=>x.case===label+'-ancestor-preservation').allExact);plateChains.push({case:label,status:'PASS',scope:'recorded fixed-cylinder Boolean cuts only, not authored/public through-all hole semantics',checkpoints});
}catch(error){failures.push({case:label,message:error.message,code:error.code??null,stack:error.stack})}
try{assert.equal(summary.matrixSuccesses,59);assert.equal(summary.matrixRefusals,2);assert.equal(summary.emptyOutputs,19);assert.equal(summary.multiSolidOutputs,9);assert.equal(summary.sameOriginalLinks,0);assert(summary.NO_DESCENDANT>0&&summary.MERGED_DESCENDANT>0);assert.equal(summary.rawSameKindSplitRelations,48);assert.equal(summary.isolatedNativeSplits,1);assert.equal(summary.plateCuts,10);assert.equal(summary.plateCornerBindings,40);assert.equal(summary.edgeGeneratedVertexTargets,20);assert.equal(summary.generatedVertexTargets,40)}catch(error){failures.push({case:'aggregate',message:error.message})}
parentPort.postMessage({status:failures.length?'FAIL':'PASS',scope:'actual Node Worker replay of recorded genuine native v2 Boolean observations; no new native/browser/public execution',summary,observations,isolatedSplitControl,plateChains,failures});
