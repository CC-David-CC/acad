# Expected planar-domain winding repair

Based on clean 381fde6b628e87678f240474cc6bdd05bc396971 plus the separately
committed BEFORE finding a63abc95. Only the analytic mesh reader changes.

A private source_rectangle helper retains the independently constructed
rectangle coordinates and orders them using the source-derived orientation.
Positive domains retain their original order; negative domains reverse only
the expected corner sequence. Both source-rectangle callsites use this helper.
The two indexed cap calls and the separate full-cylinder certificate are
unchanged. The BEFORE table enumerates every affected family (13 negative,
11 positive rectangle calls in the required ten exported meshes).

The selected original triangles and their orientation are still independently
checked by CGAL against the same sign. Original indexed geometry, source
parameters, boundary incidence, exact set coverage, global embeddedness,
support/distance predicates, limits and all refusal behavior are unchanged.
The existing mesh source file is already in the actual verifier and producer
rosters; no new imported helper or runtime source is introduced.

Manual source/diff review only. No Python import/parser, checker, test, CGAL,
Native, build or browser execution. R4 whole/FIRST files remain untouched.
This is source-ready; actual artifact judgment remains Root-owned and pending.
