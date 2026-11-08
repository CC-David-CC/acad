# Dimension source-frame candidate construction after actual PL R4

SOURCE-ONLY repair, based on root88a81819078cee0512adcd5cec26f7692a09e79b.
No tests, probes, builds, TSC, Native execution or browser runs were performed.
The original complete point-line driver and its acceptance criteria remain
unchanged. Root composes the normal build and reruns that whole workflow.

## Actual failure and retained evidence

PL R4 again failed at the signed-X endpoint reversal in driverline47. Canonical
evidence is test/point-line-distance-public-workflow/evidence-r4/receipt.json,
frozen in22b9712fcd1aa4b7d04f5594b97cb357688ad6e5. The recorded mismatch is
`source.objects.5.data.y: 2 -> -2 (delta=-4)` in MILLIMETERS, not numerical
picometer drift. Actual warm native records are

`[[0,20,0,-10,false,2,0],[0,21,0,-10,true,2,0]]:bounded`.

Columns are actual stage/native constraint index, angle radians, signed t mm,
inverted, resolved distance mm, original DistancePL residual mm. The actual warm
line therefore uses angle0/t=-10 while its two opposite-side DistancePL rows
still satisfy their original equations. Cold native angle/t were NOT captured
and remain explicitly unavailable; constructor initialization and the equation
consequences below are source-derived, not a forged cold native observation.

The earlier distinct signed-Y redundancy now passed. R4 still FAILS overall;
there are no positive repair or native Save/Open claims for the new source.
All first failures and producing pins remain unchanged.

## Why this is a construction lifecycle problem

Segment.write saves a/b endpoints; Segment.read creates a native Segment and
syncGeometry initializes its derived angle and nonnegative t from those actual
endpoints. Original authored constraints then retain their normal authority over
the frame. Angle0/t=-10 and angleπ/t=+10 encode the same reversed endpoints,
but DistancePL's actual equation uses the polar-angle normal without sign(t).
The same unchanged inverted/distance literals consequently select opposite
physical sides in the two frames. A private warm frame cannot supply additional
durable source intent which the actual source and its constraints do not carry.

The repair does NOT add sign(t), change inverted, change the schema, persist
angle/t or discard the existing exact independent replay guard. It finishes an
explicit source-frame construction phase BEFORE freezing the authoritative
candidate. The actual original equations, constraints, stage ownership and
generator lifecycle remain the model; there is no separate representation.

## Narrow trigger and original-source authority

Only the existing general driving-dimension path is affected. Dedicated
DistancePL, ProjectedDistance and RadiusLength transition routes remain intact.
The source is first replayed and independently checked exactly as before.
If its original retained schema inventory contains DistancePL or TangentLC, an
internal observer retains the EXISTING successful solve's private auxiliary
witness batch for later original-coordinate proof; it adds no solve.

The new construction trigger is an actual source-root native Segment, with
negative t, an actual retained DistancePL or TangentLC side consumer and an
actually affected field in the captured original operation component. IDs are
looked up as opaque identities against the native index and original source
roster. No public normal/flag/index, source ID grammar, coordinate proximity or
current residual supplies authority. Unsupported nested/non-source frames do
not gain a new mutation policy; the existing independent replay still refuses
any unstable resulting source.

The component proof reuses captureConnectedGeometryScope at the ACTUAL original
authored coordinates, its fresh cold evidence and privately issued auxiliaries.
Its seed consists of the original registered target row's actual polynomial
parameters, not every declared field or a numerical rank. Existing original
equation and generator dependencies, exact LockPoint/ground cuts, Param custody,
nonzero coefficients and work limits remain unchanged. The target stage/index,
schema, ordered native objects and original residual/domain are checked before
that row supplies the seed. A name binding is never replaced with a number.

## One complete construction phase

After the ordinary dimension transaction, the code checks the ACTUAL whole warm
model: finite successful native stages, original constraint/object membership,
all original registered equations/domains and no rejected row. Before any frame
change, the actual serialized warm result must preserve exact original intent
except the requested dimension edit/removal and exact geometry OUTSIDE the
captured component. A tiny unrelated optimizer movement is still refused; the
code does not restore old coordinates over an invalid or out-of-scope result.

