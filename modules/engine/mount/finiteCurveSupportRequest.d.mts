import type {
  PreparedFiniteCurve,EncodedFiniteCurveReadInput,RawFiniteCurveReadResult
} from './finiteCurveReadProtocol.mjs';
export type FiniteCurveSupportOperation = Readonly<{
  id:'sketch.curves.support-intersections.read'; version:1;
  input:'prepared-finite-curve-support-mm-v1'; output:'raw-analytic-support-query-v1';
  nativeResultCost:0; scope:'response-local'; qualification:'component-research';
  maxCurves:2; maxInputValues:24; maxRawPoints:8; maxBytes:65536;
}>;
export const FINITE_CURVE_SUPPORT_OPERATION: FiniteCurveSupportOperation;
export type FiniteCurveSupportRequest = Readonly<{
  op:'sketch.curves.support-intersections.read'; version:1; unit:'millimeter';
  curves:readonly [PreparedFiniteCurve,PreparedFiniteCurve];
}>;
export type EncodedFiniteCurveSupportRequest = Readonly<{
  request:FiniteCurveSupportRequest; input:EncodedFiniteCurveReadInput;
}>;
export type FiniteCurveSupportResult = Readonly<{
  contractVersion:1; op:'sketch.curves.support-intersections.read'; unit:'millimeter';
  observation:RawFiniteCurveReadResult;
}>;
export type FiniteCurveSupportDescriptor = Readonly<{
  contractVersion:1; engine:'occ-finite-curve-support-v1-component';
  mountId:string; generation:1; unit:'millimeter';
  representation:'occ-analytic-source-query-worker-owned'; bootstrap:'host-trusted';
  runtimeAssets:Readonly<{
    jsSha256:'479f0620b6dfe131dac05131a3798fc533e05a2bd11e8074ef240284f61bbe86';
    wasmSha256:'746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325';
    verification:'worker-sha256';
  }>;
  maxLifetimeNames:0; maxPending:1; sourceQueryOnly:true; finiteCurveSupportReadVersion:1;
  operations:readonly [FiniteCurveSupportOperation];
}>;
export interface FiniteCurveSupportCallOptions { readonly signal?:AbortSignal; }
export interface FiniteCurveSupportMountOptions {
  readonly workerUrl:string; readonly jsPath:string; readonly wasmPath:string;
  readonly timeoutMs?:number;
}
/** Source-query interface, deliberately not SolidKernel or any shape-result union. */
export interface FiniteCurveSupportMount {
  readonly descriptor:FiniteCurveSupportDescriptor;
  readonly ready:Promise<void>;
  execute(request:FiniteCurveSupportRequest,options?:FiniteCurveSupportCallOptions):Promise<FiniteCurveSupportResult>;
  readFiniteCurveSupportIntersections(request:FiniteCurveSupportRequest,options?:FiniteCurveSupportCallOptions):Promise<FiniteCurveSupportResult>;
  close():void;
}
export function captureFiniteCurveSupportRequest(value:unknown):FiniteCurveSupportRequest;
export function encodeFiniteCurveSupportRequest(value:unknown):EncodedFiniteCurveSupportRequest;
/** Invocation settlement and protected current-source custody are caller obligations. */
export function captureFiniteCurveSupportResult(value:unknown,input:EncodedFiniteCurveReadInput):FiniteCurveSupportResult;
export function captureFiniteCurveSupportDescriptor(value:unknown):FiniteCurveSupportDescriptor;
