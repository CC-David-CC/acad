# Finite-curve private Native adapter: BEFORE

SOURCE ONLY / UNMOUNTED / UNRUN. Packet2a follows Root-approved bridge2f16ecd,
frozen Native thin exportd3b2afa and first raw compile custody25cd5fa. Own Core
branch starts from25cd5fa (runtime-source basis82f9f01); no existing source file
is edited. Frozen codec56eeb1c has Git blobb72e0408; the reviewed actual
countersink invocation pattern has blobc6499927. Root/common/current C11 source,
compiled binaries, SDK and frozen proof/acceptance files stay unchanged.

The frozen Native ABI is one void
`_ReadFiniteCurveIntersectionsV1(pointer,count)`, exact two Segment/Circle/Arc
records,12..24 actual F64 values (capacity64), at most8 raw points and64KiB JSON.
It creates no shape/name/feature/region/result token. Raw packet structure is
already captured by finiteCurveReadProtocol; current source has no dedicated
invocation adapter. The existing countersink invoker is private and contains
names/geometry semantics that must NOT be imported into this query.

## Approved NEW leaves only

`modules/engine/mount/finiteCurveNativeCalls.mjs` and `.d.mts` will expose a
private `createFiniteCurveNativeCalls({Module,malloc,free,owner,requireCurrent})`
returning frozen `{read(curves)}`, plus WeakMap-backed `finiteCurveCallFailure`
classification. Owner is the actual later OCI lexical operation owner, not a
transferred Main pool owner, shape handle, public flag or source certificate.
Read uses the frozen codec to recapture/encode exactly two source-prepared DTOs;
source/document authority, descriptor/new-pair admission and two independent
original-request extractions remain the later caller's obligations.

Root explicitly requires normal memory growth support. Pin actual Module,
Module.asm, its exported WebAssembly.Memory object, actual Native function and
allocator functions. Use captured genuine WebAssembly.Memory.buffer and typed-
array intrinsics; reacquire full HEAP8 over the SAME memory.buffer with monotonic
size/range checks when growth detaches an old view. Do not invent a new no-growth
limit, trust a supplied heap view or bless a replaced memory/Module/allocator.
The actual rawJS5f1730c receiveInstance/updateGlobalBufferAndViews source establishes
these bindings; no generated code is executed to validate them in this lane.

## Settlement contract

- Immutable encoded request and original byte patterns, including negative zero;
  one qualified aligned allocation, exactly actual count*8 bytes. Record each
  attempted allocation/free boundary and never retry an uncertain retirement.
- Exact counted temporary exchange receiver and full descriptor restoration;
  at most64KiB UTF-8 before JSON parsing. The adapter deliberately does NOT set
  or clear __OCI_EXCHANGE_VAL; snapshot/check its original descriptor/value.
- No success after throw, missing/duplicate exchange, stale owner, changed input,
  malformed/unknown protocol, inconsistent heap or uncertain receiver/scratch
  cleanup. Native throws revoke all packets regardless of their known code.
- Only actual acknowledged preserved Native INVALID_REQUEST/UNCERTAIN/
  RESOURCE_LIMIT packets are ordinary (terminal:false,invoked:true). Other
  private adapter/preparation/binding/owner/allocator/decode failures remain
  terminal, including before query dispatch. Public domain refusals belong to
  upstream source preparation, not an injected ordinary-valid flag.
- Invoked records whether the query call was attempted, not a claim that a
  throwing wrapper entered C++. The classifier is private nonforgeable WeakMap
  membership; error strings/properties alone cannot authorize ordinary handling.
  Primary/cleanup errors retain actual causes; terminal adapters cannot be reused.

No Native runtime execution, import of the module, parser/test/probe/TSC/build,
controller/OCI/catalog/resource-list/Root edits, pair/default or portable
adaptation is authorized. Source-complete adapter is NOT a mounted query,
finite-event certificate or shared trim/extend implementation. Root reviews
before composition and owns the eventual coherent whole acceptance.
