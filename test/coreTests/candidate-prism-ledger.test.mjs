import test from 'node:test';import assert from 'node:assert/strict';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
import {registerCandidatePrism as register,resolveCandidatePrism as resolve,executeCenteredHole} from '../../modules/engine/extrusion/candidatePrismLedger.mjs';
const stable=x=>'worker-prism:1:'+JSON.stringify(x),faceId='S:0/SURFACE',regionId='sketch-region:'+JSON.stringify({faceId,outer:[0,1,2,3].map(i=>`${faceId}/rect-${i}`),holes:[]});
function fakeModel(feature){
 const bodyId=stable([feature,'body']),lidFaceId=stable([feature,'face','LID',{regionId}]),vec=(x=0,y=0,z=0)=>({x,y,z}),csys={origin:vec(),x:vec(1,0,0),y:vec(0,1,0),z:vec(0,0,1)},loc={mxx:1,mxy:0,mxz:0,tx:0,myx:0,myy:1,myz:0,ty:0,mzx:0,mzy:0,mzz:1,tz:0,apply(){},applyNoTranslation(){}};
 const model={id:bodyId,TYPE:1,ext:{workerGeometry:{representation:'worker-owned-occ-prism',engine:'occ'}},csys,location$:{value:loc},brepShell:{faces:[],data:{}},brepRegistry:new Map(),faces:[],edges:[],vertices:[]};
 for(let i=0;i<8;i++){const b={data:{},point:vec(i,0,0)},v={id:'vertex-'+feature+'-'+i,TYPE:4,shell:model,brepVertex:b,ext:{vertexIdentity:{stability:'transient'}}};model.vertices.push(v);model.brepRegistry.set(b,v);}
 for(let i=0;i<12;i++){const impl={eval:u=>[[u,0,0],[1,0,0]]},curve={impl,uMin:0,uMax:1,uMid:.5},b={data:{id:'edge-'+feature+'-'+i},curve},edge={id:b.data.id,TYPE:3,shell:model,brepEdge:b,ext:{workerIdentity:{stability:'authored'}}};b.halfEdge1={data:{},edge:b,inverted:false,vertexA:model.vertices[i%8].brepVertex,vertexB:model.vertices[(i+1)%8].brepVertex};b.halfEdge2={data:{},edge:b,inverted:true,vertexA:b.halfEdge1.vertexB,vertexB:b.halfEdge1.vertexA};model.edges.push(edge);model.brepRegistry.set(b,edge);}
 for(let i=0;i<6;i++){const id=i===0?lidFaceId:'face-'+feature+'-'+i,impl={eval:()=>[[0,0,0],[1,0,0],[0,1,0]],normal:()=>[0,0,1]},surface={impl,inverted:false,_simpleSurface:{normal:vec(0,0,1),w:0},uMin:0,uMax:1,vMin:0,vMax:1,uMid:.5,vMid:.5},b={data:{id,portableIdentity:{key:{featureId:feature,kind:'face',role:i===0?'LID':'SWEEP',source:{regionId}}}},surface,shell:model.brepShell,innerLoops:[]},f={id,TYPE:2,shell:model,surface,brepFace:b,topology:b,root:model};b.outerLoop={data:{},face:b,halfEdges:[]};for(let j=0;j<4;j++){const he=model.edges[Math.floor((i*4+j)/2)].brepEdge[(i*4+j)%2?'halfEdge2':'halfEdge1'];he.loop=b.outerLoop;b.outerLoop.halfEdges.push(he);}for(let j=0;j<4;j++){b.outerLoop.halfEdges[j].next=b.outerLoop.halfEdges[(j+1)%4];b.outerLoop.halfEdges[j].prev=b.outerLoop.halfEdges[(j+3)%4];}model.faces.push(f);model.brepShell.faces.push(b);model.brepRegistry.set(b,f);}
 model.traverse=fn=>{fn(model);for(const x of [...model.faces,...model.edges,...model.vertices])fn(x)};return model;
}
function fixture(){const doc=new AbortController(),pool=createEvaluationResourcePool(),owner=pool.begin({signal:doc.signal,valid:()=>true}),featureId='42',model=fakeModel(featureId),bodyId=model.id,lidFaceId=model.faces[0].id;let closed=false,checks=0;const mount={close(){closed=true},assertPortableBinding(h,b,t){checks++;if(closed||h.id!=='handle'||h.generation!==1||b.revision!=='r1'||t.marker!=='topology')throw Error('invalid binding')}},handle={mountId:'mount',generation:1,representation:'occ-brep-worker-owned',id:'handle'},topology={marker:'topology'},profile={version:2,unit:'millimeter',engine:'occ',revision:'r1',sketchDigest:'a'.repeat(64),faceId,regionId,frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:20,sketchJSON:'{}'},intent={version:1,kind:'centered-through-hole',unit:'millimeter',featureId:'43',target:{parentFeatureId:featureId,bodyId,lidFaceId,regionId},placement:{kind:'rectangle-center'},diameter:10,extent:'through-all'};owner.getOrCreateMount('occ-prism-v1',()=>mount);return {doc,pool,owner,mount,model,handle,profile,intent,topology,get checks(){return checks}}}
function put(f){return register({owner:f.owner,mount:f.mount,model:f.model,featureId:'42',profile:f.profile,handle:f.handle,topology:f.topology})}
test('actual owner binds exact model, mount, source and copied input',()=>{const f=fixture();put(f);f.profile.frame.origin[0]=99;f.handle.id='different';f.topology.marker='changed';const result=resolve(f.owner,f.intent);assert.equal(result.model,f.model);assert.equal('mount' in result,false);assert.equal('handle' in result,false);assert.equal(result.profile.frame.origin[0],0);assert.ok(f.checks>=2);assert.equal(Object.isFrozen(result.profile.frame.origin),true);f.owner.close();assert.throws(()=>result.requireCurrent())});
test('duplicate feature/model keys, foreign owner, closed mount and accepted owner fail',()=>{const f=fixture(),other=fixture();put(f);assert.throws(()=>put(f),{code:'INVALID_CANDIDATE_BINDING'});assert.throws(()=>register({owner:other.owner,mount:f.mount,model:f.model,featureId:'42',profile:f.profile,handle:f.handle,topology:f.topology}),{code:'INVALID_CANDIDATE_BINDING'});assert.throws(()=>resolve(other.owner,f.intent),{code:'INVALID_CANDIDATE_BINDING'});f.owner.seal();f.owner.accept();assert.throws(()=>resolve(f.owner,f.intent));f.owner.close();other.owner.close()});
test('abort, stale model, altered LID, handle or source binding refuse',()=>{for(const change of [f=>f.model.id='wrong',f=>f.model.faces.push(f.model.faces[0]),f=>f.model.faces[0].brepFace.data.portableIdentity.key.role='BASE',f=>f.mount.close(),f=>f.doc.abort()]){const f=fixture();put(f);change(f);assert.throws(()=>resolve(f.owner,f.intent));f.owner.close()}});
test('invalid or oversized topology is rejected before association; discard is identity scoped',()=>{const f=fixture();assert.throws(()=>register({owner:f.owner,mount:f.mount,model:f.model,featureId:'42',profile:f.profile,handle:f.handle,topology:{marker:'x'.repeat(20000)}}),{code:'INVALID_CANDIDATE_BINDING'});const a=put(f);a.discard();assert.throws(()=>resolve(f.owner,f.intent));const b=put(f);a.discard();assert.equal(resolve(f.owner,f.intent).model,f.model);b.discard();f.owner.close()});
test('abort during binding cannot install an association after invalidation',()=>{const f=fixture();f.mount.assertPortableBinding=()=>f.doc.abort();assert.throws(()=>put(f));assert.throws(()=>resolve(f.owner,f.intent));f.owner.close()});

