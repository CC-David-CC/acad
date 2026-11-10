// Called ONLY inside the complete normal signed analytic-Arc whole.
// No product imports, fake Workers, source seeds or private positive writes.
import assert from 'node:assert/strict';
export const ANALYTIC_REFUSAL_BUILD='sha256:717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484:47c9d4c96b61ba1a2792c72ccf1b7f2e22d5faa5b50948db144032436edeba25';
const one=(rows,label)=>{assert.equal(rows.length,1,label);return rows[0];};
function candidateRegistryRetention(before,after){
 assert(Number.isSafeInteger(before.lifecycle.epoch));assert.equal(after.lifecycle.epoch,before.lifecycle.epoch+1,'ONE actual candidate evaluation, no accepted publication');
 function aliases(s){const h=s.host.revision,g=s.capture.solids.revision,j=s.capture.journal.revision;for(const value of [h,g,j])assert.equal(typeof value,'string');assert(j.endsWith(':'+h),'Actual document:Jrevision:PMrevision binding');const prefix=j.slice(0,-h.length-1);assert.match(prefix,/^\d+:\d+$/);assert.equal(s.manufacturing.revision,h);assert.equal(s.drawing.revision,h);assert.equal(s.drawing.geometryRevision,g);assert.equal(s.physical.revision,j);assert.equal(s.frames.revision,j);assert.equal(s.lifecycle.pipelineFailed,false);assert.equal(s.lifecycle.cleanupFailed,false);assert.equal(s.ownership.processing,false);assert.equal(s.ownership.resources.cleanupFailed,false);for(const key of ['candidates','accepted','mounts'])assert.equal(s.ownership.resources[key],0);assert.equal(s.ownership.resources.owners,s.ownership.resources.detached);return prefix;}
 assert.equal(aliases(after),aliases(before),'Actual document and authored J revision remain exact');assert.notEqual(after.host.revision,before.host.revision);assert.notEqual(after.capture.solids.revision,before.capture.solids.revision);
 const strip=s=>{const r=structuredClone(s);for(const [object,key]of [[r.lifecycle,'epoch'],[r.host,'revision'],[r.capture.solids,'revision'],[r.capture.journal,'revision'],[r.manufacturing,'revision'],[r.drawing,'revision'],[r.drawing,'geometryRevision'],[r.physical,'revision'],[r.frames,'revision']]){assert(Object.hasOwn(object,key));delete object[key];}return r;};
 assert.deepEqual(strip(after),strip(before),'EVERY other accepted source/H/J/counter/material/Native/owner/source-version field stays exact');
}

export async function recordAnalyticPreparationRefusals({command,capture,record}){
 const rows=[],call=(name,args={})=>command(name,args);
 async function source(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:i.revision,faceId});}
 async function plane(){const i=await call('inspect-source-frames');assert(i.ready,i.reason);return call('create-source-frame',{revision:i.revision,unit:'millimeter',parent:null,placement:{kind:'basis',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}}});}
 async function append(faceId,kind,data){const i=await source(faceId),r=await call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:0,data});assert.equal(r.primitive.kind,kind);return r.primitive.id;}
 async function refuse(label,code,cmd,args,extra={}){const before=await capture();let error=null;try{await call(cmd,args);}catch(e){error={name:e.name,code:e.code??null,message:e.message,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}const after=await capture(),row={label,code,command:cmd,args,extra,error,before,after};rows.push(row);record(label,row);assert(error,'Required actual public refusal');assert.equal(error.code,code);assert(!error.committed&&!error.possiblyCommitted);if(extra.stage==='candidate-registry')candidateRegistryRetention(before,after);else assert.deepEqual(after,before,'Pre-candidate semantic/admission refusal preserves exact accepted source/H/J/counters/material/issued tokens/resources');return row;}
 const capabilities=await call('inspect-selected-profiles',{engineRevision:ANALYTIC_REFUSAL_BUILD});assert(capabilities.ready,capabilities.reason);assert.equal(capabilities.analyticProfileVersion,1);assert.equal(capabilities.engineRevision,ANALYTIC_REFUSAL_BUILD);
 // An invalid authored full branch is rejected by genuine public admission,
 // never inserted into source to manufacture a semantic failure.
 const invalidPlane=await plane(),i=await source(invalidPlane.faceId),bad={a:{x:1,y:0},b:{x:0,y:1},c:{x:0,y:0},branch:'full-ccw'};
 await refuse('Actual invalid full branch admission','INVALID_ARC_BRANCH','append-sketch-primitive',{revision:i.revision,faceId:invalidPlane.faceId,kind:'Arc',role:null,stage:0,data:bad},{plane:invalidPlane,stage:'primitive-admission'});
 async function boundedSource(label,data){const owner=await plane(),arcId=await append(owner.faceId,'Arc',data),firstId=await append(owner.faceId,'Segment',{a:data.b,b:data.c}),secondId=await append(owner.faceId,'Segment',{a:data.c,b:data.a}),inspection=await source(owner.faceId);assert.equal(inspection.objects.length,3);for(const id of [arcId,firstId,secondId])one(inspection.objects.filter(r=>r.id===id),'actual returned curve');const choice=await call('inspect-selected-profiles',{engineRevision:ANALYTIC_REFUSAL_BUILD});assert(choice.ready,choice.reason);assert.equal(choice.analyticProfileVersion,1);return{owner,arcId,firstId,secondId,inspection,choice,data,label};}
 // Every coordinate remains in the constructor's +/-1e6 local envelope,
 // while the genuine source radius2e6 is outside its explicit radius domain.
 const radial=await boundedSource('radial-domain',{a:{x:1000000,y:-1000000},b:{x:-1000000,y:1000000},c:{x:-1000000,y:-1000000},branch:'proper-ccw'});
 await refuse('Actual analytic radius-domain preparation','ANALYTIC_PROFILE_UNQUALIFIED','inspect-selected-regions',{revision:radial.choice.revision,faceId:radial.owner.faceId,depth:1,engineRevision:ANALYTIC_REFUSAL_BUILD},{...radial,stage:'semantic-preparation'});
 // This branch never becomes accepted source: the actual append candidate
 // reaches registry ReadSketch/requireArcInterval before publication. It is
 // NOT a public semantic-Worker transport proof and may replay the existing
 // healthy Native prefix before the source registry refuses it.
 const delta=2**-60,nearFullOwner=await plane(),nearFullInspection=await source(nearFullOwner.faceId),nearFullData={a:{x:1,y:0},b:{x:1,y:-delta},c:{x:0,y:0},branch:'proper-ccw'};
 await refuse('Actual unrepresentable proper-major publication','ARC_INTERVAL_UNREPRESENTABLE','append-sketch-primitive',{revision:nearFullInspection.revision,faceId:nearFullOwner.faceId,kind:'Arc',role:null,stage:0,data:nearFullData},{owner:nearFullOwner,data:nearFullData,stage:'candidate-registry',semanticWorkerTransport:'unqualified'});
 return rows;
}
