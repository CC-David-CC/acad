# Exact normal graph regeneration after C07

Source-only review: no build, test, stager or browser was executed here. Root supplies the exact desired40-hex source commit; the intended candidate when prepared was `32ae9c8` (do not silently substitute a newer head). The existing external recipe is `/mnt/data10tb/codi-acad-full-app-build-20261108.sh`; its build checkout is `/mnt/data10tb/codi-acad-build-20261107-r2`.

The new dependency is `occ-*-mount.mjs → worker-controller.mjs → selectedProfileBudget.mjs → ../solid/authoredHistoryState.mjs`. Every modern constructor's recursive source snapshot therefore changes, even if its embedded Worker/Native bytes do not. All ten modern component manifests need regeneration. Optional wrappers deliberately compare an independently fresh complete stage with old sources/files and refuse stale reuse: preserve those checks. Do not edit old component.json, copy one dependency into an old manifest, or repin the unchanged bootstrap.

## Exact commands for root (not executed)

Retain the existing wrapper's exact commit and clean tracked-source checks, qualified Node24 PATH and all11 CODI_*_NATIVE_DIR exports. Their inputs remain `.build/arrangement-native-inputs/{selected-profile,polygon-profile,mechanical-profile,boolean-history,revolve-profile,sweep-profile,loft-profile,adaptive-metrology,step-export,manufacturing-mesh,shell}`. No Native code/dependency/account copy is needed.

After exact checkout and exports, before the ordinary build, use a fresh task-owned backup label:

```sh
acad_root=/mnt/data10tb/codi-acad-build-20261107-r2
cd "$acad_root"
# ROOT_EXPECTED_COMMIT is the exact40-hex desired source supplied by root.
[[ "$(git rev-parse HEAD)" == "$ROOT_EXPECTED_COMMIT" ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
[[ "$(sha256sum modules/engine/mount/oci-verified-worker.js | cut -d' ' -f1)" == 44fbc4522d3dc9c5219b3908f53fcbda5c180d2e361d18bd31c5876d3c78b48e ]]
acad_backup="$acad_root/.build/native-graph-backups/ROOT_FRESH_LABEL"
[[ ! -e "$acad_backup" && ! -L "$acad_backup" ]]
mkdir -p -- "$acad_backup"
for acad_name in polygon-profile-assets mechanical-profile-assets boolean-history-assets revolve-profile-assets sweep-profile-assets loft-profile-assets adaptive-metrology-assets step-export-assets manufacturing-mesh-assets shell-assets; do
  if [[ -e ".build/$acad_name" || -L ".build/$acad_name" ]]; then
    mv -- ".build/$acad_name" "$acad_backup/$acad_name"
  fi
done
npm run build:physical-parameters-worker
npm run build:sketch-worker
npm run build:project-worker
npm run build:native-archive-worker
npm run build:manufacturing-hash-worker
npm run build:controlled-3mf-worker
npm run build:prism-workers
node node_modules/webpack/bin/webpack.js --config test/polygon-profile-app-history/webpack.app.cjs
node node_modules/grunt-cli/bin/grunt copy:resources copy:lib_assets mark-revision
```

Run under `set -euo pipefail`, as the existing wrapper does. `ROOT_EXPECTED_COMMIT` and `ROOT_FRESH_LABEL` must be concrete root-selected values, not literal placeholders. The move list is exclusively named generated build code; `.build/arrangement-native-inputs`, node_modules caches, compiled old runtime/packages, accounts/issuer/keys and services stay untouched. Moves preserve old outputs and do not mutate symlink targets. Never delete all of `.build` or replace Native inputs to make a check pass. A failed stage stops before main build; previous output is retained in the backup, with no live deployment/rollback implied.

## Normal chain and concrete wrapper omission

`package.json::build:prism-workers` already runs, in order: selected V2 worker; default flat prism/Manifold assets; prism semantic Worker; raw SMLib Worker; polygon; mechanical; Boolean history; revolve; sweep; loft; adaptive metrology; STEP; manufacturing; shell. It recreates each stage/entry with existing pinned Native pair validation, exact source manifests, resource closure validation and generated file hashing. Default prism staging replaces only its own generated directory; selected V2 overwrites its own generated inputs. No manual flat-rewrite or emitter-list edit is required for this C07 import.

The existing external wrapper currently builds only physical/sketch/project/native-archive Workers before direct main webpack/Grunt copy. It omits manufacturing-hash/publication, controlled3MF and prism-workers. Direct webpack and Grunt copying do NOT create those missing `.build` aliases. Add the three omitted normal tasks; do not assume retained aliases are current.

| Modern stage | Normal task /configured input |
| --- | --- |
| polygon-profile-assets | build:polygon-profile-worker /CODI_POLYGON_NATIVE_DIR |
| mechanical-profile-assets | build:mechanical-profile-worker /CODI_MECHANICAL_NATIVE_DIR |
| boolean-history-assets | build:boolean-history-worker /CODI_BOOLEAN_HISTORY_NATIVE_DIR |
| revolve-profile-assets | build:revolve-profile /CODI_REVOLVE_NATIVE_DIR |
| sweep-profile-assets | build:sweep-profile /CODI_SWEEP_NATIVE_DIR |
| loft-profile-assets | build:loft-profile /CODI_LOFT_NATIVE_DIR |
| adaptive-metrology-assets | build:adaptive-metrology /CODI_ADAPTIVE_METROLOGY_NATIVE_DIR |
| step-export-assets | build:step-export /CODI_STEP_NATIVE_DIR |
| manufacturing-mesh-assets | build:manufacturing-mesh /CODI_MANUFACTURING_MESH_NATIVE_DIR |
| shell-assets | build:shell /CODI_SHELL_NATIVE_DIR |

`stage-owned-profile-component.cjs` recursively snapshots constructor/controller imports. Verbatim dynamic Worker resources are a different closure; `authoredHistoryState` is currently needed by the application's bundled controller/budget, not a new dynamic planner-resource import. The normal resource-closure assertion must still pass on all real emitted modules. Do not invent a capability or extra runtime module route.

## Qualification still required

Root must retain actual producing source/recipe logs and complete staged/emitted package pins. Fresh component manifests must include current authoredHistoryState source and canonical bootstrap44fbc..., with each existing Native pair unchanged. Normal whole-package verification and complete Gate1 public workflows remain mandatory. This document is a source recipe, not an executed build/asset/runtime PASS. No defaults, Native ABI, stale guards or product capabilities change.

## Root-selected producing run (reported, not validated by this lane)

Root selected exact source `32ae9c8a10659e43a3c5a5f4f51602b8aad64161` and reported normal build start using `/mnt/data10tb/codi-acad-composed-app-build-20261108-r1.sh`, a copy of the existing wrapper plus the ten-directory retention and three omitted normal targets above. Its retained output path is `.build/native-graphs-before-gate1-composed-20261108-r1`; its build log is `.build/gate1-composed-32ae9c8-build.log`. Root owns session15486 and its terminal evidence. These paths are provenance/resume information, not a PASS or permission for this lane to start/stop/restart the build.
