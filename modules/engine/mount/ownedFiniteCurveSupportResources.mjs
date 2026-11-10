// Exact reachable Worker leaf closure for the query-only mode. This DATA leaf
// is consumed by Main/build admission, not imported into the Worker itself.
export const FINITE_CURVE_SUPPORT_RESOURCE_MODULES = Object.freeze([
  'modules/engine/mount/finiteCurveNativeCalls.mjs',
  'modules/engine/mount/finiteCurveReadProtocol.mjs'
]);
// Module ports required by the actual adapter. Its asm query/allocator identity,
// genuine asm memory and current HEAP8 are additionally checked by the adapter.
// No InitCommands, named-shape/model DB, mesh or constructor is required.
export const FINITE_CURVE_SUPPORT_NATIVE_PORTS = Object.freeze([
  '_ReadFiniteCurveIntersectionsV1', '_malloc', '_free'
]);
