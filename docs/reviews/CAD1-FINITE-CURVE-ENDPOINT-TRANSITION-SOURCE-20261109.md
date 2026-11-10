# Finite-curve endpoint semantic transition: source handoff

SOURCE ONLY / UNRUN. Base67058270f40a9507766ff9ff7ba2418ed5c07343.
Exactly one NEW runtime leaf,
web/app/sketcher/headless/finiteCurveEndpointTransition.ts, plus this note.
No existing task/client/coordinator/schema/certificate/solver/Native/Host/J
file is changed. No tests/parser/import/module/build/Native/browser execution.

Implements the private semantic slice of public contract573f0a2 and
Root approvaldf6d8ad. Root separately approved the exact point/no-op/failure
interpretation below before implementation. This source is not a mounted
public coordinate operation, source-owner issuer or qualification.

## Exact captured input and exports

changeFiniteCurveEndpoint(value) captures ALL fields synchronously before its
first await:

    {revision,sketchJSON,externalParameters,expectedSource,raw,domain,
     intent:{action:'trim'|'extend',
             target:{curveId,endpoint:'a'|'b'},nativeIndex},
     coordinatePolicy:'ordinary'|'typed-lengths'}

Unknown fields/accessors/symbols/nonplain records refuse. expectedSource must
structurally capture as a successful original source receipt with the SAME
revision. Source text/external map and selected ordered IDs are captured through
the existing finiteCurveSourceEnvelope policy; selected IDs come from the
captured expected receipt, never parsed opaque IDs. Raw is structurally detached
against that receipt's full input before awaiting. Domain/intent/policy are
strictly detached/frozen. No caller geometry/success/certificate/phase flag is
admitted. Coordinate policy is Root's actual captured job.typed, not public input.

verifyFiniteCurveEndpointCandidate(value) takes EXACTLY the SAME original
fields plus candidateJSON and resultPoint, both captured before first await.
resultPoint is the existing exact coordinate receipt {id,x,y}, not a proof.
Candidate source retains the existing1MiB character/UTF-8 limits.

Producer success:

    {revision,ok:true,changed,serializedSketch,evidence,
     point:{id,x,y},endpoint:{action,target:{curveId,endpoint},nativeIndex}}

Verifier success is the existing standard {revision,ok:true,verified:true}.
Failure is {revision,ok:false,error:{code,message,cause?}}, with bounded
64-character code/512-character message and genuine validated original cause.
No source body, live workspace, Params, Native name, event ID or authority flag
crosses this result.

## Actual independent source and Native candidate selection

Each producer AND verifier call independently runs extractFiniteCurveSource on
the complete original text/external map/selected ordered pair. That route has
the actual cold solve, original-coordinate captured equations/domains/admission,
auxiliary ownership, fresh decode/cleanup, target children/Params and original
F64/source/frame/parameter/admission digest proof. The fresh whole receipt must
match expectedSource, including revision/nonce and every binding. Expected
geometry/evidence is never injected into that extraction's solve.

Raw is then recaptured AGAIN against the fresh actual input, and
verifyFiniteCurveCandidates recomputes its bounded mathematical certificate
inside this Worker. No submitted certificate/finite-membership flag is trusted.
Require certified finite-points, the exact actual nativeIndex in its finite
selected-domain census, one matching root and both membership.selectedDomain
values true. Candidate must be the same represented point as rawPoints at that
index. No nearest-root choice, second query, reconstructed root, alternate solve,
support-only guess or overlap interval event is used.

The selected root must carry actual withinBudget distanceEvidence with the
existing5e-8mm=50pm budget. False returns
CURVE_PUBLICATION_DISTANCE_UNQUALIFIED before coordinate construction.
Actual mathematical uncertainty returns CURVE_QUERY_UNCERTAIN with its bounded
existing reason; it never becomes empty, conflicting or globally infeasible.

The target is one freshly extracted actual Segment. Its child IDs are ONLY
members[1]/members[2] in the source extractor's authenticated root/A/B order.
No suffix grammar, coordinate match, index-to-topology guess or public ID
authorizes a child. The other selected source curve is the boundary.

## Exact action and publication semantics

| Requested action/domain | Required actual certificate |
|---|---|
| trim / finite-pair | Target location interior, selected own endpoint, or opposite endpoint; boundary finite membership must also hold. |
| own-endpoint trim | Certified exact endpoint membership determines no-op. Return ORIGINAL endpoint coordinates and EXACT original source bytes; do not replace them with a rounded Native sample. |
| opposite-endpoint trim | CURVE_ENDPOINT_DEGENERATE before coordinate construction; no source collapse is published. |
| extend / endpoint-ray | Domain's actual targetCurveId and endpoint match intent; target location outside, with the same selected outward ray and genuine boundary membership. No finite-pair event is repurposed as extension. |

