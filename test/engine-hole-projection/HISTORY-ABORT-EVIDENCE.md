# Actual craft host-abort control

On source `8b0faa5b` and the full-app fixture described in
`HISTORY-EVIDENCE.md`, `history-abort-browser.test.cjs` passed in an isolated
Chromium profile. The real craft service created the 100×50×20 mm parent,
then requested the actual centered hole. Test-only instrumentation of
`Worker.prototype.postMessage` scheduled the host-lifetime abort immediately
after one `research-centered-cut` message was posted; instrumentation of that
same Worker observed one termination. The operation rejected with AbortError,
processing drained, the previous six-face parent remained displayed and the
serialized history was unchanged. A 250 ms post-drain check did not observe
late publication. The host was closed, so this is not a claim the accepted
parent's terminated engine remains usable afterward.

The hook establishes that dispatch occurred, not that native code had begun,
not an OS worker crash, and not every possible timing. It uses actual craft,
sketch and research OCC workers with a test host lifetime. It is not a release
runtime, real window manager close, account switch, power loss or signed Files
test. Existing 8b0 fixture hashes and build recipe apply. Test invocation:

```
JSKETCHER_TEST_URL=http://127.0.0.1:19988/ CODI_TEST_CDP=http://127.0.0.1:19318/ \
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
/tmp/codi-files-move-node/bin/node test/engine-hole-projection/history-abort-browser.test.cjs
```
