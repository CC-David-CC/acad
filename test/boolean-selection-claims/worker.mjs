import {parentPort} from 'node:worker_threads';import assert from 'node:assert/strict';
import {reconcileBooleanSelectionClaims as reconcile,MAX_BOOLEAN_SELECTION_BYTES as CAP} from '../../modules/engine/mount/booleanSelectionClaims.mjs';
import {native,catalog,clone,plural,history,claim,fixture,sourceClaims} from './fixtures.mjs';
const rows=[],check=(name,scope,fn)=>{try{const data=fn();rows.push({name,scope,status:'PASS',...(data?{data}:{})})}catch(e){rows.push({name,scope,status:'FAIL',error:e.message,code:e.code??null})}};
const synthetic=(name,fn)=>check(name,'synthetic metadata control; not native Boolean output',fn);
const observation=r=>({resolved:r.resolved,unresolved:r.unresolved,unclaimed:r.unclaimed});
const noIndices=r=>assert.doesNotMatch(JSON.stringify(observation(r)),/"(?:sourceIndex|sourceCounts|resultCounts|nativeIndex|ptr|ref|index)"\s*:/);
const bytes=v=>new TextEncoder().encode(JSON.stringify(v)).byteLength;
for(const name of['edge-fillet','edge-chamfer','healthy-after-refusals'])check('recorded v1 '+name,'recorded genuine single-input native history + explicitly synthetic empty second input, not a fresh Boolean',()=>{
 const row=native.rows.find(r=>r.name===name),claims=sourceClaims(),input={sources:[{claims,ancestry:row.value.ancestry},{claims:[],ancestry:history(row.catalog,1,{edges:0,faces:0})}],topology:row.catalog},before=JSON.stringify(input),r=reconcile(input);
 assert.equal(r.resolved.filter(c=>c.kind==='edge').length,11);assert.equal(r.resolved.filter(c=>c.kind==='face').length,6);assert.equal(r.unresolved.length,1);assert.equal(r.unresolved[0].reason,'NO_DESCENDANT');assert.equal(r.unresolved[0].reportedDeleted[0].reportedDeleted,true);
 let rawDeletedSurvivors=0;for(const c of claims){const a=row.value.ancestry[plural(c.kind)][c.sourceIndex-1],targets=[...new Set([...a.same[plural(c.kind)],...a.modified[plural(c.kind)]])];if(a.reportedDeleted&&targets.length===1){assert.equal((c.kind==='edge'?r.resolveEdge:r.resolveFace)(c.id),targets[0]);rawDeletedSurvivors++}}
 assert(rawDeletedSurvivors>0);assert.equal(JSON.stringify(input),before);assert.deepEqual(r.readGenerated(0,'edge',row.selected[0]),row.value.ancestry.edges[row.selected[0]-1].generated);assert.equal(r.unclaimed.edges,4);assert.equal(r.unclaimed.faces,1);noIndices(r);return{resolvedEdges:11,resolvedFaces:6,rawDeletedSurvivors};
});
synthetic('two input distinct surviving claims use separate same-kind spaces',()=>{
 const x=fixture([claim('eA'),claim('fA',1,'face'),claim('vA',1,'vertex')],[claim('eB',2),claim('fB',2,'face'),claim('vB',2,'vertex')]),r=reconcile(x);
 assert.equal(r.resolved.length,6);assert.equal(r.resolveVertex('vA'),1);assert.equal(r.resolveEdge('eB'),2);assert.equal(r.resolveFace('fB'),2);assert.equal(r.resolved.find(x=>x.id==='vA').geometry,'point');noIndices(r);
});
synthetic('same authored ID unions duplicate same/modified candidates across inputs',()=>{
 const x=fixture([claim('shared')],[claim('shared',2)]);x.sources[0].ancestry.edges[0].modified.edges=[1];x.sources[0].ancestry.edges[0].reportedDeleted=true;x.sources[1].ancestry.edges[1].same.edges=[1];x.sources[1].ancestry.edges[1].reportedDeleted=true;
 const r=reconcile(x);assert.equal(r.resolved.length,1);assert.equal(r.resolveEdge('shared'),1);assert.deepEqual(r.unresolved,[]);
});
synthetic('same ID split or one absent source remains explicit without raw-delete override',()=>{
 const x=fixture([claim('shared')],[claim('shared',2)]),r=reconcile(x);assert.equal(r.unresolved[0].reason,'MULTIPLE_DESCENDANTS');assert.equal(r.unresolved[0].candidateCount,2);assert.deepEqual(r.unresolved[0].reportedDeleted,[{input:0,reportedDeleted:false},{input:1,reportedDeleted:false}]);assert.throws(()=>r.resolveEdge('shared'),{code:'UNRESOLVED_SELECTION'});
 x.sources[0].ancestry.edges[0].same.edges=[];x.sources[0].ancestry.edges[0].reportedDeleted=true;assert.equal(reconcile(x).resolveEdge('shared'),2);
});
synthetic('different input IDs sharing a descendant BOTH become unresolved merges',()=>{
 const x=fixture();x.sources[1].ancestry.edges[1].same.edges=[1];const r=reconcile(x);assert.equal(r.resolved.length,0);assert.deepEqual(r.unresolved.map(x=>[x.id,x.reason,x.candidateCount]),[['A','MERGED_DESCENDANT',1],['B','MERGED_DESCENDANT',1]]);for(const id of['A','B'])assert.throws(()=>r.resolveEdge(id),{code:'UNRESOLVED_SELECTION'});
});
synthetic('overlapping split+merge uses merge precedence across both inputs',()=>{
 const x=fixture();x.sources[0].ancestry.edges[0].modified.edges=[2];const r=reconcile(x);assert.equal(r.unresolved[0].reason,'MERGED_DESCENDANT');assert.equal(r.unresolved[0].candidateCount,2);assert.equal(r.unresolved[1].reason,'MERGED_DESCENDANT');
});
synthetic('generated vertices/edges/faces remain separate, including unclaimed source rows',()=>{
 const x=fixture([claim('A')],[claim('B',2)]),row=x.sources[0].ancestry.edges[0];row.same.edges=[];row.generated={vertices:[1],edges:[2],faces:[1]};x.sources[1].ancestry.edges[5].generated.vertices=[2];
 const r=reconcile(x);assert.equal(r.unresolved[0].reason,'NO_DESCENDANT');assert.equal(r.unresolved[0].reportedDeleted[0].reportedDeleted,false);assert.deepEqual(r.readGenerated(0,'edge',1),row.generated);assert.deepEqual(r.readGenerated(1,'edge',6).vertices,[2]);assert.equal(r.resolved.length,1);assert.equal(r.resolveEdge('B'),2);assert(Object.isFrozen(r.readGenerated(0,'edge',1).vertices));noIndices(r);
});
synthetic('genuine empty output has no inherited members and no fabricated validity claim',()=>{
 const topology={version:1,scope:'response-local',persistentIds:false,valid:true,solidCount:0,vertices:[],edges:[],faces:[]},counts={vertices:8,edges:12,faces:6};
 const input={sources:[{claims:[claim('A')],ancestry:history(topology,2,counts)},{claims:[claim('B',1,'face')],ancestry:history(topology,2,counts)}],topology},r=reconcile(input);assert.equal(r.resolved.length,0);assert(r.unresolved.every(x=>x.reason==='NO_DESCENDANT'));assert.deepEqual(r.unclaimed,{vertices:0,edges:0,faces:0});assert(!Object.hasOwn(r,'valid'));
});
synthetic('same-ID conflicting kinds, duplicate IDs or duplicate per-kind source indices refuse',()=>{
 for(const input of[fixture([claim('A'),claim('A',2)],[]),fixture([claim('A'),claim('C')],[]),fixture([claim('A')],[claim('A',1,'face')])])assert.throws(()=>reconcile(input),{code:'ENGINE_FAILURE'});
});
synthetic('complete ordered ancestry includes every vertex row and actual result member',()=>{
 const changes=[x=>x.sources[0].ancestry.vertices.pop(),x=>x.sources[0].ancestry.vertices[1].source=1,x=>x.sources[0].ancestry.sourceCounts.vertices++,x=>x.sources[0].ancestry.resultCounts.vertices++,x=>x.sources[0].ancestry.edges[0].generated.vertices=[0],x=>x.sources[0].ancestry.edges[0].generated.vertices=[1025],x=>x.sources[0].ancestry.edges[0].generated.vertices=[1,1],x=>x.sources[0].ancestry.edges[0].same.faces=[1],x=>x.sources[0].ancestry.faces[0].reportedDeleted=0,x=>delete x.sources[1].ancestry.faces[0].modified.vertices,x=>x.sources[0].ancestry.version=true];
 for(const change of changes){const x=fixture();change(x);assert.throws(()=>reconcile(x),{code:'ENGINE_FAILURE'})}
});
synthetic('complete unclaimed rows still validate malformed target members',()=>{
 const x=fixture([],[]);x.sources[1].ancestry.vertices[7].modified.faces=[257];assert.throws(()=>reconcile(x),{code:'ENGINE_FAILURE'});
});
synthetic('all nested data including topology refuses accessors before invocation',()=>{
 let reads=0;for(const where of['root','claim','row','target','topology-point']){const x=fixture();const [o,k]=where==='root'?[x,'topology']:where==='claim'?[x.sources[0].claims[0],'id']:where==='row'?[x.sources[1].ancestry.vertices[0],'modified']:where==='target'?[x.sources[0].ancestry.edges[0].same.edges,'0']:[x.topology.vertices[0].point,'0'];Object.defineProperty(o,k,{enumerable:true,get(){reads++;throw Error('must not run')}});assert.throws(()=>reconcile(x),{code:'ENGINE_FAILURE'})}assert.equal(reads,0);
});
synthetic('unknown fields, sparse arrays, prototypes, cycles and nonfinite data refuse',()=>{
 const changes=[x=>x.extra=1,x=>x.sources.push(x.sources[0]),x=>x.sources.pop(),x=>x.sources[0].claims[0].nativeIndex=1,x=>delete x.sources[0].ancestry.edges[0],x=>x.sources[0].claims[0].id='',x=>x.topology.vertices[0].point[0]=Infinity,x=>x.sources[0].claims[0].sourceIndex=1.5,x=>x.sources[0].claims[0].kind='solid',x=>x.topology=x,x=>Object.setPrototypeOf(x.sources[0],{hidden:1})];for(const change of changes){const x=fixture();change(x);assert.throws(()=>reconcile(x))}
});
synthetic('legacy v1 remains explicit, vertex omissions/mixed versions refuse rather than convert',()=>{
 const v1=fixture([claim('A')],[],1),r=reconcile(v1);assert.equal(r.resolveEdge('A'),1);assert.deepEqual(r.readGenerated(0,'edge',1),{edges:[],faces:[]});assert.throws(()=>r.readGenerated(0,'vertex',1),{code:'INVALID_SELECTION'});
 v1.sources[0].claims=[claim('V',1,'vertex')];assert.throws(()=>reconcile(v1),{code:'ENGINE_FAILURE'});const mixed=fixture();mixed.sources[1].ancestry=history(catalog,1);assert.throws(()=>reconcile(mixed),{code:'ENGINE_FAILURE'});
});
function padded(target){
 const all=[];for(const kind of['vertex','edge','face'])for(let i=0;i<catalog[plural(kind)].length;i++)all.push(claim(kind+'-'+i,i+1,kind));
 const x=fixture(clone(all),all.map(c=>({...c,id:'other-'+c.id})));let gap=target-bytes(x);assert(gap>=0);
 for(const source of x.sources)for(const c of source.claims){const n=Math.min(gap,16384-c.id.length);c.id+='x'.repeat(n);gap-=n}assert.equal(gap,0);assert.equal(bytes(x),target);return x;
}
synthetic('captured byte cap is exact, returned observations use actual UTF8, not character estimates',()=>{
 const exact=padded(CAP),r=reconcile(exact),returned=bytes(observation(r));assert(returned<=CAP);assert(returned>CAP-40000);noIndices(r);
 const tooLarge=padded(CAP+1);assert.throws(()=>reconcile(tooLarge),{code:'SELECTION_RESOURCE_LIMIT'});
 const multi=padded(CAP-2),last=multi.sources[1].claims.at(-1);last.id+='界';assert(JSON.stringify(multi).length<CAP);assert(bytes(multi)>CAP);assert.throws(()=>reconcile(multi),{code:'SELECTION_RESOURCE_LIMIT'});
 const unicode=fixture([claim('界'.repeat(10000))],[]),u=reconcile(unicode);assert(bytes(observation(u))>JSON.stringify(observation(u)).length);return{capturedBoundaryBytes:bytes(exact),returnedBoundaryBytes:returned,unicodeReturnedBytes:bytes(observation(u))};
});
synthetic('detached frozen observations and private generated/resolver data survive caller mutation',()=>{
 const x=fixture(),before=JSON.stringify(x),r=reconcile(x),saved=observation(r);assert.equal(JSON.stringify(x),before);x.sources[0].claims[0].id='new';x.sources[0].ancestry.edges[0].same.edges=[3];x.sources[0].ancestry.edges[0].generated.vertices=[1];x.topology.edges[0].type='bspline';assert.equal(r.resolveEdge('A'),1);assert.deepEqual(r.readGenerated(0,'edge',1).vertices,[]);assert(Object.isFrozen(r)&&Object.isFrozen(r.resolved)&&Object.isFrozen(r.resolved[0]));assert.deepEqual(observation(r),saved);
 for(const [fn,args]of[[r.resolveEdge,['missing']],[r.resolveVertex,['missing']],[r.resolveFace,['missing']]])assert.throws(()=>fn(...args),{code:'UNRESOLVED_SELECTION'});assert.throws(()=>r.resolveEdge('x'.repeat(16385)),{code:'INVALID_SELECTION'});for(const args of[[2,'edge',1],[0,'unknown',1],[0,'edge',0],[0,'edge',513]])assert.throws(()=>r.readGenerated(...args),{code:'INVALID_SELECTION'});
});
parentPort.postMessage({status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'actual Node Worker pure reconciliation; recorded genuine legacy single-input histories plus synthetic joint-claim controls only',rows});
