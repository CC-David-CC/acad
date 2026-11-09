// Private Native invocation. The caller owns one newly reserved result name;
// neither a saved feature nor a public flag can provide this environment.
import {validateOwnedTopology,validatePrismProvenance,bindPrismSourceSlots} from './ownedTopologyContract.mjs';
import {createProfileExtentSelectionIndex} from './profileExtentSelectionIndex.mjs';
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code});};
export function createOwnedProfileExtentResult(env,prepared,name){
 const {Module,stringPointer,malloc,free,heap,query,summarize,interrogate,chargeResult}=env;
 const before=Module._OwnedShapeNamesV2(),values=prepared.nativeValues;let pointer=0,data=0,attempted=false,output,failure=null;
 if(!Number.isSafeInteger(before)||before<0||!Array.isArray(values)||values.length<18||values.length>9000||typeof chargeResult!=='function')fail('The bound Native extent payload/budget is unavailable.');
 const cleanupFailure=(message,cause)=>{failure={cause:Object.assign(Error(message),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};};
 try{
  pointer=stringPointer(name);if(!pointer)fail('Native extent name allocation failed.','RESOURCE_LIMIT');
  data=malloc(values.length*8);if(!data)fail('Native extent input allocation failed.','RESOURCE_LIMIT');
  if(!Number.isSafeInteger(data)||data<0||data%8||data/8+values.length>heap().length)fail('Native extent allocation lies outside its actual heap.');
  heap().set(values,data/8);globalThis.__OCI_EXCHANGE_VAL=null;attempted=true;
  Module._CreateSelectedProfileV3(pointer,data,values.length);
  const created=globalThis.__OCI_EXCHANGE_VAL;globalThis.__OCI_EXCHANGE_VAL=null;
  if(data/8+values.length>heap().length||values.some((n,i)=>!Object.is(n,heap()[data/8+i])))fail('Native construction changed its captured extent inputs.','PROFILE_EXTENT_INPUT_CHANGED');
  if(created?.error){
   if(Module._OwnedShapeNamesV2()!==before)fail('A refused Native extent published a result name.');
   if(created.error==='PROFILE_CONSTRUCTION_FAILED')fail('Native V3 extent construction returned PROFILE_CONSTRUCTION_FAILED.','PROFILE_EXTENT_CONSTRUCTION_FAILED');
   if(created.error==='MEASUREMENT_PRECISION_UNRESOLVED')fail('Native extent metrology returned MEASUREMENT_PRECISION_UNRESOLVED.','MEASUREMENT_PRECISION_UNRESOLVED');
   fail('Native extent construction returned an unknown failure.');
  }
  if(!created||created.version!==3||created.valid!==true||created.solidCount!==1||Module._OwnedShapeNamesV2()!==before+1)fail('Native extent construction did not produce exactly one valid owned solid.');
  const expected=prepared.expected,tolerance=Math.max(1e-7,expected.volume*1e-9);
  if(!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Math.abs(created.nativeVolume-expected.volume)>tolerance||['min','max'].some(key=>!Array.isArray(created.nativeBounds?.[key])||created.nativeBounds[key].length!==3||created.nativeBounds[key].some((n,i)=>!Number.isFinite(n)||Math.abs(n-expected.bounds[key][i])>1e-6)))fail('Native extent measurements differ from the original source interval.');
  const evidence=summarize(name,interrogate(name));if(!evidence||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!(evidence.nativeVolume>0))fail('The observed extent is not one valid positive Native solid.');
  if(Number.isSafeInteger(evidence.faces)&&evidence.faces>1000)fail('The actual extent result exceeds the existing Native face budget.','RESOURCE_LIMIT');
  const topology=created.constructionProvenance?.status==='available'?validateOwnedTopology(query('_ReadOwnedTopologyV1',name)):null;
  const provenance=bindPrismSourceSlots(validatePrismProvenance(created.constructionProvenance,topology,prepared),prepared);
  let index=null,reason=provenance.reason||null;
  if(provenance.status==='available')try{index=createProfileExtentSelectionIndex({featureId:prepared.binding.featureId,provenance,topology,prepared});}catch(error){if(!['SELECTION_UNAVAILABLE','SELECTION_RESOURCE_LIMIT'].includes(error?.code))throw error;reason=error.code;}
  chargeResult(name,evidence);
  output={name,evidence,provenance,index,reason:index?null:reason,binding:prepared.binding};
 }catch(cause){failure={cause};}
 finally{
  globalThis.__OCI_EXCHANGE_VAL=null;
  if(data)try{free(data);}catch(cause){cleanupFailure('Native extent input cleanup failed.',cause);}
  if(pointer)try{free(pointer);}catch(cause){cleanupFailure('Native extent name-pointer cleanup failed.',cause);}
  // A failure never returns a half-published result. Only this fresh owned
  // name is released; source names and foreign owners are never traversed.
  if(failure!==null&&attempted){
   let releasePointer=0;
   try{releasePointer=stringPointer(name);if(!releasePointer)throw Error('Rollback name allocation failed.');const released=Module._ReleaseOwnedShapeV2(releasePointer);if(![0,1].includes(released)||Module._OwnedShapeNamesV2()!==before)throw Error('Native extent rollback ownership differs.');}catch(cause){cleanupFailure('Native extent rollback was not established.',cause);}
   finally{if(releasePointer)try{free(releasePointer);}catch(cause){cleanupFailure('Native extent rollback pointer cleanup failed.',cause);}}
  }
 }
 if(failure!==null)throw failure.cause;return output;
}
