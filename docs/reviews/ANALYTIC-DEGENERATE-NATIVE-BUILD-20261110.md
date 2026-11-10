# Analytic degenerate-edge native build

The reviewed Native guard-order source `4510c9a112ce3bda5335256d5bc58d1b339226f5`
compiled successfully in the one-use R730 output
`/mnt/data10tb/codi-occ-analytic-degenerate-native-build-20261110-r4`.
The build recorded 42,966 input files, unchanged input custody and a clean
source checkout. Among SDK paths also captured by the retained mechanical
build, all 6,934 shared file records matched; the new capture additionally
recorded the Emscripten config and Node executable. This comparison is input
evidence, not a precision or runtime qualification.

The actual raw JavaScript SHA-256 is
`65b41925747402eaceccc168e1245ffb2e316be98104e6f626a8d9dd080e0ff8`;
the actual WASM SHA-256 is
`97ea6162af031859dce14ee500be2a9bffef8eac129139b5462a1f8907a4157c`.
The lossless single-receiver adaptation produced portable JavaScript SHA-256
`717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484`;
the copied WASM was byte-compared to the build output. Portable artifacts and
their custody report are in
`/mnt/data10tb/codi-occ-analytic-degenerate-portable-20261110-r4`.

Native build result SHA-256:
`9799e8c59c6cde0c21a3062f41471a3190304553de5f7aed4078c4da6e28f57a`.
Build log SHA-256:
`01639abd6933f15b170e8e8bfda720fd2511b32cfd30f64c7b75e21266cd19c3`.
Portable custody report SHA-256:
`a916f84e6300eb474a7085fab9c7e2f89c2b3dcd0fc666112b36247fcdd62d06`.
The retained R3 failure and its unresolved context remain untouched. The new
pair must be assembled and exercised through the full workflow before any
claim that the failure is fixed.
