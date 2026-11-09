# Conical Native foundation — exact source contract

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