test('distinct parent bodies cannot claim the same durable face or edge key',()=>{
 const f=fixture(),other=fakeModel('44');put(f);const shared=f.model.edges[0].id;other.edges[0].id=shared;other.edges[0].brepEdge.data.id=shared;
 assert.throws(()=>register({owner:f.owner,mount:f.mount,model:other,featureId:'44',profile:f.profile,handle:f.handle,topology:f.topology}),{code:'INVALID_CANDIDATE_BINDING'});f.owner.close();
});
test('handle generation and mismatched source face cannot be registered',()=>{
 const a=fixture();a.handle.generation=2;assert.throws(()=>put(a),/invalid binding/);a.owner.close();
 const b=fixture();b.profile.faceId='S:other/SURFACE';assert.throws(()=>put(b),{code:'INVALID_CANDIDATE_BINDING'});b.owner.close();
});
test('repeated traversal of the identical object is not a collision',()=>{
 const f=fixture(),traverse=f.model.traverse;f.model.traverse=fn=>{traverse(fn);fn(f.model.faces[0])};put(f);assert.equal(resolve(f.owner,f.intent).model,f.model);f.owner.close();
});
test('projected topology, coordinates, tessellation and location mutations invalidate binding',()=>{
 const f=fixture();put(f);const face=f.model.faces[0].brepFace,edge=f.model.edges[0].brepEdge,vertex=f.model.vertices[0].brepVertex;
 const checks=[[face.data,'id','unrelated-topology-id'],[vertex.point,'x',99],[f.model.location$.value,'tx',7],[face.outerLoop.halfEdges[0],'next',null],[edge.data,'id','bad-edge']];
 for(const [object,key,value] of checks){const old=object[key];object[key]=value;assert.throws(()=>resolve(f.owner,f.intent),{code:'INVALID_CANDIDATE_PROJECTION'});object[key]=old;assert.equal(resolve(f.owner,f.intent).model,f.model)}f.owner.close();
});

