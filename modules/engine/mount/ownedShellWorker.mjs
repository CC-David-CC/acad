// Only the production OCI Worker's private native environment calls these ports.
import {captureShellBoxRequest,shellBinding,SHELL_NATIVE_REFUSALS,BOX_CONSTRUCTION_REFUSALS} from './ownedShellProtocol.mjs';
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {createBoxSelectionIndex} from './boxSelectionIndex.mjs';
import {validateOwnedShellResult} from './ownedShellNativeContract.mjs';
import {deriveShellSelectionIndexV2} from './selectionLineageIndex.mjs';
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code});};
function nativeFailure(value,allowed){
 const keys=value&&typeof value==='object'?Reflect.ownKeys(value):[];
 if(keys.length!==2||!keys.includes('version')||!keys.includes('error')||Object.getOwnPropertyDescriptor(value,'version')?.value!==1||typeof Object.getOwnPropertyDescriptor(value,'error')?.value!=='string')fail('Malformed native shell/box refusal');
 if(value?.error==='MEASUREMENT_PRECISION_UNRESOLVED'||value?.error==='SHELL_INPUT_CHANGED')fail(value.error,value.error);
 if(!allowed.includes(value?.error))fail('Native shell/box integrity failed');fail(value.error,value.error);
}
function evidenceOf(env,name,created){
 const evidence=env.summarize(name,env.interrogate(name));
 if(!evidence||evidence.empty||evidence.solidCount!==1||Math.abs(evidence.nativeVolume-created.nativeVolume)>Math.max(1e-7,created.nativeVolume*1e-9)||JSON.stringify(evidence.nativeBounds)!==JSON.stringify(created.nativeBounds))fail('Native result measurements disagree');
 return evidence;
}
export function createOwnedShellBox(env,input){
 const request=captureShellBoxRequest(input),{Module,name,stringPointer,free}=env,before=Module._OwnedShapeNamesV2();let pointer=0,created,operationFailed=false,operationError;
 try{pointer=stringPointer(name);globalThis.__OCI_EXCHANGE_VAL=null;Module._CreateOwnedBoxWithFacesV1(pointer,...request.origin,...request.dimensions);created=globalThis.__OCI_EXCHANGE_VAL;}
 catch(error){operationFailed=true;operationError=error;throw error;}
 finally{globalThis.__OCI_EXCHANGE_VAL=null;if(pointer)try{free(pointer);}catch(cause){throw Object.assign(Error('Native box scratch cleanup failed'),{code:'ENGINE_CLEANUP_FAILED',cause,operationFailed,operationError});}}
 if(created?.error){if(Module._OwnedShapeNamesV2()!==before)fail('Refused box construction published a native result');nativeFailure(created,BOX_CONSTRUCTION_REFUSALS);}
 if(!created||Object.keys(created).sort().join(',')!=='construction,empty,nativeBounds,nativeVolume,solidCount,valid,version'||created.version!==1||created.valid!==true||created.empty!==false||created.solidCount!==1||!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Module._OwnedShapeNamesV2()!==before+1)fail('Invalid native box construction result');
 const topology=validateOwnedTopology(env.query('_ReadOwnedTopologyV1',name)),index=createBoxSelectionIndex({featureId:request.featureId,construction:created.construction,topology});
 return {index,evidence:evidenceOf(env,name,created),binding:Object.freeze({version:1,featureId:request.featureId})};
}
export function applyOwnedShell(env,input,captureBoundaryRef){
 const request=shellBinding(input),source=env.sourceIndex;
 if(!source)fail('The parent has no resolved authored face selections','SELECTION_UNAVAILABLE');
 if(source.plan.featureId!==request.producerFeatureId)fail('The parent producer changed','INVALID_SELECTION_BINDING');
 if(source.plan.sourceContexts.some(c=>c.featureId===request.featureId))fail('A shell cannot reuse a construction origin','INVALID_SELECTION_BINDING');
 const indices=request.removedFaceIds.map(id=>source.resolveFace(id));if(new Set(indices).size!==indices.length)fail('Distinct authored selections must resolve to distinct native faces','INVALID_SELECTION_BINDING');
 const sourceTopology=validateOwnedTopology(env.query('_ReadOwnedTopologyV1',env.sourceName)),{Module,name,stringPointer,malloc,free}=env,before=Module._OwnedShapeNamesV2();let a=0,b=0,data=0,created,operationFailed=false,operationError;
 try{a=stringPointer(env.sourceName);b=stringPointer(name);data=malloc(indices.length*4);if(!data)fail('Native shell allocation failed','RESOURCE_LIMIT');Module.HEAP32.set(indices,data/4);globalThis.__OCI_EXCHANGE_VAL=null;Module._ApplyOwnedShellV1(a,b,data,indices.length,request.thickness);created=globalThis.__OCI_EXCHANGE_VAL;if(indices.some((x,i)=>Module.HEAP32[data/4+i]!==x))fail('Native shell changed the captured index payload','SHELL_INPUT_CHANGED');}
 catch(error){operationFailed=true;operationError=error;throw error;}
 finally{globalThis.__OCI_EXCHANGE_VAL=null;let cleanupFailed=false,cause;for(const pointer of [data,b,a])if(pointer)try{free(pointer);}catch(error){if(!cleanupFailed){cleanupFailed=true;cause=error;}}if(cleanupFailed)throw Object.assign(Error('Native shell scratch cleanup failed'),{code:'ENGINE_CLEANUP_FAILED',cause,operationFailed,operationError});}
 if(created?.error){if(Module._OwnedShapeNamesV2()!==before)fail('Refused shell published a native result');nativeFailure(created,SHELL_NATIVE_REFUSALS);}
 if(Module._OwnedShapeNamesV2()!==before+1)fail('Invalid native shell ownership');
 const topology=validateOwnedTopology(env.query('_ReadOwnedTopologyV1',name)),validation=validateOwnedShellResult(created,{sourceTopology,topology,indices,thickness:request.thickness});let index=null,reason=validation.reason;
 if(!reason)try{index=deriveShellSelectionIndexV2({sourceIndex:source,ancestry:created.ancestry.data,topology,featureId:request.featureId,removedFaceIds:request.removedFaceIds},captureBoundaryRef);}catch(error){if(!['SELECTION_RESOURCE_LIMIT','SELECTION_UNAVAILABLE'].includes(error?.code))throw error;reason=error.code;}
 return {index,reason,evidence:evidenceOf(env,name,created),binding:request,topology,ancestry:created.ancestry};
}
