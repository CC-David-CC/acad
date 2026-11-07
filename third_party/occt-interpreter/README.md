# OCCT interpreter source and notices

The source-built candidate comes from the unchanged Autodrop3d/occt-interpreter
commit `5efaf53accb45bac475155fc4d5552642c19e91e`, tree
`f820351dd52207a3ad757bdeaf5510f7b4ae01fc`. Its exact source archive is backed
up on R730 as described in `docs/occt-source-rebuild-20261102/RESULTS.md`
(SHA-256 `86ccaa4d1974b15a1ee8a26e69db20e7c04f5000ffd4924008cebcd1a82fb9e4`).
This source archive must be made available to recipients along with the notices
when distributing the binary; an R730-only backup is not a public source offer.

The three files in this directory reproduce the upstream wrapper's root
license, the OCCT LGPL 2.1 text and the OCCT exception. The root license
requires its notices in copies and sets conditions on modifications to its
covered software. A jSketcher modification does not by itself establish that
the separately sourced wrapper was modified. The recorded build used unchanged
wrapper and OCCT source, with external path mapping and compilation settings;
see the build receipt for details. Do not omit the root notice supplied here.

The recorded link inputs include the wrapper's `shape-io/main.cpp`, its local
headers, `scripts/call.js`, Emscripten runtime/toolchain components, and OCCT
static archives TKTopTest, TKBool, TKBO, TKBRep, TKernel, TKFeat, TKFillet,
TKG2d, TKG3d, TKGeomAlgo, TKGeomBase, TKHLR, TKMath, TKMesh, TKOffset, TKPrim,
TKShHealing, TKTopAlgo, TKXSBase, TKSTEPBase, TKSTEPAttr, TKSTEP209 and TKSTEP.
This list comes from the link command, not a complete symbol-level dependency
or notice audit. The build disabled TBB, Tcl and FreeType. Other toolchain and
runtime component notices and correspondence must still be audited before
claiming the distribution notice set is complete. Avoid describing this note
or a browser smoke test as a legal or engineering certification.
