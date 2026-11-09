# Private countersink coordinator review — BEFORE repair

Reviewed contract1bbcc3170a4cc6cf2f8167b4a166a0f3046928f2 and source
 d5a5c0d0fb73de8f10d232b3ccb50e7558ac053d against actual Native
fc1654ee5d4471584073d4d8e3363d8c9b324566 and its retained ports. Source only:
no parser, probes, tests, TSC, build, Native or browser execution. No existing
root/fixture/runtime/helper/evidence edits. The coordinator is unregistered;
these are service source findings, not a public incident.

## Confirmed related terminal-settlement gaps

1. ownedCountersinkWorker.mjs:35–49 performs actual census/topology/metrics reads
   BEFORE its four-result try at108/finally128. A Native scratch-release,
   exclusive exchange restoration, malformed exchange or thrown-invocation
   failure at that point escapes WITHOUT the coordinator's terminateWorker
   outcome. countersinkNativeCalls records terminal:true privately, but only
   the later attempted-result/final cleanup path converts uncertainty to the
   required realm-retirement error. Its preflight work-state failure at33 is
   likewise an owned ENGINE_CLEANUP_FAILED without that disposition. No result
   has been attempted yet; this is not proof of a leaked shape. Unknown scratch
   or receiver custody still cannot become an ordinary reusable-worker refusal.
2. Consulting ONLY countersinkCallFailure in an outer catch is insufficient.
   After normal Native return, metrics:21–23 invokes conicalFields and topology:79
   invokes validateOwnedTopology; cone:80 also invokes the strict cone capture.
   Those helpers can throw an owned ENGINE_FAILURE that has NO callFailures
   entry. Similar post-return schema calls exist in nativeError and evidence.
   Such malformed actual observations are terminal under COORDINATOR.md, but
   the adapter currently loses its own post-invocation classification at the
   strict helper boundary. This is a source path, not an executed corrupt JSON.

Bounded remedy: an outer coordinator settlement boundary must honor terminal
adapter errors/actual owner loss across preflight AND the existing body. Strict
post-return adapter captures must privately classify their thrown errors as
terminal while preserving actual existing Error identity/code/message/cause;
already branded ordinary Native refusals stay ordinary. Owned cleanup errors
must carry the same realm-retirement contract even before the four-result try.
No new public callback, caller trust flag, identity port or names-derived proof.
Ordinary numeric/source-domain and capacity/preallocation refusals with proven
custody must retain their original exception/result semantics. Freeze this
BEFORE note unchanged and put any source repair in a separate commit.

## Reviewed retained behavior

* Native method signatures/versions match: selected V3 receipt, Boolean kind1
  subtract, conical V1 receipt/coupled observation, owned solid V2, topology V1,
  mesh faces/inverted/tess, census V1 and integer classify/release/name count.
  Classifier0/1/2/3 maps IN/OUT/ON/UNKNOWN correctly. No absent cone export or
  source-binding identity port is assumed to exist in an old compiled pair.
* The exchange collector stores only one bounded string, parses AFTER Native
  return and restoration, rejects wrong count/size/JSON, and discards EVERY
  payload if invocation throws. Its descriptor/identity restoration check and
  current-heap scratch/F64 input readback happen before yielding. Clearing the
  old exchange scratch is intentional; no earlier payload authorizes success.
* Four monotone names are reserved once, with32 lifetime names and100000
  cumulative triangles. Each attempt precedes dispatch; normal refusal may
  settle absence under the specified exclusive allocator/count contract, while
  unknown invocation never grants release authority. Positive results require
  normal call+count+same-name reads, conditional on actual private exclusivity.
* Release is one acknowledged exact-name call with catalog/metric fences and
  census−1. Unknown/releasing outcomes are not retried. Existing shared charge
  retains all actual intermediate work. Its resource refusal is accepted only
  with the known callback policy, exact unchanged work and census−1; no refund
  or second authoritative budget. Final success reconciles four charges and
  baseline+1; cleanup uncertainty takes precedence and retains operation cause.
* Geometry closes real small prism→first cut→frustum→final cut, actual role/
  ancestry/coupled catalogs and finite trims already reviewed in079db909. Both
  measured removal increments must clear the explicit precision resolution;
  outer bounds, actual validity and metrics are independently read. The15
  classification points corroborate the finite facts, not replace them. No
  additional math contradiction found in this coordinator's points/cut sequence.
* Retained original input is not re-meshed. Actual C++ Boolean apply snapshots
  its original BRep/catalog/tolerances on success/failure and uses detached
  copies. JS source/metrics/catalog checks add custody fences without claiming
  a cross-call BRep or adversarial same-name IsEqual certificate.

## Explicit integration gaps, not silently repaired here

sourceCreationBinding only has a necessary immutable shape/digest-format check.
It is NOT yet issued by an actual constructor; names, nominal mass, source
profile, selection index or matching JSON cannot authenticate that binding.
Current old-profile maps cannot mint this context. Future constructor/ledger
input custody and the lexical Module/record/source/busy guard remain required.

The packet does not register a cohort/pair/operation, issue a ledger token,
activate typedANGLE, add shared J/PM/Open/exports or prove cancellation/cleanup
on a real runtime. A new actual compiled pair, exact closed graph and complete
public original-request/.cad/STEP/3MF/SVG whole/FIRST oracle remain pending.
Existing current candidate regressions do not execute these new conical ports.
