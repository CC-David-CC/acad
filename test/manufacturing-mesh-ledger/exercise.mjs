// Actual catalog factory, private ledger and production model; no source-history seed.
export async function exerciseCatalogLedger(){
 const api=window.manufacturingCatalog,build=api.OCC_MANUFACTURING_MESH_BUILD,rows=[],workers=[],Original=window.Worker;
 const check=(x,m)=>{if(!x)throw Error(m);};
 window.Worker=class extends Original{constructor(...args){super(...args);this.record={url:String(args[0]),terminated:false};workers.push(this.record);}terminate(){this.record.terminated=true;return super.terminate();}};
 const pool=api.createEvaluationResourcePool(),owners=[];
 try{
  check(api.listAvailableManufacturingMeshBuilds().some(b=>b.revision===build.revision),'Configured build missing');
  check(api.listAvailableLoftBuilds().some(b=>b.revision===build.revision),'Inherited loft missing');
  check(api.listAvailableStepExportBuilds().some(b=>b.revision===build.revision),'Inherited STEP missing');
  check(api.preferredCadEngineBuild('occ').revision!==build.revision,'Default changed');
  for(const purpose of ['observation','model']){
   const start=JSON.stringify(pool.usage),signal=new AbortController(),owner=pool.begin({signal:signal.signal,valid:()=>true,purpose});owners.push(owner);
   const models=new Map(),registry={find:id=>models.get(id)};
   const output=await api.evaluateWorkerSolid({owner,kind:'box',request:{version:1,unit:'millimeter',engine:'occ',engineRevision:build.revision,featureId:7,origin:[0,0,0],dimensions:[10,20,30]},registry,createMount:api.createCatalogMount,validateMount:api.validateEngineMount,createModel:(...args)=>new api.MWorkerSolid(...args),valid:()=>true});
   models.set(output.outputId,output.model);output.publicationCheck();
   const metrics=output.model.inspectKernelMetrics(),display=output.model.inspectDisplayProjection(),before=JSON.stringify(metrics);
   check(Math.abs(metrics.nativeVolume-6000)<=1e-6,'Native box volume');check(metrics.nativeValidity.valid===true,'Native box validity');
   if(purpose==='model'){owner.seal();owner.accept();}
   const usage=JSON.stringify(pool.usage);
   let result,outcome;
   try{result=await api.readCandidateWorkerManufacturingMesh({owner,registry,engine:'occ',engineRevision:build.revision,body:Object.freeze({bodyId:output.outputId,featureId:7,expectedMetrics:metrics}),controls:Object.freeze({linearDeflectionMm:.01,angularDeflectionRadians:.1,relative:false,maxVertices:150000,maxTriangles:100000}),valid:()=>true});}catch(e){outcome={code:e.code,name:e.name,message:e.message};}
   if(purpose==='observation'){
    check(result&&!outcome,'Observation read failed');check(result.metadata.vertexCount===8&&result.metadata.triangleCount===12,'Actual indexed box census');check(result.buffer.byteLength===368,'Actual indexed box length');check(!('handle'in result)&&!('token'in result),'Private handle leaked');
    const response=await fetch('/__mesh/catalog-box-r4',{method:'POST',body:result.buffer});check(response.ok,'Artifact sink failed');const sink=await response.json();
    owner.seal();let rejected;try{owner.accept();}catch(e){rejected=e.code;}check(rejected==='OBSERVATION_PUBLICATION_FORBIDDEN','Observation became accepted');
    rows.push({purpose,bodyId:output.outputId,metrics,display,metadata:result.metadata,sink,rejected,ownerState:owner.state,usageBefore:JSON.parse(usage),usageAfter:pool.usage});
   }else{
    check(outcome?.code==='OBSERVATION_AUTHORITY_REQUIRED','Accepted authority refusal missing');check(owner.state==='accepted','Accepted model retired by refusal');rows.push({purpose,bodyId:output.outputId,metrics,display,outcome,ownerState:owner.state});
   }
   check(models.get(output.outputId)===output.model,'Registry model changed');check(output.model.inspectKernelMetrics()===metrics&&JSON.stringify(metrics)===before,'Native/model measurements changed');check(JSON.stringify(pool.usage)===usage,'Read resource usage changed');
   owner.close();check(owner.state==='closed','Owner not closed');check(JSON.stringify(pool.usage)===start,'Resources not retired');
  }
  return{rows,workers,usage:pool.usage,build,scope:'Real catalog factory/private candidate ledger/production MWorkerSolid on actual Native box. No authored source, normal app, Save/Open or 3MF claim.'};
 }finally{for(const owner of owners)owner.close();window.Worker=Original;window.__factoryPartial={rows,workers,usage:pool.usage};}
}
