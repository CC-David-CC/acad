# Native Arc reconstruction and exchange

The explicit synthetic `fixture.json` is an editable native Arc on an independent
XY plane. It is a native-file seed, not public primitive-creation evidence.
`browser.cjs` uses the actual application loader, derived sketch reader,
NURBS implementation, production DXF Worker and native snapshot reopen.
No reader/solver/viewer is substituted.

The signed desktop lane found that a full Arc accepted by native validation
failed normal rebuilding with `Cannot read properties of null (reading 'u0')`.
Root reproduced that on r7; `before-r7.json` records app hash and failure.
The reader had treated this full circle as a zero-sweep partial Arc. It also
welded Arc endpoints within the generic vertex factory's 1e-3 tolerance, much
larger than the native Arc branch tolerance (strict coordinate differences
below1e-6). That could collapse a valid short partial Arc too.

The reader now classifies the full branch with the exact native predicate and
derives a Circle loop with the same authored identity. Native source stays Arc.
Partial Arcs retain raw coordinates instead of entering that vertex weld.
Root r8 then passed identical and near-positive/negative full circles but still
failed the strict-threshold partial case: Verb's ordinary Arc constructor
intersects nearly parallel endpoint tangent rays and dereferences a null result.
For sweeps up to1e-4 radians, the application now constructs the exact rational
quadratic from the angular bisector and cosine weight. This is circular geometry,
not a line approximation. Ordinary larger-arc conversion is unchanged.

Root actual r9 source `811c32d52`, private direct20500 and R730 build
`codi-worker-sketch-view-20261105-r9`, passes six cases: translated identical
endpoints, near-positive/negative endpoints, partial arcs exactly at/above the
strict tolerance, and an ordinary major arc. The test checks native objects,
full/partial contour/region counts, finite tessellation on the specified circle,
unwelded partial endpoints, actual DXF CIRCLE/ARC branch, unchanged live project,
and exact native source after reopen. `receipt-r9.json` holds observations.

App SHA256 `228751ccbf0a94a92cbdce615de769849113d23d903a184a8911686929701533`.
Both production Workers remain byte-identical to r7: sketch29ef SHA256
`3e1b41242e8f4a279d7598ab75675380d5cc124f925e2469a74d03e330debf91`,
project1c3d SHA256
`c0f6db34857b0b4bf1e211f79f90615a1052097c75afd2d2bbea7f38efa74cc8`.
The build reran both Worker configurations and the matched application config.

Run with Node24, `PUPPETEER_CORE_PATH` pointing to installed puppeteer-core,
`CODI_TEST_CDP` pointing at an existing loopback Chromium endpoint,
`JSKETCHER_TEST_URL` at the pinned application fixture, `CODI_APP_SHA256`
and `CODI_RECEIPT` set explicitly. `CODI_EXPECT_BEFORE=1` reproduces the r7
failure on the first fixture. Every test closes its own browser context only.

This does not prove signed My files persistence, all coordinate scales,
construction roles, profile Boolean/extrusion capability, every Arc entity pair,
or complete CAD1. The separate desktop signed lane covers actual Files/menu
integration; broader numerical/profile cases remain on the existing checklist.
