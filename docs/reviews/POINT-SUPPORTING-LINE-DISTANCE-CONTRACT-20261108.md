# DistancePL: finite shared point-to-supporting-line contract

Proposal and source audit only, based on qualified main b5cc011 (including6407d6b), 2026-11-08. No product edits, tests, probes, mathematical/native execution, builds, TSC or browser runs. The projected-distance source packet10940466/d342b855/a538b850 and its current6cff R2 are separate and unqualified at this review. Do not overwrite those shared seams. Seventeen named scoped proofs and all 21 formal Partial exercise statuses remain unchanged; the C03 inventory is still 17 families.

This proposes one genuine existing DistancePL path. It does not qualify tangent contact, finite-segment proximity, a parallel-line offset dimension, arbitrary generator/stage domains, BRep accuracy or human gestures.

## Confirmed current source and exact meaning

| Source | Confirmed behavior |
|---|---|
| web/app/sketcher/constr/ANConstraints.ts:538–583 | Registered DistancePL has ordered objects [Point,Segment], constants distance and inverted. distance is numeric/nonnegative; inverted is a literal boolean field. Native parameter scope is P.x/P.y, line.params.ang and line.a.x/line.a.y; it does NOT include line.params.t. |
| web/app/sketcher/shapes/segment.ts:36–77 | Actual owned line normal is nx=−sin(ang), ny=cos(ang); w=n·A. syncGeometry initializes ang from endpoint direction and t to positive endpoint length. t is a mutable solver Param, not a positive-domain constant. |
| ANConstraints.ts:862–876 | Original internal Polar equations are A+t(cos ang,sin ang)−B=0. A negative t is algebraically possible; equivalent endpoint geometry can use ang+π and −t. |
| ANConstraints.ts:1111–1141; constr/booleanSketchFields.mjs | General numeric validation already requires finite nonnegative resolved distance. Boolean semantics accept only true/false or the actual legacy strings 'true'/'false', never a named expression. finite:true ALSO adds a1e6 cap; adding that flag would silently tighten existing Native DistancePL rows and is not proposed. |
| actions/constraintActions.js:589–625 | Existing real human Point+Segment action initializes distance/side from the actual polar normal, then edits/adds actual AlgNumConstraint. This is real existing capability, not a qualified public closed-source workflow or proof of every action lifecycle. |
| headless/drivingDimensionTarget.mjs:3–8,24–41,60–66 | DistancePL has no supported driving field/target. Existing discovery and delta capture require exactly ONE constant, and assume either a point pair or one measured primitive. DistancePL needs its exact two constants and mixed Point/Segment ownership; adding only a field-name allowlist would remain incorrect. |
| headless/inspectionClient.ts:110 onward | Inspection captures exact existing row keys and binds target objects/current source. New DistancePL metadata needs an explicit discriminated capture; arbitrary new caller geometry is not authority. |
| headless/typedDependentSketch.mjs; cad/parameters/discoverTypedSketchConsumers.mjs | Both use drivingLengthField and already preserve registered literal booleans. They currently reject a name in DistancePL.distance. A shared nonnegative length-field policy can admit that one field without permitting an expression in inverted. |
| io.ts:198–229,350–425 | Native source writes Segment endpoints; ang/t are rebuilt by actual Segment.read/stabilize. Constraint writer retains original objects, distance, inverted, stage, annotations and derived admission. No saved polar gauge exists. |
| headless/sketchValidation.ts:18,76–139 | DistancePL signature is already supported; ordinary Segment geometry must exceed the existing1e−9mm numerical envelope. Original equations/residual policy apply. The registered schema-specific line-domain list currently omits DistancePL, although source/result entity validation separately rejects collapsed Segments. |

Let P be the actual selected EndPoint, A the actual line.a, θ the actual owned polar angle, d the resolved nonnegative canonical millimeter value, and σ=−1 when inverted=true, otherwise+1. The ORIGINAL equation is

    n(θ) = (−sin θ, cos θ)
    n(θ)·(P−A) − σ d = 0.

n is unit length mathematically; production floating evaluation retains its full available precision and existing validation. Its signed quantity is a normal coordinate, not the Euclidean distance to the finite segment. For A=(0,0), B=(10,0), ordinary cold θ=0, P=(20,2) satisfies d=2/inverted=false even though its perpendicular foot is outside the finite Segment. Segment.calcNormalDistance's finite-foot rejection is NOT DistancePL's equation and must not be reused here.

