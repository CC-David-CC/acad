# Finite-curve private Native adapter: packet2a source handoff

SOURCE ONLY / UNMOUNTED / UNRUN. BEFORE is the separately committed
CAD1-FINITE-CURVE-NATIVE-CALLS-BEFORE-20261109.md. Basis25cd5fa (Core runtime
basis82f9f01); no old module, Root/common graph, Native source/binary/SDK,
portable adaptation, C11 source, frozen producer/driver/evidence or default was
changed. No module import/evaluation, parser/test/probe/TSC/build, Native/JS/WASM
runtime or browser execution occurred in this lane.

## Exact new files and API

- `modules/engine/mount/finiteCurveNativeCalls.mjs`.
- Matching `finiteCurveNativeCalls.d.mts`, with explicit Module/asm/memory/ABI,
  private context, raw return and failure-classification types.

`createFiniteCurveNativeCalls({Module,malloc,free,owner,requireCurrent})` captures
exactly these five own-data context fields and returns frozen `{read(curves)}`.
The context is trusted private future OCI wiring, NOT request data or an owner
issuer: Root must supply the real lexical operation owner and a synchronous
throwing currentness guard bound to its actual job. A returned boolean/Promise
is not a guard. The adapter never receives an authored feature/body/region ID,
Native shape/name, success flag, source coordinate proof or new callback hook.

`read` is synchronous and accepts exactly the two source-prepared DTOs defined
by the frozen protocol. It recaptures/encodes them itself, preserving immutable
original values and bits. Returns only the detached frozen raw support-query
observation; no event, finite certificate, source identity or public read grant.

`finiteCurveCallFailure(error)` returns frozen `{invoked,terminal}` only for an
error issued by this module's private WeakMap. Adding code/terminal/invoked
properties to an arbitrary exception cannot forge the classification. Invoked
means the actual query wrapper call was ATTEMPTED, not proof that a throwing
wrapper entered C++. Terminal requires caller realm retirement even before
query dispatch. Terminal adapters are permanently revoked; reentrancy also
revokes the adapter. There is no retry or another generic authority framework.

## Actual binding and normal WASM growth

Capture and recheck Module===actual global own-data Module, the actual asm
exports object, its genuine exported WebAssembly.Memory, the query Module/asm
functions, both Module/asm allocator functions and the exact context owner/guard.
Currentness is checked before and after the guard callback, around allocation /
query/settlement/decode and immediately before returning. No replaced method,
allocator, Module, memory, context or stale owner can authorize a result.

Use captured native WebAssembly.Memory.buffer and typed-array/ArrayBuffer
intrinsics, not a caller view or shadowed buffer property. Every heap observation
reacquires the SAME memory's current buffer and proves Module.HEAP8 is the full
Int8Array view with zero offset, identical buffer and complete byte length.
Byte length must remain monotonic. Valid growth/detached old views are supported;
there is no new no-growth/size quota. The compiled cohort is ordinary unshared
WASM memory; unsupported/inconsistent views or a replacement memory are terminal.
Root's inspected rawJS5f1730c receiveInstance/updateGlobalBufferAndViews wiring
establishes these actual field names. That same raw source uses stable
createExportWrapper functions for the Module query/malloc/free entries; pinning
those identities does not reject a legitimate lazy first-call replacement.
This packet does not execute growth or claim functional growth qualification.

## Scratch and exchange settlement

Codec input is exactly two curves,12..24 actual F64 values; private capacity64
never grants trailing values. Allocate only actual count*8 (96..192bytes),
qualify the original positive aligned pointer/range, and write explicit
little-endian IEEE754 bytes, retaining negative zero. Reacquire genuine heap
views and compare every original input byte before free, including after a
legitimate growth. No Main geometry/hash or new Native census call is used;
the frozen Native query itself owns its existing census/input fences.

A qualified known allocation has one original free attempt. The attempt is
recorded before calling; a throwing free is never retried. Unknown allocator
outcome/pointer or lost allocator/memory ownership cannot be guessed into a free:
retire the realm. Source cancellation does not itself prevent owned scratch
cleanup when Module/allocator/memory identities still hold, but it forbids output.

