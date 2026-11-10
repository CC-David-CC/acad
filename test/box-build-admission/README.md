# Complete missing-cohort box-admission workflow

UNRUN source packet. Root is sole executor. This NEW packet preserves the complete original occ-boolean-public-workflow source/analytic cases and adds five public early-admission checks; original producing packets/evidence stay frozen. Read CONTRACT.md and ANALYTIC-CONTRACT.md.

1. Freeze/compose product + this full source; choose actual Core/Host/acceptance commits. On R730 run the NEW separate normal build recipe with a fresh absolute output worktree:
   bash test/box-build-admission/build-recipe.sh <FULL_CORE_COMMIT> <NEW_R730_BUILD_ROOT>
   It uses the reviewed full assembled build sequence/private node_modules/.cache and exact Native input directories, unsets ONLY CODI_BOOLEAN_HISTORY_NATIVE_DIR, runs normal complete build tasks, then freezes actual source/null-entry/full-dist custody. It does not mutate an existing build, copy an old dist, register a different pair or run Native geometry.

2. Fresh normal CAD+Files staging/pins, preserving all current source/runtime roles:
   bash test/box-build-admission/stage-recipe.sh <FULL_CORE_COMMIT> <FULL_HOST_COMMIT> <BUILD_ROOT> <NEW_HOST_WORKTREE> <NEW_STAGE_ROOT> <NEW_PINS_JSON>
   The pinned helper source comes from the existing reviewed pin fixture (PIN-FIXTURE-SOURCE.md). Normal staging enumerates all actual Core assets and exclusions. Custody streams every delivered Core byte against BOTH build and actual catalog metadata; no absent-cohort manifest is fabricated. Root uses the isolated fixture's ordinary server/CDP path, own disposable accounts/contexts only. No new network port/relay or Files race exercise is requested.

3. Run the complete signed driver once after Root reviews the actual build/stage/pins. Standard signed harness environment, each field exported before the Node command:

CODI_DESKTOP_SOURCE_ROOT=<actual frozen Host/helper checkout>
CODI_DRIVER_SOURCE_COMMIT=<exact acceptance source commit>
CODI_DESKTOP_HELPER_COMMIT=<exact helper source commit>
CODI_EXPECT_SOURCE=<actual built Core commit>
CODI_EXPECT_DESKTOP=<actual staged Host commit>
CODI_SIGNED_PINS=<actual NEW pins JSON>
CODI_ENGINE_REVISION=sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc
CODI_OMISSION_BUILD_CUSTODY=<BUILD_ROOT>/box-omission-build-custody.json
CODI_OMISSION_STAGE_CUSTODY=<STAGE_ROOT>/box-omission-stage-custody.json
CODI_TEST_URL=http://127.0.0.1:<own-fixture-port>/
CODI_TEST_CDP=http://127.0.0.1:<existing-CDP-port>
PUPPETEER_CORE_PATH=<existing pinned puppeteer-core24.35.0>
CODI_EVIDENCE=<NEW-exclusive-whole-directory>
node <acceptance-root>/test/box-build-admission/desktop-driver.mjs

The omission revision comes only from the actual bound build custody and is independently fixed to the registered Boolean-history singleton; it is not a public missing-asset flag. Successful part operations use ONLY explicitly selected real MFG32e/abb. Existing baseline/other histories are not converted. Source/helper Git objects must remain available to the independent reader.

4. Only after complete whole PASS: use the original same-OCCT separate STEP reader source/build custody and normal child-only reader-offline.cjs preload (unchanged source from the qualified extent reader; retained in this packet's source roster, Node24 does not accept the obsolete no-experimental-fetch flag); run-reader.mjs <WHOLE_DIR> <ACTUAL_REVIEWED_READER_BUILD_DIR> checks actual source SHA and input before/after. An already qualified reader with exactly identical read-step.cpp bytes may be reused with its frozen build inputs; do not infer from a path/name or rebuild a reader ad hoc without custody. Preserve first readback and first oracle outcomes.
   Then python3 <acceptance-root>/test/box-build-admission/check.py <WHOLE_DIR>.
   The independent original E16 checker is extended only by mandatory fixture-custody and exact five-case joins/next-ID checks. No original physical/format/tolerance/refusal criterion is relaxed.

This is a complete finite MFG/OCC whole, not runtime qualification of all baseline engines, broad manifold/precision competency, or proof of a missing cohort before actual build+whole execution. Baseline OCC/Manifold/SMLib admission remains preserved by product source; their existing full regressions can be grouped separately by Root. Build/source custody checks observe owned normal artifacts only, not filesystem races or other accounts.
