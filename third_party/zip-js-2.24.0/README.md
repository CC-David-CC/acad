# zip.js 2.24.0 native archive dependency

Exact npm dependency `@zip.js/zip.js`2.24.0, package-lock integrity:
`sha512-WlaVKzdqBK+RF3bdiXZWbdCnvGB6PdO4IHC1mn/2Yfl3bASgqUNegnU3+PNg61iecwoPfUi5BgLUPqBukXpyWw==`.
The acquired registry tarball matched that SHA512 during authorized source acquisition; no product test/build was run. The package is not vendored here; npm installs the locked dependency normally. `LICENSE` is the package's BSD-3-Clause notice.

The archive Worker imports `lib/zip-core-native.js`, whose package-bundled
JavaScript zlib implementation is statically included. Its default nested
Worker URI is explicitly disabled along with external WASM URI and native
CompressionStream substitution. The normal build refuses any other version.
The default package index is deliberately not used: it selects external WASM.
No CDN, custom external codec, Node backend or new runtime download is needed.
