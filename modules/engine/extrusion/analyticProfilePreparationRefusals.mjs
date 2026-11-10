// Additional semantic-preparation codes actually emitted by the analytic
// source/branch/world proof. These are NOT Native invocation outcomes.
export const ANALYTIC_PROFILE_PREPARATION_REFUSALS=Object.freeze([
 'ANALYTIC_PROFILE_UNQUALIFIED','INVALID_ARC_BRANCH','ARC_INTERVAL_UNREPRESENTABLE'
]);
const ownData=(value,key)=>{if(!value||typeof value!=='object'||Array.isArray(value))return undefined;const d=Object.getOwnPropertyDescriptor(value,key);return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')?d.value:undefined;};
// Narrow transport classification of the actual submitted semantic request.
// It grants no source/geometry/capability authority; the original producer
// still validates the full envelope, source hash, frame, branch and equations.
export function isAnalyticProfilePreparationRequest(value){
 const kind=ownData(value,'kind'),profile=ownData(value,'profile');
 return (kind==='inspect-selected'||kind==='prepare-selected')&&ownData(profile,'profileVersion')===3&&ownData(profile,'analyticProfileVersion')===1;
}
