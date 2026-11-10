Source-only follow-up to frozen16e7f0e4, 2026-11-10. No parser/import,
helper test, Native, browser or build was executed. The original source
checkpoint remains backed on its original branch; this is a separate narrow
reader correction, not a reproduced application/kernel defect.

Timeline identified concrete false positives in the independent STEP reader.
A cylinder seam could be split through another on-circle point at intermediate
Z, using two secant LINE supports. Endpoint radii, finite sectors, closed IDs,
opposite edge uses and Euler2 would pass while the line interiors leave the
cylinder. A full cap CIRCLE could also use a slightly tilted axis: seam vertex
and Green area survive while the rest of the circle leaves the cap plane.
Side PLANE trims lacked checks against the actual face support altogether.

The reader now proves whole curve-to-face incidence. The frozen artifact
family is cardinal, translated analytic prisms; an uncertified tilted cylinder
axis explicitly refuses rather than being interpreted as cardinal. LINEs on
cylinders require exact dyadic axis parallelism, identical represented XY
endpoint positions and actual radius incidence of the entire generator
support as well as its endpoints. LINEs on planes require exact tangent
direction plus support-origin and every endpoint plane incidence. CIRCLEs
require exact support-plane parallelism and center plane incidence. On a
cylinder, the circle center-axis offset and radius mismatch share ONE existing
1e-6mm incidence allowance, proved by a squared dyadic inequality. No additive
second tolerance is granted. Circular end levels are checked against the
finite source ends; the existing source sector/period/orientation tests stay.

All new predicates use the original represented binary64 values as Fractions;
no coordinates, axes, trims, IDs or tolerances are rewritten. The old1e-6
binary64 allowance is preserved exactly via Q(1e-6), with no angle epsilon.
The complete original primitive-prism wire census is also explicit: each
cylinder has two actual end arcs and two generator uses (the same generator
twice only for the actual full periodic seam); source Segment walls have four
LINE uses; each cap has its complete original source-curve count. This rejects
spur/extra-revolution loops in the stated finite subset, rather than claiming
a general STEP importer. Other encodings may yield ORACLE_REFUSED.

Original LINE/CIRCLE support, same_sense, directed trim, half/full branch,
entity-ID closure, opposite use, face/source census, Green area, units and
Euler checks remain in force. The complete public whole, ten native cycles,
actual artifacts, original-index CGAL/mesh proof, source and durable custody
are unchanged. Root must independently review and execute the same complete
whole plus its FIRST artifact oracle; no positive runtime result is claimed.
