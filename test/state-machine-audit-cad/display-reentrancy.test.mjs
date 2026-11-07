// Actual manager TS; existing explicit UI/storage/pipeline doubles. No geometry,
// UI authoring or native success is synthesized. Only metadata transition guards.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fixture} from '../display-units/manager-fixture.mjs';
const rows=[],write=()=>{if(process.env.CODI_AUDIT_OBSERVATIONS)fs.writeFileSync(process.env.CODI_AUDIT_OBSERVATIONS,JSON.stringify({scope:'Production manager reentrant valid-callback controls; not public browser geometry',rows},null,2)+'\n');};
for(const mode of ['newer-presentation','newer-matching-presentation','pipeline-start','manager-replaced','craft-replaced'])test('final caller guard cannot authorize '+mode+' invalidation',async()=>{
 const f=fixture();try{
  const revision=f.manager.inspectDisplayUnits().revision;let calls=0,injected=false,inner=null,error=null,result=null;
  const valid=()=>{calls++;if(calls===3){injected=true;if(mode.startsWith('newer-'))inner=f.manager.setDisplayUnits({revision,lengthUnit:'inch'});else if(mode==='pipeline-start')f.ctx.craftService.isProcessing=true;else if(mode==='manager-replaced')f.ctx.projectManager={...f.manager};else f.ctx.craftService={...f.ctx.craftService};}return true;};
  try{result=f.manager.setDisplayUnits({revision,lengthUnit:mode==='newer-presentation'?'millimeter':'inch'},{valid});}catch(e){error={name:e.name,code:e.code||null,message:e.message,committed:e.committed===true};}
  const observed={mode,calls,injected,inner,result,error,metadata:f.manager.getPresentationMetadata(),processing:f.ctx.craftService.isProcessing,workers:{...f.workers}};rows.push(observed);write();assert.equal(injected,true);assert(error,'Expected rejection after final callback invalidated the captured state');if(mode.endsWith('-replaced'))assert.equal(error.name,'AbortError');else assert.equal(error.code,mode.startsWith('newer-')?'STALE_REVISION':'WORKSPACE_BUSY');assert.deepEqual(observed.metadata,mode.startsWith('newer-')?{version:1,lengthUnit:'inch'}:null);assert.equal(f.workers.geometry,0);
 }finally{await f.close();}
});
