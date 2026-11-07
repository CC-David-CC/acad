# Public selected-profile adversarial qualification

Test source: `5779adb4fe27cf4ff97101ced0cf27d919fde928`, based on D0d3.
Final tested product: `a0b363bce15e8533be17c9332b46a7e51ddeea5d` (private r4).
The exact ordinary app, Worker, native-glue and WASM hashes are in `pins.json`.
Only this test directory changed; product fixes were serially owned by root.

**PASS:10 getter probes +2 source-currentness controls +35 adversarial/control
rows**, including a six-case bounded full-replay workflow. The final default
run observes270 terminated command Workers; each closed host has0 live owners
and0 mounts. `evidence/public-final.json` is the source-bound raw receipt.
This does not qualify every CAD gate, human UI, signed host, Files or deployment.

## Findings and corrections

| Finding | Actual before evidence | Qualified correction |
|---|---|---|
| Reply fields read before descriptor validation | D0/r1 executed every tested getter: solve ok3/revision1/sketch2; semantic jobId1/ok2/value1; native seq1/kind5/ready-kind1/nativeVolume3. Semantic inspection/native extrusion could finish successfully. | Root61a5 captures shallow own-data headers before field reads, captures nested error data and bounded native evidence/binding metadata. On r4 all10 probes refuse with0 getter reads and unchanged accepted state. |
| Unrelated project autosave invalidates discovery | Controlled r2 public save rewrites identical project bytes: global/project-key revision4→5, while sketch namespace/source version remains3. A held genuine discovery aborts. | Roota0b binds to sketch namespace membership/versions, retaining exact source/frame/stream/epoch/lifetime guards. The identical save now stays current and discovery finishes successfully. |
| Source edit+undo ABA | A real public Point append followed by authored undo restores exact source bytes but advances source versions3→6. | Still aborts on r4; exact late reply remains inert. No byte-equality shortcut or timer suppression. |
| Source-edit scope initially misunderstood | D0's unknown-history allowlist appeared to block every source edit. Root15ed subsequently recognizes selected dependencies. A stale blanket-refusal oracle failed because actual full replay succeeded. | Separately prove bounded dependent Circle/construction edits and unrelated edits. This is full replay, not permission to treat a consumed source as unrelated for fast saving. The current API note understates this tested scope. |

Before receipts are retained. Additional harness corrections are explicit:
the hold must intercept one reply across Worker instances, so successful
continuation can receive its second independent semantic answer; the primitive
helper returns an ID, not a receipt; applying another driving diameter is a new
constraint rather than editing the previous driver. None required a product
math change or a weaker accepted-state oracle.

## What the public tests actually do

All geometry is authored by public commands. Returned primitive IDs and actual
persisted region descriptors drive selections. No private source setter,
custom constraint, in-page OCC, fake solver/status, Canvas or substitute UI is
used. Response faults perturb genuine Worker messages only.

- Six source/semantic header probes and four native header/metadata probes
  replace one descriptor and return its genuine value if read. Corrected
  transport refuses without invoking any getter.
- Caller request/options getters, invalid depths/engine/runtime/body policies,
  oversized/unknown region identities, pre-aborted callers, false lifetime
  guards and a revision superseded by a real source edit all refuse safely.
- Forged source/semantic/native envelopes are rejected. One altered expected
  volume fails independent semantic comparison. Two equally forged expected
  volumes reach the real native kernel and fail `NATIVE_MEASUREMENT_MISMATCH`
  before publication, preserving the accepted document and releasing the
  candidate's native resources.
- Real held replies cover caller abort, source ABA and host close after a
  genuine native result. Exact late delivery is observed and remains inert.
- A genuine selected disk publishes with native volume12π mm³ and bounds
  [-2,-2,0] to[2,2,3]. Exact source bytes AND versions survive publication; the
  source plane and both disjoint source regions remain available.
- A dependent construction Point preserves prior source and native geometry.
  A first driving diameter6 regenerates the selected disk to27π mm³ and bounds
  [-3,-3,0] to[3,3,3]. A contradictory second driving diameter refuses `INVALID`.
  Enlarging the previously undimensioned unselected circle into an intersection
  refuses `STALE_REGION`. Both failures retain the exact last-valid state.
  An unrelated-plane Point edit succeeds without rewriting the selected source
  bytes/version or changing its native geometry.

The35 top-level control rows comprise21 request/state controls,9 transport/
measurement controls,4 held-lifetime controls and1 composite workflow containing
six independently checked cases. The10 getter probes and2 currentness controls
are additional rows, not a claim that all broader CAD combinations are covered.

## State and resource oracle

The accepted-state oracle includes native source bytes and storage versions,
feature history/publication stream revisions, model IDs/native metrics, authored
undo/redo intent, pipeline validity and LIVE resource counts. It excludes
operational currentness tokens and never-reuse feature-ID counters: a rejected
submitted operation may consume an ID or advance an execution epoch without
changing authored intent. Host close deliberately releases owners and denies
live inspectors; that case compares durable read-only source/history/model
observations and separately proves cleanup. All observed command Workers are
terminated; no browser-memory/performance or physical-GPU claim is made.

## Scope and remaining boundaries

Experimental selected-profile-v2 supports separate OCC results, bounded positive
mm depth, one bounded generator-free native source stage, full circles and exact
local rectangles. Discovery advertises64KiB source/response and128-region caps.
The native component still has an eight-lifetime-shape-name mount budget; this
corpus does not qualify deep/large feature histories. Bounded replay cases above
do not qualify arbitrary constraints, topology-changing references, curves,
typed/project bindings, generated-face operations or manufacturing export.

A structurally valid same-realm data forgery is not cryptographically
attributable. Descriptor admission, repeated independent jobs, native checks
and source currentness are distinct protections; they do not secure a browser
whose application code is arbitrarily compromised.

After-commit cancellation classification is a SEPARATE follow-up branch and
receipt. It does not erase this270-Worker proof. This directory's current
lifecycle tests concern invalidation before publication and stale late replies.
No production/default asset, public route or live deployment changed.

## Reproduce

The tests-only branch is based on D0d3. Check out producta0b363bce, then bring in
the test-source commit above. Root's tested runtime is
`/mnt/data10tb/codi-cad-selected-profile-public-20261106-r4`, private20682;
matching r1/r2 pins are retained with the before receipts. Shared CDP19329 is
used through isolated contexts and disconnected, never restarted or closed.
Root owns these fixture servers; this lane leaves them untouched.

```
JSKETCHER_TEST_URL=http://127.0.0.1:20682/ \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_SOURCE=a0b363bce15e8533be17c9332b46a7e51ddeea5d \
CODI_EXPECT_APP_SHA256=8ae3ddc83e706829761c66ddc573fae42f9d746171ee09c1ee3b0f0744d98965 \
CODI_RECEIPT=/tmp/selected-public.json \
CODI_FAILURE_RECEIPT=/tmp/selected-public-failure.json \
node test/selected-profile-public-adversarial/browser.cjs
```

Untouched D0 getter measurement adds `CODI_EXPECT_BASELINE_GETTERS=1` and
`CODI_PROBES_ONLY=1`. Controlled r2 false-invalidation measurement uses
`CODI_CURRENTNESS_ONLY=1 CODI_EXPECT_BASELINE_CURRENTNESS=1`. These are explicitly
labeled baseline exposures, not passing corrected-product qualifications.
Optional skip/subset switches support bounded diagnosis; the final primary
receipt comes from the DEFAULT complete runner with no skipped probes.
