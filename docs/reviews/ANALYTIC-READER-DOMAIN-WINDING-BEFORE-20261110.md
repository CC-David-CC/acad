# Analytic artifact reader expected-domain winding

Source-only finding; no reader, parser, test, CGAL, Native or browser run.
The original R4 whole and FIRST refusal remain unchanged.

Inputs: clean Root 381fde6b628e87678f240474cc6bdd05bc396971, containing the
separate expected-rational repair; actual R4 FIRST verifier
27c163111a759d07060efc87a9dd7cbdd8732356. The frozen mesh reader is blob
94612a2ff0ca959635d4df5cb99d70435ed6c01c (SHA256
3f677d60e2bf1341d433fa6c358e93c10daa979d285dc8ec61187bebe0657b51).

`mesh_oracle.py` source-rectangle calls at lines 109 and 113 construct the
same counterclockwise corner order for either independently derived sign.
The actual CGAL `planar_coverage.cpp` domain loop requires the original outer
loop orientation to equal `r.sign` before temporary normalization. A negative
sign therefore necessarily yields `DOMAIN_ORIGINAL_ORIENTATION`; it does not
indicate an invalid exported mesh.

The correction must orient only the independent expected rectangle loop using
the already source-derived sign. Actual triangles, vertex IDs, selected IDs,
cap boundary loops, and all CGAL orientation/nonoverlap/set checks stay intact.
No fitted domain, triangle reversal, welding, tolerance change or fallback.

| Finite family | Source rectangles with negative sign | Positive rectangles |
| --- | --- | --- |
| Semicircle | upper half-cylinder wall | chord side |
| Slot, declared +X axis | top side; left half-cylinder wall | bottom side; right half-cylinder wall |
| Full Arc | none: separate full-cylinder certificate | none |
| Notch | side 2; side 3; side 4; inward half-cylinder wall | side 0; side 1 |

Across the required baseline/edited/final semicircle and Slot meshes, three
full meshes and final notch mesh this is 13 negatively oriented and 11
positively oriented source rectangles. Every expected-domain call is covered:
indexed bottom/top caps already use their actual original edge-use winding;
full cylinders use the independent annular certificate. No other planar caller
exists in this reader.

The bounded STEP/source/custody pass found no additional confirmed blocker.
Actual `semicircle-baseline.step` was read as text only. An eventual mismatch
between an actual half-wall chart and the ideal source rectangle still refuses;
this repair supplies no authority to fit or heal that mismatch. Artifact
qualification remains pending a coherent Root-owned after-whole invocation.
