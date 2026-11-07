# SMLib native refusal atomicity — 1fddd

On actual browser fixture `20473`, CAD `1fddd2d1ce89a216d011e304fafcbf284b066278`, `native-failure-atomic-browser.test.cjs` produces the expected SMLib refusal for hollow box H union the identical 6 mm inner insert I. Its strict native snapshot equality currently **fails**: `project.model.counters.featureId` advances from 4 to 5. Published outputs and authored history otherwise compare equal in the separate diagnostic. Failure log: `/tmp/codi-native-failure-atomic-1fddd-r1.log`.

The diagnostic `/tmp/codi-native-failure-diagnostic.cjs` compares outputs and history separately, records the counter, calls the ordinary host-save snapshot, and then explicitly submits I union H. That reverse operation succeeds with reported volume 1000; log `/tmp/codi-native-failure-diagnostic-1fddd-r1.log`. This demonstrates recoverability for the tested sequence, not strict native snapshot atomicity or an automatic retry. The original forward union remains refused. No product behavior or gate was altered.

Run the strict control with `NODE_PATH=<puppeteer-node-modules> JSKETCHER_TEST_URL=http://127.0.0.1:20473/ CODI_TEST_CDP=http://127.0.0.1:19329/ node test/solid-output-history/native-failure-atomic-browser.test.cjs`.

Policy-aware follow-up `native-failure-policy-browser.test.cjs` **passes** on the same fixture (log `/tmp/codi-native-failure-policy-1fddd-r1.log`). It checks that the counter advances exactly once and that every other native snapshot field and all outputs remain equal; then confirms the ordinary host-save snapshot succeeds and the explicitly requested reverse union skips the consumed ID and returns volume 1000. Full serialized byte equality remains false: the allocator deliberately does not reuse IDs claimed by failed operations.
