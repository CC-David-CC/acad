# Fresh ACAD checkout build requirements

The first clean ACAD build exposed two dependencies on the previous worktree's
layout. These are build findings, not geometry qualification.

1. Raw NVIDIA glue used a symlinked cache path that did not match Webpack's
   resolved resource identity. The required browser loader was skipped; the
   retained exact worker-output hash correctly rejected the resulting bundle.
   ACAD62019cc canonicalizes the verified input path before alias/loader matching.
   Input/native/output hashes remain unchanged.
2. The main graph requires the retained selected-profile cohort, but the normal
   `build:prism-workers` chain never generated its assets. An old worktree had
   leftover outputs and hid that omission. The chain now explicitly invokes
   `build:selected-profile-worker` with `CODI_SELECTED_NATIVE_DIR`, using existing
   strict source/native pins. Fresh builds produce those assets from source.

Current qualified Native inputs on R730 are external build inputs, not tracked
outputs or dependency directories:

| Environment variable | R730 directory |
|---|---|
| CODI_SELECTED_NATIVE_DIR | /mnt/data10tb/codi-occ-selected-profile-build-20261106 |
| CODI_POLYGON_NATIVE_DIR | /mnt/data10tb/codi-occ-gate1-build-20261106-r2 |
| CODI_MECHANICAL_NATIVE_DIR | /mnt/data10tb/codi-occ-edge-treatment-main-20261106-r1 |
| CODI_BOOLEAN_HISTORY_NATIVE_DIR | /mnt/data10tb/codi-occ-boolean-history-main-20261106-r1 |
| CODI_REVOLVE_NATIVE_DIR | /mnt/data10tb/codi-occ-owned-revolve-main-20261106-r2 |
| CODI_SWEEP_NATIVE_DIR | /mnt/data10tb/codi-occ-owned-sweep-main-20261107-r1 |
| CODI_LOFT_NATIVE_DIR | /mnt/data10tb/codi-occ-owned-loft-main-20261107-r4 |
| CODI_ADAPTIVE_METROLOGY_NATIVE_DIR | /mnt/data10tb/codi-root-adaptive-native-input-20261107-r1 |
| CODI_STEP_NATIVE_DIR | /mnt/data10tb/codi-root-step-native-input-20261107-r1 |
| CODI_MANUFACTURING_MESH_NATIVE_DIR | /mnt/data10tb/codi-root-manufacturing-native-input-20261107-r1 |
| CODI_SHELL_NATIVE_DIR | /mnt/data10tb/codi-occ-owned-shell-main-20261107-r2 |

Every preparation script verifies its recorded Native hashes. The selected
cohort is JS cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9,
WASM a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637.
Shared package/native caches may be symlinked outside Git; they are not CAD
source or permission to use different artifacts. First failed logs remain in
R730 `/mnt/data10tb/codi-acad-build-20261107-r1/.build/`.

Use Node24 and the complete normal physical/sketch/project/hash/3MF/prism Worker
build chain before compiling the application graph. Workers are separate build
products. A successful compilation is only the prerequisite for actual complete
browser/model/file/export workflows. JSketcher rollback remains gated on those
workflows; no public deployment follows from a build.
