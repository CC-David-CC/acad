# Exact represented-coordinate signed triangle integral

Base CADf1072e9f5. Only the new pure `modules/engine/mount/exactMeshVolume.mjs` and this test directory change. No shared Worker/controller, app, native binary, authored geometry, default backend, Files or service changes. This is a measurement candidate for **dedicated Worker** integration, not a Gate pass or native validity result.

## Contract and scope

`measureExactSignedMeshVolume(positions,{maxTriangles?})` accepts a flat, unshared, attached Float64Array, nine finite coordinates per oriented triangle, with at most100000 triangles. Dense JavaScript arrays are intentionally not accepted: a two-pass exact calculation must not reread caller-controlled getters or a concurrently mutable buffer. It returns frozen `{signedVolume,triangles,arithmetic:'exact-represented-binary64',rounding:'nearest-even'}`. Empty/all-zero input and exact signed cancellation return positive zero.

The result is the correctly rounded binary64 value of the **exact rational origin-tetrahedron sum of the represented coordinates**, `sum(det(a,b,c))/6`. The helper never takes an absolute volume, changes coordinates, snaps dimensions, changes the reference origin, estimates shell groups, repairs winding, classifies material, validates closure/manifoldness or replaces nativeVolume. For an already oriented closed boundary, outward disconnected shells add and inward cavities subtract; open or misoriented geometry still produces only the supplied signed integral, not proof of physical solid volume. The single-open-triangle oracle deliberately demonstrates that distinction.

Malformed/nonfinite/wrong typed data, shared/detached buffers and invalid limits refuse with INVALID_MESH. Exceeding the work cap uses RESOURCE_LIMIT. A nonzero exact value rounding to zero, or a result rounding to infinity, refuses with MESH_VOLUME_NUMERIC_RANGE; no partial/heuristic result is returned. Representable nonzero subnormal results are permitted and correctly rounded. Exact cancellation is zero even when individual tetrahedron integrals exceed binary64 range. No negative-zero orientation meaning is invented for an exact zero.

## Arithmetic and rounding argument

A single reused8-byte DataView decomposes each nonzero finite binary64 coordinate into signed integer mantissa (at most53bits) times2^e, where -1074≤e≤971. Pass1 validates the input and finds common minimum E. Pass2 converts each triangle's nine coordinates to exact integers at that scale, adds its exact BigInt determinant to one accumulator, and discards those temporary coordinates. There is no coordinate cache or per-triangle retained list. The signed rational result is N×2^(3E)/6.

For positive |N| with L binary digits, floor(log2(|N|/6)) is either L−3 or L−4. One exact shifted-integer comparison selects the exponent. The final quantum is2^max(floor(log2(value))−52,−1074). Divide the corresponding exact numerator by its exact denominator once; compare twice the remainder to the denominator, and on a tie increment only an odd quotient. The quantized integer is at most2^53 and exactly representable. Its power-of-two scale itself lies in binary64 range, so the final multiplication is representable without a second rounding, except the explicitly refused overflow carry. Sign is restored afterward. There is no Number(largeBigInt), double-rounded significand, or intermediate power below2^-1074.

## Independent oracle and known defects

84 small cases are checked in an actual Node Worker against independent Python Fraction determinant arithmetic and Python's correctly rounded Fraction→float conversion, compared by exact64-bit encoding. They include all three retained genuine native meshes from `test/local-mesh-volume/actual-native-mesh.json`, translated tiny/separated shells, cavities, disconnected/reversed boundaries, exact cancellation, zeros/degeneracy/open triangles, normal and subnormal ties-to-even (including below/above half-min-subnormal), finite-maximum/overflow boundaries, deterministic scale-spanning samples, and MAX³ terms canceling to1 or to the smallest subnormal. Three further control groups cover strict work/data admission and the concrete defect comparisons. No native output is fabricated or freshly recaptured.

The retained two-separated-tiny-box counterexample now gives exact rounded integral **1.2000274123848626e-17**, matching Fraction. The earlier local/common-anchor result1.2000551038462114e-17 remains in the receipt as the reproduced before comparison. No grouping or guessed shell pairing is used in the production helper.

