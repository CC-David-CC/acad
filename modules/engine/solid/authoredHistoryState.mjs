// Authored state only. No kernel geometry, handles, registry or model cache.
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export const SUPPRESSIBLE_FEATURE_TYPES=Object.freeze(['WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1']);
export const HISTORY_CONTROL_TYPES=Object.freeze(['PLANE','WORKER_SOLID_BOX_V1',...SUPPRESSIBLE_FEATURE_TYPES]);
export function featureSuppressed(entry){
 if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('INVALID_HISTORY_STATE','Expected an authored feature record.');
 const field=Object.getOwnPropertyDescriptor(entry,'suppressed');
 if(!field){if('suppressed' in entry)fail('INVALID_HISTORY_STATE','Suppression must be own data.');return false;}
 const type=Object.getOwnPropertyDescriptor(entry,'type');
 if(!field.enumerable||!Object.hasOwn(field,'value')||field.value!==true||!type?.enumerable||!Object.hasOwn(type,'value')||!SUPPRESSIBLE_FEATURE_TYPES.includes(type.value))fail('INVALID_HISTORY_STATE','Unsupported authored suppression state.');
 return true;
}
export function historyStateVersion(history){
 if(!Array.isArray(history)||history.length>10000||Reflect.ownKeys(history).length!==history.length+1)fail('INVALID_HISTORY_STATE','Expected bounded dense authored history.');
 let suppressed=false;
 for(let i=0;i<history.length;i++){const d=Object.getOwnPropertyDescriptor(history,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_HISTORY_STATE','History must be dense own data.');suppressed=featureSuppressed(d.value)||suppressed;}
 return suppressed?1:undefined;
}
export function validateModelHistoryState(model){
 const state=historyStateVersion(model.history),marker=Object.getOwnPropertyDescriptor(model,'historyStateVersion');
 if(state===1?(!marker?.enumerable||!Object.hasOwn(marker,'value')||marker.value!==1):!!marker)fail('INVALID_HISTORY_STATE','The authored history state marker must exactly match its suppressed entries.');
 return state;
}
export function requireActiveFeature(entry){if(featureSuppressed(entry))fail('FEATURE_SUPPRESSED','Unsuppress this authored feature before editing its parameters.');return entry;}