The equation is correct for its actual polar-normal semantics. No reproduced wrong-math incident is established. Do not insert DIRECTION_SIGN(t) or rewrite literals to manufacture endpoint-relative left/right semantics. When t<0, n(θ) is the opposite of the ordinary A→B left normal. Therefore the public branch names must be 'polar-normal' and 'opposite-polar-normal', represented by the one existing authoritative inverted constant, not unconditionally 'left'/'right'.

Zero distance is valid. Both boolean choices give the same zero locus, but the raw chosen flag remains authored intent for a later positive edit. No automatic branch flip at zero, serialization normalization or branch dedup is proposed. A point that is actually a line endpoint can give a genuine redundant zero equation; a nonzero request on that same endpoint can conflict. Do not reject every such identity as a malformed target or substitute a coordinate weld.

## Public contract proposed for root approval

One new create command and reuse current inspected dimension edit/remove:

    apply-closed-sketch-point-line-distance({
      revision, faceId, pointId, lineId, distance, inverted
    }, options)

All keys exact own-data; pointId and lineId are actual inspected source-local identities, with genuine EndPoint/Segment type/owner checks. They are not two interchangeable IDs and are never parsed/reconstructed. revision/face/window/account/currentness and captured source/parameter revision bind the whole operation.

Initial target domain: an actual nongenerated ordinary Segment and a current actual EndPoint whose native owner is an ordinary Point/Segment/Circle/Arc in the supported authored stage. A real datum/ground point must be identified from actual restored ownership, never its ID spelling. Other point-owner classes or a moving generator dependency are explicitly unsupported by this new mutation route, not invalid native source. Unrelated carried geometry/constraints retain their existing read/validation/carry behavior and exact source; no new whole-document object-type rejection follows.

Creation uses a finite numeric literal d≥0; the existing shared scalar request envelope [0,1e6]mm is a public command limit, not a new native-schema minimum/maximum. No strictly-positive restriction. Existing valid larger Native literals retain their prior read/carry domain; the source is not rewritten or rejected merely to fit the new command. Existing component/document budgets remain unchanged.

inverted is an explicit boolean in the new request. The actual human action may still initialize it from its existing polar-normal calculation, then call the same model admission. A supplied boolean is never replaced by sign(point-side), a default side or a named parameter. Exact same current ordered targets/literal d/side may be a no-op; a new name binding is distinct intent. Multiple matching existing rows need actual locator-based edit/remove, not arbitrary first-row selection. A different incompatible side/distance produces the solver's real refusal/cause; no blanket 'infeasible' label from numerical failure.

Existing edit-closed-sketch-dimension({revision,faceId,constraintId,value}) changes ONLY DistancePL.distance to a current literal or actual existing typed length identifier. remove-closed-sketch-dimension removes exactly the discovered row. Neither path may change inverted, object order, stage, annotations, another constraint, a parameter definition or source identity. Named→numeric overwrite retains existing BOUND_DIMENSION refusal; explicit rebind name is checked by the same length resolver and nonnegative domain. A definition update must discover this exact consumer and keep the raw identifier. At d=0 the original inverted literal survives travel/Save/Open and later name/positive edit. Side editing is not silently added to the scalar edit command.

### Inspection and reply

Reuse actual closed-sketch inspection/dimensionTargets; preserve every existing row/task schema unchanged outside a discriminated DistancePL row. Its row binds ordered objects [pointId,lineId], raw distance identifier/literal, actual nonnegative current distance, admission and current edit/remove locator. Validate exactly the original distance+inverted record, accepting existing registered raw boolean/string encodings without rewriting them.

Proposed DistancePL-only supportingLine metadata is

    {lineId,normalBasis:'native-polar-angle',anchor:[ax,ay],
     angleRadians,polarLength,normal:[nx,ny],signedDistance,inverted,
     quality:'source-local-supporting-line-mm'}

It is derived once in a disposable Worker from the actual owned native Segment/Param and Point used for this same verified source, not reconstructed on Main from source IDs or endpoints. lineId must exactly equal objects[1]. normal/anchor/angle/t/signedDistance are descriptive, current-revision data, not saved source fields, caller mutation permissions or a BRep certificate. Main does only bounded own-data capture and binding checks. Source/read-only inspection may be a cold replay; document that rather than calling it the exact retained warm Param state.

A create result's discriminated dimension receipt contains actual typeId:'DistancePL', ordered objects, explicit distance/inverted, stage/index and actual accepted/redundant state. Its second Worker must reconstruct the same original request and bind the whole receipt, including side. Dimension edit/remove replies preserve the current public transport while adding only the strict DistancePL branch witness required for this type; no unrelated schema wire expansion.

