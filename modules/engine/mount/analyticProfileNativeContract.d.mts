export interface AnalyticProfileNativeRuntime{readonly jsSha256:string;readonly wasmSha256:string;readonly nativeSourceCommit:string;readonly nativeHeaderSha256:string;}
export const ANALYTIC_PROFILE_NATIVE_RUNTIME:Readonly<AnalyticProfileNativeRuntime>|null;
export function matchesAnalyticProfileRuntime(js:unknown,wasm:unknown):boolean;
