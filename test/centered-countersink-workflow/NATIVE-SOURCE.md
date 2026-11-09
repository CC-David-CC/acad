# Conical Native foundation — exact source contract

## Current root checkpoint: early-failure source repaired; qualification open

All Native source below remains UNCOMPILED and UNQUALIFIED. Follow-up independent
source review of04ad4cd found CONICAL-EARLY-FAILURE-PUBLICATION-01: full capture
flags can bypass already-known name/frame or census/lookup post-error fences
when admission/snapshot fails early. Root confirmed the source and reviewed separate staged-capture repair
fc1654ee5d4471584073d4d8e3363d8c9b324566. Source blockers are repaired;
actual compilation and qualification remain open. Ordinary success-path
source fences do not close this related failure-path gap. No callback mutation
probe, public incident or runtime result is claimed. Old qualified binaries and
current Coree521860/Host843aee31a private fixture do not contain these new ports.
The later repair, independent review, actual compilation/pair/graph registration
and full shared workflow remain separate outstanding gates.


SOURCE ONLY, no compilation, tests, Native/browser calls or qualification.
This is the bounded dependency approved after `c2c8b21a`, not a countersink
feature implementation, public raw topology API or a replacement cohort.
Old binaries/pairs/defaults and frozen blind/counterbore packets stay unchanged.

## Producer baseline and ownership

New isolated Native worktree:
`/mnt/data10tb/codi-occ-owned-conical-source-20261109-r1`, branch
`feature/owned-conical-support-v1-20261109`, from exact
`c15e49dfbb5bb5fcf7b5c81e7c63724c81807ae0`. Its actual retained primary MFG
compile-input source is `0e429519e97a29e991ec4aa42b5ea6ddab24ddbb`, as recorded
by c15's `shape-io/owned-manufacturing-mesh-v1-probe/ffi-evidence-r1/runtime-pins.json`.
This ancestry links the source audit to real existing32e/abb producer evidence;
it does NOT claim the two new ports exist in32e/abb or qualify new output.

Retained source read: `BRepPrimAPI_MakeCone.hxx:47–100` supplies the actual
gp_Ax2/radii/height builder; `BRepPrim_OneAxis.hxx:163–171,241–245` exposes
LateralFace/BottomFace/TopFace/BottomEdge/TopEdge; `BRepPrim_Cone.cxx:191–205`
has real radius/separation/height domain checks and constructs the semiangle
from actual radii/height. `gp_Cone.hxx` preserves actual reference frame/radius
and signed semiangle; there is no need to calculate or serialize a far apex.
TKPrim is already an actual linked input of the retained normal build script.

Owned files: two new `shape-io/ownedConicalFrustumV1.hpp` and
`ownedConeTopologyV1.hpp`, `shape-io/main.cpp` include/export splices, and a
pure `owned_topology_v1::catalog(shape,const Maps&)` overload. The old
`catalog(shape)` delegates to that same unchanged serializer; V1 face fields,
cone analytic:null/support:unsupported, indices/order and existing C ports are
retained. The overload allows the joint read to use ONE actual map for V1 and
its supplement. No DBRep SDK change, new library/ABI dependency, main build,
catalog/default selection, Worker/controller/stager or PM/archive edit here.

## New private ports

```cpp
void CreateOwnedConicalFrustumV1(const char* resultName,
  const double* frame12, double bottomRadius, double topRadius, double height);
void ReadOwnedConeTopologyV1(const char* shapeName);
```

Synchronous `__OCI_EXCHANGE` JSON publication, like the retained owned ports;
no return-status integer, pointer, caller ordinal or shape object is public.
Names are nonempty ≤64-byte private owned names. The future Worker owns their
exact allocation/handle mapping and captures exactly one response AFTER the
Native function returns. Any missing/duplicate/malformed response is terminal.
No flags supplied through public JSON can authorize the ports.

