# Distance domain and Save tolerance review — 2026-11-05

Followup to f49b5cf21. The shared DistancePP.distance schema now carries
nonnegative:true and finite:true. Existing shared constant validation applies
this rule during UI/constraint admission and backend loading, rather than only
inside Save. Negative unsigned values were previously accepted because their
polynomial squares the target: the retained pre-fix real-backend control accepts
-5 with zero residual. Zero remains valid point coincidence. SignedDistanceX,
SignedDistanceY and ProjectedDistance schemas are unchanged and their negative
Save controls pass. The existing finite metadata policy also bounds magnitudes
to1e6; this is explicit shared validation, not a change to signed-distance rules.

The focused actual async Save/real solver suite now passes40 positive cases,
two typed flag cases and eight no-write/no-exit refusal cases. New positives
include zero DistancePP and negative signed X/Y/projected distances; a shared
schema control rejects negative/nonfinite DistancePP before a save, and actual
Save propagates a negative-distance backend refusal without write/exit.
See distance-domain-save-pass.log. These remain isolated Node Worker-thread /
controlled store tests, not browser UI/client, public agent, host or native
kernel acceptance.

## Independent near-residual investigation

No geometry-comparison tolerance was changed. The review program loads a real
headless UI workspace, performs the ordinary prepare/fine-solve path, serializes
its current geometry, then solves again with the real backend and invokes the
existing1e-9 absolute diagnostic geometry check. Four families were sampled:
Angle, SegmentLength, TangentLC and DistancePP; offsets0,1e6,1e8; lengths0.01,
1,1e3,1e6; initial endpoint perturbations0 and1e-8, plus -5/0/+5 point-distance
domain controls. Baseline source f49b5cf21 produced99 rows in the retained JSON.

98 baseline states had successful UI fine solve with no rejected relation;
43 retained nonzero solver error. None suffered a backend refusal or a1e-9
geometry-comparison refusal; maximum before/after coordinate delta was zero.
For example, point distance5 at the origin with a1e-8 endpoint perturbation
retained a7.999999944980231e-9mm radial residual, yet both solves succeeded with
exactly unchanged geometry. One large translated case already had rejected UI
admission; the backend correctly refused its rejected intent. This is evidence
against blanket loosening, not a proof for all nonlinear curves, scales, stage
interactions or browser drag paths.

```sh
node test/review-save-compat/run-near-residual-review.cjs
```

The current source additionally enforces the new distance domain, so its negative
and >1e6 unsigned-distance setup rows now refuse before the comparison. The
review asserts no comparison refusal among sampled successful/nonrejected UI
states. It performs no production write, app build or GUI action. A future
concrete valid-geometry false refusal should motivate independently checking
current geometry/residuals; simply raising the intent/geometry tolerance would
need separate justification.

## Source-only caller/name review

At226104e38 the sole direct production editor.save call is awaited by
saveAndExitEditor. Save and non-desktop OpenInTab actions propagate the Promise;
the action system observes UI-dispatched rejection and returns the original
Promise to awaiting callers. The sketch action adapter's expression arrow also
returns the invoked action. No additional missed production Save caller was
found. Historical120-call migration has syntax/compile/source audit evidence;
its browser scopes remain unqualified until combined execution.

Root6f3c28790 is an installed-Worker E/Math Save/regeneration test. The preceding
name validator change allows precisely E/Math in addition to established
external parameter names, while legacy variable-name and safe-expression AST
rules stay separate. External lookup uses own keys on a null-prototype table.
No concrete name-bridge defect was found in this bounded read-only review; that
is not an independent browser pass for6f.
