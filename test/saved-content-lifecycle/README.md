# Grouped saved-content lifecycle

Source only. Root supplies fresh exact CODI_RUNTIME_SOURCE_ROOT,
CODI_DESKTOP_SOURCE_ROOT, CODI_EXPECT_SOURCE, CODI_EXPECT_DESKTOP,
CODI_ACCEPTANCE_SOURCE, CODI_SIGNED_PINS, CODI_ENGINE_REVISION,
CODI_TEST_URL (owned loopback fixture), CODI_TEST_CDP, PUPPETEER_CORE_PATH
(reviewed24.35.0), CODI_EVIDENCE (NEW directory), then runs reviewed Node:

`node test/saved-content-lifecycle/desktop-driver.mjs`

Run from a separate clean acceptance checkout. Original Core/Host compiled
roots stay clean and unchanged. All source rosters bind actual Git blobs;
asset pins must come from the new complete staged candidate, not historic
metadata. Native codec Worker and its exactSavedContent source must be included
in the fresh source/build input custody.

Only after terminal whole PASS and retired owned contexts:

`python3 test/saved-content-lifecycle/run-artifact-oracle.py WHOLE NEW_AFTER VERIFIER_FULL_COMMIT`

See CONTRACT.md for measurable scope, explicit source-only obligations and
resource limits. Do not run this during implementation or convert missing
observation into PASS. No published source or live service is modified by it.
