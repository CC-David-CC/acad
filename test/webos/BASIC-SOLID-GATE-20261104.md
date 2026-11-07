# Bounded block and washer checks

A loopback-only supplied fixture at port 19707, Chromium CDP 19329, was exercised with independent browser contexts. The supplied fixture was described as the combined 15a7e2a5 build. The served `static/index.bundle.js` SHA-256 was `c35bce15493022ef28d0aa8b8d503f3bea4deeb980f4b1a3a8013e14515758bf`; its `.rev` was `160620f2cf1ad55ca7f738844ba66692c95b0280`. This receipt does not independently prove a clean source-to-asset binding.

`basic-solid-worker-browser.test.cjs` uses a test-bound host lifetime, the shared rectangle creation and worker extrusion commands, and actual OCC worker geometry. A 100 × 50 × 20 mm block had one six-face body, bounds (0,0,0)–(100,50,20) mm and tessellated signed-volume magnitude 100000 mm³. Negative depth was rejected while history, body IDs and display tessellation remained identical. Its native snapshot replayed into a separate browser context with matching IDs and face count. It does not cover the signed WebOS parent, a durable server save, or a visible wizard action.

`basic-washer-browser.test.cjs` invokes existing sketch and wizard test helpers to author two circles of radii 15 and 5 mm, selects the explicit annular region and extrudes it 4 mm using the legacy in-page OCC `EXTRUDE` route. One body had OCC mass within 0.2 mm³ of 800π mm³ and its native snapshot replayed in a separate browser context. The original `region-picking-browser.test.cjs` separately passed real checkbox and canvas selection. The washer test is not proof that the worker rectangle extrusion command supports inner loops or that the entire workflow was performed by manual mouse input.

Commands, using a disposable loopback fixture and browser:

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:19707/ CODI_TEST_CDP=http://127.0.0.1:19329/ PUPPETEER_CORE_PATH=/path/to/puppeteer-core node test/webos/basic-solid-worker-browser.test.cjs
JSKETCHER_TEST_URL=http://127.0.0.1:19707/ CODI_TEST_CDP=http://127.0.0.1:19329/ NODE_PATH=/path/to/node_modules node test/webos/basic-washer-browser.test.cjs
JSKETCHER_TEST_URL=http://127.0.0.1:19707/ CODI_TEST_CDP=http://127.0.0.1:19329/ NODE_PATH=/path/to/node_modules node test/webos/region-picking-browser.test.cjs
```