For the selected actual native Segments only, syncGeometry initializes derived
frames from the real edited endpoints. The existing complete native stage
lifecycle validator then performs ONE stage resolve pass over the original
model, including real generators. It validates earlier-stage preservation,
ordered generator sources/outputs, original constraint ownership, equations and
domains. This is an explicit ordered construction phase, not retry or polish.

The fully resolved native result is again checked for the exact authored delta
and exact untouched geometry. Only then is its authorized component copied into
the original authored source via applyCapturedGeometry. Since the actual whole
result already passed the untouched-component check, this cannot hide unrelated
movement by patching old coordinates back. Exact source metadata, boundary,
constraints, stage/generator records and original target ordering remain bound.

There is NO final t>0 rule. Original Angle/H/V/AngleBetween/P/P or signed-t
constraints can select a legitimate negative-t chart again. Their constants are
not rewritten and their original residual/domain checks are not relaxed. If the
candidate cannot establish the original model's coherent source/replay meaning,
the operation refuses and retains the accepted model.

## Independent verification and publication

The EXISTING independent solveSketch call verifies the frozen constructed
candidate. The exact sameRestoredSketch comparison for non-DistancePP remains;
the separate existing bounded DistancePP policy is unchanged. Classification
checks and the bounded R3 mismatch diagnostic remain in place. No cold optimizer
result is adopted to make a failed comparison disappear.

If it refuses here, the diagnostic's actual warm records now describe the
current native frame AFTER the explicit construction pass; the historical R4
records remain the original pre-repair observations. Cold native frame data
remain unavailable rather than inferred or fabricated.

For a constructed-frame candidate, the same existing cold call also privately
issues its auxiliary batch. evaluateCapturedSketch validates the ORIGINAL
edited equations, ownership, actual coordinates, original domain, classification
and boundary AT the constructed candidate, independently of optimizer output.
The returned authoritative bytes and residual evidence come from that candidate
and captured evaluation, not a copied cold geometry result. Other paths retain
their prior return behavior. There is no extra cold solve or loop.

The second disposable Worker still reconstructs the entire operation from the
original request before checking the supplied candidate. Existing symmetric
dimension travel, exact historical source, currentness, journal and host
publication/resource guards are not bypassed. Nothing is changed in Main,
Desktop, Files, PM, codecs, Native, engine defaults or format policy.

## Internal callback ownership

sketchTransition.ts adds ONLY an optional TypeScript function argument forwarding
solveSketch's existing private successful auxiliary observer. Public request
keys and success/error DTOs remain exact and unchanged; a serialized caller
cannot supply an observer or a witness. Replay geometry/source validation is
unchanged and still must succeed before a replay result can be consumed.

The issued frozen batch stays in the same disposable Worker and is checked by
the existing private WeakSet/registered-factory/Param-owner machinery. It is not
persisted, sent to Main, supplied by a public flag or reused across the second
Worker. That Worker obtains its own actual solve observations. No alternate
representation or second job/lifetime is introduced.

## Other consumers and limits

DistancePL and TangentLC have polar-normal side semantics; both are recognized
as triggers. PointOnLine, Collinear and AxisSymmetry are homogeneous zero
relations and retain their original equations. ProjectedDistance already uses
sign(t). LengthRelation uses the magnitude of t; SegmentLength directly fixes
its positive length. Raw angle and ordered angle-pair constraints keep their
original chart/turn/branch authority. No general gauge-invariance claim is made
for other curve/auxiliary/legacy constraints or generated sources.

Source-frame discovery and warm original-equation checks each cap their work at
100000 native rows; the existing shared captured-component and full stage
validator budgets remain. Those are proof resources, not new feature-scale or
model-accuracy claims. Existing schema/nonfinite/resource failures stay typed;
numerical failure is not called infeasibility. No epsilon, rounding, trig,
coefficient-reduction or numerical stopping policy changes.

The full unchanged PL workflow must still establish signed reversal, live
rotation/reversal, opposite polarity, zero, conflicts, no-op, stale requests,
named distance edit/remove, mixed Undo/Redo and real native .cad Save/server
equality/fresh Open. Mirror and other retained workflows remain regression
obligations after normal composition. This source-only packet is not a passed
workflow, new generic geometry authority or a broad C03/C04 qualification.
