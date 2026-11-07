# Sketch helper and icon import controls

`sketcherTPI.addSerpinski` calls the four-number Euclidean distance helper.
Its original import pointed to `math/commons`, which does not export that
function. Before the fix, a focused webpack bundle emitted the missing-export
warning and invocation failed with `TypeError: distance is not a function`.
The import now uses the existing `math/distance` implementation.

Run `node --test test/coreTests/helper-warning.test.cjs` after installing the
locked dependencies. Optionally set `CODI_TEST_NODE_MODULES` to a read-only
matching dependency directory and `CODI_TEST_TMPDIR` to an isolated output
filesystem. The first focused bundle invokes the actual helper with a small
instrumented viewer/tool and checks the 3-4-5 distance, finite generated
segments and both connector endpoints. This tests the helper path, not a real
interactive sketch editor or solver.

The second focused bundle checks that all seven icon components formerly
imported from `react-icons/all` are identical exported functions when imported
from their specific `fi`, `gi`, `hi`, `bi` and `bs` modules. The only other
`react-icons/all` import was unused and was removed. The package explicitly
marks `sideEffects: false`; no icon component or UI behavior is changed by the
import cleanup. The identity test deliberately imports `all` to compare it,
so its test-only bundle can still show the old conflicting `io`/`io5` warning.
No broad icon rendering or full application regression is claimed.