function cutMount(f){
 const cut={mountId:'mount',generation:1,representation:'occ-brep-worker-owned',id:'cut'};
 f.mount.centeredThroughHole=async({parent,request})=>{
  assert.equal(parent.id,'handle');assert.equal(request.diameter,10);
  const {version,...binding}=request;
  return {contractVersion:1,op:'solid.profile.centered-through-hole',handle:cut,binding,evidence:{valid:true},portableTopology:{marker:'cut'}};
 };
 f.mount.assertCenteredHoleBinding=(h,p,b,t)=>{if(h.id!=='cut'||p.id!=='handle'||b.diameter!==10||t.marker!=='cut')throw Error('invalid cut binding');};
}
test('cut adapter hides handles and can register a nonrecursive publication check',async()=>{
 const f=fixture();put(f);cutMount(f);
 const result=await executeCenteredHole(f.owner,f.intent,{valid:()=>true,signal:undefined});
 assert.equal(result.parentModel,f.model);assert.equal('handle' in result,false);assert.equal('mount' in result,false);
 f.owner.addPublicationCheck('hole:43',result.publicationCheck);result.requireCurrent();
 result.portableTopology.marker='changed';assert.throws(()=>f.owner.requireCurrent(),/invalid cut binding/);
 f.owner.close();assert.throws(()=>result.requireCurrent());
});
test('failed cut or stale post-await guard closes candidate and cannot publish',async()=>{
 for(const failure of ['native','source','abort','binding']){
  const f=fixture();put(f);cutMount(f);const operation=f.mount.centeredThroughHole,controller=new AbortController();
  f.mount.centeredThroughHole=async request=>{
   if(failure==='native')throw Error('native failure');
   const result=await operation(request);
   if(failure==='source')f.model.id='changed';
   if(failure==='abort')controller.abort();
   if(failure==='binding')result.binding.diameter=11;
   return result;
  };
  await assert.rejects(executeCenteredHole(f.owner,f.intent,{valid:()=>true,signal:controller.signal}));
  assert.equal(f.owner.state,'closed');assert.equal(f.pool.usage.owners,0);
 }
});
test('same-parent overlapping cuts refuse without starting a second native call',async()=>{
 const f=fixture();put(f);cutMount(f);const operation=f.mount.centeredThroughHole;let release,calls=0;
 const wait=new Promise(resolve=>release=resolve);
 f.mount.centeredThroughHole=async request=>{calls++;await wait;return operation(request);};
 const first=executeCenteredHole(f.owner,f.intent,{valid:()=>true,signal:undefined});
 await assert.rejects(executeCenteredHole(f.owner,f.intent,{valid:()=>true,signal:undefined}),/already in progress/);
 assert.equal(calls,1);release();const result=await first;result.requireCurrent();f.owner.close();
});

test('publication refuses a guard invalidated during its final parent binding check',async()=>{
 const f=fixture();put(f);cutMount(f);let valid=true;
 const result=await executeCenteredHole(f.owner,f.intent,{valid:()=>valid});
 f.owner.addPublicationCheck('hole:43',result.publicationCheck);
 const original=f.mount.assertPortableBinding;let checks=0;
 f.mount.assertPortableBinding=(...args)=>{original(...args);if(++checks===2)valid=false;};
 assert.throws(()=>f.owner.requireCurrent(),{name:'AbortError'});f.owner.close();
});
