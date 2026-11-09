# Root review: finite-curve portable loader preparation

Root reviewed exact adapter77019bc / composedf7d1130 before transformation.
Its single full before/after receiver literals match unchanged mechanical
adapter's reviewed transformation. Raw inputs are actual compiled d3b2afa:
JS5f1730c/316580bytes, WASM746da919/36216184bytes. No Native code/ABI or
numeric data is patched. The adapter guards both inputs, requires exactly one
literal occurrence, writes exclusive new JS, reads back the actual result and
rehashes inputs/script before publishing metadata. WASM hashing is streamed.

Approve one isolated source transformation to NEW R730 output
/mnt/data10tb/codi-occ-finite-curve-native-portable-20261109-r1, plus streamed
exclusive byte-identical WASM copy and before/after custody. Preserve first
failures and outputs; no overwrite/retry. Record actual resulting hashes, never
infer a pair from another compile. No JS/WASM eval/import/module/Native/query,
probe/tests/browser, factory/catalog/default/graph or C11 change is authorized by
this preparation. Working runtime binaries remain only R730 until functional
gates qualify; only small source/custody records enter Git.
