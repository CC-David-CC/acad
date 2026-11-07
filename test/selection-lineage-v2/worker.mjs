import {parentPort} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {liftPrismSelectionIndexV2 as lift,deriveBooleanSelectionIndexV2 as boolean,deriveEdgeSelectionIndexV2 as edge} from '../../modules/engine/mount/selectionLineageIndex.mjs';
import {edgeReceipt,native,edgeBase,mainBase,edgeAt,identity,renamed} from './fixtures.mjs';
const rows=[],check=(name,fn)=>{try{const data=fn();rows.push({name,status:'PASS',...(data?{data}:{})});}catch(e){rows.push({name,status:'FAIL',error:{message:e.message,code:e.code??null,stack:e.stack}});}};
const noNative=plan=>assert.doesNotMatch(JSON.stringify(plan),/"(?:index|sourceIndex|nativeIndex|handle|ptr|resolveEdge|resolveFace|resolveVertex)"\s*:/);
const base=edgeBase(),real=Object.fromEntries(edgeReceipt.rows.filter(r=>r.catalog).map(r=>[r.name,r]));
const treatment=(source,row,featureId,kind)=>edge({sourceIndex:source,ancestry:row.value.ancestry,topology:row.catalog,featureId,kind,selectedEdgeIds:row.selected.map(n=>edgeAt(source,n))});
let first;
check('actual frozen initial prism lifts exact keys and genuine component origin',()=>{
 assert.equal(base.v2.plan.version,2);assert.equal(Object.hasOwn(base.v2.plan,'regionId'),false);assert.deepEqual(base.v2.plan.sourceContexts,[{kind:'sketch-profile',featureId:1,regionId:'component-rectangle'}]);
 assert.deepEqual(base.v2.plan.edges.map(x=>x.id).sort(),base.v1.plan.edges.map(x=>x.id).sort());assert.deepEqual(base.v2.plan.vertices,[]);
 assert.deepEqual(base.v2.plan.unresolved,[{kind:'vertex',count:8,reason:'UNCLAIMED_KERNEL_ENTITY'}]);
 for(const d of base.v2.plan.edges){assert.equal(d.originFeatureId,1);assert.equal(base.v2.resolveEdge(d.id),base.v1.resolveEdge(d.id));}noNative(base.v2.plan);
});
check('actual frozen fillet uses one real source and actual unique generated blend',()=>{
 first=treatment(base.v2,real['edge-fillet'],101,'fillet');assert.equal(first.plan.edges.length,11);assert.equal(first.plan.faces.length,7);
 const lost=edgeAt(base.v2,real['edge-fillet'].selected[0]),r=first.plan.unresolved.find(x=>x.id===lost);assert.deepEqual(r,{kind:'edge',id:lost,reason:'NO_DESCENDANT',candidateCount:0,reportedDeleted:[{input:0,reportedDeleted:true}],featureId:101,originFeatureId:1});
 const blend=first.plan.faces.find(x=>x.role==='blend');assert.equal(blend.id,'worker-edge-treatment-selection:1:'+JSON.stringify([101,'fillet','face','blend',lost]));assert.equal(blend.originFeatureId,1);assert.equal(blend.geometry,'cylinder');noNative(first.plan);
 return{resolvedEdges:11,resolvedFaces:7,origin:blend.originFeatureId};
});
check('actual frozen subsequent chamfer preserves first failure and old blend origin',()=>{
 assert(first);const next=treatment(first,real['edge-sequential'],103,'chamfer-equal');for(const r of first.plan.unresolved.filter(x=>x.id))assert.deepEqual(next.plan.unresolved.find(x=>x.id===r.id),r);
 assert.equal(next.plan.faces.filter(x=>x.role==='blend').length,2);assert(next.plan.faces.every(x=>x.originFeatureId===1));assert.deepEqual(next.plan.sourceContexts,base.v2.plan.sourceContexts);noNative(next.plan);
});
check('actual frozen size replay retains opaque keys with changed native geometry',()=>{
 const small=treatment(base.v2,real['healthy-after-refusals'],101,'fillet');assert.notEqual(real['edge-fillet'].value.nativeVolume,real['healthy-after-refusals'].value.nativeVolume);assert.deepEqual(small.plan.edges.map(x=>x.id),first.plan.edges.map(x=>x.id));assert.deepEqual(small.plan.faces.map(x=>x.id),first.plan.faces.map(x=>x.id));
});
for(const [name,a,b]of [['disjoint-0','A','C'],['overlap-0','A','B'],['overlap-1','A','B'],['same-operand-0','A','A'],['same-operand-1','A','A'],['real-circle-through-cut','plate','circle-tool']])check('actual main V3 source-bound Boolean '+name,()=>{
 const A=mainBase(a),B=a===b?A:mainBase(b),row=native.rows[name];assert.deepEqual(row.inputA.before.catalog,A.catalog);assert.deepEqual(row.inputB.before.catalog,B.catalog);
 const result=boolean({sources:[A.v2,B.v2],ancestries:[row.value.ancestryA.data,row.value.ancestryB.data],topology:row.output.catalog,featureId:1000});
 assert.equal(Object.hasOwn(result.plan,'regionId'),false);assert(result.plan.sourceContexts.every(c=>c.kind==='sketch-profile'));assert.equal(result.plan.sourceContexts.length,a===b?1:2);
 for(const d of [...result.plan.edges,...result.plan.faces]){assert(result.plan.sourceContexts.some(c=>c.featureId===d.originFeatureId));const type=result.plan.edges.includes(d)?'Edge':'Face',index=result['resolve'+type](d.id);assert.equal(d.geometry,row.output.catalog[type==='Edge'?'edges':'faces'][index-1].type);}
 for(const r of result.plan.unresolved.filter(x=>x.id)){assert(result.plan.sourceContexts.some(c=>c.featureId===r.originFeatureId));assert.equal(r.featureId,1000);assert(r.reportedDeleted.length>=1&&r.reportedDeleted.length<=2);}
 if(name==='disjoint-0')assert.equal(result.plan.edges.length,24);
 if(name==='same-operand-0')assert.equal(result.plan.edges.length,12);
 if(name==='same-operand-1'){assert.equal(result.plan.edges.length,0);assert.equal(result.plan.faces.length,0);assert.equal(result.plan.unresolved.filter(x=>x.id).length,18);}
 noNative(result.plan);return{contexts:result.plan.sourceContexts,resolvedEdges:result.plan.edges.length,resolvedFaces:result.plan.faces.length,detailedUnresolved:result.plan.unresolved.filter(x=>x.id).length};
});
const selected=base.v2.plan.edges[0].id;
const one=(ancestry=identity(base.catalog),extra={})=>edge({sourceIndex:base.v2,ancestry,topology:base.catalog,featureId:201,kind:'fillet',selectedEdgeIds:[selected],...extra});
check('synthetic same/modified duplicates and raw deletion flags preserve inherited keys',()=>{
 const a=identity(base.catalog);for(const r of a.edges){r.modified.edges=r.same.edges.slice();r.reportedDeleted=true;}const i=one(a);assert.equal(i.plan.edges.length,12);assert.equal(i.plan.faces.length,6);assert.deepEqual(i.plan.unresolved,[{kind:'vertex',count:8,reason:'UNCLAIMED_KERNEL_ENTITY'}]);
});
check('synthetic split/merge failures use true one-input evidence and preserve origin',()=>{
 for(const mode of ['split','merge']){const a=identity(base.catalog),n=base.v2.resolveEdge(selected);a.edges[n-1].modified.edges=[n===12?1:n+1];if(mode==='split')a.edges[(n===12?1:n+1)-1].same.edges=[];const i=one(a),r=i.plan.unresolved.find(x=>x.id===selected);assert.equal(r.reason,mode==='split'?'MULTIPLE_DESCENDANTS':'MERGED_DESCENDANT');assert.equal(r.originFeatureId,1);assert.deepEqual(r.reportedDeleted,[{input:0,reportedDeleted:false}]);assert.throws(()=>i.resolveEdge(selected),{code:'UNRESOLVED_SELECTION'});}
});
check('synthetic unclaimed native co-generators and retained faces forbid blend naming',()=>{
 for(const mode of ['unadvertised-co-generator','retained-face','multiple-targets']){
  const a=identity(base.catalog),n=base.v2.resolveEdge(selected),other=n===12?1:n+1;if(mode!=='retained-face')a.faces[5].same.faces=[];a.edges[n-1].generated.faces=[6];
  const sourceIndex={...base.v2,plan:structuredClone(base.v2.plan)};
  if(mode==='unadvertised-co-generator'){a.edges[other-1].generated.faces=[6];sourceIndex.plan.edges=sourceIndex.plan.edges.filter(d=>base.v2.resolveEdge(d.id)!==other);}
  if(mode==='multiple-targets')a.edges[n-1].generated.faces=[5,6];
  assert.equal(one(a,{sourceIndex}).plan.faces.filter(d=>d.role==='blend').length,0,mode);
 }
});
check('synthetic prior boolean evidence and first failure survive without stale counts',()=>{
 const sourceIndex={...base.v2,plan:structuredClone(base.v2.plan)},lost=sourceIndex.plan.edges.shift();sourceIndex.plan.source='kernel-operation-history';sourceIndex.plan.featureId=100;
 const prior={kind:'edge',id:lost.id,reason:'NO_DESCENDANT',candidateCount:0,reportedDeleted:true,featureId:77,originFeatureId:1};sourceIndex.plan.unresolved=[prior,{kind:'edge',count:12,reason:'UNCLAIMED_KERNEL_ENTITY'}];
 const i=one(identity(base.catalog),{sourceIndex,selectedEdgeIds:[sourceIndex.plan.edges[0].id]});assert.deepEqual(i.plan.unresolved.find(r=>r.id===lost.id),prior);assert.deepEqual(i.plan.unresolved.filter(r=>!r.id),[{kind:'vertex',count:8,reason:'UNCLAIMED_KERNEL_ENTITY'},{kind:'edge',count:1,reason:'UNCLAIMED_KERNEL_ENTITY'}]);
});
check('synthetic branch role/origin/source-region conflicts refuse naming explicitly',()=>{
 const a=identity(base.catalog),call=(left,right)=>boolean({sources:[left,right],ancestries:[a,a],topology:base.catalog,featureId:201});
 for(const change of [p=>p.edges[0].role='different',p=>p.edges[0].curveId='different',p=>p.sourceContexts[0].regionId='different']){const b={...base.v2,plan:structuredClone(base.v2.plan)};change(b.plan);assert.throws(()=>call(base.v2,b),{code:'SELECTION_UNAVAILABLE'});}
 const other={...base.v2,plan:structuredClone(base.v2.plan)};other.plan.featureId=2;other.plan.sourceContexts[0].featureId=2;for(const d of [...other.plan.edges,...other.plan.faces])d.originFeatureId=2;
 assert.throws(()=>call(base.v2,other),{code:'SELECTION_UNAVAILABLE'});
});
check('synthetic same ID derived geometry differences are not authored metadata conflicts',()=>{
 const other={...base.v2,plan:structuredClone(base.v2.plan)};other.plan.edges[0].geometry='bspline';
 const i=boolean({sources:[base.v2,other],ancestries:[identity(base.catalog),identity(base.catalog)],topology:base.catalog,featureId:201});assert.equal(i.plan.edges.find(d=>d.id===other.plan.edges[0].id).geometry,'line');
});
check('synthetic prior-versus-resolved and conflicting first histories are never repaired',()=>{
 const a=identity(base.catalog),copy=()=>({...base.v2,plan:structuredClone(base.v2.plan)}),left=copy(),lost=left.plan.edges.shift();left.plan.source='kernel-operation-history';left.plan.featureId=100;
 left.plan.unresolved.push({kind:'edge',id:lost.id,reason:'NO_DESCENDANT',candidateCount:0,reportedDeleted:true,featureId:77,originFeatureId:1});
 const call=right=>boolean({sources:[left,right],ancestries:[a,a],topology:base.catalog,featureId:201});assert.throws(()=>call(base.v2),{code:'SELECTION_UNAVAILABLE'});
 const right={...left,plan:structuredClone(left.plan)};right.plan.unresolved.find(r=>r.id).featureId=78;assert.throws(()=>call(right),{code:'SELECTION_UNAVAILABLE'});
 const same=call(left);assert.deepEqual(same.plan.unresolved.find(r=>r.id===lost.id),left.plan.unresolved.find(r=>r.id===lost.id));
});
check('synthetic contexts sort numerically and merge only actual matching origins',()=>{
 const A=mainBase('A').v2,B=mainBase('B').v2,a=identity(base.catalog),i=boolean({sources:[B,A],ancestries:[a,a],topology:base.catalog,featureId:201});assert.deepEqual(i.plan.sourceContexts.map(c=>c.featureId),[10,20]);
 const bad={...base.v2,plan:structuredClone(base.v2.plan)};bad.plan.sourceContexts[0].kind='box';assert.throws(()=>one(a,{sourceIndex:bad}),{code:'SELECTION_UNAVAILABLE'});
 const many={...base.v2,plan:structuredClone(base.v2.plan)};many.plan.sourceContexts=Array.from({length:33},(_,i)=>({kind:'sketch-profile',featureId:i+1,regionId:'r'+i}));assert.throws(()=>one(a,{sourceIndex:many}),{code:'SELECTION_RESOURCE_LIMIT'});
});
check('synthetic original caller data is captured before resolver callbacks',()=>{
 const a=identity(base.catalog),topology=structuredClone(base.catalog),plan=structuredClone(base.v2.plan);let done=false;
 const sourceIndex={...base.v2,plan,resolveEdge(id){if(!done){done=true;a.edges[0].same.edges=[];topology.vertices[0].point[0]=999;plan.edges[0].role='mutated';}return base.v2.resolveEdge(id);}};
 const i=one(a,{sourceIndex,topology});assert(done);assert.equal(i.plan.edges.length,12);assert.equal(i.plan.edges.find(d=>d.id===plan.edges[0].id).role,base.v2.plan.edges[0].role);
});
check('synthetic nested/outer accessors, custom objects and extra native fields refuse unread',()=>{
 let reads=0;const scenarios=[
  args=>Object.defineProperty(args,'kind',{enumerable:true,get(){reads++;return'fillet';}}),
  args=>Object.defineProperty(args.sourceIndex,'plan',{enumerable:true,get(){reads++;return base.v2.plan;}}),
  args=>Object.defineProperty(args.sourceIndex.plan.edges[0],'id',{enumerable:true,get(){reads++;return selected;}}),
  args=>Object.defineProperty(args.sourceIndex.plan.sourceContexts[0],'regionId',{enumerable:true,get(){reads++;return'bad';}}),
  args=>Object.defineProperty(args.topology.vertices[0].point,'0',{enumerable:true,get(){reads++;return 0;}}),
  args=>Object.defineProperty(args.ancestry.edges[0].same.edges,'0',{enumerable:true,get(){reads++;return 1;}}),
  args=>args.sourceIndex.plan.handle=7,
  args=>Object.setPrototypeOf(args.sourceIndex.plan.sourceContexts[0],{custom:true}),
  args=>args.sourceIndex.plan.edges[0].toJSON=()=>{reads++;return{};}
 ];
 for(const change of scenarios){const args={sourceIndex:{...base.v2,plan:structuredClone(base.v2.plan)},ancestry:identity(base.catalog),topology:structuredClone(base.catalog),featureId:201,kind:'fillet',selectedEdgeIds:[selected]};change(args);assert.throws(()=>edge(args),{code:'ENGINE_FAILURE'});}assert.equal(reads,0);
});
check('synthetic malformed raw histories and advertised native bindings refuse',()=>{
 for(const mutate of [a=>a.sourceCounts.edges++,a=>a.resultCounts.faces++,a=>a.edges.pop(),a=>a.edges[0].same.edges=[1,1],a=>a.edges[0].same.faces=[1],a=>a.edges[0].generated.vertices=[9999],a=>a.edges[0].reportedDeleted=0]){const a=identity(base.catalog);mutate(a);assert.throws(()=>one(a),{code:'ENGINE_FAILURE'});}
 for(const sourceIndex of [{...base.v2,resolveEdge:()=>0},{...base.v2,resolveFace:()=>999},{...base.v2,resolveEdge:()=>1}])assert.throws(()=>one(identity(base.catalog),{sourceIndex}),{code:'ENGINE_FAILURE'});
 const bad={...base.v2,plan:structuredClone(base.v2.plan)};bad.plan.edges[0].originFeatureId=999;assert.throws(()=>one(identity(base.catalog),{sourceIndex:bad}),{code:'ENGINE_FAILURE'});
});
check('synthetic producer and selected-edge identity admission',()=>{
 for(const featureId of [0,1,NaN,201.5,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>one(identity(base.catalog),{featureId}));
 for(const selectedEdgeIds of [[],[selected,selected],['missing'],[base.v2.plan.faces[0].id]])assert.throws(()=>one(identity(base.catalog),{selectedEdgeIds}),{code:'INVALID_SELECTION'});
 assert.throws(()=>one(identity(base.catalog),{kind:'smooth'}),{code:'INVALID_REQUEST'});
 assert.throws(()=>boolean({sources:[base.v2],ancestries:[identity(base.catalog)],topology:base.catalog,featureId:201}),{code:'ENGINE_FAILURE'});
 for(const [featureId,regionId]of [[2,'component-rectangle'],[1,'other']])assert.throws(()=>lift({sourceIndex:base.v1,featureId,regionId,topology:base.catalog}),{code:'INVALID_REQUEST'});
});
check('synthetic key cap and immutable resolver publication',()=>{
 const long=renamed(base.v2,(id,i,type)=>type==='edge'&&i===0?'x'.repeat(16384):id),pick=long.plan.edges[1].id,i=one(identity(base.catalog),{sourceIndex:long,selectedEdgeIds:[pick]});assert(i.plan.edges.some(x=>x.id.length===16384));assert(Object.isFrozen(i)&&Object.isFrozen(i.plan.sourceContexts[0])&&Object.isFrozen(i.plan.edges[0]));assert.throws(()=>i.plan.edges.push({}),TypeError);
 const a=identity(base.catalog);a.faces[5].same.faces=[];a.edges[long.resolveEdge(long.plan.edges[0].id)-1].generated.faces=[6];assert.throws(()=>one(a,{sourceIndex:long,selectedEdgeIds:[long.plan.edges[0].id]}),{code:'SELECTION_RESOURCE_LIMIT'});
 assert.throws(()=>i.resolveVertex('unknown'),{code:'UNRESOLVED_SELECTION'});assert.throws(()=>i.resolveEdge('x'.repeat(16385)),{code:'INVALID_SELECTION'});noNative(i.plan);
});
check('synthetic qualified-vertex metadata uses real membership and refuses legacy missing rows',()=>{
 const sourceIndex={...base.v2,plan:structuredClone(base.v2.plan),resolveVertex:id=>{assert.equal(id,'synthetic-vertex');return 1;}};sourceIndex.plan.source='kernel-operation-history';sourceIndex.plan.featureId=100;sourceIndex.plan.vertices=[{id:'synthetic-vertex',role:'source-vertex',geometry:'point',originFeatureId:1}];
 const i=one(identity(base.catalog),{sourceIndex});assert.equal(i.resolveVertex('synthetic-vertex'),1);assert.equal(i.plan.vertices[0].geometry,'point');assert.equal(i.plan.unresolved.find(x=>x.kind==='vertex').count,7);
 assert.throws(()=>one(identity(base.catalog,1),{sourceIndex}),{code:'SELECTION_UNAVAILABLE'});
});
check('synthetic prior evidence strict union rejects fabricated slots and contradictory reasons',()=>{
 for(const mutate of [r=>r.reportedDeleted=[],r=>r.reportedDeleted=[{input:2,reportedDeleted:true}],r=>r.reportedDeleted=[{input:0,reportedDeleted:true},{input:0,reportedDeleted:false}],r=>r.reportedDeleted=[{input:0,reportedDeleted:1}],r=>r.candidateCount=1,r=>r.originFeatureId=999,r=>r.featureId=0,r=>r.extra=1]){
  const sourceIndex={...base.v2,plan:structuredClone(base.v2.plan)},lost=sourceIndex.plan.edges.shift();sourceIndex.plan.source='kernel-operation-history';sourceIndex.plan.featureId=100;
  const r={kind:'edge',id:lost.id,reason:'NO_DESCENDANT',candidateCount:0,reportedDeleted:true,featureId:77,originFeatureId:1};mutate(r);sourceIndex.plan.unresolved.push(r);assert.throws(()=>one(identity(base.catalog),{sourceIndex,selectedEdgeIds:[sourceIndex.plan.edges[0].id]}),{code:'ENGINE_FAILURE'});
 }
});
const encoded=value=>new TextEncoder().encode(JSON.stringify(value)).byteLength;
function padded(sourceIndex,ancestry,selectedEdgeIds,target=524288){
 const index={...sourceIndex,plan:structuredClone(sourceIndex.plan)};index.plan.source='kernel-operation-history';index.plan.featureId=100;
 const pads=Array.from({length:32},(_,i)=>({kind:'edge',id:'pad:'+i+':',reason:'NO_DESCENDANT',candidateCount:0,reportedDeleted:false,featureId:77,originFeatureId:1}));index.plan.unresolved.push(...pads);
 const view=()=>({plan:index.plan,ancestries:[ancestry],topology:base.catalog,featureId:201,kind:'fillet',selectedEdgeIds});
 let remaining=target-encoded(view());assert(remaining>=0);
 for(const row of pads){const n=Math.min(16384-row.id.length,remaining);row.id+='x'.repeat(n);remaining-=n;}
 assert.equal(remaining,0);assert.equal(encoded(view()),target);return{index,pads,view};
}
check('synthetic exact captured UTF-8 boundary accepts and one byte more refuses',()=>{
 const a=identity(base.catalog),p=padded(base.v2,a,[selected]),i=one(a,{sourceIndex:p.index});assert(i.plan.unresolved.length>=32);
 const row=p.pads.find(x=>x.id.length<16384);assert(row);row.id+='x';assert.equal(encoded(p.view()),524289);assert.throws(()=>one(a,{sourceIndex:p.index}),{code:'SELECTION_RESOURCE_LIMIT'});
 return{acceptedSnapshotBytes:524288,rejectedSnapshotBytes:524289,outputBytes:encoded(i.plan)};
});
check('synthetic multibyte limit counts actual UTF-8 independently of string length',()=>{
 const a=identity(base.catalog),p=padded(base.v2,a,[selected],524287),row=p.pads.find(x=>x.id.length<16384);row.id=row.id.slice(0,-1)+'\uffff';assert(JSON.stringify(p.view()).length<524288);assert(encoded(p.view())>524288);assert.throws(()=>one(a,{sourceIndex:p.index}),{code:'SELECTION_RESOURCE_LIMIT'});
});
check('synthetic derived observation budget remains independent of captured input',()=>{
 const source=renamed(base.v2,(id,i,type)=>type==='edge'&&i<6?'long-edge:'+i+':'+'x'.repeat(14000):id),selectedEdgeIds=source.plan.edges.slice(0,6).map(x=>x.id),a=identity(base.catalog);
 for(const row of a.faces)row.same.faces=[];
 for(let i=0;i<6;i++)a.edges[source.resolveEdge(selectedEdgeIds[i])-1].generated.faces=[i+1];
 const p=padded(source,a,selectedEdgeIds);assert.throws(()=>one(a,{sourceIndex:p.index,selectedEdgeIds}),{code:'SELECTION_RESOURCE_LIMIT'});
 return{capturedBytes:encoded(p.view()),control:'Synthetic generated relations over unchanged frozen native catalog; no geometry claim'};
});
check('synthetic sparse/symbol/cyclic/nonfinite data is never serialized through callbacks',()=>{
 for(const mutate of [args=>delete args.selectedEdgeIds[0],args=>args.ancestry.edges[0].same.edges[Symbol('extra')]=1,args=>args.sourceIndex.plan.loop=args.sourceIndex.plan,args=>args.topology.vertices[0].point[0]=Infinity]){
  const args={sourceIndex:{...base.v2,plan:structuredClone(base.v2.plan)},ancestry:identity(base.catalog),topology:structuredClone(base.catalog),featureId:201,kind:'fillet',selectedEdgeIds:[selected]};mutate(args);assert.throws(()=>edge(args),{code:'ENGINE_FAILURE'});
 }
});
parentPort.postMessage({status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'Pure Node Worker replay of frozen actual native construction/edge/Boolean data with explicit component caller source slots; synthetic controls labeled; no new kernel/public authoring',rows});
