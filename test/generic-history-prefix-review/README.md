# Generic new-feature replay: independent ARC23 proof

This test-only checkpoint extends the retained private prepared-replay proof. No product edits, source packaging, service or deployment change. Default OCC remains unchanged; no all-engine or universal-history claim.

## Actual new-feature before/after

The existing actual-app history-ABA harness now has an explicit new-feature mode. It creates rectangle 100×50, extrusion 20, centered hole 10 through actual craft methods, then uses inspected IDs to create four 4 mm corner holes. During the candidate prefix's real rectangle-solve post, it mutates the accepted centered-hole record 10→12; at the real centered-cut post, the request is already materialized and the accepted record is restored to 10. Genuine Worker messages/replies and native kernel geometry are used. Only this controlled history/message timing is injected.

| Receipt under test/closed-sketch-publication-review | Exact runtime | Outcome |
| --- | --- | --- |
| new-feature-aba-baseline-cb4.json | cb4a0dce8e4ce5c6d70524eb3b38e354ec58ec31, direct 20483, app 323878bd7c3ce662ae2ef57b9ece84fa4b7ebfb5c0fcd54fc20cd15a3cde1aac | New feature accepts. Existing center request 12, published center 12 and corners 4, 11 faces. History still specifies center 10; fresh native replay gives center 10/corners 4. Separate source ownership failure beyond private prepared replay. |
| new-feature-aba-fixed-053.json | 053163cc472d52b1a9a3f61e4edc4373f83a9ad2, direct 20484, app 113078a78741b531de52bd54047617b4076b14a379fe6e8cefb5ec661dcee12a | Same injection. Native request 10, center 10/corners 4, 11 faces, original history prefix semantically retained and exactly one intended feature appended; fresh native replay agrees. |

Both pin the actual sketch Worker d959fcb7282eaa3807d77d797c3ba80b708a7e95cd6efb8158a1f98ab8635c27 and record other targeted Worker pins. Independent analytic loop sampling observes two center-diameter loops plus eight 4 mm loops on the two support faces. Input sketch bytes remain unchanged by this feature creation. This is actual app/Workers/native snapshot restore, not signed Files Save/sync or human UI qualification. Owned contexts close; fixtures remain running.

## Empty and rewound carry

rewound-prefix-fixed-053.json records a separate actual API control. It starts from pointer -1/history 0/models 0 and creates the initial design. After rewinding to its plane, two generic PLANE insertions produce feature sequences [1,4,2,3] then[1,4,5,2,3] with pointers 1 then 2, retaining the old extrusion/hole suffix. Returning to the full tip and fresh native restore preserves that suffix, body ID, 10 mm hole and 3 models. This checks that a changed prefix is not incorrectly compared with the old full-tip signature. It observes the public empty state, not the private fullTipSignature value.

## Source assessment and remaining scope

At 053, submitModification normalizes/detaches the new request and captures the existing history with captureAuthoredHistory before staging. Capture is bound to project/document, accepted state+revision, model state+revision, epoch, pending work, preparation and source tip. The accepted full-tip signature is required only when the current pointer is at the full tip. A null tip accepts only a coherent empty history [], pointer -1 and models []. This preserves first creation and rewound insertion while preventing arbitrary nonempty source adoption. Feature-ID reservation and duplicate checks remain; rejected IDs retain the existing high-water/skip policy.

Only these caller paths are qualified. Timeline/rebuild and prefix inspection in beginCenteredParentRepair still retain history references at source and need independent ownership review. Authored dimension/physical/repair-change paths already construct detached history captures; do not label all of them borrowed. Direct runPipeline is a different boundary: the located remote-parts caller supplies a freshly JSON-parsed external project in a separate context. Native restore similarly starts from parsed input, though low-level reset accepts a caller array. These are not proven active-document alias failures merely because they share evaluatePipeline. ARC23 remains partial; no global freeze/framework change is implied.

## Reproduction

Use the pinned immutable fixtures or identical builds and separate receipts. From the CAD checkout:

```sh
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
JSKETCHER_TEST_URL=http://127.0.0.1:20484 CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_APP_SHA256=113078a78741b531de52bd54047617b4076b14a379fe6e8cefb5ec661dcee12a \
CODI_SKETCH_SHA256=d959fcb7282eaa3807d77d797c3ba80b708a7e95cd6efb8158a1f98ab8635c27 \
CODI_SOURCE_PIN=053163cc4 CODI_OPERATION_MODE=new-feature \
CODI_EXPECT_DETACHED_FIX=1 CODI_RECEIPT=/tmp/new-feature-fixed.json \
node test/closed-sketch-publication-review/history-aba-browser.test.cjs
```

For the baseline use cb4/20483/app 323878 and omit the expected-fix flag; for the carry use the same fixed environment with rewound-prefix-browser.test.cjs. The script's default closed-sketch mode retains the earlier prepared-replay control, whose original receipts remain unchanged. Native restoration comparison uses parsed deep equality for object-key canonicalization while preserving every value/type/ID and array ordering.
