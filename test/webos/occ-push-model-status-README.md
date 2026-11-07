# OCC registration status regression

The actual pinned runtime returned status 0 for registration of a valid real
BOX, and the registered shape interrogated as six faces. The archived 5efaf53
source has `EngineCommand` return the `io.pushModel` result, and that function
returns 0 after `DBRep::Set`; npm binary/source correspondence is not attested.

The test then substitutes a return value of 7 at the engine adapter, without
passing any invalid native pointer. Before the fix, both wrapper and proxy
accepted the injected failure, two actual subsequent `_CallCommand` calls
occurred, and the second proxy call reused the first cache entry. With the fix,
wrapper and both proxy calls fail with `LEGACY_GEOMETRY_UNAVAILABLE`, three
registration attempts are observed, and no native command runs. Restoring the
real adapter allows a successful OCC copy with six faces.

Run `node test/webos/occ-push-model-status-browser.test.cjs` against a freshly
built local WebOS app and isolated loopback Chromium/CDP. This regression uses
an injected error, not a naturally observed failure from a valid OCC pointer.
