# Through-hole creation Undo: dynamic authored keys

The complete retained plate/material/native Save/export workflow on Core7ba1f6e7c failed before materials, while undoing the actual newly created centered-through hole. Public error: TypeError reading kind of undefined. The append comparator called appendKeys(current.type) without the validated current parameters. The through-hole schema legitimately derives offset fields from parameters.kind. Selected extrusion keys are static, which is why the32-hole selected-extrusion creation control passed without exposing it.

Pass captured current.params into the same key selector used by append capture and accounting. This preserves exact current-vs-recorded identity/dimension comparison, including four-corner offsets, and retains the existing shared chronology. No format changes, defaults, fallback, relaxed error expectation or new history stack.

Source repair only; complete plate and two-object export workflows must run after coherent app rebuild. Existing failure receipt is retained; no per-step tests.
