import type {EncodedFiniteCurveReadInput} from '../../../../modules/engine/mount/finiteCurveReadProtocol.mjs';
export const FINITE_CURVE_SOURCE_LIMITS: Readonly<{sourceBytes:1048576;externalParameters:1024;receiptBytes:16384;targets:2;members:4}>;
export type FiniteCurveSourceFrame=Readonly<{origin:readonly [number,number,number];x:readonly [number,number,number];y:readonly [number,number,number];z:readonly [number,number,number]}>;
export type FiniteCurveSourceTarget=Readonly<{id:string;type:'Segment'|'Circle'|'Arc';role:string|null;stage:number;members:readonly string[]}>;
export type FiniteCurveSourceRequest=Readonly<{revision:string;sketchJSON:string;externalParameters:Readonly<Record<string,number>>;intent:Readonly<{curveIds:readonly [string,string]}>}>;
export type FiniteCurveSourceSuccess=Readonly<{version:1;revision:string;ok:true;sourceSha256:string;bindingSha256:string;admissionSha256:string;frame:FiniteCurveSourceFrame;targets:readonly [FiniteCurveSourceTarget,FiniteCurveSourceTarget];input:EncodedFiniteCurveReadInput}>;
export type FiniteCurveSourceFailure=Readonly<{revision:string;ok:false;error:Readonly<{code:string;message:string;cause?:Readonly<{kind:string;basis:string}>}>}>;
export type FiniteCurveSourceReceipt=FiniteCurveSourceSuccess|FiniteCurveSourceFailure;
export type FiniteCurveSourceVerificationRequest=FiniteCurveSourceRequest&Readonly<{expected:FiniteCurveSourceSuccess}>;
export function finiteCurveSourceFail(code:string,message:string):never;
export function finiteCurveSourceWord(value:number):string;
export function captureFiniteCurveSourceFrame(value:unknown):FiniteCurveSourceFrame;
export function captureFiniteCurveSourceReceipt(value:unknown,revision:string):FiniteCurveSourceReceipt;
export function captureFiniteCurveSourceRequest(value:unknown,verify?:false):FiniteCurveSourceRequest;
export function captureFiniteCurveSourceRequest(value:unknown,verify:true):FiniteCurveSourceVerificationRequest;
/** Compare bounded private parsed trees or already-captured receipts; not an input validator. */
export function sameFiniteCurveSourceReceipt(a:unknown,b:unknown):boolean;
/** Worker-only digest encoding. Caller must supply the actual independently extracted receipt. */
export function finiteCurveSourceBindingText(request:FiniteCurveSourceRequest,receipt:FiniteCurveSourceSuccess):string;
