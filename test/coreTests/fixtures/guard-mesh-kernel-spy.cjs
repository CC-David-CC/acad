exports.manifoldBooleanRaw = () => {
  globalThis.__guardMeshKernelCalls = (globalThis.__guardMeshKernelCalls || 0) + 1;
  throw new Error('Unexpected mesh kernel call in admission test');
};
