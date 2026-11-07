# Independent carried-feature checks after spline identity repair

Root reran these real Chromium controls against the matching rebuilt spline
fixture on loopback 19709, using isolated contexts on CDP19329. Source repair
`a22859f5` and the source/build hashes in `test/c03-spline-fixture/README.md`
identify the tested app. These test-only expectation changes do not alter app
assets. The shared browser and the retained bracket failure context were left
open.

| Control | Result | Actual scope |
| --- | --- | --- |
| spline-history-browser, desktop | PASS | Draw both spline types, undo/redo, real control-point drags, native snapshot and fresh workspace replay. |
| spline-history-browser, CODI_PHONE=1 | PASS | Emulated phone taps, both spline types, history and fresh replay; no physical-device or touch-drag claim. |
| c03-spline-fixture/browser-rejection | PASS | Clean historical sketch accepted; both duplicate-ID sketches rejected with stored bytes unchanged. |
| dxf-import-browser | PASS | Real sketch LINE/CIRCLE import, undo/redo, malformed import refusal, failed-load rollback and strict serialization/reload. |
| multiple-face-selection-browser | PASS | Real box faces, exclusive and marking-session selection; this is selection-service coverage, not mouse picking. |
| dimension-cancel-browser | PASS | Three measurement tools, trusted Escape, selection and completed geometry preservation. |
| dimension-history-browser | PASS | Measurement cancellation and undo/redo without duplicate dimensions. |
| marquee-browser, desktop | PASS | Trusted mouse area selection, additive selection, cancellation, default pan forwarding and sketch teardown. |
| marquee-browser, CODI_PHONE=1 | PASS | Emulated touch area selection/cancellation and overlay/listener cleanup. |

Run from this checkout with `PUPPETEER_CORE_PATH` pointing to installed
puppeteer-core, `JSKETCHER_TEST_URL=http://127.0.0.1:19709/` and
`CODI_TEST_CDP=http://127.0.0.1:19329/`. The fixture returns this exact CSP:

```text
default-src 'self'; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'
```

For tests asserting a captured policy, set `CODI_EXPECT_CSP` to that exact
header. Their default remains the earlier captured hosting policy; the override
does not bypass header equality or change the served policy. Production host
CSP and signed Files integration remain separate release checks.

This closes the affected local carried-feature subset after ID reservation.
It does not establish all camera/navigation behavior, either engine's complete
capabilities, a supported full-agent bracket or final combined beta readiness.
