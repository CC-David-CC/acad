/** Private unmounted Worker adapter. No current-source or finite-event authority. */
import type {PreparedFiniteCurve,RawFiniteCurveReadResult} from './finiteCurveReadProtocol.mjs';
export interface FiniteCurveNativeModule {
 readonly asm:Readonly<{
  memory:WebAssembly.Memory;
  ReadFiniteCurveIntersectionsV1:(pointer:number,count:number)=>void;
  malloc:(bytes:number)=>number;
  free:(pointer:number)=>void;
 }>;
 readonly HEAP8:Int8Array;
 readonly _ReadFiniteCurveIntersectionsV1:(pointer:number,count:number)=>void;
 readonly _malloc:(bytes:number)=>number;
 readonly _free:(pointer:number)=>void;
}
export interface FiniteCurveNativeCallContext {
 readonly Module:FiniteCurveNativeModule;
 readonly malloc:(bytes:number)=>number;
 readonly free:(pointer:number)=>void;
 /** Actual lexical invocation owner, supplied by the protected future OCI bridge. */
 readonly owner:object;
 /** Synchronous throwing guard for that actual owner/source job; never a success flag. */
 readonly requireCurrent:()=>void;
}
export interface FiniteCurveNativeCalls {
 read(curves:readonly [PreparedFiniteCurve,PreparedFiniteCurve]):RawFiniteCurveReadResult;
}
export type FiniteCurveCallFailure=Readonly<{
 /** Query invocation was attempted; does not prove that a throwing wrapper entered C++. */
 invoked:boolean;
 /** Realm retirement required, including terminal failures before query invocation. */
 terminal:boolean;
}>;
export function createFiniteCurveNativeCalls(context:FiniteCurveNativeCallContext):Readonly<FiniteCurveNativeCalls>;
/** Private WeakMap membership; caller error properties/codes cannot forge settlement. */
export function finiteCurveCallFailure(value:unknown):FiniteCurveCallFailure|null;
