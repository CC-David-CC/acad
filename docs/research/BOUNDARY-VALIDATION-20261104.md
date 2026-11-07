# Independent boundary correction check

Root reproduced three false acceptances against the exact `6dc801fc` validator:
an outer vertex moved by 1000 mm, reversed surface UV bounds, and reversed line
parameter ranges. These were native-envelope mutations while the separate mesh
remained intact, demonstrating why mesh checks alone were insufficient.

Integrated correction is `4554f86a` (agent `78b22419` plus `06114068`). Root reran
the original counterexamples against the integrated implementation: all three
now reject. Root also ran these actual fixture suites: 11 tests passed.

```
node --test test/engine-hole/topology.test.mjs \
  research/four-corner-topology/validate.test.mjs \
  research/four-corner-topology/provenance.test.mjs
```

The shared boundary check covers both centered-hole and four-corner results,
including original/resized fixtures. Native line ranges do not yet include an
analytic origin and direction, so the existing centered-hole schema cannot
prove absolute line-parameter-to-endpoint mapping. Four-corner native schema
extension is underway. No claim of universal B-rep validation is made.

Four-corner topology remains research, not a registered production operation.
The new shared helper still needs the worker asset packaging update before a
new browser runtime can be prepared. The desktop remains pinned to its prior
qualified runtime; these source tests do not prove a deployed worker update.

Follow-up: packaging `4eefae3d` and line-frame validator `d170976b` are now
integrated. Root independently passed 14 topology/provenance tests, including
actual normal/resized line-frame responses and refusal of the actual native
three-of-four-hole result. The four-corner schema now requires analytic line
origin/direction and evaluates both oriented endpoints; the centered parent
still uses its earlier schema and retains that stated limitation.

The initial root packaging check correctly failed because local generated
assets predated the helper import. Running `node build/prepare-prism-assets.cjs`
refreshed them; all four `embedded-worker-build.test.cjs` checks then passed,
including exact helper source bytes. Native/worker and mount adapter lanes are
now integrating the operation behind real ownership and publication guards.
No four-hole feature or new desktop runtime has been deployed.
