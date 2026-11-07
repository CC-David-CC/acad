# Emscripten runtime inventory for the OCCT candidate

The recorded source-built OCCT link uses Emscripten 2.0.30. A separate relink
using the recorded compiled objects and linker settings with `EMCC_DEBUG=1`
produced the same candidate JS and WASM hashes (`3c56e74e…` and `a2b2f7da…`).
The debug trace reports considering these system archives: libGL, libal, libc,
libc++, libc++abi, libmalloc (dlmalloc), libc_rt_wasm, libcompiler_rt, libhtml5
and libsockets. Static archives being passed to the linker does not prove every
archive member appears in the final executable.

The accompanying license texts were copied from that exact toolchain tree:
Emscripten's root LICENSE, musl COPYRIGHT, libc++ and libc++abi LICENSE.TXT,
and compiler-rt LICENSE.TXT. The toolchain's `system/lib/dlmalloc.c` identifies
Doug Lea's dlmalloc 2.8.6 as public domain and points to CC0. The complete
captured trace is retained in R730 scratch at
`/mnt/data10tb/codi-occt-link-audit-20261103/link-debug.log`. It may contain
local paths and is not intended as a user-facing license notice.

This is an improved inventory, not exhaustive notice closure: determine which
members and generated JS/runtime components were retained, inspect their
individual license headers, and check transitive and build-tool contributions
before publishing. The exact wrapper/OCCT sources and separate notices are
listed in `../occt-interpreter/README.md`.