The actual native tiny box near(1e6,1e6,1e6) gives exact represented integral **6.000137061924313e-18**, matching the recorded native value. The requested dimensions multiply to6e-18. This dimensional drift remains visible and is **not fixed** by exact integration. The old recorded global-origin estimate−2.6667257770895962e-6 is separate prior evidence. An initial descriptive control accidentally selected the ordinary translated native row; all three native rows already passed the independent84-case oracle, but the control was corrected to assert the tiny row explicitly. Initial receipts remain retained.

## Work and memory bounds

The maximum input payload is7,200,000bytes. Both passes are linear in triangle count; BigInt operand sizes are bounded by the binary64 exponent range and fixed triangle cap. At E=−1074, each scaled coordinate has magnitude below2^2098 (at most2098bits). Each determinant is a sum of six triple products, so its magnitude is below2^6297. Summing fewer than2^17 triangles bounds the accumulator below2^6314. Final rounding needs no larger magnitude; the final binary string used to count accumulator bits is at most6314characters. There are only nine coordinate integers, one accumulator and a constant number of arithmetic temporaries, not an O(triangles) cache. Even a conservative64 simultaneously reachable6314-bit magnitude slots plus the bounded final string are below128KiB of **logical arithmetic payload**. This is deliberately loose and is not a V8 object/allocator/peak heap/RSS guarantee.

BigInt operations allocate temporary objects; collection timing and total allocation churn are implementation-dependent. Process/isolate snapshots below are not peak allocation bounds or OS reclamation evidence. In particular, successive benchmark input buffers may remain until a later GC. Input storage and runtime overhead must be budgeted separately. Worker termination/candidate ownership remains the external cancellation mechanism; no callbacks or yielding are introduced inside this synchronous exact calculation.

## R730 benchmark and recommendation

Fresh archived source49bad9f60, Node24.22.1/Python3.12.3, single measurement per case, actual Node Worker:

|100000-triangle data|Time|Result|
|---|---:|---:|
|Simple axis-basis arithmetic|87.75ms|100000|
|Recorded ordinary native box coordinates repeated8333 times, four degenerate padding triangles|145.32ms|35840233|
|99998 wide-range nondegenerate triangles in reverse pairs plus two min-subnormal degenerate rows|4670.82ms|0|

The repeated native-coordinate benchmark measures arithmetic throughput, not a fresh100k-triangle native model or a valid overlapping multi-solid construction. The adversarial case forces the full MAX/MIN exponent range and exact cancellation. A prior same-helper run measured simple95.72ms/adversarial5180.72ms; both receipts are retained, with no universal speed claim. Worst-case cost is seconds despite the finite work cap.

R2 snapshots were roughly86–105MB whole-process RSS, with Worker-isolate heap snapshots about7.9–9.6MB and array-buffer snapshots reflecting one to three existing7.2MB benchmark inputs before GC. These are before/after observations, not peaks, incremental helper memory usage, hard limits or reclamation guarantees. Exact bytes and their scope are preserved in `r730-receipt.json`.

The arithmetic candidate is suitable for bounded dedicated-Worker integration with its strict cap and explicit range refusals. Do not call it on the main/UI thread or replace nativeVolume. Root must integrate shared Worker/assets/pins and requalify actual browser behavior, cancellation/lifecycle, evidence comparisons and existing CAD operations. Neither Node timing nor the arithmetic proof qualifies a browser/native workflow.

## Reproduction

```
node test/exact-mesh-volume/run.mjs
BENCHMARK=1 node test/exact-mesh-volume/run.mjs test/exact-mesh-volume/receipt.json
```

The runner regenerates only this directory's cases/oracle outputs, pins source inputs before/after, runs the independent Python oracle, and waits for the real Node Worker to exit. The canonical old native receipts are read without modification. R730 source/receipts are retained separately and no previous proof is relabeled as a new app or native build.
