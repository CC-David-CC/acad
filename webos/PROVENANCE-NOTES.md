# Local runtime source and notice evidence

This is an evidence inventory, not a legal clearance or proof of complete
corresponding source. The preparer continues to mark the result local-only.
Its `dependency-notices.zip` inventories installed package metadata and
notices broadly, including build-only packages. `needs-review.json` flags
missing package notice files or metadata; a flag does not mean that a package
is definitely included in the emitted application.

For the f36062ba baseline build, 7 of the 70 flagged entries are heuristic main-bundle
npm candidates. The project validator's detected npm module IDs are a subset
of the main bundle's IDs. Development-webpack comments are a review aid, not
an authoritative dependency graph; vendored scripts, transformations, Wasm,
and modules omitted from those comments require separate review. The build
now refuses a detected worker-only npm module pending review. The combined
runtime also packages the headless sketch-solver worker, with the same
content-addressed reference and module-inventory checks as the validator.
Each worker has its own path/hash in the build receipt. This adds no blanket
source or license clearance for the engine or its dependencies.

| Exact candidate | Evidence and outstanding work |
| --- | --- |
| `regenerator-runtime` 0.10.5 | The embedded `runtime.js` is hash-pinned; separately supplied BSD license and PATENTS texts are included. Package metadata says MIT. Review exact distribution terms and the transformed dependency chain. |
| `clipper-lib` 6.2.1 | The embedded `clipper.js` is hash-pinned; its Boost license and upstream copyright header are included. |
| `component-emitter` 1.1.3 | Package ships its MIT LICENSE, Copyright 2014 Component contributors; metadata omits a license field. The emitter test checks its exact license and the bundled replacement. |
| `numeric` 1.2.6 | Four pinned source files reproduce the npm input hash. Numeric and quadprog licenses and a source archive are included; the numerical precompiler transforms the input. |
| `stream` 0.0.2 | The installed README contains the full MIT text and Copyright 2012 Julian Gruber; it is included in the source-candidate archive and notice inventory supplemental files. `index.js` matches upstream tag v0.0.2 commit `3faf89f7b8770fe41b41b6f0bb1e08bb9367fc9f`. |
| `timers` 0.1.1 | Historical source-candidate evidence retains this package and README. The current XML scheduling alias excludes its npm module from the runtime bundle; verify the final bundle and distributed source archive independently. Its metadata and README say MIT, but that upstream tag has no full MIT notice or copyright text; do not invent one. |
| `@icons/material` 0.2.4 | Its exact upstream tag is `47a3170f27d1c1061e69b1b68f7dfd8d4d7845f3`; it declares MIT but does not ship a full license or copyright notice. It generates icons from `mdi-svg ^2.2.43`. The two detected bundled components, CheckIcon and UnfoldMoreHorizontalIcon, contain path data matching installed SVGs; these SVGs match published `mdi-svg` 2.2.43 byte for byte. The exact published MDI MIT license, Copyright 2017 Austin Andrews, is included and hash-pinned. Obtain authoritative wrapper license/copyright and verify provenance of other material before release. |

`runtime-source-candidates.zip` is a deterministic archive of the exact
installed package contents for these seven candidates, with nested dependencies
excluded. For the large @icons/material package it includes only the two detected
components and SVGs, package metadata, README and generation script. npm uses the fork's pinned lockfile for installation. It contains the
installed generated icon components and SVGs, not the untransformed upstream
JSX project or a proof of how those files were generated. Source, rights, and
license obligations of all transitive inputs still need review.

The fork source archive corresponds to the pinned Git commit. OCCT interpreter,
OCCT, Manifold, Clipper2, and numeric source and notices are separately supplied
and described by the build receipts. The OCCT binary was built from the recorded
source recipe but has not been independently reproduced; no correspondence to
the npm binary is claimed. Author permissions for the jSketcher fork do not
establish rights for independent dependencies, including the interpreter's
separate license. No public distribution or deployment is authorized by this
inventory.

The bundled `stream` 0.0.2 entry and README match upstream tag v0.0.2 commit
`3faf89f7b8770fe41b41b6f0bb1e08bb9367fc9f`; its README includes the full MIT
notice and Julian Gruber copyright. The separately packaged exact README is
`STREAM-UPSTREAM-README.txt`. The historical source-candidate `timers` 0.1.1 entry and README match
upstream tag 0.1.1 commit `d400ce94b22686faf0b717259040e6b0615250e6`; its
README, supplied as `TIMERS-UPSTREAM-README.txt`, and package metadata say MIT,
but the tagged upstream tree supplies no full license grant or copyright
notice. The exact upstream contents are preserved, not supplemented with an
invented attribution; obtaining authoritative full notice remains open.
