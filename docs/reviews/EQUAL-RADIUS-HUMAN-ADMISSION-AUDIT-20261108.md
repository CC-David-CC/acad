# EqualRadius human-domain source audit

Source-only review of packet47e2da2 against original action at78a70d2; no
execution, tests, probes, builds or new qualification. Existing whole-flow
criteria/driver/oracle remain frozen. Root serially composes with Fixed/PL.

Two common-helper preconditions were narrower than the actual human producer:

1. **Destination stage.** `ParametricManager._add` (`sketcher/parametric.ts`)
   starts at `stages[0]` and raises the destination only when a referenced actual
   object belongs to a later stage. Thus two ground references (`index=-1`)
   still author their equation in stage0. The initial helper started at its
   first target stage and refused both-ground pairs. Corrected to the actual PM
   floor. Actual ground Circle/Arc objects come from `IO.createBoundaryObjects`
   / BoundaryGenerator; the ground layer is included in `Viewer.traverse`.
   Equal finite ground radii can be a real redundant equation; unequal fixed
   radii still face the genuine solver/domain rejection. No ground permission
   is added to the CLOSED API.
2. **Recovery versus final domain.** A positive-radius precondition in the
   common helper ran BEFORE the human transaction's real solve. The actual
   producer previously submitted fresh rows then performed admission/recovery;
   post-solve domain policy exists in registeredConstraintPolicy/AlgNumSystem
   and headless original-equation validation. Common preparation now requires
   real finite radius Params, without preemptively forbidding a finite
   degenerate initial state that a genuine solve may repair. After the real
   solve, the callback explicitly requires the existing registered EqualRadius
   circular domain (both final radii>1e−9mm), with exact invalid-domain cause on
   refusal. It does not admit invalid final geometry to preserve bad behavior,
   lower the circular minimum, add tolerance, or call a failed solve a proof.

The closed path remains deliberately narrower and separate:

| Policy | Common/human | CLOSED source command |
| --- | --- | --- |
| Circle/Arc membership | Actual visible model selections; real stage/Params | Same plus exact current root/index and bounded discovered IDs |
| Ground targets | Actual PM stage0 placement; genuine final admission | Refused |
| Prior-stage generated targets | No new generator/root prohibition | Refused |
| Same-stage generated target | Actual PM._add refusal remains authoritative | Refused before mutation |
| Finite degenerate initial radius | Actual solve/recovery first; final domain must hold | Original accepted source/cold proof and positive radius required |
| Repeated selected pair | Fresh row and actual solve, as original human action | Symmetric source/J-preserving semantic no-op |
| N-selection | Fresh consecutive pairs in ONE addConstraintGroup transaction | Public two-target operation only |

`prepareNewEqualRadius` keeps all human rows fresh rather than using the closed
existing-row shortcut. `addConstraintGroup` still owns checkpoint/rollback,
actual stage solve, existing rejected-row preservation and atomic batch failure.
The shared validation rejects a newly conflicting member or a newly rejected
retained row; it permits an already-rejected retained row as the original helper
already did. No common stage.objects.has(root), generator/isGenerated or ID256
closed gate is applied to the human action. Circle/Arc constructors/copy/read
allocate distinct real radius Params; rejecting aliases/invalid identities is
not a known excluded genuine constructor domain. No synthetic state is claimed
as a Native success or observed runtime incident by this source audit.

Scope: coherent human admission correction only. Existing closed create/remove,
unchanged-original two-Worker proofs, typed travel, fixture and archive oracles
are unchanged. Broader consumed typed Circle / ordinary Arc profile integration
remains explicitly open, not repaired by these admission changes.


## Closed discovery/consumer alignment — source review only

Independent review after4ded782 found a source-confirmed eligibility mismatch,
not a reproduced runtime incident. discoverEqualRadiusRows offered canRemove
for any admitted source Circle/Arc pair with valid stage/constants, including
roots listed in an original stage generator's generatedObjects. The actual
changeEqualRadius removal independently restores Native ownership and rejects
o.generator/o.isGenerated. A valid carried later-stage relation referring to an
earlier generated root could therefore be offered an operation it cannot use.

Closed discovery now derives an ephemeral generated-root Set from the same
original, independently validated stage generator output records and withholds
the locator/removal capability for those actual roots, with a precise reason.
SketchGenerator.read uses those exact output references to install the native
generator owner. This is the source-backed correspondence; it does not infer
ownership from opaque IDs, coordinates or a new saved trust flag. Source/replay
preflight remains authoritative and unchanged; malformed generator inventories
are not silently treated as ordinary roots. Both discovery and locator
resolution use this derived closed eligibility. The removal transition keeps
its independent actual Native ownership checks.

No human action/admission/domain code, schema equations, source cache, stage
order, carry policy, solver, native IO or existing complete driver/oracle is
changed by this follow-up. Nongenerated roots retain the prior discovery rule.
Existing carried generated relations remain inspectable as rows with their
original source/identities and an explicit unsupported closed removal reason;
this does not turn valid carry into invalid geometry or expand mutation power.

Qualification remains pending: root must run the frozen complete ordinary
EqualRadius application workflow after coherent composition. The specific
generated-carry boundary also needs a real admitted earlier-generated/later-row
native model authored through existing model actions, then normal inspection,
Save/Open and preserved-source checks. No synthetic successful source, edited
test fixture, microtest, build, probe or browser result supplies that evidence.
