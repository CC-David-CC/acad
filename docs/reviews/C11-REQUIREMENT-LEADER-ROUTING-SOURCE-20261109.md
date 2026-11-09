# C11 requirement leader routing source handoff

SOURCE ONLY, 2026-11-09. This follows BEFORE
`8a873501615962723fa5e56d8fdbd804ecdd51e2` on exact producing baseline
`82f9f01b7a6fbc5e2bfc25183a72da87a8e31e97`. Original R3 remains FAIL;
no parser, tests, build, Native or browser execution was performed here.

The sole product change is
`web/app/cad/export/linkedPartDrawingRequirementForms.mjs`, SHA256
`93a9d07961ee9511ff89a6225c32b50fd71f397f0028add4ab3eaa79e7b52f73`.
All requirement frames are reserved before routing. Each leader retains its
original path slot, genuine projected anchor, authored frame and old selected
side midpoint. Text, physical facts, labels, definitions, references and model
state are unchanged. Clear direct leaders retain their original two points and
attributes. Only obstructed leaders acquire derived intermediate paper points.

The private visibility graph uses corners immediately outside the stroke-expanded
declared rectangles, deterministic coordinate order and Dijkstra selection.
Binary64 distances rank routes only. Every node and segment is independently
checked using exact dyadic integer predicates against represented paper inputs:
sheet inset .125mm; other text/caption/form open rectangles expanded exactly
.125mm; own closed frame excluded until the final endpoint; final approach from
the original strict exterior side. Rectangle/segment tests use separating axes
and exact orientation. The final route is checked again before serialization.

New waypoint rounding is conservative outward rounding of paper obstacles,
never movement or rounding of source geometry, authored frame or anchor. The
graph is a finite supported routing domain, not a claim that every continuous
paper path is found. A missing graph route or exceeded bound explicitly refuses
RESOURCE_LIMIT before export submission; it does not hide or move a label.

Limits are128 total other/own rectangles,514 graph nodes,6 leaders,
8,000,000 charged work units shared by all leaders,1200-bit grid integers,
64 output vertices per leader and8192 path characters. Binary64 decomposition,
bounded sorting, arrays and intermediate products also have fixed bounds from
these inputs. Work units are an algorithmic resource guard, not a latency claim.

SVG grammar remains one M followed by explicit L commands. Routed leaders alone
add `stroke-linejoin="round"`; direct leaders retain old attributes. Round joins
bound bend ink within the .125-expanded segments. `strokeBounds` now contains
one actual segment box per leader segment, so the existing warning layout does
not treat the empty interior of a whole routed-path bounding box as ink. Frame
and cell boxes are unchanged. General geometry/leader crossings, leader/leader
crossings and professional typography remain separate open scope.

The helper stays private in the existing requirement-forms leaf, with no imports,
new module, caller flags, capability or Native dependency. Actual static closure
is `controlledMesh3mf.worker.mjs` -> `linkedPartDrawingSvg.mjs` -> this leaf.
The existing exporter catches RESOURCE_LIMIT and preserves the ordinary export
write-settlement path. This synchronous presentation change introduces no new
await or publication/currentness boundary.

The current complete C11 driver `product` roster and Python `PRODUCT` set already
include this exact leaf, caption/warning leaves and renderer. They must capture
the new producing Git object and before/after bytes at Root's final source
freeze. No transitive leaf is added. Prior frozen evidence and source snapshots
remain untouched; Root owns regenerated build pins and the actual coherent run.

Independent acceptance dependency is
`74d729586c088d0325b25b7ebd95d586d52728b3` (Root composed `046ca61`).
It checks actual endpoint membership, all segment/text/sheet inequalities,
own-frame prefix and final-side contact, direct retention, bounded grammar and
routed-only round joins without replaying the route search. Warning clearance
uses each actual leader segment box. All prior geometry, quantities, Native
facts, repair/travel, source, archive, refusal and write-custody criteria remain.
Whole/FIRST-oracle and real SVG review are still required; this source packet
does not qualify the repaired layout.
