# Bounded Native circular failure stages

Source-only Core companion to dxf's Native diagnostic packet from183ab32. Exact
vocabulary was coordinated directly before editing. No tests, TSC, build,
probes, Native calls or browser execution accompany this source checkpoint.
Root retains all R1/R2/R3 failures and runs the unchanged complete workflow.

Native failure publication is exactly `{version:1,error,stage}`. The negative
integer FFI status remains authoritative, using the existing -1..-12 mapping
and existing unchanged CIRCULAR_NATIVE_ERRORS array. The strict private capture
`captureNativeCircularFailure(input,status)` admits only three enumerable own
data fields, version1, error equal to that exact status mapping, and one of:

```
capture
construct
observe
create
cap-mapping
source-edge-mapping
first-edge-mapping
last-edge-mapping
generated-history
swept-face-membership
fragment-closure
final-closure
receipt
input-verification
publication
```

The captured record is detached/frozen and contains only bounded literals. No
shape, face/edge/fragment index, coordinates, count, Native name, pointer or full
payload is added. `native()` exposes the existing error code with message
`<error> at <stage>`. All old recoverable-versus-terminal classification stays
unchanged; no status/code is newly recoverable. Status0 goes through the same
success path and unchanged success schemas. Common bootstrap is untouched.

Missing response, wrong/extra/accessor/inherited fields, unknown stage, wrong
version, nonnegative/malformed status, or error/status mismatch becomes terminal
ENGINE_FAILURE. No legacy diagnostic fallback or freeform code inference is
allowed. Scratch input/name preservation checks, guaranteed free, truthy cleanup
records and terminal cleanup-failure precedence remain exact. A Native error
publication failure may yield no valid diagnostic; that truthfully fails closed.

Native's BUSY early return stays unchanged to avoid overwriting an outer
reentrant call's exchange payload. The ordinary production Worker/controller
serializes these calls; a direct reentrant call without a valid exact diagnostic
cannot masquerade as a recoverable request through this new capture.

Native uses one stack-owned stage enum per execute; create/swept helpers receive
its reference, and catch/rollback retain the failing stage. INPUT_CHANGED keeps
its original overriding status precedence. These diagnostic labels do not
change geometry, tolerance, provenance, status schema, allocation/rollback or
ownership. Root will bind the recompiled exact new Native pair separately; no
Native literal, catalog, stager or default is changed in this Core packet.
