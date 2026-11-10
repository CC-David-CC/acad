// Filled ONLY from a reviewed actual Native build. Null means unavailable;
// no old pair aliases, guessed hashes or automatic fallback.
export const ANALYTIC_PROFILE_NATIVE_RUNTIME=Object.freeze({
  jsSha256:'717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484',
  wasmSha256:'47c9d4c96b61ba1a2792c72ccf1b7f2e22d5faa5b50948db144032436edeba25',
  nativeSourceCommit:'147015f5349e85b8bf9e5025012944b3f03d81ae',
  nativeHeaderSha256:'7921e2642d15e8fcd44d878c1e3b85c4af2b62ee08763a82794b096ea5407b47'
});
export function matchesAnalyticProfileRuntime(js,wasm){return ANALYTIC_PROFILE_NATIVE_RUNTIME!==null&&js===ANALYTIC_PROFILE_NATIVE_RUNTIME.jsSha256&&wasm===ANALYTIC_PROFILE_NATIVE_RUNTIME.wasmSha256;}
