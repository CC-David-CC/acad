# Independent polygon math review

Reviewed product source: `f67ab45d31afa24c225a24d94158830da31ff5d8`.
Only this new test directory belongs to this review; no product changes.

The real Node Worker imports the actual three production modules. Independent
Python `Fraction.from_float` arithmetic supplies 1,200 determinant expectations
using an absolute-coordinate six-product formula and 182 triangle areas using
the shoelace formula. Python's correctly rounded `float(Fraction)` supplies the
expected numeric measurement rather than copying the production converter.

```sh
python3 test/polygon-math-review/fixtures.py
node test/polygon-math-review/run.mjs /tmp/polygon-review.json
```

The frozen-source run is intentionally failing: `before-f67.json` records
187 passing rows and two genuine failures out of 189. This is not a skipped or
weakened test. Its embedded hashes identify the source actually run.

Both defects are double rounding in the positive exact-dyadic area conversion:

| Triangle nonzero axis coordinates | Expected rounded area | Observed on f67 |
|---|---|---|
| x=(1+2^-52)·2^-500; y=(1.125-2^-52)·2^-571 | 5·Number.MIN_VALUE | 4·Number.MIN_VALUE |
| x=(1+2^-52)·2^-500; y=(1-2^-53)·2^-574 | Number.MIN_VALUE | UNREPRESENTABLE_AREA |

The first 53-bit rounding loses information needed by the later subnormal
rounding. This affects the pure helper's stated numeric measurement; these
coordinates are outside the native adapter's supported resolution. It does
not demonstrate a failure of an ordinary manufactured part.

## Corrected-source check

The owner fixed the conversion in `afbd6a6c1`: integer quantization now happens
once at the final binary64 exponent, including the subnormal exponent floor.
This review applied that exact owner commit, with no edits to the three
production modules, and reran the identical 189 expectations. `after-afbd.json`
records **189/189 PASS**. Both previously failing cases now return the
independently expected value. The fixture generator and Worker assertions are
unchanged from the failing checkpoint. The runner additionally records its
own/fixture hashes and Node version; this receipt is a new run, not a relabel
of the frozen-source failure. The native thin receipt remains tied to its
original JS/WASM pins and is not retagged as this corrected pure-math run.

Passing controls cover widely separated exponents, cancellation/underflow,
other rational areas, a concave L/notch, circle clearance against edge
interiors, polygon holes in circles, winding/cyclic ordering, a rotated
right-handed frame, the native numeric stream, detached coordinates, strict
V2 triangle refusal and the V3 512-vertex cap. Existing tests were also run
unchanged: all 11 Node Worker groups and all 25 prior planner/source/discovery
tests pass on this same frozen source.

The V3 planner admits the valid triangle (0,0),(1000000,0),(500000,1e-12).
Its edges and area pass the explicit checks; a triangle has no nonadjacent
edge pair. These checks therefore do not establish a global minimum width
of 0.0001mm. They do not weld or alter coordinates. A separate bounded native
diagnostic found no construction failure for this example.

`thin-native.cjs` ran via the owner's pinned `shape-io/run-probe.cjs` against
the actual newly compiled C++→WASM V3 provider: JS
`4c6b242fe2675ef8ee362caf0872872cf37ac652c431042b5e2843f227b9194a`,
WASM `9a31bd41b5d08cd6c7d5ecfbcdd01ab2c13a5a558a309c36dd58ecbb2ceef625`.
The receipt records heights 1e-12, 1e-5 and 1e-3 at length 1e6, plus an
ordinary 20×10 triangle. All four return valid one-solid results and analytic
volumes/bounds; input arrays remain exact, each result is released, final
owned-name count is zero. This is a WASM component diagnostic in Node, not
native-CPU, tessellation, Chrome, public CAD, manifold inspection or general
thin-feature qualification. No fallback, repair or tolerance change.

No filesystem race/security test, private geometry writer, fake solver,
browser shim or successful-output injection is used here. This review does
not establish general arrangements, native/public V3 support, manufacturing
accuracy, all-engine equivalence or a completed Gate 1 exercise.
