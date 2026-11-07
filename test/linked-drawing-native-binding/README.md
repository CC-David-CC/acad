# Prepared signed linked-part drawing workflow

`desktop-driver.mjs` is source-only preparation, not executed or qualified. Root runs it after composing the application and pinning served bytes. It owns fresh browser contexts/accounts and leaves the shared browser/fixture running.

Two complete public workflows start rectangles at `[0,0]` and `[-80,-40]`, both100×50mm. They select the advertised exact manufacturing build, extrude20mm, add the source-bound centered D10 bore, then treat two discovered opposite outer connectors with R3 fillets and the other two with equal1mm chamfers. IDs come from actual public receipts, region descriptors, closed-sketch inspection, current selection descriptors and readonly actual operation history. Opaque IDs are never parsed or inferred from Native ordinals.

Six dimensions bind width/height to actual source segments, depth to current original cap selection IDs, and diameter/offsets to the actual semantic hole feature. Three top/front/right views use the authentic source datum. X/Y offsets are nonnegative distances from datum axes, not rectangle minima. The negative case gives30/15mm initially and5/25mm after width/height150/30; signed anchors remain actual evidence.

The complete workflow covers public drawing create/no-op/title replace/stale refusal/remove and shared Undo/Redo; discovered existing SegmentLength width/height editing; depth25 and semantic D14 edits/replay; and actual SVG export to My files. The shared readWorkerLinkedPartDrawing service is an explicitly readonly __CAD_APP oracle, never private authoring. Each read checks all six facts and three genuine packed Native orthographic views. Exact before/after checks retain source/history/IDs/counters/journal/dirty/association/resource fields and both revision tokens. Metadata-only operations preserve geometry.

NativeV3 Save/server sync/fresh public Open must retain the complete definition and editable part, reset session Undo, and allow reedit/export. A valid unresolved definition uses the actual returned fillet feature as its hole reference: that feature exists but has no hole provenance. Hole dimensions must be unresolved/null with empty anchors, source/cap dimensions remain measured, SVG labels the failures, and the unresolved definition survives Save/Open. Explicit replacement restores the original hole reference; no substitution occurs.

Fixed independent expectations: volume `W*H*D - pi*(diameter/2)^2*D - 2*(9-9*pi/4)*D - D`; bounds `[origin.x,origin.y,0]..[origin.x+W,origin.y+H,D]`. Absolute tolerances: volume1e-6mm³, bounds/dimensions1e-6mm. SVG is parsed from actual synchronized bytes and checked for millimeter sheet size, bound metadata, all views, actual dimension labels and visible unresolved labels. This does not claim universal drawing standards, printing or GUI editing qualification.

Required environment: CODI_DESKTOP_SOURCE_ROOT (frozen source containing existing sweep signed harness), PUPPETEER_CORE_PATH, CODI_TEST_URL, CODI_TEST_CDP, CODI_SIGNED_PINS, CODI_EXPECT_SOURCE, CODI_EXPECT_DESKTOP, and nonexistent CODI_EVIDENCE. URLs must be local. The driver records before/after SHA of itself, this README, imported harness and canonical helper, plus every supplied served pin and outer index. The exact Native pair stays32eec74e…/abbf2aa0….

```sh
CODI_DESKTOP_SOURCE_ROOT=/tmp/codi-desktop-mechanical-candidate-20261105 \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
CODI_TEST_URL=http://127.0.0.1:20946/ CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_SIGNED_PINS=/tmp/codi-drawing-workflow-pins-20261107-r1.json \
CODI_EXPECT_SOURCE=ROOT_CORE_FULL_SHA CODI_EXPECT_DESKTOP=ROOT_DESKTOP_FULL_SHA \
CODI_EVIDENCE=/tmp/codi-linked-drawing-signed-proof-r1 \
/tmp/codi-files-move-node/bin/node test/linked-drawing-native-binding/desktop-driver.mjs
```

No deadline deliberately closes a context during a submitted Save/export/sync. Commands and byte readbacks settle before normal cleanup. First failures are retained; there is no automatic retry or assertion relaxation. No fake Native/Canvas/SVG result, source/model seed, filesystem race, account probe, credential/session archival or deployment is included. Full E22/Gate1 remains unqualified until the actual complete run is reviewed.
