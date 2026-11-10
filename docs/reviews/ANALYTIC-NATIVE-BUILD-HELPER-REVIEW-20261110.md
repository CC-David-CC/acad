# Analytic Native build helper review

Reviewed Core496e05e076a6ddb7702cf273f1587527eb77dce0 and Native4510c9a112ce3bda5335256d5bc58d1b339226f5, source only. This own branch changes no Native, compiled Core/Host, retained fixture/context, acceptance criteria or evidence.

Confirmed gap: `normal-build.sh` originally trusted the documented exclusive
mkdir only. A second shell invocation could truncate FIRST PID/version/log/exit
and input/result manifests. The correction claims the output once with atomic
mkdir before all artifact writes, then refuses already-present known outputs.
The two copied helpers remain inputs and are never replaced. The claim persists
on success, failure or interruption. This source was read, not executed.

The exact retained SDK root/include/lib paths match the existing reviewed
centered-countersink build precedent. The tracked Native build script remains
unchanged and explicitly links the same23TK archives in the same order with
the same defines/C++/optimization/memory/exception/post-JS settings. Capture
requires the exact clean Native4510 HEAD, hashes the actual tracked source,
headers, allTK archives plus the explicit23 link inputs, CMake cache, Emscripten
source/tools/sysroot/compiler files, actual interpreter/config/node when
available, and both copied helper inputs; it checks hashes AND census after.
The SDK is a retained non-Git build tree. These fresh observations bind its
actual bytes; equality to an older qualified SDK manifest still requires Root
review, and no invented SDK revision is asserted.

Portable adaptation requires Root-supplied actual rawJS/WASM hashes, one exact
legacy receiver occurrence, and an exclusive NEW output. It changes only that
receiver literal and reports raw/portable/WASM and adapter hashes; it does not
evaluate either artifact or generate guessed pins. Its fixed source label
requires the separate reviewed normal-build source/input/output receipt, as
already documented. Root must record the actual copied helper Git blobs before
launch and independently inspect outputs/exports before adaptation/repinning.
No additional material source blocker found within these stated contracts.
No build, helper execution, parser/import, tests, Native or browser was run.
