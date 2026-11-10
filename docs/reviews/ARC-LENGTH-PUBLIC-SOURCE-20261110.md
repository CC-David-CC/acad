# ArcLength public lifecycle — source completion packet

Coordinated Core and Host source, prepared after the BEFORE/equation commits.
No compilation, tests, browser run or qualification is claimed. Independent
source review is required before inclusion in a fresh assembled candidate.
Existing Segment APIs and their exact metadata remain unchanged.

## Model and ownership

A native `ArcLengthDimension` serializes `{arc: actualArcId, offset}` and renders
a leader/text at the authored interval midpoint. Its label uses the document's
normal unit formatter and derived driving/reference role. It never measures the
endpoint chord; a full Arc remains nonzero. Strict IO requires an actual native
Arc at that ID and bounded own-data serialization. No measured value or role
flag is persisted. Model preparation authenticates actual stage/ruler/driver
membership and refuses generated/dependent/ambiguous targets.

Separate Arc envelopes retain the old Segment schema exactly. Arc rows name
`arcId`; source and metadata retain the existing 1MiB/64KiB/1024-row bounds.
The disposable sketch Worker cold-checks original geometry, derives the candidate
from the original source, validates actual solver admission, preserves source
objects on role conversion, cold-checks twice and independently reconstructs the
same request. Main publishes the existing prepared sketch-bytes transaction and
shared history after source/currentness checks. It introduces no other journal.
Ordinary editor gestures reuse this native preparation and retain the editor's
existing journal behavior.

## Public operations and transitions

| State/operation | Meaning and invariant |
|---|---|
| No ruler → create | Add only a native ruler, preserving any existing driver. |
| Reference → driving | Add one positive literal ArcLength equation at the current measured length; reject if geometry would change or admission fails. |
| Driving → reference | Remove the actual equation; retain the existing ruler, source geometry and identity. A legacy driver without a ruler first requires create. |
| Reference → remove | Remove only that actual ruler; do not delete geometry. |
| Driving value edit/remove | Use the existing discovered source locator, typed length rules and normal dimension transaction/verifier. No stale locator or hidden edit route. |
| Undo/redo membership | Reconstruct the actual original native create or demotion operation from the recorded pair, then compare the whole exact serialized candidate. |
| Save/Open | Native strict IO includes ruler/equation/branch and derived role; no external import claim. |
| Failure/stale/unknown | Preserve existing shared coordinator, Worker and Host scope/settlement rules. No auto-retry or permissive failure remap. |

New shared commands are `inspect-closed-sketch-arc-measurements`,
`create-closed-sketch-arc-length-measurement`,
`remove-closed-sketch-arc-length-measurement`, and
`convert-closed-sketch-arc-length-role`. Existing
`edit-closed-sketch-dimension` / `remove-closed-sketch-dimension` discover the
new driving schema and retain ordinary revision-scoped identity. The Host uses
the existing account/document scope and `settleScopedCommand` cleanup contract.
`examples/arc-length.mjs` is source-only demonstration code, not a passing test.

## Explicit current bounds and review needs

- Ordinary authored circular Arcs, proper/full CCW interval; generated Arcs,
  ellipse/spline/path length and arbitrary selected subintervals remain outside
  this packet. Existing source/radius floors and residual tolerances remain.
- Create/role mutations use the existing ordinary document policy; typed mode
  reports unsupported role mutation. Existing driver edits retain typed binding
  rules. This is an explicit remaining capability limit, not an overall C04 PASS.
- Literal current-shape promotion can reject numerical ambiguity or redundancy;
  it never copies warm solver coordinates into the authored source.
- ArcLength has no separate constraint annotation; its native ruler presents the
  current driving equation. Deleting a driving ruler refuses until demoted.
- DXF export with this ruler explicitly refuses unsupported annotation export;
  silent omission would be incorrect. No other export qualification is implied.

Independent reviewer must inspect chart/residual consistency, exact native
serialization and ownership, forward/reverse membership reconstruction, ordinary
existing-driver edit/removal integration, Host method names, typed-mode refusals,
source/build resource closure, and human action identity. Root must add these
actual new source paths to the next candidate's producer/source custody.

The grouped acceptance remains the BEFORE contract: minor/major/seam-crossing/
full intervals, role transitions, ordinary value edit, typed bindings, domain
refusals, rejection atomicity, both history directions, native Save/server/fresh
Open, original equations/geometry and independent actual artifact checks. This
packet has not run that acceptance. Do not promote or claim Gate 1 PASS from it.
