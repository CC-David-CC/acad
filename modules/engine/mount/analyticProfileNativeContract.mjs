// Filled ONLY from a reviewed actual Native build. Null means unavailable;
// no old pair aliases, guessed hashes or automatic fallback.
export const ANALYTIC_PROFILE_NATIVE_RUNTIME=Object.freeze({
  jsSha256:'717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484',
  wasmSha256:'97ea6162af031859dce14ee500be2a9bffef8eac129139b5462a1f8907a4157c',
  nativeSourceCommit:'4510c9a112ce3bda5335256d5bc58d1b339226f5',
  nativeHeaderSha256:'9438956d0ef6ee43c939cddcb212f4990a4c4978c351bada75eb2af418f8a286'
});
export function matchesAnalyticProfileRuntime(js,wasm){return ANALYTIC_PROFILE_NATIVE_RUNTIME!==null&&js===ANALYTIC_PROFILE_NATIVE_RUNTIME.jsSha256&&wasm===ANALYTIC_PROFILE_NATIVE_RUNTIME.wasmSha256;}