## Branch and source-format obligations requiring explicit approval

The original equation's polar normal is unambiguous in one native workspace. Its representation is NOT an extra persistent datum: source stores endpoints while native read initializes positive t. An accepted warm solve with t<0 can thus have n opposite to its cold reconstruction unless the original equation/source proof rules it out. This is a source-backed replay RISK, not an observed bad Save or proof that the current pipeline publishes it.

Proposed policy: publish only a candidate whose original DistancePL equation, actual source-declared geometry and existing cold/native replay proofs all agree on the retained raw inverted choice. No hidden ang/t field, branch flag, sign-dependent rewrite or automatic side repair. Use actual captured auxiliary witnesses and original Polar equations when authorizing affected geometry; a generic guessed endpoint normal is not private source ownership.

Required ordinary positive acceptance includes live line rotation and reversal with a free dependent Point. On cold source reversal its polar normal reverses, so a fixed inverted=false/d>0 must move the Point to the corresponding new normal side (or refuse only when real additional locks make it impossible). Do not declare every reversal unsupported to close the case. If existing warm→source publication cannot construct that positive case, root must approve a narrow canonical-candidate construction at the responsible transition; no global schema change, silent source healing or weakened replay bound follows from this proposal. The whole run, not a microprobe, determines whether that extra repair is necessary.

Existing exact source/state proof remains decisive. A mathematically invalid zero-length line refuses before normal evaluation; the existing >1e−9mm supported Segment envelope stays a numerical-domain declaration, not proof that smaller mathematical lines do not exist. A new narrow DistancePL registered-domain check may reuse actual projectedDirectionValid for finite nonzero owned Polar/endpoints; it does not multiply its equation by sign(t) or change stopping/residual tolerances.

## Shared source/ownership implementation proposal

No existing file is edited by this document. Root approval and serial composition with the pending Projected packet are required before implementation.

| Proposed seam | Exact responsibility |
|---|---|
| NEW actions/pointLineDistanceAdmission.js | Pure owned-target/current-row inspector separate from mutable prepare/add. Pure inspection must work inside IO.evaluateCapturedSketch's existing captured transaction; mutation entry still refuses a caller's open transaction. Real native EndPoint/Segment, original stage/consumer ownership, constants and no-op checks; original AlgNumConstraint only. Human action delegates to shared admission without invented schema execution. |
| NEW headless/pointLineDistanceEnvelope.mjs + pointLineDistanceTransition.ts | Exact request/reply, bounded captured source, real Worker admission, full original-equation/domain/source proof and original-request second-Worker reconstruction. No fake successful geometry. |
| drivingDimensionTarget.mjs + drivingDimensionTransition.ts | One DistancePL-specific field/count/value and exact two-constant validator; preserve original inverted representation during edit/remove/delta/travel. Use dedicated PL transition branch if that avoids weakening existing generic exact-one-constant rules. Keep later Radius/Mirror/Projected behavior intact. |
| headless/closedSketchInspection.ts + inspectionClient.ts | Worker-owned actual support metadata and discriminated exact capture; no Main trigonometry/source parsing/native ownership guesses. |
| typedDependentSketch.mjs + cad/parameters/discoverTypedSketchConsumers.mjs | Reuse shared distance-length/domain helper; literal inverted remains a registered boolean. Actual external length resolver/definitions, not copied parameter values or new formula grammar. |
| constr/registeredConstraintPolicy.mjs, only if required | Narrow actual owned line-domain qualification using existing finite nonzero Polar policy; original residual equation/profile unchanged. No new global epsilon or scalar threshold. |
| solveWorker/client/transitionClient + closedSketchTransitions/Craft + thin Desktop adapter | One actual create task and independent original-request verifier; existing currentness/one sketch-bytes journal/full-suffix candidate publication, transport settlement and disposal. Root coordinates exact additive splices after Projected/Radii changes. No PM/codec/native-ABI/Canvas/toolbar/new model/provider changes. |

Use common capturedGeometryScope on ORIGINAL polynomials, actual fixed cuts/auxiliary ownership and real dependencies. Capture both targets, source and current parameters before awaits. For an already satisfied request retain the exact original source as appropriate; for an unsatisfied request authorize only the actual warm connected-component delta. Construct from original source plus that delta, never restore old coordinates over invalid optimizer output. Validate original constants/domains/equations and all retained classifications before and after independent cold construction/replay. Preserve unrelated rows, native dimensions, labels, materials, source IDs and exact historical travel bytes. No speculative generator broadening; moving generated/consumed components remain explicit supported/refused domains.

