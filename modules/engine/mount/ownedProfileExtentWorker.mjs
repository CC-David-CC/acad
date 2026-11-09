// Private Native invocation. The caller owns one fresh result reservation.
// chargeResult MUST be the actual non-retiring OCI adapter: this helper alone
// may retire a positively established fresh result, at most once. Unknown
// Native/scratch/exchange custody belongs to outer closeWorker realm retirement.
import {validateOwnedTopology,validatePrismProvenance,bindPrismSourceSlots} from './ownedTopologyContract.mjs';
import {createProfileExtentSelectionIndex} from './profileExtentSelectionIndex.mjs';
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code});};
const codeOf=value=>value!==null&&(typeof value==='object'||typeof value==='function')?Object.getOwnPropertyDescriptor(value,'code')?.value:undefined;
export function createOwnedProfileExtentResult(env,prepared,name){
 const {Module,stringPointer,malloc,free,heap,byteHeap,query,summarize,interrogate,chargeResult}=env;
 const values=prepared.nativeValues;let before,nameBytes,pointer=0,data=0,ownership='unattempted',uncertain=false,output,failure=null;
 const opaque=work=>{try{return work();}catch(cause){uncertain=true;throw cause;}};
 const cleanupFailure=(message,cause)=>{uncertain=true;failure={cause:Object.assign(Error(message),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};};
 const preservedName=()=>{const bytes=opaque(byteHeap);if(!Number.isSafeInteger(pointer)||pointer<1||pointer+nameBytes.length>=bytes.length||bytes[pointer+nameBytes.length]!==0||nameBytes.some((n,i)=>(bytes[pointer+i]&255)!==n)){uncertain=true;fail('Native extent result-name input changed.','PROFILE_EXTENT_INPUT_CHANGED');}};
 const census=()=>{const n=opaque(()=>Module._OwnedShapeNamesV2());if(!Number.isSafeInteger(n)||n<0){uncertain=true;fail('The actual Native name census is unavailable.');}return n;};
 try{
  if(!Array.isArray(values)||values.length<18||values.length>9000||typeof chargeResult!=='function'||typeof byteHeap!=='function'||typeof name!=='string'||!name||name.length>256||name.includes('\0'))fail('The bound Native extent payload/budget is unavailable.');
  nameBytes=new TextEncoder().encode(name);before=census();pointer=opaque(()=>stringPointer(name));if(!pointer)fail('Native extent name allocation failed.','RESOURCE_LIMIT');preservedName();
  data=opaque(()=>malloc(values.length*8));if(!data)fail('Native extent input allocation failed.','RESOURCE_LIMIT');
  if(!Number.isSafeInteger(data)||data<0||data%8||data/8+values.length>opaque(heap).length){uncertain=true;fail('Native extent allocation lies outside its actual heap.');}
  opaque(()=>heap().set(values,data/8));opaque(()=>{globalThis.__OCI_EXCHANGE_VAL=null;});ownership='unknown';
  opaque(()=>Module._CreateSelectedProfileV3(pointer,data,values.length));
  const created=opaque(()=>globalThis.__OCI_EXCHANGE_VAL);opaque(()=>{globalThis.__OCI_EXCHANGE_VAL=null;});
  preservedName();const currentHeap=opaque(heap);if(data/8+values.length>currentHeap.length||values.some((n,i)=>!Object.is(n,currentHeap[data/8+i])))fail('Native construction changed its captured extent inputs.','PROFILE_EXTENT_INPUT_CHANGED');
  if(created?.error){
   // ONLY these actual acknowledged constructor refusals promise no publication.
   // The matching unchanged census corroborates that promise; count alone does
   // not settle an unknown exchange or justify a mutating absence query.
   if(!['PROFILE_CONSTRUCTION_FAILED','MEASUREMENT_PRECISION_UNRESOLVED'].includes(created.error))fail('Native extent construction returned an unknown failure.');
   if(census()!==before)fail('A refused Native extent changed its owned-name census.');
   ownership='absent';
   if(created.error==='PROFILE_CONSTRUCTION_FAILED')fail('Native V3 extent construction returned PROFILE_CONSTRUCTION_FAILED.','PROFILE_EXTENT_CONSTRUCTION_FAILED');
   fail('Native extent metrology returned MEASUREMENT_PRECISION_UNRESOLVED.','MEASUREMENT_PRECISION_UNRESOLVED');
  }
  if(!created||created.version!==3||created.valid!==true||created.solidCount!==1||census()!==before+1)fail('Native extent construction did not acknowledge exactly one valid owned solid.');
  const expected=prepared.expected,tolerance=Math.max(1e-7,expected.volume*1e-9);
  if(!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Math.abs(created.nativeVolume-expected.volume)>tolerance||['min','max'].some(key=>!Array.isArray(created.nativeBounds?.[key])||created.nativeBounds[key].length!==3||created.nativeBounds[key].some((n,i)=>!Number.isFinite(n)||Math.abs(n-expected.bounds[key][i])>1e-6)))fail('Native extent measurements differ from the original source interval.');
  const raw=opaque(()=>interrogate(name)),evidence=opaque(()=>summarize(name,raw));
  if(!evidence||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!(evidence.nativeVolume>0))fail('The named extent observation is not one valid positive Native solid.');
  // The actual constructor acknowledgement, preserved input, matching census
  // AND successful observation of this exact fresh name establish ownership.
  ownership='owned';
  if(!Number.isSafeInteger(evidence.faces)||evidence.faces<1)fail('The named extent face census is unavailable.');
  if(evidence.faces>1000)fail('The actual extent result exceeds the existing Native face budget.','RESOURCE_LIMIT');
  const topology=created.constructionProvenance?.status==='available'?validateOwnedTopology(opaque(()=>query('_ReadOwnedTopologyV1',name))):null;
  const provenance=bindPrismSourceSlots(validatePrismProvenance(created.constructionProvenance,topology,prepared),prepared);
  let index=null,reason=provenance.reason||null;
  if(provenance.status==='available')try{index=createProfileExtentSelectionIndex({featureId:prepared.binding.featureId,provenance,topology,prepared});}catch(error){if(!['SELECTION_UNAVAILABLE','SELECTION_RESOURCE_LIMIT'].includes(codeOf(error)))throw error;reason=codeOf(error);}
  // This exact internal adapter records work or refuses. It NEVER releases.
  preservedName();chargeResult(name,evidence);
  output={name,evidence,provenance,index,reason:index?null:reason,binding:prepared.binding};
 }catch(cause){failure={cause};}
 finally{
  try{globalThis.__OCI_EXCHANGE_VAL=null;}catch(cause){cleanupFailure('Native extent exchange cleanup failed.',cause);}
  const code=failure===null?null:codeOf(failure.cause),ordinary=failure!==null&&!uncertain&&['RESOURCE_LIMIT','PROFILE_EXTENT_CONSTRUCTION_FAILED'].includes(code);
  if(ordinary&&ownership==='owned'){
   // Use the still-live ORIGINAL name pointer. No second allocation or release
   // is attempted to discover/repair uncertain custody, and release0 is NOT an
   // acknowledgement for a positively established owned result.
   try{preservedName();ownership='unknown';const released=Module._ReleaseOwnedShapeV2(pointer);if(released!==1||census()!==before)throw Error('Native extent retirement acknowledgement differs.');ownership='retired';}
   catch(cause){cleanupFailure('Native extent retirement was not established.',cause);}
  }
  // Unknown operation/exchange/scratch outcome: no further Native repair/free.
  // The caller's existing terminal catch retires this actual private realm.
  if(failure!==null&&ownership==='unknown')uncertain=true;
  if(!uncertain){
   if(data)try{free(data);data=0;}catch(cause){cleanupFailure('Native extent input cleanup failed.',cause);}
   if(!uncertain&&pointer)try{free(pointer);pointer=0;}catch(cause){cleanupFailure('Native extent name-pointer cleanup failed.',cause);}
  }
  if(failure!==null&&uncertain&&['RESOURCE_LIMIT','PROFILE_EXTENT_CONSTRUCTION_FAILED'].includes(codeOf(failure.cause)))failure={cause:Object.assign(Error('Native extent operation custody is unresolved; retire its private realm.'),{code:'ENGINE_FAILURE',cause:failure.cause})};
 }
 if(failure!==null)throw failure.cause;return output;
}