Constructor input frame is `[originXYZ,xXYZ,yXYZ,zXYZ]`, finite coordinates
within the retained4e6 domain; basis uses the same dimensionless1e-12 unit,
orthogonality and right-handed capture policy as selectedProfileV2. Radii/height
are positive ≤1e6, strictly bottomRadius<topRadius. This port is a full ordinary
frustum, not an apex, decreasing cone, partial sector or zero-angle cylinder.
Actual OCCT domain refusals remain real; no minimum reduction/clipping/snap.
Frame/request/name bytes are captured and preserved; value bindings use full
precision. Native construction uses `BRepPrimAPI_MakeCone(gp_Ax2,... )` and real
builder roles, not analytic copies, revolution heuristics, mesh or shape search.

Success is existing actual selected-profile metrics (`version:1,valid:true,
solidCount,nativeVolume,nativeBounds`) plus exactly `constructionProvenance`:

```js
{version:1,scope:'response-local',persistentIds:false,
 source:'BRepPrimAPI_MakeCone',
 request:{frame:[/*12 original doubles*/],bottomRadius,topRadius,height},
 resultCounts:{vertices,edges,faces},
 faces:{wall,bottomCap,topCap},edges:{bottomRim,topRim}}
```

Every role is the actual builder-returned entity resolved with IsSame into
the SAME result catalog. All roles must be distinct where appropriate, actual
cap/rim/wall support and membership must agree, and the actual result must be
one valid positive solid. Counts and metrics come from that result. The whole
constructor receipt is ≤4KiB. Only the fresh final name may be inserted. An
unconfirmed exact-name rollback/count is fatal `ENGINE_CLEANUP_FAILED`; do not
release an unidentified name. No prior shape is passed to this constructor:
it never reads/mutates one, only checks/inserts/releases its exact fresh name
and checks the map census. The SDK deliberately has no public all-name iterator;
this is not described as an all-shape runtime snapshot. The future two-cut
coordinator still captures/checks its actual parent/source around invocation.

Coupled read success has exact outer keys:

```js
{version:1,scope:'response-local',persistentIds:false,
 topology: /* unchanged actual V1 catalog from the same shape/maps */,
 coneFaces:[{face,origin:[x,y,z],axis:[x,y,z],x:[x,y,z],y:[x,y,z],
             referenceRadius,semiAngle,direct}]}
```

One row for EVERY actual GeomAbs_Cone in ascending actual face-index order;
zero actual cones means an honest empty list. Each gp_Cone comes directly from
BRepAdaptor_Surface::Cone, with actual reference-plane origin, axis/x/y basis,
nonnegative reference radius, SIGNED semiangle, and actual Ax3 direct/indirect
handedness. Face orientation stays in the original V1 catalog and is not
multiplied into these support values. No apex or normalized synthetic cone.
Supplement indices are response-local only; no persisted/public Native IDs.

Bounds stay1024vertices/512edges/256faces/4096wires+uses, and **one512KiB
aggregate output including the supplement**, not512KiB plus more. The read
allocates no owned name. Its actual owned input is checked before/after using
the retained8MiB bounded BRep/catalog/tolerance snapshot and exact name/shape/
census binding on success AND failure. Resource/input uncertainty never returns
a successful observation. No separate/fitted display geometry is authority.

Failures are exactly `{version:1,error:<closed code>}`. Proposed closed codes:
`CONICAL_INVALID_REQUEST`, `CONICAL_UNSUPPORTED_DOMAIN`, `CONICAL_INVALID_SHAPE`,
`CONICAL_CONSTRUCTION_FAILED`, `CONICAL_PROVENANCE_UNRESOLVED`,
`CONICAL_RESOURCE_LIMIT`, `CONICAL_INPUT_CHANGED`, `CONICAL_INSPECTION_FAILED`,
`CONICAL_PUBLICATION_FAILED`,
`MEASUREMENT_PRECISION_UNRESOLVED`, `ENGINE_CLEANUP_FAILED`.
Only the actual constructor's known Standard_DomainError maps to the domain
code; unknown inspection/ownership/allocation failures are never relabeled as
recoverable geometry success. Cleanup uncertainty and input preservation take
precedence while retaining the original failure internally. No raw exception,
Native shape/name/pointer or unbounded error payload is serialized.

