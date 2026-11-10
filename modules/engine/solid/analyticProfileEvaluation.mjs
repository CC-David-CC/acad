// Narrow data admission into the existing profile ledger, not a new model.
import {analyticProfileFields,captureAnalyticProfileRequest} from '../mount/analyticProfilePlan.mjs';
export function captureAnalyticProfileEvaluation(value){
 const r=analyticProfileFields(value,['version','unit','engine','engineRevision','featureId','profile']);
 if(r.version!==1||r.unit!=='millimeter'||r.engine!=='occ'||typeof r.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision)||!Number.isSafeInteger(r.featureId)||r.featureId<1)throw Object.assign(Error('Expected actual authored analytic-profile evaluation identity'),{code:'INVALID_REQUEST'});
 return Object.freeze({...r,profile:captureAnalyticProfileRequest(r.profile)});
}
