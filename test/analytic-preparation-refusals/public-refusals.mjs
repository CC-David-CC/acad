// Called ONLY inside the complete normal signed analytic-Arc whole.
// No product imports, fake Workers, source seeds or private positive writes.
import assert from 'node:assert/strict';
export const ANALYTIC_REFUSAL_BUILD='sha256:717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484:47c9d4c96b61ba1a2792c72ccf1b7f2e22d5faa5b50948db144032436edeba25';
const one=(rows,label)=>{assert.equal(rows.length,1,label);return rows[0];};
export async function recordAnalyticPreparationRefusals({command,capture,record}){
 const rows=[],call=(name,args={})=>command(name,args);
 async function source(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:i.revision,faceId});}
 async function plane(){const i=await call('inspect-source-frames');assert(i.ready,i.reason);return call('create-source-frame',{revision:i.revision,unit:'millimeter',parent:null,placement:{kind:'basis',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}}});}
 async function append(faceId,kind,data){const i=await source(faceId),r=await call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:0,data});assert.equal(r.primitive.kind,kind);return r.primitive.id;}
 async function refuse(label,code,cmd,args,extra={}){const before=await capture();let error=null;try{await call(cmd,args);}catch(e){error={name:e.name,code:e.code??null,message:e.message,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}const after=await capture(),row={label,code,command:cmd,args,extra,error,before,after};rows.push(row);record(label,row);assert(error,'Required actual public refusal');assert.equal(error.code,code);assert(!error.committed&&!error.possiblyCommitted);assert.deepEqual(after,before,'Pre-Native semantic/admission refusal preserves exact accepted source/H/J/counters/material/issued tokens/resources');return row;}
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
 // Exact negative endpoint ray is mathematically major, but adding its tiny
 // negative angle to TAU cannot represent a proper end below TAU. Do NOT
 // replace it with a full Arc or merge its distinct source endpoints.
 const delta=2**-60,nearFull=await boundedSource('proper-major-chart',{a:{x:1,y:0},b:{x:1,y:-delta},c:{x:0,y:0},branch:'proper-ccw'});
 await refuse('Actual unrepresentable proper-major interval','ARC_INTERVAL_UNREPRESENTABLE','inspect-selected-regions',{revision:nearFull.choice.revision,faceId:nearFull.owner.faceId,depth:1,engineRevision:ANALYTIC_REFUSAL_BUILD},{...nearFull,stage:'semantic-preparation'});
 return rows;
}
