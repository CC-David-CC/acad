// Main-side structural query wrapper ONLY. It grants no captured-source,
// current-document, settled-Native or certified-finite-event authority.
// This leaf is not part of the two-leaf Worker import closure.
import {
  FINITE_CURVE_READ_LIMITS,
  encodeFiniteCurveReadInput,
  captureFiniteCurveReadResult
} from './finiteCurveReadProtocol.mjs';
import {FINITE_CURVE_SUPPORT_CANDIDATE as candidate} from './ownedFiniteCurveSupportCandidate.mjs';

export const FINITE_CURVE_SUPPORT_OPERATION = Object.freeze({
  id: 'sketch.curves.support-intersections.read',
  version: 1,
  input: 'prepared-finite-curve-support-mm-v1',
  output: 'raw-analytic-support-query-v1',
  nativeResultCost: 0,
  scope: 'response-local',
  qualification: 'component-research',
  maxCurves: FINITE_CURVE_READ_LIMITS.curves,
  maxInputValues: FINITE_CURVE_READ_LIMITS.actualValues,
  maxRawPoints: FINITE_CURVE_READ_LIMITS.rawPoints,
  maxBytes: FINITE_CURVE_READ_LIMITS.responseBytes
});

const own = (value,key) => Object.prototype.hasOwnProperty.call(value,key);
const functionSource = Function.call.bind(Function.prototype.toString);
const invalid = message => {throw Object.assign(Error(message),{code:'CURVE_QUERY_INVALID_REQUEST'});};
const protocol = message => {throw Object.assign(Error(message),{code:'FINITE_CURVE_READ_PROTOCOL'});};
const invalidMount = message => {throw Object.assign(Error(message),{code:'INVALID_MOUNT'});};
function builtinPrototype(value,constructor) {
  if (!value || typeof value!=='object') return false;
  const c=Object.getOwnPropertyDescriptor(value,'constructor');
  const p=c&&own(c,'value')&&typeof c.value==='function'
    ?Object.getOwnPropertyDescriptor(c.value,'prototype'):null;
  return !!p&&own(p,'value')&&p.value===value&&functionSource(c.value)===functionSource(constructor);
}
function plainPrototype(value) {
  return value===null || Object.getPrototypeOf(value)===null&&builtinPrototype(value,Object);
}
function fields(value,keys,fail) {
  if (!value || typeof value!=='object' || Array.isArray(value) ||
      !plainPrototype(Object.getPrototypeOf(value))) fail('Expected a plain finite-curve support record.');
  const actual=Reflect.ownKeys(value);
  if (actual.length!==keys.length || actual.some(k=>typeof k!=='string'||!keys.includes(k)))
    fail('Unexpected finite-curve support fields.');
  const captured=Object.create(null);
  for (const key of keys) {
    const d=Object.getOwnPropertyDescriptor(value,key);
    if (!d?.enumerable || !own(d,'value')) fail('Finite-curve support fields must be own data.');
    captured[key]=d.value;
  }
  return captured;
}
function one(value,fail) {
  if (!Array.isArray(value)) fail('Expected one finite-curve support operation.');
  const p=Object.getPrototypeOf(value),d=Object.getOwnPropertyDescriptor(value,'length');
  if (p!==null&&!(builtinPrototype(p,Array)&&plainPrototype(Object.getPrototypeOf(p))) ||
      !d || !own(d,'value') || d.value!==1 || Reflect.ownKeys(value).length!==2)
    fail('Expected one dense own-data finite-curve support operation.');
  const item=Object.getOwnPropertyDescriptor(value,'0');
  if (!item?.enumerable || !own(item,'value')) fail('Expected one own-data finite-curve support operation.');
  return item.value;
}
function prepare(value) {
  const r=fields(value,['op','version','unit','curves'],invalid);
  if (r.op!==FINITE_CURVE_SUPPORT_OPERATION.id || r.version!==1 || r.unit!=='millimeter')
    invalid('Unsupported finite-curve support request.');
  // Keep every existing raw DTO/domain/F64 rule in its unchanged owner.
  const input=encodeFiniteCurveReadInput(r.curves);
  const request=Object.freeze({op:r.op,version:1,unit:'millimeter',curves:input.curves});
  return Object.freeze({request,input});
}
export function captureFiniteCurveSupportRequest(value) {
  return prepare(value).request;
}
/** Original id/stage metadata is retained in request; inputBits alone is not source identity. */
export function encodeFiniteCurveSupportRequest(value) {
  return prepare(value);
}
export function captureFiniteCurveSupportResult(value,input) {
  const r=fields(value,['contractVersion','op','unit','observation'],protocol);
  if (r.contractVersion!==1 || r.op!==FINITE_CURVE_SUPPORT_OPERATION.id || r.unit!=='millimeter')
    protocol('Unsupported finite-curve support result wrapper.');
  // Raw capture authenticates its exact encoded DTO/echo, never Native cleanup
  // or original-source ownership. The actual caller must settle those first.
  const observation=captureFiniteCurveReadResult(r.observation,input);
  return Object.freeze({contractVersion:1,op:r.op,unit:'millimeter',observation});
}
export function captureFiniteCurveSupportDescriptor(value) {
  const r=fields(value,[
    'contractVersion','engine','mountId','generation','unit','representation','bootstrap',
    'runtimeAssets','maxLifetimeNames','maxPending','sourceQueryOnly',
    'finiteCurveSupportReadVersion','operations'
  ],invalidMount);
  if (r.contractVersion!==1 || r.engine!==candidate.engine ||
      typeof r.mountId!=='string' || !r.mountId || r.generation!==1 ||
      r.unit!=='millimeter' || r.representation!==candidate.representation ||
      r.bootstrap!=='host-trusted' || r.maxLifetimeNames!==0 || r.maxPending!==1 ||
      r.sourceQueryOnly!==true || r.finiteCurveSupportReadVersion!==1)
    invalidMount('Expected the exact shape-free finite-curve support descriptor.');
  const assets=fields(r.runtimeAssets,['jsSha256','wasmSha256','verification'],invalidMount);
  if (assets.jsSha256!==candidate.jsSha256 || assets.wasmSha256!==candidate.wasmSha256 ||
      assets.verification!=='worker-sha256')
    invalidMount('Expected the exact finite-curve support Native pair and verification.');
  const keys=Object.keys(FINITE_CURVE_SUPPORT_OPERATION);
  const operation=fields(one(r.operations,invalidMount),keys,invalidMount);
  if (keys.some(key=>!Object.is(operation[key],FINITE_CURVE_SUPPORT_OPERATION[key])))
    invalidMount('Expected the sole nonproducing raw finite-curve support operation.');
  return Object.freeze({
    contractVersion:1,engine:r.engine,mountId:r.mountId,generation:1,
    unit:'millimeter',representation:r.representation,bootstrap:'host-trusted',
    runtimeAssets:Object.freeze({
      jsSha256:assets.jsSha256,wasmSha256:assets.wasmSha256,verification:'worker-sha256'
    }),
    maxLifetimeNames:0,maxPending:1,sourceQueryOnly:true,finiteCurveSupportReadVersion:1,
    operations:Object.freeze([FINITE_CURVE_SUPPORT_OPERATION])
  });
}
