# Headless topology import without eager Verb

The legacy Shell/Face graph imports NURBS helpers even when reading a purely
analytic prism. Those helpers previously read global Verb during module import.
Closest-point lookup is now deferred until called. The existing global Verb
surface tessellation cache is still installed eagerly when Verb is present at
module load, or once when a real NURBS surface is first constructed after Verb
loads. A NURBS request without Verb fails explicitly. This removes eager import
coupling only; NURBS still uses the global runtime and the cache mutates that
runtime. It does not establish a general explicit-runtime dependency contract.

`browser.test.cjs` runs real Workers under strict CSP without DOM/canvas/window
shims. One worker imports the unchanged portable reader and reads the captured
OCC descriptor with no Verb, verifies clear failures for NURBS without Verb,
then loads the actual pinned app-local `/lib/verb.js` and checks real NURBS
construction, closest-point calculation, surface tessellation, cache reuse and
no duplicate wrapping. Another loads the actual Verb before importing modules
and repeats the NURBS checks, exercising the legacy ordering. The bundled worker
uses the existing CSP-safe numeric module. The browser script defaults to the
retained real descriptor and accepts `CODI_TOPOLOGY_IN` for a fresh capture.
Use `webpack --config test/brep-verb-separation/webpack.config.cjs`, copy the
resulting `worker.js` into the existing isolated engine fixture's `static` as
`verb-separation-worker.js`, and supply the documented loopback/CDP and
Puppeteer paths. This is a source-only research fixture, not deployed code.
