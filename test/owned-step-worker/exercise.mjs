// Genuine Worker/native component requests. Fixture IDs are not public source
// membership, authored-document, or persistent native-identity claims.
export async function exerciseSTEP(){
 const {createStepExportOccMount}=await import('/modules/engine/mount/occ-step-export-mount.mjs');
 const Original=Worker,workers=[],out=window.__stepPartial={exports:[],refusals:[],workers};
 window.Worker=class extends Original{constructor(...args){super(...args);this.record={posts:[],replies:[],terminated:false};workers.push(this.record);this.addEventListener('message',e=>this.record.replies.push({kind:e.data.kind,seq:e.data.seq,op:e.data.op}));}postMessage(v,...rest){this.record.posts.push(v.kind);return super.postMessage(v,...rest);}terminate(){this.record.terminated=true;return super.terminate();}};
 const m=createStepExportOccMount({workerUrl:'/modules/engine/mount/step-export-worker.js',jsPath:'/step-export-occ-portable.js',wasmPath:'/step-export-occ.wasm'}),live=[];
 const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},poly=p=>p.map((a,i)=>({kind:'segment',id:'edge'+i,a,b:p[(i+1)%p.length]})),circle=(id,x,y,r)=>[{kind:'circle',id,center:[x,y],radius:r}],box=(origin,dimensions)=>({op:'solid.box.create',version:1,unit:'millimeter',origin,dimensions}),extrude=(outer,holes,depth)=>({op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth,region:{id:'component-region',outer,holes}});
 const make=async request=>{const r=await m.execute(request);live.push(r.handle);return r;},snap=async handle=>{const topology=await m.execute({op:'solid.topology.read',version:1,handle}),mesh=await m.readSolidMesh({op:'solid.mesh.read',version:1,handle});return{topology,evidence:mesh.evidence,triangleCount:mesh.triangleCount,coordinates:Array.from(new Float64Array(mesh.buffer))};};
 const snapshots=async inputs=>{const rows=[];for(const r of inputs)rows.push(await snap(r.handle));return rows;};
 const emit=async(label,inputs)=>{const before=await snapshots(inputs),at=workers[0].replies.length,r=await m.execute({op:'solid.step.export',version:1,unit:'millimeter',handles:inputs.map(r=>r.handle)}),res=await fetch('/__export/'+label,{method:'POST',body:r.blob});if(!res.ok)throw Error('Own Blob sink HTTP'+res.status);const sink=await res.json(),after=await snapshots(inputs);out.exports.push({label,metadata:r.metadata,blob:{size:r.blob.size,type:r.blob.type,intrinsic:Blob.prototype.slice.call(r.blob).size},sink,before,after,preserved:JSON.stringify(before)===JSON.stringify(after),replies:workers[0].replies.slice(at),inputEvidence:inputs.map(r=>r.evidence)});};
 try{await m.ready;out.descriptor=m.descriptor;
 const unit=await make(box([0,0,0],[25.4,50.8,76.2]));await emit('unit-box',[unit]);
 const plate=await make(extrude(poly([[0,0],[100,0],[100,50],[0,50]]),[circle('center',50,25,5),...[[8,8],[92,8],[92,42],[8,42]].map((p,i)=>circle('corner'+i,...p,2))],20));await emit('five-hole-plate',[plate]);
 const bracket=await make(extrude(poly([[0,0],[50,0],[50,5],[5,5],[5,40],[0,40]]),[circle('bore',2.5,20,2)],10));await emit('l-bracket',[bracket]);
 const a=await make(box([0,0,0],[10,10,10])),b=await make(box([4,4,4],[2,2,2]));
 await m.execute({op:'solid.selections.read',version:1,handle:a.handle,featureId:101});await m.execute({op:'solid.selections.read',version:1,handle:b.handle,featureId:102});
 const cavity=await make({op:'solid.boolean.subtract',version:1,unit:'millimeter',a:a.handle,b:b.handle,featureId:103,producerAFeatureId:101,producerBFeatureId:102});await emit('cavity',[cavity]);
 const c=await make(box([20,0,0],[10,10,10]));await emit('two-inputs',[a,c]);
 await m.execute({op:'solid.selections.read',version:1,handle:c.handle,featureId:104});const multi=await make({op:'solid.boolean.union',version:1,unit:'millimeter',a:a.handle,b:c.handle,featureId:105,producerAFeatureId:101,producerBFeatureId:104});await emit('one-multisolid',[multi]);
 const holes=[];for(let y=0;y<2;y++)for(let x=0;x<8;x++)holes.push(circle('hole'+holes.length,10+x*10,10+y*20,2));const large=await make(extrude(poly([[0,0],[100,0],[100,50],[0,50]]),holes,20));await emit('multi-chunk',[large]);
 const loft=await make({op:'solid.profile.loft',version:1,unit:'millimeter',sections:[3,4].map((r,i)=>({source:{faceId:'section'+i,sourceSha256:String(i+1).repeat(64)},frame:{...frame,origin:[0,0,i*30]},region:{id:'region'+i,outer:circle('circle',0,0,r),holes:[]}})),correspondence:{kind:'circle',startA:0,reverseA:false,startB:Math.PI/2,reverseB:false},construction:'ruled-solid'});await emit('quarter-loft',[loft]);
 for(const[label,o]of [['tiny-origin',[0,0,0]],['tiny-translated',[1e6,1e6,1e6]]])await emit(label,[await make(box(o,[1e-6,2e-6,3e-6]))]);
 for(const handles of [[],[unit.handle,unit.handle],[{...unit.handle,id:'foreign'}]]){const at=workers[0].posts.length;let outcome;try{await m.execute({op:'solid.step.export',version:1,unit:'millimeter',handles});}catch(e){outcome={code:e.code,message:e.message};}out.refusals.push({outcome,posts:workers[0].posts.length-at});}
 await emit('healthy-continuation',[unit]);for(const handle of live)await m.dispose({op:'solid.dispose',version:1,handle});out.disposed=live.length;return out;
 }finally{m.close();window.Worker=Original;}
}
