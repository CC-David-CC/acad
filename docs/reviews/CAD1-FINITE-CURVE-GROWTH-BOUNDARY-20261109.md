# Finite-curve invocation: normal WASM growth boundary

Root source decision, 2026-11-09. No Native function or module execution.
The exact normal raw build from Native d3b2afa compiled successfully; Core
b45d9a0 retains source/input/static ABI custody. Raw JS SHA256 is
5f1730c347eb3edeb8b6d5e06eeeedcdf04b2348aac0c92b04001bd5edd5b7de;
raw WASM746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325.
Neither raw pair is portable, mounted or behavior-qualified by this note.

Read-only inspection of these exact JS bytes establishes that receiveInstance
sets Module.asm to instance.exports, takes wasmMemory from Module.asm.memory,
and calls updateGlobalBufferAndViews(wasmMemory.buffer). That helper publishes
Module.HEAP8 as a full Int8Array of the current memory buffer. This is an actual
source fact, not a guessed Module.wasmMemory property.

The private new shape-free adapter should support ordinary memory growth.
Pin the actual Module, asm export object, exported WebAssembly.Memory, Native
method/allocator functions and lexical owner; capture the intrinsic Memory
buffer getter. Reacquire the full HEAP8 against the SAME memory object at each
boundary, admit monotonic legitimate growth, and recheck actual scratch ranges
and unchanged original Float64 bits before freeing. A detached old view is
never evidence of corruption or permission to use stale bytes. Replacement or
an inconsistent/unproved view remains terminal. Cleanup uncertainty revokes a
payload even when the Native algorithm returned successfully.

The API remains one private read of two source-prepared DTOs; its structural
codec grants no source authority or finite-contact certificate. No dummy shape,
public positive flag, new registry/framework or automatic backend fallback.
Actual growth/cleanup/Native behavior still needs later complete qualification;
this decision does not invoke or emulate any of those transitions.
