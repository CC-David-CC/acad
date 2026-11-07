# Independent fixed-core qualification

Source `c9f1d103976a815cef12a0eeb371b61e2442ca85`, parent 10489; immutable fixture `http://127.0.0.1:20584/static/index.html`, test Worker SHA256 `de90850d961327b206f311460bc3a221091289490e38968cc0df3e27bf985028`, verb SHA256 `55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3`. Both asset pins were verified before dispatch. Baseline negative evidence remains commit `0f5cf50ec444bc8cb9715da9da1d9e69bae057e6` and the parent review directory; no baseline receipt was overwritten.

Actual Chromium 155/CDP 19329 target `EB995F9AD324045E98E9533818DE6A70` completed **18/18** owned test Workers, all terminated, no CSP violations. Same-origin strict script/Worker CSP has no unsafe-eval/Blob Worker. The owned browser context closed. `browser-receipt.json` records outcomes and output hashes.

| Prior finding or retained behavior | Independent result |
| --- | --- |
| Map/Date interpreted as empty parameter maps | Map, Date, Float64Array and Array now refuse INVALID, preserving the supplied revision. |
| Valid revision lost on envelope/source rejection | Extra request key and >1 MiB UTF-8 source refuse INVALID with `review-current` retained. |
| Accessor domain | Test Worker constructs request-revision and external-value getters locally. Both actual core calls refuse INVALID with zero getter reads; a valid own-data revision remains for the external-value case. This tests the production core in a real Worker, not browser postMessage behavior, which can evaluate caller getters during structured cloning. |
| Plain record support | Ordinary and null-prototype numeric data record controls pass. |
| Missing admission-hint wording | Missing hint explicitly refuses UNSUPPORTED; changed explicit hint refuses INTENT_CHANGED. No silent intent migration or geometry relaxation. |
| Exact replay and accepted relation | Exact native replay, correct physical length ratio, metadata and IDs pass. |
| Boundary, stages and unrelated shape | Fixed boundary retained; earlier-stage geometry retained through a two-stage relation; unrelated raw spline's complete authored data retained. |

The separate **12/12 source-method controls** execute the exact private `verifyLengthIntent` body with its actual imported `assertAllowedSolverGeometry`. All six prior spline/rigid authored-field escapes now refuse `UNSUPPORTED_SOLVER_DATA_CHANGE`; numeric segment movement and requested relation insertion remain permitted. Root ID, metadata, generator and relation-target changes still refuse. These are controlled candidate mutations at the verifier boundary, not claims that a real solver changed those fields or that a native corrupt result was published.

Source review finds the policy called before data masking at `web/app/sketcher/headless/sketchTransition.ts:68–69`. `transitionGeometryPolicy.mjs:7–15` permits numeric solver coordinates for Point/Segment/Circle/Arc, modern Ellipse/EllipticalArc and BezierCurve forms; these match their `visitParams`/`write` fields. RigidGroup permits only transform x/y/angle, retaining membership/local definitions exactly. BSpline permits only cPoints x/y, retaining child IDs, degree, knot arrays, modes, method and every other field. Unknown changed data refuses; unchanged unknown data is still subject to the full native schema preflight. The old blanket data replacement remains solely for final comparison after this field check.

Spline scope is deliberately conservative: changes to fit/base/derived arrays refuse rather than being normalized or blessed as solver coordinates. Some such data can legitimately derive from interpolation/CV source controls, so this does not qualify all dependent spline edits. Existing final spline-derived validation, strict native intent/admission/identity checks and full exact replay remain necessary. The field comparator is a delta policy, not standalone validation of unchanged invalid geometry or support for native fields, such as weights, that the existing schema does not accept.

No new blocker was found for the tested data-only boundary. This does **not** qualify production transport, live editor ownership/hydration, history publication, undo/redo, cancellation, account boundaries, actual Save or signed Files. No DOM/canvas/fake UI or manufactured successful solver reply participates. The large 512-lock benchmark and timeout controls were not repeated; the earlier timeout remains no solver verdict.

From a checkout containing c9f1 plus these tests:

```sh
node test/sketch-transition-review/fixed/intent-verifier.test.mjs
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_TEST_CDP=http://127.0.0.1:19329 \
JSKETCHER_TEST_URL=http://127.0.0.1:20584 \
node test/sketch-transition-review/fixed/browser.test.cjs
```

These tests own separate contexts and leave the immutable fixture running. Tests/notes only; no shared product edits or builds.
