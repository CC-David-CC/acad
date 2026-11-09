# Extent STEP reader: Node24 launch failure before geometry

The complete extent R4 browser workflow26910 PASS0 on actual0af/Hostbe24,
separate acceptance7e1e2b6:144rows/1674commands/89observations/nine native cycles/
14artifacts/26settled writes/seven cases. All18 source pins unchanged; owned
contexts retired. No browser/CAD failure or lost saved file is reported here.

First after-whole pipeline42619 built the separate reader successfully, then
the first reader invocation exited9 before loading its JS/WASM. The unchanged
report at evidence-r4/first-reader.json records empty stdout and Node's exact
`--no-experimental-fetch is an invalid negation because it is not a boolean option`.
No Python artifact oracle ran. SDK Emscripten is2.0.30; runtime Node24.22.1 and
SDK Node24.19.0 both report that the removed flag is unsupported. The compiled
reader/source23-library manifest and exact binary digests remain retained.

Source cause: run-reader.mjs unconditionally passes that old Node CLI flag.
Emscripten2.0.30 generated instantiateAsync selects fetch whenever it exists and
the WASM path is not a file URI. Stable Node fetch cannot load this absolute
local filesystem path. The intended offline behavior is the generated existing
filesystem loader; the old flag had disabled fetch to select it.

Required repair: a small explicit CommonJS preload disables fetch only in the
reader child process, invoked using supported `--require`. Keep actual reader
JS/WASM, C++ source, all probes/arguments/artifacts, shape checks and tolerances
unchanged. Capture actual runner/preload bytes before/after the read. Do not add
a fake Native result, VM/canvas replacement, retry loop, alternate geometry or
new runtime installation. Preserve the first report and use a distinct new
reader report. Only after successful real reads run the FIRST independent
Python oracle and review the two actual SVGs. No full CAD workflow rerun or
reader recompilation is warranted solely by this prelaunch tooling failure.