Creation, scalar edit, removal and journal travel all need the original-request independent second Worker, exact side/ordered-target metadata and current lifetime. A valid/re-solvable candidate alone is insufficient. Do not reuse signedDistanceIntentProof unchanged: it explicitly requires one constant and would omit inverted. Do not discover a row by a public locator grammar; use the exact actual inspected locator/current native index.

## One complete public workflow and independent truth

Freeze driver/expected math before execution, then root runs the whole workflow only after coherent source/build composition:

1. Normal New; real anchored datum rectangle and unchanged Native extrusion; independent ordinary Segment L A=(0,0),B=(10,0), actual Point P=(20,2), unrelated Q=(7,9). Discover actual endpoint/line IDs; use existing signed X/Y dimensions from the real locked datum to hold both line endpoints initially, with actual unrelated Q intent retained. No raw equations or guessed endpoint IDs. Create d=2/inverted=false; despite the foot x20 lying outside the finite segment this is a required positive supporting-line case.
2. Inspect genuine row/side/normal and current original residual. With L fixed, P starts with two local coordinate freedoms, the real PL row leaves one, signed X(P)=20 removes it, and a DISTINCT signed Y(P)=2 is genuinely redundant. Freeze the independent rational rank for that declared P subproblem; do not infer global physical DOF. A request d3 while signed Y2 remains is a true contradictory pair: retain actual cause/state. Remove ONLY the discovered Y2 row, edit d2→3→0→2 on SAME PL row, no-op, remove/Undo/Redo; raw side persists at zero. An inverted=true case starts with a genuine Point below the horizontal line. A duplicate PL no-op is not separately authored redundancy.
3. Remove the actual discovered signed locks on B and the tangential X20 lock on P; retain A's real datum locks and every unrelated row. Rotate the real live line to vertical and reverse it by actual public endpoint/source edits (B=(0,10), then B=(−10,0)) with only the genuinely needed locks retained. Require the free dependent Point to satisfy the SAME raw side and distance under the actual cold normal, rather than a hardcoded tangential location. A separate locked-point reversal/conflicting-distance request must refuse atomically. Zero/collapse/stale/unknown/nonfinite/negative cases preserve accepted source/history/J/counters/resources. Do not route this through a projected point-pair substitute.
4. Bind SAME distance to a genuine current named length (e.g clearance=2mm), update to3mm, reject a negative value, wrong dimension, undefined identifier and cycle. Preserve raw name and inverted; numeric overwrite refuses. Mixed creation/distance/parameter/line travel uses the one existing journal; unrelated Q/Native body remains exact. Only actual allowed dependent geometry moves.
5. Three normal .cad Saves/browser acknowledgements/own server byte equality/fresh signed Opens, rediscovery/reedit/resave and actual unchanged Native queries. Native bodies only corroborate unaffected suffix; they do not certify the point-line equation as a BRep feature. No shutdown writes or private source seeding.
6. AFTER the entire run, independent archive ZIP/CRC/entry hashes/source identities and Decimal/Fraction analytic geometry check every stored and replay-inspected observation separately. Derive n from actual source-declared L only after checking its native positive-t reconstruction/normal witness; evaluate the ORIGINAL equation and the separate absolute supporting-line distance via cross(L,P−A)/|L|, plus the branch flag. For cardinal/3-4-5 frames use exact rational normals; generic angle checks use high precision. Frozen physical-coordinate/normal-offset oracle50pm=5e−8mm; original solver residual policy1e−6mm is not substituted as achieved geometric accuracy. Source/constant/ID equality stays exact. If a fixture misses that budget, preserve actual error/cause rather than broaden it.

A two-parallel-line offset is a separate semantic relation. One Point from a second Segment does not guarantee that Segment is parallel or every point shares the offset. A future explicit offset operation must bind both genuine lines plus parallelism/side and independent source intent; passing this DistancePL workflow alone does not close that C04 row.

## Review decision requested

Approve or amend: literal polar-normal inverted semantics; explicit numeric create plus existing named scalar edit/remove; readonly actual native support metadata; strict two-constant/source/side proof; ordinary free reversal as required positive acceptance with any necessary canonical-candidate repair separately justified. No production mathematical change is established or authorized by this audit. Root retains source ownership coordination and all complete execution.