Snapshot the exact actual __OCI_EXCHANGE descriptor and ancillary
__OCI_EXCHANGE_VAL descriptor/value identity. Install an exclusive collector
with the same flags, count every delivery, and retain only one bounded string.
Do not parse or forward callbacks inside Native publication. The adapter NEVER
sets/clears/reads the contents of the ancillary value slot or calls the original
receiver; that descriptor/value must remain unchanged. No unbounded clone/hash
of an old ancillary object is introduced.

Restore only the exact still-owned collector descriptor; confirm restoration.
Never overwrite another receiver if ownership changed. Recheck both exchange
slots after scratch cleanup and the final job guard. One missing/duplicate
exchange, a thrown invocation, input mutation, stale owner, unknown response or
uncertain receiver/free outcome revokes ALL packets. A known-looking error
packet after a Native throw cannot turn that invocation into an ordinary refusal.
Primary and bounded cleanup causes are retained; cleanup uncertainty dominates
success and retains the actual primary error when one exists.

After acknowledged cleanup/currentness, bound actual UTF-8 response bytes to
64KiB BEFORE decoding. A small private wire precheck detects duplicate decoded
JSON keys (including escaped aliases), unterminated containers/strings and
excessive nesting before JSON.parse. It is not a new public/general parser:
actual detached shape, input-bit/overload binding,2 bases,0..8 raw rows and all
finite values remain the frozen protocol's authority. Malformed or unbound
response is terminal FINITE_CURVE_READ_PROTOCOL with its actual cause.

Only acknowledged preserved Native CURVE_QUERY_INVALID_REQUEST,
CURVE_QUERY_UNCERTAIN and CURVE_QUERY_RESOURCE_LIMIT packets are ordinary
(terminal:false,invoked:true). Every other Native packet stays terminal with
its original code. Adapter/context/private-preparation/owner/decode failures
are terminal, including predispatch. A zero malloc result retains RESOURCE_LIMIT
but is terminal/invoked:false; it is not fabricated as an acknowledged Native
query packet. Public ordinary unsupported/domain refusals must occur upstream
in the genuine source preparation, before entering this private Native adapter.

## Transitive graph and deferred caller obligations

The ONE runtime import is `./finiteCurveReadProtocol.mjs` (frozen56eeb1c, blob
b72e0408c34b64697e2c8103894fb2f5b6d64599). No countersink/cone/solid helper,
name allocator, geometry admission, Native pair constant or dynamic import is
introduced. New declarations import only the matching protocol types. Existing
countersink invocation code is a custody precedent, not a transitive dependency.

Root must later add this actual Worker leaf plus its protocol to the exact new
cohort's prepare/entry/factory closed roster and pin the resulting real OCI /
bootstrap/module graph. Do not advertise a method because these files exist.
The actual compiled raw source is Native d3b2afa with rawJS5f1730c/WASM746da919;
portable adaptation, exact new-pair mode/descriptor/ABI admission, dedicated
nonproducing controller/OCI route and the actual lexical owner are UNIMPLEMENTED
here. Old pairs/defaults/caps and current runtime stay unchanged.

Also required: two unchanged-original-request semantic Worker extractions,
actual document/source/definition/parameter/frame/lifetime custody, discard-only
observation owner/cleanup integration, certified finite membership/root/error/
branch facts, then shared trim/extend/J/full suffix/native Save/Open whole
acceptance and independent artifacts. An immutable encoded DTO and valid raw
transport are never source authority or manufactured/Gate1 conformance.

## Source-review lifecycle / future complete-flow expectations

| Transition | Invariant retained by this leaf | Remaining whole evidence |
|---|---|---|
| private context → adapter | actual current Module/asm/memory/allocator/owner | actual protected new-cohort readiness and source job |
| prepared pair → allocation | frozen exact wire and original F64 bytes | independent original-source extraction and numeric domains |
| live scratch → invoked | owned descriptor, one query call, no result shape | actual normal query and supported growth path |
| invoked → settled | every throw/count/input/cleanup failure revokes packets | real complete invocation/owner cleanup, no isolated probes |
| settled → raw result/refusal | strict codec/current job; only3 ordinary Native codes | finite-event completeness/error/branch certification |
| any terminal → revoked | no reuse/retry, caller must close realm | complete shared-flow resource settlement / healthy continuation |

No result from any of those future rows is claimed by source review. Root reviews
this component before common composition or any later execution authorization.
