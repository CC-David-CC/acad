// Ephemeral diagnostics, never authored/native document fields. These describe
// the failed check; they are not proofs of global design infeasibility.
const bases = Object.freeze({
  'algebraic-contradiction':'exact-reduced-row',
  'approximate-reduction-rejection':'approximate-reduced-row',
  'original-residual-failure':'original-equations',
  'invalid-domain':'domain-check',
  'numerical-convergence-failure':'solver-status',
  'nonfinite-result':'finite-check',
  'resource-limit':'resource-check',
  'retained-validation-failure':'retained-validation',
  'unclassified-rejection':'admission-membership'
});
export function admissionCause(kind) {
  if (!Object.hasOwn(bases,kind)) throw Error('Unknown admission cause.');
  return Object.freeze({kind,basis:bases[kind]});
}
function record(value,keys) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid sketch failure data.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Failure fields must be data.');out[key]=d.value;}return out;
}
export function captureAdmissionCause(value) {
  const c=record(value,['kind','basis']);
  if(typeof c.kind!=='string'||!Object.hasOwn(bases,c.kind)||c.basis!==bases[c.kind])throw Error('Invalid sketch failure cause.');
  return admissionCause(c.kind);
}
/** @returns {Readonly<{code:string,message:string,cause?:Readonly<{kind:string,basis:string}>}>} */
export function captureSketchFailure(value) {
  const hasCause=Object.getOwnPropertyDescriptor(value||{},'cause')!==undefined;
  const e=record(value,hasCause?['code','message','cause']:['code','message']);
  if(typeof e.code!=='string'||!e.code||e.code.length>64||typeof e.message!=='string'||e.message.length>512)throw Error('Invalid sketch failure.');
  if(hasCause)e.cause=captureAdmissionCause(e.cause);
  return Object.freeze(e);
}
// Private symbol metadata cannot arrive as a public JSON status flag. It is
// enumerable so the existing owned status snapshots/spreads preserve rollback.
const solveValidationCause=Symbol('internal-original-validation-cause');
export function clearSolveValidationCause(status){if(status&&typeof status==='object')delete status[solveValidationCause];}
export function setSolveValidationCause(status,cause){
 const success=status&&typeof status==='object'&&Object.getOwnPropertyDescriptor(status,'success');
 if(!success||!Object.hasOwn(success,'value')||success.value!==false)throw Error('Only a failed internal solve can carry validation cause.');
 Object.defineProperty(status,solveValidationCause,{value:captureAdmissionCause(cause),enumerable:true,configurable:true});
}
export function getSolveValidationCause(status){
 const ownCause=status&&typeof status==='object'&&Object.getOwnPropertyDescriptor(status,solveValidationCause);
 const success=status&&typeof status==='object'&&Object.getOwnPropertyDescriptor(status,'success');
 return success&&Object.hasOwn(success,'value')&&success.value===false&&ownCause&&Object.hasOwn(ownCause,'value')?captureAdmissionCause(ownCause.value):undefined;
}
export function causeForSolveStatus(status) {
 const original=getSolveValidationCause(status);if(original)return original;
  const domain=status?.domainError;
  if(['DIRECTION_SOLVE_FAILED','PROJECTED_SOLVE_FAILED'].includes(domain))return admissionCause('numerical-convergence-failure');
  if(['DIRECTION_RESOURCE_LIMIT','PROJECTED_RESOURCE_LIMIT'].includes(domain))return admissionCause('resource-limit');
  if(['DIRECTION_DOMAIN','PROJECTED_DIRECTION_DOMAIN','FIXED_ENTITY_DOMAIN'].includes(domain))return admissionCause('invalid-domain');
  // The inherited rigid check includes original residuals AND domain checks.
  // Its collapsed error cannot truthfully distinguish either one here.
  if(domain==='RIGID_CONSTRAINT_DOMAIN')return admissionCause('retained-validation-failure');
  if(status?.success===false)return admissionCause('numerical-convergence-failure');
  if(status&&!Number.isFinite(status.error))return admissionCause('nonfinite-result');
  return undefined;
}
export function withAdmissionCause(error,cause) {
  if(cause&&error instanceof Error){const captured=captureAdmissionCause(cause);try{Object.defineProperty(error,'admissionCause',{value:captured,configurable:true});}catch{/* Diagnostic failure must not replace the original exception. */}}
  return error;
}
export function failureCause(error) {
  const d=error&&Object.getOwnPropertyDescriptor(error,'admissionCause');
  if(d&&Object.hasOwn(d,'value'))return captureAdmissionCause(d.value);
  const code=error&&Object.getOwnPropertyDescriptor(error,'code');
  if(!code||!Object.hasOwn(code,'value'))return undefined;
  if(code.value==='RESIDUAL')return admissionCause('original-residual-failure');
  if(['DIRECTION_DOMAIN','PROJECTED_DIRECTION_DOMAIN','DISTANCE_DOMAIN','RIGID_DOMAIN'].includes(code.value))return admissionCause('invalid-domain');
  return undefined;
}
