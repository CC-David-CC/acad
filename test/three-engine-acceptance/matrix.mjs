import {numericCases,boxRequest} from './cases.mjs';
function require(value,message){if(!value)throw Error(message);}
function near(actual,expected,tolerance,message){require(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,`${message}: ${actual} != ${expected}`);}
export function checkShape(result,test,descriptor){
 require(result?.handle?.representation===descriptor.representation,'Result representation changed');
 require(result.handle.mountId===descriptor.mountId&&result.handle.generation===descriptor.generation,'Result ownership changed');
 const evidence=result.evidence;
 require(evidence&&(Object.hasOwn(evidence,'volume')!==Object.hasOwn(evidence,'signedVolume')),'Missing/ambiguous volume');
 // Test-only measurement adaptation. Do not discard sign or convert geometry.
 const volume=Object.hasOwn(evidence,'volume')?evidence.volume:evidence.signedVolume;
 near(volume,test.volume,Math.max(1e-8,Math.abs(test.volume)*1e-10),'Volume mm^3');
 if(test.bounds===null){require(evidence.empty===true&&evidence.bounds===null&&volume===0,'Empty must be explicit');return;}
 require(evidence.empty!==true&&evidence.bounds,'Unexpected empty');
 for(const key of ['min','max']){
  require(Array.isArray(evidence.bounds[key])&&evidence.bounds[key].length===3,'Invalid bounds');
  for(let i=0;i<3;i++)near(evidence.bounds[key][i],test.bounds[key][i],1e-7,`Bounds ${key}[${i}] mm`);
 }
}
export function checkDescriptor(d,expected){
 require(d?.contractVersion===1&&d.unit==='millimeter','Unsupported contract/unit');
 require(d.engine===expected.engine&&d.representation===expected.representation,'Wrong engine/fallback representation');
 require(typeof d.mountId==='string'&&d.mountId.length>0&&d.generation===1,'Missing mount identity');
 require(d.runtimeAssets?.verification==='worker-sha256','Require Worker runtime verification');
 for(const k of ['jsSha256','wasmSha256'])require(/^[a-f0-9]{64}$/.test(expected[k])&&d.runtimeAssets[k]===expected[k],`Runtime pin mismatch: ${k}`);
}
export function measureMesh(buffer){
 require(buffer instanceof ArrayBuffer&&buffer.byteLength%72===0,'Invalid triangle buffer');
 const points=new Float64Array(buffer),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let volume=0;
 for(let i=0;i<points.length;i+=9){
  for(let j=0;j<9;j++){const value=points[i+j];require(Number.isFinite(value),'Nonfinite triangle');min[j%3]=Math.min(min[j%3],value);max[j%3]=Math.max(max[j%3],value);}
  volume+=(points[i]*(points[i+4]*points[i+8]-points[i+5]*points[i+7])+points[i+1]*(points[i+5]*points[i+6]-points[i+3]*points[i+8])+points[i+2]*(points[i+3]*points[i+7]-points[i+4]*points[i+6]))/6;
 }
 return {volume,bounds:points.length?{min,max}:null};
}
async function checkMesh(mount,result,test){
 require(typeof mount.assertSolidBinding==='function'&&mount.assertSolidBinding(result.handle)===true,'Missing actual solid binding');
 require(typeof mount.readSolidMesh==='function','Missing common mesh reader');
 const request={op:'solid.mesh.read',version:1,handle:result.handle},mesh=await mount.readSolidMesh(request);
 require(mesh.unit==='millimeter'&&mesh.quality==='display-only'&&Number.isSafeInteger(mesh.triangleCount)&&mesh.triangleCount*72===mesh.buffer.byteLength,'Invalid mesh metadata');
 const measured=measureMesh(mesh.buffer);checkShape({handle:result.handle,evidence:measured},test,mount.descriptor);
 if(test.id==='box'){
  new Float64Array(mesh.buffer).fill(0);
  const reread=await mount.readSolidMesh(request);
  checkShape({handle:result.handle,evidence:measureMesh(reread.buffer)},test,mount.descriptor);
 }
}
async function refusal(work,code){
 try{await work();}catch(e){require(e?.code===code,`Expected ${code}, received ${e?.code||e}`);return;}
 throw Error(`Expected ${code}`);
}
// Supply the real factory. This module contains no kernel/Worker success stub.
export async function runNumericMatrix(createMount,expected){
 const rows=[],timings=[];
 for(const test of numericCases){
  const initStart=performance.now(),mount=createMount(),owned=[];
  const timing={id:test.id,mountOrdinal:timings.length+1,operations:[]};timings.push(timing);
  const timed=async(label,work)=>{const start=performance.now();try{return await work();}finally{timing.operations.push({label,elapsedMs:performance.now()-start});}};
  let failure,refusalClosedMount=false;
  try{
   await mount.ready;timing.initMs=performance.now()-initStart;checkDescriptor(mount.descriptor,expected);
   const a=await timed('create-a',()=>mount.execute(boxRequest(test.a)));owned.push(a.handle);
   if(!test.op){checkShape(a,test,mount.descriptor);await timed('mesh-and-independent-check',()=>checkMesh(mount,a,test));rows.push({id:test.id,status:'pass',mesh:'analytic-volume-bounds'});continue;}
   const b=await timed('create-b',()=>mount.execute(boxRequest(test.b)));owned.push(b.handle);
   let result;
   try{result=await timed('boolean-'+test.op,()=>mount.execute({op:'solid.boolean.'+test.op,version:1,unit:'millimeter',a:a.handle,b:b.handle}));}
   catch(e){
    if(test.bounds===null&&expected.emptyRefusal&&e?.code===expected.emptyRefusal){
     if(expected.emptyRefusalClosesMount){await refusal(()=>mount.execute(boxRequest(test.a)),'MOUNT_CLOSED');refusalClosedMount=true;}
     rows.push({id:test.id,status:'unsupported',code:e.code,lifetime:refusalClosedMount?'candidate-closed':'not-checked'});continue;
    }
    throw e;
   }
   owned.push(result.handle);checkShape(result,test,mount.descriptor);
   if(test.bounds!==null)await timed('mesh-and-independent-check',()=>checkMesh(mount,result,test));
   rows.push({id:test.id,status:'pass',mesh:test.bounds===null?'not-checked':'analytic-volume-bounds'});
  }catch(error){failure=error;rows.push({id:test.id,status:'failure',code:error?.code||null,message:error.message});}finally{
   let cleanupFailure;
   if(!refusalClosedMount)for(const handle of owned.reverse())try{await mount.execute({op:'solid.dispose',version:1,handle});}catch(error){cleanupFailure??=error;}
   try{mount.close();}catch(error){cleanupFailure??=error;}
   if(cleanupFailure&&!failure)rows.push({id:test.id+'/cleanup',status:'failure',code:cleanupFailure?.code||null,message:cleanupFailure.message});
  }
 }
 const mount=createMount(),other=createMount();
 try{
  await Promise.all([mount.ready,other.ready]);checkDescriptor(mount.descriptor,expected);checkDescriptor(other.descriptor,expected);
  const a=await mount.execute(boxRequest(numericCases[0].a)),b=await mount.execute(boxRequest(numericCases[0].a));
  const union={op:'solid.boolean.union',version:1,unit:'millimeter',a:a.handle,b:b.handle};
  const step=async(id,work)=>{try{await work();rows.push({id,status:'pass'});}catch(e){rows.push({id,status:'failure',code:e?.code||null,message:e.message});}};
  await step('foreign-mount',()=>refusal(()=>other.execute(union),'INVALID_HANDLE'));
  await step('unit-refusal',()=>refusal(()=>mount.execute({...boxRequest(numericCases[0].a),unit:'inch'}),'INVALID_REQUEST'));
  await step('negative-dimension-refusal',()=>refusal(()=>mount.execute({...boxRequest(numericCases[0].a),dimensions:[-1,20,30]}),'INVALID_REQUEST'));
  await step('unsupported-operation',()=>refusal(()=>mount.execute({op:'solid.unregistered.test',version:1}),'UNSUPPORTED_OPERATION'));
  const controller=new AbortController();controller.abort();
  await step('pre-aborted-operation',()=>refusal(()=>mount.execute(boxRequest(numericCases[0].a),{signal:controller.signal}),'CANCELLED'));
  await mount.execute({op:'solid.dispose',version:1,handle:a.handle});
  await step('disposed-handle',()=>refusal(()=>mount.execute(union),'INVALID_HANDLE'));
  await mount.execute({op:'solid.dispose',version:1,handle:b.handle});
  require(mount.descriptor.maxLifetimeNames===8,'Review lifetime fixture budget before changing controls');
  for(let i=2;i<8;i++){
   const value=await mount.execute(boxRequest(numericCases[0].a));
   await mount.execute({op:'solid.dispose',version:1,handle:value.handle});
  }
  await step('lifetime-budget',()=>refusal(()=>mount.execute(boxRequest(numericCases[0].a)),'RESOURCE_LIMIT'));
  mount.close();mount.close();
  await step('closed-mount-after-lifetime-budget',()=>refusal(()=>mount.execute(boxRequest(numericCases[0].a)),'MOUNT_CLOSED'));
 }finally{mount.close();other.close();}
 return {engine:expected.engine,representation:expected.representation,unit:'millimeter',rows,timings,
  timingScope:'performance.now client/Worker roundtrip, not pure kernel time; init excludes entry import and includes Worker startup/WASM load; mesh includes independent checks and first-box reread',
  workerMemory:{available:false,reason:'Current real mount API reports no measured Worker/WASM memory; host JS heap is not a substitute'},
  scope:'Numerical/caller-boundary controls only; no history/native/in-flight-cancellation/stale-response proof'};
}
