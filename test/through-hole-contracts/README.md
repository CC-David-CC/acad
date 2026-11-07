Pure host contracts for through holes
====================================

Base: `982db0619566116ff985fc63ad24d70b30e4d96d`. Owned product files are only
`engineCatalog.mjs`, `SolidKernel.ts`, `selectedProfileBudget.mjs` and
`selectedProfileBuildSelection.mjs`. No Worker, native, ledger, operation,
facade, SDK, UI, default-engine or saved-intent changes.

The existing explicit Boolean-history build gains `throughHoleVersion:1`.
Its native JS/WASM revision stays `dd666902…:8d5e537e…`; the actual root
controller already advertises the matching descriptor. Mount admission now
requires `solid.holes.through` v1, both exact kinds, source
`selected-rectangle`, termination `through-all`, and exact numeric
`nativeResultCost` values 2/8. Dense own-data kind arrays and exact plain
cost maps reject malformed metadata without invoking tested getters.
Historical builds and default selection retain their prior identities.

`KernelThroughHole` intersects the shared `OwnedHoleIntent` declaration with
the op and two transient ownership handles. It joins `SolidRequest` and its
result joins `ShapeResult`. The authored parser still captures exactly 12
centered or 14 corner fields; runtime handles, solved tool geometry and tool
extent are absent from saved intent. Runtime capture remains authoritative;
TypeScript is a static aid, not exact-object validation.

`WORKER_THROUGH_HOLES_V1` now owns whole-part backend identity even when
earlier outputs are consumed or empty. Mixed builds refuse rather than fall
back. Choosing an old recorded build does not grant it hole capability.
Native-result accounting reads an own enumerable primitive `kind` and charges
2 centered or 8 corner names, including temporary tools/intermediates.
Existing generic costs stay 1; legacy separate mounts stay separate. The
32-name inclusive replay limit is unchanged. `canAppend` remains the generic
one-result availability flag: callers must check the prospective 2/8 cost
before appending a hole operation. Budgeting does not validate the full intent,
source ancestry, material, geometry or mount capabilities.

Run from the source checkout:

```sh
/tmp/codi-files-move-node/bin/node test/through-hole-contracts/verify.mjs
```

Override `THROUGH_HOLE_TSC` with another qualified TypeScript CLI path if the
default local compiler is unavailable. The runner executes 12 new metadata,
capture, accounting and backend controls plus 8 retained catalog/budget
controls; checks new and previous Boolean type fixtures with TS4.7.4 strict
and exact optional properties; and verifies that the type-only import is
erased. `receipt.json` records the exact inputs, command flags and results.
Mount stubs never execute geometry. No native/browser/authoring qualification
or full Gate 1 pass is claimed here.

The source app uses CommonJS compilation. An initial standalone NodeNext
check rejected this type-only `.mjs` import from the CommonJS-classified
`SolidKernel.ts` (TS1471); it is not the app's compilation mode. Shared types
are preserved without duplicate declarations or suppression. An initial
negative TS fixture spread a discriminated union; TS4.7 accepted its optional
`never` fields after changing the discriminator, so the corrected test uses an
explicit malformed literal. Runtime exact capture is independently tested.

The earlier `test/boolean-history-catalog/catalog.test.mjs` success stub lacks
the now-required through-hole descriptor. Its historical/default coverage is
represented here with complete current metadata; that obsolete fixture is
outside this lane's ownership. Likewise the older polygon-history test's
empty-history default expectation predates the root's Boolean-build default.
Neither old test file was edited or silently reported as passing.
