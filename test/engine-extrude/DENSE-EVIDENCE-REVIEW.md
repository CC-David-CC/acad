# Profile response array validation

On baseline 70856759, a Chromium test that intercepted a Worker response and
removed one array entry independently from `surfaceTypes`, `loopLengths`,
`edgeUseCounts`, and `edgeFaces` observed successful operations in all four
cases. The forged data was introduced at the message boundary; it was not a
real OCC result. Sparse arrays can cross a Worker structured clone.

The controller now requires present entries for each expected array element,
including each loop, and requires four distinct authored source IDs. The same
test checks each sparse case and a mismatched source ID returns
`ENGINE_FAILURE`, then refuses further work with `MOUNT_CLOSED`.

The focused lifecycle browser test and actual solver-to-OCC profile browser
test passed against the pinned portable wrapper and WASM. This is response
validation, not a substitute for kernel or persistent-topology validation.