## Future wrapper/application dependencies (not implemented here)

Root must compile a NEW explicit pair, pin Native source/SDK/libraries/archive/
loader adaptation, and bind exact factory/catalog/closed Worker graph and all
changed bootstrap pins before advertising conical capability.32e/abb and old
cohorts must retain old guards and must NOT load this new capability by alias.
The private Worker must validate exact schemas, actual V1/cone membership,
request/role/current ownership, aggregate bytes and finite values, then retain
Native indices only in its same-evaluation ledger. No raw name/handle/ordinal
gets a public command or persistence field. New numerical qualification bounds
stay explicit and separately reviewed, not borrowed from display tolerances.

The application countersink remains one semantic fifteen-field feature and J
entry. Reuse the actual counterbore two-cut custody discipline: small circular
tool→first cut, exact new frustum→final cut; charge four genuine results,
propagate actual A ancestry twice, retire only owned scratch, preserve all prior
losses, and prove final unique shortened cylinder/cone and shared actual rims.
An annular counterbore shoulder is not a cone proof; final cone top rim at actual
entry is not the tool's overrun top rim. Genuine typed ANGLE needs a shared
field-role lookup (`includedAngleRadians:angle`, diameters:length), not the
current length-only physical-field resolver or a second expression evaluator.
Counterbore acceptance and its owner are untouched; no angle/product splice
is included in this Native foundation packet.

Future complete qualification retains all `c2c8b21a` public creation/edit/
refusal/typed/travel/.cad/export criteria plus a genuine Native component whole
for role/coupled-read completeness, preservation/rollback/resource refusals,
healthy continuation and retained old ports on the NEW pair. No success,
publication, whole result, latency or memory claim accompanies source freezing.

## Frozen Native source handoff

Implemented source checkpoint (UNCOMPILED/UNQUALIFIED):
`c181811c9e9dd20985875386555659f7ad81de44`, exact parentc15 above, branch
`feature/owned-conical-support-v1-20261109` in the authorized Native repository.
Five source files changed: the two headers, two narrow existing-file splices and
`shape-io/CONICAL-SOURCE-V1-20261109.md` (the pre-code contract77d97b copy).
No SDK source/header, library, build script or binary was changed.

| Actual Native source file | SHA256 |
| --- | --- |
| ownedConeTopologyV1.hpp | a2162da34f568e993b24ba791e447394a3990bc80bff93ae3af97a0b5b8d8ab5 |
| ownedConicalFrustumV1.hpp | af1635ad03852967dbaa6451187f4a3fed4025302bcd2158c034d8131ef9a7d1 |
| ownedTopologyV1.hpp | 6c4ea61ec8b9890bf20c713bdb058701ff2928bd6f76ff397d9179cff419943f |
| main.cpp | 011f7ee18326b0eb06c946e90a4b9ef9f92a9c57821c847dd878fb91b72dc564 |

The constructor enforces one remaining slot inside32 current owned names and
only its own one final allocation; the future semantic operation still charges
four actual results in the one existing cumulative work/triangle budget. Dot
(`.`) is rejected as the SDK's special selection token; no name grammar/public
selector is introduced. All constructor faces must be the distinct actual three
builder roles and both actual rim edges belong to the corresponding wall/cap;
counts remain actual map counts. Actual solid mass/bounds come from the retained
Native measurement implementation, never a nominal frustum formula.

Both read and constructor emit only the frozen closed fields/codes. Actual
reference origin/x/y/axis, radius, signed semiangle and handedness are read from
gp_Cone without apex inference. Read never allocates an owned result; named-input
snapshot/census is checked after a captured read even when observation fails.
Fresh construction does not touch any prior BRep; future wrapper snapshots of
its real source/parent remain REQUIRED (root confirmed that boundary). Initial
snapshot/resource inability is not a successful preservation certificate.