Other target/action/domain/overlap/nonselectable combinations explicitly refuse.
Only exact certified endpoint membership chooses no-op/collapse, never proximity.
If a distinct mathematical interior/outward event's actual represented Native
point equals the current endpoint, it refuses CURVE_ENDPOINT_UNSUPPORTED with
the actual representability reason. It does not fabricate own-end membership.
An actually collapsed or below-domain proposed coordinate result still fails
the existing original coordinate-domain proof; no new minimum/epsilon is added.

Construct an existing PRIVATE coordinate batch with exactly TWO actual points:
changed selected endpoint at its actual Native candidate (or exact original
no-op coordinate), and opposite endpoint driven at its ORIGINAL coordinate.
These are temporary existing LockPoint intents only inside the established
private coordinate transaction; they are removed and all original equations/
constants/typed names retained by that existing producer. No persistent lock,
constraint erasure, generic public point command or new editable model exists.

editPointsCoordinatesTransition supplies retained original equation/scope,
actual authorized warm-component delta, fresh cold/second-cold/total replay
bounds, original-coordinate captured evidence and exact intent proof.
Genuinely connected neighbors may follow. No unrelated or selected-boundary
geometry is restored over an invalid optimizer output.

Afterward, explicitly require the ENTIRE selected boundary source row to equal
the original represented row (all geometry, branch, IDs, role and stage), and
the target's opposite endpoint data to remain exact, including signed zero.
Refuse if the shared solve cannot retain them. Selected target coordinates use
the existing coordinate publication's exact numeric equality (JSON canonicalizes
signed zero), with NO spatial tolerance. Point receipts remain exact represented
values. Non-noop must genuinely change source bytes and selected coordinates.

Even no-op calls the original existing coordinate batch's no-mutation path to
obtain real original evidence, and requires its returned bytes to remain EXACT
original. No evidence is invented from a digest or copied first success.

## Independent verifier and travel obligations

The verifier recomputes the complete original semantic preparation/certificate
again, compares actual resultPoint to the selected owned endpoint intent and
checks boundary/opposite/no-op invariants. It then calls:

- ordinary: verifyPointsCoordinatesCandidate;
- typed-lengths: verifyTypedPointsCoordinatesCandidate.

Those existing functions reconstruct the COMPLETE original coordinate batch and
require exact candidateJSON plus the complete two-point receipt. The typed path
also invokes its existing symmetric coordinate travel proof under the SAME
bindings for a changed candidate. No optimizer output is copied back and no
formula/name is replaced by a literal. A no-op requires exact original bytes
and point, and follows the existing no-change verification path.

Producer success is a candidate, not adoption. Root MUST call the independent
verifier in a second fresh disposable Worker and obtain success before any
shared publication; in particular do not skip the typed travel proof because
the producer returned ok. Root's authenticated J/native-travel integration and
full-suffix replay remain mandatory; these private receipts cannot invent that
authority or guarantee arbitrary nonlinear reversibility.

## Failure layers and remaining integration

Approved local semantic codes:
CURVE_ENDPOINT_INVALID_REQUEST, CURVE_ENDPOINT_UNSUPPORTED,
CURVE_ENDPOINT_DEGENERATE, CURVE_ENDPOINT_CANDIDATE_MISMATCH,
CURVE_QUERY_UNCERTAIN and CURVE_PUBLICATION_DISTANCE_UNQUALIFIED.
Source mismatch retains FINITE_CURVE_SOURCE_MISMATCH. Actual source/coordinate/
resource/solver/domain failures keep their original code/message/cause via
captureSketchFailure/withAdmissionCause/failureCause. Numerical failure is not
an infeasibility theorem. Root public preflight separately owns DOMAIN and
SELECTION_MISMATCH semantics; no message/code infers selection disposition.

Limits stay the actual source/certificate/coordinate limits: source1MiB,
two selected curves/eight raw points; bounded certificate arithmetic/work;
existing coordinate1024-object/32-point/one-stage/±1e8mm envelope and256-character
point IDs. A source-extractable child exceeding that current coordinate ID
envelope is explicitly unsupported, not globally malformed geometry. New exact
boundary comparison is bounded by existing100000-node/64-depth structure.
No threshold, seed, solver or global numerical policy changes.

Root alone still owns task/client exact result capture, original source owner
(including REQUIRED consumed-source edit), actual current query receipt/Native
settlement/cohort/job/frame/definition/material/host custody, currentness across
each await, trusted phase/selection disposition, shared mutable transaction
entry, one J, full suffix/Native/body validation, and native Save/Open/travel.
Inputs raw/expectedSource are private structural records: this leaf cannot prove
their Native-origin or document-currentness merely from their contents.

Mandatory authored Arc packet remains a composition prerequisite for proper
Arc boundary reads; full Arc raw query and richer trim/splitting/interval domains
remain OPEN. No common source was cherry-picked/overwritten from another lane.
No public availability, successful query/edit/Native outcome or Gate1 result
is claimed by this unexecuted source packet.
