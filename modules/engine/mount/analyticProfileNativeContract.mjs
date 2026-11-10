// Filled ONLY from a reviewed actual Native build. Null means unavailable;
// no old pair aliases, guessed hashes or automatic fallback.
export const ANALYTIC_PROFILE_NATIVE_RUNTIME=null;
export function matchesAnalyticProfileRuntime(js,wasm){return ANALYTIC_PROFILE_NATIVE_RUNTIME!==null&&js===ANALYTIC_PROFILE_NATIVE_RUNTIME.jsSha256&&wasm===ANALYTIC_PROFILE_NATIVE_RUNTIME.wasmSha256;}