R730 source was relayed to example.invalid through an incremental bundle fromc15, using
only configured trusted local aliases; no host-key bypass/new trust or Native
clone/object insertion into ACAD. Bundle SHA256 matched R730/local/box copies:
`3b49e36147abe66afe372aada686582b50539f1b67877254cbacef1cc1085e28`.
Both Native refs read backc181. The old qualified worktrees/builds were untouched.
No compiler, test/probe, Native function, browser, mesh or successful artifact was
executed/created. Root alone owns compilation and future actual qualification.

## Post-publication custody repair (source only)

Independent source review62b301 found that the new ports' previous final call to
the shared publisher could invoke returning/throwing JS after the last input
fence. No public incident was established. Native follow-up
`04ad4cd070a3b42137a9c67cd53280a91ec0c7df` starts at the frozen complete
mechanical sourcec29 and is backed on BOTH Native LANs under
`fix/conical-publication-fences-20261109`. The originalc181/c29 branches remain.

Only the two conical headers, their two NEW void main.cpp export wrappers and
the two Native source notes change. Old ports/shared `selected_profile_v2::publish`,
same-Maps overload, Shell/Box/circular code, numerical domains, wire success
schemas, old pairs/defaults/SDK/libraries/build scripts are unchanged. A private
caught `EM_ASM_INT` publisher acknowledges actual synchronous receiver return.
The new closed error is `CONICAL_PUBLICATION_FAILED`; arbitrary receiver text is
never serialized.

Before accepting constructor success, AFTER that receiver returns, require exact
captured name/frame bytes, baseline+1 owned count, same actual named result and
unchanged bounded result BRep/catalog/tolerances. Read success similarly requires
the original name, census, exact named input and complete snapshot after the
callback, not only beforehand. The same8MiB snapshot limit applies; at most one
retained and one temporary snapshot coexist. Comparisons check current heap
ranges and the exact captured name terminator. Scalar dimensions remain values.

On a failed fence or thrown receiver, constructor rollback attempts release ONLY
its exact original allocation still under the exact owned name; missing/replaced
identity, failed release or unreconciled census is terminal cleanup uncertainty.
It never releases a replacement, retries cleanup or claims caller input changes
were undone. Read never modifies/restores/removes its input. Neither port claims
all unrelated named shapes were snapshotted; future semantic Worker parent/source
preservation remains required.

Error publication is caught and fenced too. If it cannot be acknowledged or the
post-error integrity fence fails, the private C++ function returns a static
terminal-code pointer. Its TopoDS/snapshot/exception locals destruct before the
thin void export throws a bounded JS Error with that code. Uncertain constructor
cleanup takes priority, then input preservation, otherwise publication failure.
The original failure is held privately through cleanup/error reporting, not
converted to arbitrary public text. The external C signatures remain void.

The future Worker MUST treat a thrown invocation as terminal regardless of any
positive payload already received, discard all responses and retire/latch the
evaluation's actual ownership failure. Missing, duplicate or malformed exchange
also refuses; success is provisional until Native returns normally and all
fences pass. A callback may store a positive payload and then throw, so silently
returning from a failed error receiver would not suffice. No wrapper is claimed
implemented here.

| Repaired Native file | SHA256 |
| --- | --- |
| ownedConeTopologyV1.hpp | d6414f7785bd4d734a8bb6a1944612d64900d001a21afa7973a6817a29388f0b |
| ownedConicalFrustumV1.hpp | a2082b2d26a774efc703e8b0e18128a1f10dd055b09568943d7125206413e038 |
| main.cpp | 64e26dd2e00c9241d02cfdf6d5234f7bd365f5be1c3b0854e2fe6f4f11794ca3 |

Incremental bundlec29→04ad SHA256:
`aaf1baad646564cc9a803f64ba33c0ef22032ff47be997ea865c9b3e705c01ec`,
matched R730/local/box and both Native refs read back04ad. No compiler, parser,
test/probe, callback mutation, Native function or browser execution occurred.
This fixes the reviewed source boundary; it is not runtime qualification.
