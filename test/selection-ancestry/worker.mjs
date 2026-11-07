import {parentPort} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {deriveSelectionAncestryIndex as derive} from '../../modules/engine/mount/selectionAncestryIndex.mjs';
import {createPrismSelectionIndex} from '../../modules/engine/mount/prismSelectionIndex.mjs';
const receipt=JSON.parse(readFileSync(new URL('./native-first-receipt.json',import.meta.url),'utf8')),rows=[];
const check=(name,fn)=>{try{const data=fn();rows.push({name,status:'PASS',...(data?{data}:{})});}catch(e){rows.push({name,status:'FAIL',error:e.message,code:e.code??null});}};
const near=(a,b)=>assert(Math.abs(a-b)<Math.max(1e-7,Math.abs(b)*1e-10));
const native=Object.fromEntries(receipt.rows.filter(r=>r.catalog).map(r=>[r.name,r]));
const initial=structuredClone(receipt.initial.create.constructionProvenance),catalog=receipt.initial.catalog,loop=initial.data.sourceLoops[0];
// Explicit component-side names on actual C++ source slots, not recovered CAD
// IDs or a public sketch/history workflow. Check the real cap geometry first.
const expected=[[0,0,0],[100,0,0],[100,50,0],[0,50,0]];assert.equal(initial.data.sourceLoops.length,1);assert.equal(loop.vertices.length,4);
loop.vertices.forEach((v,i)=>assert.deepEqual(catalog.vertices[v.firstVertex-1].point,expected[i]));
initial.sourceBinding={scope:'solved-request',regionId:'component-rectangle',nativeSlotBindings:[{loop:0,edges:loop.edges.map((e,i)=>({source:i,curveId:'e'+i,nativeReversed:false})),vertices:loop.vertices.map((v,i)=>({source:i,incidentCurveIds:['e'+((i+3)%4),'e'+i].sort()}))}]};
const base=createPrismSelectionIndex(1,initial,catalog),edgeAt=(index,n)=>{const ids=index.plan.edges.filter(x=>index.resolveEdge(x.id)===n).map(x=>x.id);assert.equal(ids.length,1);return ids[0];};
const applied=(source,row,featureId,kind)=>derive({sourceIndex:source,ancestry:row.value.ancestry,topology:row.catalog,featureId,kind,selectedEdgeIds:row.selected.map(n=>edgeAt(source,n))});
const noIndices=p=>assert.doesNotMatch(JSON.stringify(p),/"(?:nativeIndex|resultLocal|ptr|ref|index)"\s*:/);
let first;
check('recorded actual main-export fillet and raw-deleted survivors',()=>{
 const row=native['edge-fillet'],before=JSON.stringify({initial,catalog,row,plan:base.plan});first=applied(base,row,101,'fillet');
 near(row.value.nativeVolume,100000-20*9*(1-Math.PI/4));assert.equal(first.plan.featureId,101);assert.equal(first.plan.regionId,base.plan.regionId);assert.equal(first.plan.source,'kernel-operation-history');assert.equal(first.plan.edges.length,11);assert.equal(first.plan.faces.length,7);
 const selected=edgeAt(base,row.selected[0]);assert.throws(()=>first.resolveEdge(selected),{code:'UNRESOLVED_SELECTION'});assert.deepEqual(first.plan.unresolved.find(x=>x.id===selected),{kind:'edge',id:selected,reason:'NO_DESCENDANT',candidateCount:0,reportedDeleted:true,featureId:101});
 const blend=first.plan.faces.filter(x=>x.role==='blend');assert.equal(blend.length,1);assert.equal(blend[0].sourceEdgeId,selected);assert.equal(blend[0].geometry,row.catalog.faces[first.resolveFace(blend[0].id)-1].type);assert.deepEqual(first.plan.unresolved.filter(x=>!x.id),[{kind:'edge',count:4,reason:'UNCLAIMED_KERNEL_ENTITY'}]);
 let retainedRawDeleted=0;for(const d of base.plan.edges){const r=row.value.ancestry.edges[base.resolveEdge(d.id)-1],targets=[...new Set([...r.same.edges,...r.modified.edges])];if(r.reportedDeleted&&targets.length===1){assert.equal(first.resolveEdge(d.id),targets[0]);retainedRawDeleted++;}}
 assert(retainedRawDeleted>0);assert.equal(JSON.stringify({initial,catalog,row,plan:base.plan}),before);noIndices(first.plan);return{volume:row.value.nativeVolume,edges:11,faces:7,retainedDespiteRawDeleted:retainedRawDeleted,newBlendFaces:1,unclaimedEdges:4};
});
check('recorded actual equal-distance chamfer',()=>{
 const row=native['edge-chamfer'],index=applied(base,row,102,'chamfer-equal');near(row.value.nativeVolume,99990);assert.equal(index.plan.edges.length,11);assert.equal(index.plan.faces.length,7);assert.equal(index.plan.faces.filter(x=>x.role==='blend').length,1);noIndices(index.plan);return{volume:row.value.nativeVolume};
});
check('recorded actual far-corner chamfer after fillet',()=>{
 assert(first,'Fillet replay must have passed');const row=native['edge-sequential'],selected=edgeAt(first,row.selected[0]),next=applied(first,row,103,'chamfer-equal');near(row.value.nativeVolume,100000-20*9*(1-Math.PI/4)-10);assert.equal(next.plan.edges.length,10);assert.equal(next.plan.faces.length,8);assert.equal(next.plan.faces.filter(x=>x.role==='blend').length,2);
 for(const old of first.plan.unresolved.filter(x=>x.id))assert.deepEqual(next.plan.unresolved.find(x=>x.id===old.id),old);assert.equal(next.plan.unresolved.find(x=>x.id===selected).featureId,103);assert.deepEqual(next.plan.unresolved.filter(x=>!x.id),[{kind:'edge',count:8,reason:'UNCLAIMED_KERNEL_ENTITY'}]);
 const oldBlend=first.plan.faces.find(x=>x.role==='blend');assert(Number.isInteger(next.resolveFace(oldBlend.id)));noIndices(next.plan);return{volume:row.value.nativeVolume,edges:10,faces:8,oldBlendSurvives:true,unclaimedEdges:8};
});
check('recorded radius edit changes geometry while identities survive replay',()=>{
 assert(first);const row=native['healthy-after-refusals'],index=applied(base,row,101,'fillet');near(row.value.nativeVolume,100000-20*4*(1-Math.PI/4));assert.notEqual(row.value.nativeVolume,native['edge-fillet'].value.nativeVolume);assert.deepEqual(index.plan.edges.map(x=>x.id),first.plan.edges.map(x=>x.id));assert.deepEqual(index.plan.faces.map(x=>x.id),first.plan.faces.map(x=>x.id));assert.equal(receipt.nativeInputPreserved,true);assert.equal(receipt.finalOwnedNames,0);return{volume:row.value.nativeVolume,sameKeysAfterSizeChange:true};
});
const identity=()=>({version:1,scope:'response-local',persistentIds:false,sourceCounts:{edges:catalog.edges.length,faces:catalog.faces.length},resultCounts:{edges:catalog.edges.length,faces:catalog.faces.length},...Object.fromEntries(['edges','faces'].map(kind=>[kind,catalog[kind].map((_,i)=>({source:i+1,same:{edges:kind==='edges'?[i+1]:[],faces:kind==='faces'?[i+1]:[]},modified:{edges:[],faces:[]},generated:{edges:[],faces:[]},reportedDeleted:false}))]))});
const selected=base.plan.edges[0].id,source=base.resolveEdge(selected)-1;
const one=(a,extra={})=>derive({sourceIndex:base,ancestry:a,topology:catalog,featureId:201,kind:'fillet',selectedEdgeIds:[selected],...extra});
check('synthetic same+modified duplicate dedup and raw deleted flag',()=>{const a=identity();for(const e of a.edges){e.modified.edges=e.same.edges.slice();e.reportedDeleted=true;}const index=one(a);assert.equal(index.plan.edges.length,12);assert.equal(index.plan.faces.length,6);assert.deepEqual(index.plan.unresolved,[]);});
check('synthetic missing descendant remains explicit evidence',()=>{const a=identity();a.edges[source].same.edges=[];const i=one(a),r=i.plan.unresolved.find(x=>x.id===selected);assert.equal(r.reason,'NO_DESCENDANT');assert.equal(r.reportedDeleted,false);assert.throws(()=>i.resolveEdge(selected),{code:'UNRESOLVED_SELECTION'});});
check('synthetic split is ambiguous without nearest matching',()=>{const a=identity(),other=(source+1)%12;a.edges[source].same.edges=[];a.edges[source].modified.edges=[source+1,other+1];a.edges[other].same.edges=[];const i=one(a);assert.equal(i.plan.unresolved.find(x=>x.id===selected).reason,'MULTIPLE_DESCENDANTS');assert.equal(i.plan.unresolved.find(x=>x.id===selected).candidateCount,2);});
check('synthetic many-to-one rejects both identities',()=>{const a=identity(),other=(source+1)%12;a.edges[other].same.edges=[source+1];const i=one(a);for(const id of[selected,edgeAt(base,other+1)]){assert.equal(i.plan.unresolved.find(x=>x.id===id).reason,'MERGED_DESCENDANT');assert.throws(()=>i.resolveEdge(id),{code:'UNRESOLVED_SELECTION'});}});
check('synthetic overlapping split and merge records shared origin',()=>{const a=identity(),other=(source+1)%12;a.edges[source].modified.edges=[other+1];const i=one(a);assert.equal(i.plan.unresolved.find(x=>x.id===selected).reason,'MERGED_DESCENDANT');assert.equal(i.plan.unresolved.find(x=>x.id===selected).candidateCount,2);assert.equal(i.plan.unresolved.find(x=>x.id===edgeAt(base,other+1)).reason,'MERGED_DESCENDANT');});
check('synthetic Generated edges never replace old edges',()=>{const a=identity();a.edges[source].same.edges=[];a.edges[source].generated.edges=[source+1];const i=one(a);assert.throws(()=>i.resolveEdge(selected),{code:'UNRESOLVED_SELECTION'});assert.equal(i.plan.edges.length,11);assert(i.plan.edges.every(x=>!x.id.startsWith('worker-edge-treatment-selection:')));});
check('synthetic unique new face uses actual catalog field type',()=>{const a=identity();a.faces[5].same.faces=[];a.edges[source].generated.faces=[6];const i=one(a),blend=i.plan.faces.find(x=>x.role==='blend');assert(blend);assert.equal(blend.sourceEdgeId,selected);assert.equal(blend.geometry,catalog.faces[5].type);assert.equal(i.resolveFace(blend.id),6);assert(blend.id.startsWith('worker-edge-treatment-selection:1:'));});
check('synthetic shared or retained generated faces stay unqualified',()=>{for(const mode of['unselected-co-generator','retained-face','multiple-generated']){const a=identity();if(mode!=='retained-face')a.faces[5].same.faces=[];a.edges[source].generated.faces=[6];if(mode==='unselected-co-generator')a.edges[(source+1)%12].generated.faces=[6];if(mode==='multiple-generated')a.edges[source].generated.faces=[5,6];const i=one(a);assert.equal(i.plan.faces.filter(x=>x.role==='blend').length,0,mode);}});
check('synthetic un-authored native co-generator also prevents unique naming',()=>{const a=identity(),other=(source+1)%12;a.faces[5].same.faces=[];a.edges[source].generated.faces=[6];a.edges[other].generated.faces=[6];const hidden=edgeAt(base,other+1),sourceIndex={...base,plan:{...base.plan,edges:base.plan.edges.filter(x=>x.id!==hidden)}};const i=one(a,{sourceIndex});assert.equal(i.plan.faces.filter(x=>x.role==='blend').length,0);});
check('synthetic face merge remains distinct from edge index space',()=>{const a=identity();a.faces[1].same.faces=[1];const i=one(a);for(const n of[1,2]){const id=base.plan.faces.find(x=>base.resolveFace(x.id)===n).id;assert.equal(i.plan.unresolved.find(x=>x.id===id).reason,'MERGED_DESCENDANT');assert.throws(()=>i.resolveFace(id),{code:'UNRESOLVED_SELECTION'});}assert.equal(i.plan.edges.length,12);});
check('synthetic earlier failure survives without aggregate double count',()=>{const a=identity();a.edges[source].same.edges=[];const first=one(a),next=derive({sourceIndex:first,ancestry:identity(),topology:catalog,featureId:202,kind:'chamfer-equal',selectedEdgeIds:[first.plan.edges[0].id]});assert.deepEqual(next.plan.unresolved.find(x=>x.id===selected),first.plan.unresolved.find(x=>x.id===selected));assert.deepEqual(next.plan.unresolved.filter(x=>!x.id),[{kind:'edge',count:1,reason:'UNCLAIMED_KERNEL_ENTITY'}]);});
check('synthetic surface observation updates retained descriptor',()=>{const t=structuredClone(catalog);t.faces[0].type='bspline';t.faces[0].analytic=null;t.faces[0].support='unsupported';const i=one(identity(),{topology:t}),id=base.plan.faces.find(x=>base.resolveFace(x.id)===1).id;assert.equal(i.plan.faces.find(x=>x.id===id).geometry,'bspline');});
check('synthetic malformed ancestry counts and membership refuse',()=>{
 const mutations=[a=>a.sourceCounts.edges++,a=>a.resultCounts.faces++,a=>a.edges[1].source=1,a=>a.edges.pop(),a=>a.edges[0].same.edges=[1,1],a=>a.edges[0].modified.edges=[513],a=>a.edges[0].reportedDeleted=1,a=>a.edges[0].ptr=7,a=>a.edges[0].same.faces=[1]];
 for(const mutate of mutations){const a=identity();mutate(a);assert.throws(()=>one(a),{code:'ENGINE_FAILURE'});}
 let reads=0;const a=identity();Object.defineProperty(a.edges[0],'same',{enumerable:true,get(){reads++;return{edges:[1],faces:[]};}});assert.throws(()=>one(a),{code:'ENGINE_FAILURE'});assert.equal(reads,0);
});
check('synthetic caller and private binding admission refuse',()=>{
 for(const extra of[{featureId:0},{kind:'polish'},{selectedEdgeIds:[]},{selectedEdgeIds:[selected,selected]},{selectedEdgeIds:[base.plan.faces[0].id]}])assert.throws(()=>one(identity(),extra));
 assert.throws(()=>one(identity(),{sourceIndex:{...base,resolveEdge:()=>9999}}),{code:'ENGINE_FAILURE'});
 const bad={...base,plan:{...base.plan,edges:[...base.plan.edges,base.plan.edges[0]]}};assert.throws(()=>one(identity(),{sourceIndex:bad}),{code:'ENGINE_FAILURE'});
 assert.throws(()=>one(identity(),{topology:{...catalog,solidCount:2}}),{code:'ENGINE_FAILURE'});
 const args={sourceIndex:base,ancestry:identity(),topology:catalog,featureId:201,kind:'fillet',selectedEdgeIds:[selected]};let reads=0;Object.defineProperty(args,'kind',{enumerable:true,get(){reads++;return'fillet';}});assert.throws(()=>derive(args),{code:'ENGINE_FAILURE'});assert.equal(reads,0);
});
const renamed=(rename)=>{const plan=structuredClone(base.plan),map=new Map();plan.edges=plan.edges.map((x,i)=>{const id=rename(x.id,i);map.set(id,base.resolveEdge(x.id));return{...x,id};});return{plan,resolveEdge:id=>{if(!map.has(id))throw Error('missing');return map.get(id);},resolveFace:base.resolveFace};};
check('synthetic generated key and actual UTF8 plan budgets',()=>{
 const a=identity();a.faces[5].same.faces=[];a.edges[source].generated.faces=[6];
 const long=renamed((id,i)=>i===0?'x'.repeat(16384):id);assert.throws(()=>one(a,{sourceIndex:long,selectedEdgeIds:[long.plan.edges[0].id]}),{code:'SELECTION_RESOURCE_LIMIT'});
 const wide=renamed((id,i)=>i<11?String(i)+':'+String.fromCharCode(0xffff).repeat(14900):id);assert(new TextEncoder().encode(JSON.stringify(wide.plan)).byteLength<524288);assert.throws(()=>one(a,{sourceIndex:wide,selectedEdgeIds:[wide.plan.edges[0].id]}),{code:'SELECTION_RESOURCE_LIMIT'});
});
check('synthetic deterministic plans and input preservation',()=>{const a=identity(),before=JSON.stringify({a,catalog,plan:base.plan}),x=one(a),y=one(a);assert.deepEqual(x.plan,y.plan);assert(Object.isFrozen(x)&&Object.isFrozen(x.plan)&&Object.isFrozen(x.plan.edges));assert.equal(JSON.stringify({a,catalog,plan:base.plan}),before);assert.throws(()=>x.resolveEdge('missing'),{code:'UNRESOLVED_SELECTION'});assert.throws(()=>x.resolveEdge('x'.repeat(16385)),{code:'INVALID_SELECTION'});noIndices(x.plan);});
parentPort.postMessage({status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'Actual Node Worker pure propagation of recorded genuine main-export fixtures plus explicitly synthetic metadata controls; no new native/browser/public operation',rows});
