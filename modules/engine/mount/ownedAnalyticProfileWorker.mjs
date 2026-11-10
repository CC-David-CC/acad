// Private Native invocation. The caller owns one fresh result reservation.
// chargeResult MUST be the actual non-retiring OCI adapter: this helper alone
// may retire a positively established fresh result, at most once. Unknown
// Native/scratch/exchange custody belongs to outer closeWorker realm retirement.
import {validateAnalyticPrismProvenance} from './analyticProfileProvenance.mjs';
import {ANALYTIC_PROFILE_NATIVE_CODES,analyticProfileFields} from './analyticProfilePlan.mjs';
const fail=(message,code='ENGINE_FAILURE')=>{throw Object.assign(Error(message),{code});};
const codeOf=value=>value!==null&&(typeof value==='object'||typeof value==='function')?Object.getOwnPropertyDescriptor(value,'code')?.value:undefined;
export function createOwnedAnalyticProfileResult(env,prepared,name){
 const {Module,stringPointer,malloc,free,heap,byteHeap,query,summarize,interrogate,chargeResult}=env;
 const values=prepared.nativeValues;let before,nameBytes,pointer=0,data=0,ownership='unattempted',uncertain=false,output,failure=null;
 const opaque=work=>{try{return work();}catch(cause){uncertain=true;throw cause;}};
 const cleanupFailure=(message,cause)=>{uncertain=true;failure={cause:Object.assign(Error(message),{code:'ENGINE_CLEANUP_FAILED',cause,operationError:failure?.cause})};};
 const preservedName=()=>{const bytes=opaque(byteHeap);if(!Number.isSafeInteger(pointer)||pointer<1||pointer+nameBytes.length>=bytes.length||bytes[pointer+nameBytes.length]!==0||nameBytes.some((n,i)=>(bytes[pointer+i]&255)!==n)){uncertain=true;fail('Native analytic profile result-name input changed.','ANALYTIC_PROFILE_INPUT_CHANGED');}};
 const census=()=>{const n=opaque(()=>Module._OwnedShapeNamesV2());if(!Number.isSafeInteger(n)||n<0){uncertain=true;fail('The actual Native name census is unavailable.');}return n;};
 try{
  if(!Array.isArray(values)||values.length<25||values.length>1546||typeof chargeResult!=='function'||typeof byteHeap!=='function'||typeof name!=='string'||!name||name.length>64||name.includes('\0'))fail('The bound Native analytic profile payload/budget is unavailable.');
  nameBytes=new TextEncoder().encode(name);before=census();pointer=opaque(()=>stringPointer(name));if(!pointer)fail('Native analytic profile name allocation failed.','RESOURCE_LIMIT');preservedName();
  data=opaque(()=>malloc(values.length*8));if(!data)fail('Native analytic profile input allocation failed.','RESOURCE_LIMIT');
  if(!Number.isSafeInteger(data)||data<0||data%8||data/8+values.length>opaque(heap).length){uncertain=true;fail('Native analytic profile allocation lies outside its actual heap.');}
  opaque(()=>heap().set(values,data/8));opaque(()=>{globalThis.__OCI_EXCHANGE_VAL=null;});ownership='unknown';
  const status=opaque(()=>Module._CreateOwnedAnalyticProfileV1(pointer,data,values.length));
  const created=opaque(()=>globalThis.__OCI_EXCHANGE_VAL);opaque(()=>{globalThis.__OCI_EXCHANGE_VAL=null;});
  preservedName();const currentHeap=opaque(heap);if(data/8+values.length>currentHeap.length||values.some((n,i)=>!Object.is(n,currentHeap[data/8+i])))fail('Native construction changed its captured analytic profile inputs.','ANALYTIC_PROFILE_INPUT_CHANGED');
  if(status!==0){
   if(!Number.isSafeInteger(status)||status> -1||status< -12)fail('Native analytic profile returned an unknown status.');
   const diagnostic=analyticProfileFields(created,['version','error','stage']),code=ANALYTIC_PROFILE_NATIVE_CODES[-status-1];
   if(diagnostic.version!==1||diagnostic.error!==code||!['capture','construct','receipt','publication'].includes(diagnostic.stage))fail('Native analytic profile failure diagnostic differs from its actual status.');
   if(['ANALYTIC_PROFILE_INPUT_CHANGED','ANALYTIC_PROFILE_PUBLICATION_FAILED','ANALYTIC_PROFILE_BUSY'].includes(code)){uncertain=true;fail('Native analytic profile custody is unresolved.',code);}
   if(census()!==before)fail('A refused Native analytic profile changed its owned-name census.');
   ownership='absent';fail('Native analytic profile refused at '+diagnostic.stage+'.',code);
  }
  if(!created||created.version!==5||created.valid!==true||created.solidCount!==1||census()!==before+1)fail('Native analytic profile did not acknowledge one valid owned solid.');
  const expected=prepared.expected,tolerance=Math.max(1e-7,expected.volume*1e-9);
  if(!Number.isFinite(created.nativeVolume)||created.nativeVolume<=0||Math.abs(created.nativeVolume-expected.volume)>tolerance||['min','max'].some(key=>!Array.isArray(created.nativeBounds?.[key])||created.nativeBounds[key].length!==3||created.nativeBounds[key].some((n,i)=>!Number.isFinite(n)||Math.abs(n-expected.bounds[key][i])>1e-6)))fail('Native analytic profile measurements differ from the original source interval.');
  const raw=opaque(()=>interrogate(name)),evidence=opaque(()=>summarize(name,raw));
  if(!evidence||evidence.solidCount!==1||evidence.nativeValidity?.valid!==true||!(evidence.nativeVolume>0))fail('The named analytic profile observation is not one valid positive Native solid.');
  // The actual constructor acknowledgement, preserved input, matching census
  // AND successful observation of this exact fresh name establish ownership.
  ownership='owned';
  if(!Number.isSafeInteger(evidence.faces)||evidence.faces<1)fail('The named analytic profile face census is unavailable.');
  if(evidence.faces>1000)fail('The actual analytic profile result exceeds the existing Native face budget.','RESOURCE_LIMIT');
  const nativeTopology=opaque(()=>query('_ReadOwnedTopologyV1',name));if(nativeTopology?.error==='TOPOLOGY_RESOURCE_LIMIT')fail('Actual Native topology exceeds its existing read budget.','RESOURCE_LIMIT');
  const provenance=validateAnalyticPrismProvenance(created.constructionProvenance,nativeTopology,prepared);
  // This exact internal adapter records work or refuses. It NEVER releases.
  preservedName();chargeResult(name,evidence);
  output={name,evidence,provenance};
 }catch(cause){failure={cause};}
 finally{
  try{globalThis.__OCI_EXCHANGE_VAL=null;}catch(cause){cleanupFailure('Native analytic profile exchange cleanup failed.',cause);}
  const code=failure===null?null:codeOf(failure.cause),ordinary=failure!==null&&!uncertain&&['RESOURCE_LIMIT',...ANALYTIC_PROFILE_NATIVE_CODES.filter(c=>!['ANALYTIC_PROFILE_INPUT_CHANGED','ANALYTIC_PROFILE_PUBLICATION_FAILED','ANALYTIC_PROFILE_BUSY','MEASUREMENT_PRECISION_UNRESOLVED'].includes(c))].includes(code);
  if(ordinary&&ownership==='owned'){
   // Use the still-live ORIGINAL name pointer. No second allocation or release
   // is attempted to discover/repair uncertain custody, and release0 is NOT an
   // acknowledgement for a positively established owned result.
   try{preservedName();ownership='unknown';const released=Module._ReleaseOwnedShapeV2(pointer);if(released!==1||census()!==before)throw Error('Native analytic profile retirement acknowledgement differs.');ownership='retired';}
   catch(cause){cleanupFailure('Native analytic profile retirement was not established.',cause);}
  }
  // Unknown operation/exchange/scratch outcome: no further Native repair/free.
  // The caller's existing terminal catch retires this actual private realm.
  if(failure!==null&&ownership==='unknown')uncertain=true;
  if(!uncertain){
   if(data)try{free(data);data=0;}catch(cause){cleanupFailure('Native analytic profile input cleanup failed.',cause);}
   if(!uncertain&&pointer)try{free(pointer);pointer=0;}catch(cause){cleanupFailure('Native analytic profile name-pointer cleanup failed.',cause);}
  }
  if(failure!==null&&uncertain&&!['ANALYTIC_PROFILE_INPUT_CHANGED','ANALYTIC_PROFILE_PUBLICATION_FAILED','ANALYTIC_PROFILE_BUSY','MEASUREMENT_PRECISION_UNRESOLVED','ENGINE_CLEANUP_FAILED'].includes(codeOf(failure.cause)))failure={cause:Object.assign(Error('Native analytic profile custody is unresolved; retire its private realm.'),{code:'ENGINE_FAILURE',cause:failure.cause})};
 }
 if(failure!==null)throw failure.cause;return output;
}
