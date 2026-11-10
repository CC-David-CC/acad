# Next assembled pin contract preparation — source only

This NEW helper has not been run, parsed, tested or built in this lane. It does not modify the old r1/r2 helpers, contracts, receipts, compiled input trees, staging trees, runtime defaults or capability tables. No generated next contract/hash/file count or staged availability is claimed. Base sourcea17780cfe2a1186ef13e2a56c5ac798b2265ce5e, own tooling/assembled-next-pin-contract-20261110 branch.

`prepare-next-contract.py` uses the committed `assembled-next-policy.json` and additive `assembled-next-inputs.json`. The original policy requires a separate contract review. Therefore derivation and pin preparation are separate operations: derive an exclusive NEW candidate JSON outside all source/build/stage/apps trees; Root reviews and commits that exact JSON in an acceptance checkout; only then `pins` accepts that committed contract and re-verifies the same actual tuple. A changed Worker/metadata/path/source produces a new contract, not a silent update.

## Preserved obligations and actual associations

The historical r2 contract's EVERY367 logical paths remain one-to-one, even if the supplied original known historical receipt has298 paths. Hash-named Workers map by the explicit role, not by an old hash or a guessed next hash. The actual original298 receipt must match its frozen bytes/SHA/tuple; an actual r2 pin file is also admitted only with the exact r2 tuple/full file map and its r2 contractSHA/selected count. No reduced/custom base is admitted. Base metadata is retained separately from the new source/Host/outer/Files/pins.

All seven retained emitted cohorts, all existing projection copies, changed verbatim arrangement/selection leaves and the actual flat selected-profile inputs are included. Every emitted component has an actual prepared component manifest, exact emitted/prepared record association, real Native JS/WASM/Worker identities, actual common bootstrap source and committed original `.sources`. The tool retains component properties/flags as metadata, not an advertised capability. It never invents a flat selected-profile component: prepared files, committed producer/literal Native pins and documented literal module rewrites are captured directly. Actual legacy hashed flat WASM association is selected by exact bytes/size plus its existing20-hex path grammar; no fallback to another pair.

Arrangement arithmetic producers are bundled Worker sources, not necessarily emitted raw `.mjs` copies. The supplemental matrix deliberately distinguishes them from actually verbatim emitted descriptors/selection leaves. Pattern, reference-measurement, shared Main/source-validator, entry/config and Host adapter sources bind actual clean source/Git blobs; main bundle and eight explicit Worker roles bind actual fresh generated cache bytes, Core dist, stage and catalog asset bytes. The complete CURRENT declared inner census is physically stream-verified in all three locations, including files outside the selected browser fetch-pin subset; no unselected staged asset is silently called verified from metadata alone. Host pattern/reference source copies also match the actual stage's copied Host files. Both actual outer app entries/styles/resources are stream-verified. Preserved global Host resource paths bind their actual Host source bytes and remain later whole fetch obligations.

## Custody and limits

The acceptance helper root, compiled Core checkout and Host checkout must be three different actual clean Git roots with explicit full HEAD commits, checked before and after. Run from the actual acceptance root. Actual dist `.rev` must equal Core commit; stage-pins and builder-config must point at those exact Core/Host/stage/apps roots. The isolated builder must include exactly CAD+Files, retaining old Files obligations. Every helper/policy/historical contract and changed source is a real committed Git blob. No tracked OR untracked source changes are allowed; ignored generated build/cache paths remain separate artifacts. The helper source itself and policy bytes are bound independently from the compiled source.

Metadata input is capped2MiB per file before bounded read, asset count20000, individual asset128MiB, declared staged inner census1GiB and streaming chunks1MiB. Large JS/WASM/bundles are never read into one buffer. Total bytes streamed can exceed1GiB because separate actual prepared/dist/stage/catalog copies are compared; that is bounded verification I/O, not a changed site or RAM quota. Source records are also bounded by20000. Core dist files excluded by the actual committed stager are outside this public inner-census proof; this is not a claim about total build/dependency cache disk use. Reported hash-stream bytes count file-hash reads, not subsequent small metadata reads or Git blob comparison pipes. No resident/peak memory performance claim is made. Metadata and all observed file identities and clean checkouts are fenced again around exclusive output. A late failure leaves the NEW output as failed evidence and returns nonzero; do not overwrite/retry it as a success.

This is offline source/build/stage custody. `.rev`, cache equality, source blobs and entry/config associations do NOT prove that a compiler transitively included each source, nor that the supplied build was executed by this tool. Root must retain its actual normal build/stage command/log/input custody separately. No source-as-bundle equality is claimed for bundled or rewritten text. No CAD code, importer, Worker, Native module, browser or Network endpoint is invoked. No geometry, account/Files settlement, full workflow or independent FIRST criterion is waived. The later whole must fetch these actual bytes and prove the actual geometry/lifecycle.

## Exact invocation after a fresh coherent Root build/stage

Choose actual paths and full OIDs from Root's retained build/stage receipt. The following variables are required inputs, not guessed candidate identities. Evidence/output paths must be outside all three checkouts and both stage trees. The old298 receipt shown is a retained actual input; both it and r2 history stay unchanged.

```sh
cd "$cad_acceptance_root"
python3 test/assembled-fixture-pins/prepare-next-contract.py derive \
  --base-pins /mnt/data10tb/codi-acad-multiprofile-pins-20261109-r1.json \
  --core-source "$cad_core_build_root" --core-commit "$cad_core_build_oid" \
  --desktop-source "$cad_host_build_root" --host-commit "$cad_host_build_oid" \
  --acceptance-commit "$cad_acceptance_oid" \
  --stage "$cad_stage_root" --apps "$cad_apps_root" \
  --output "$cad_new_contract_candidate"
```

Root reviews that complete candidate contract. Copy it unchanged to a NEW versioned path such as `test/assembled-fixture-pins/reviewed/next-contract.json` in a clean review acceptance branch and commit it. The helper/matrix/policy/historical contract bytes must remain identical; the review acceptance HEAD may differ because it now contains the contract. Then run, with the actual reviewed checkout/OID and the SAME immutable compiled/staged tuple:

```sh
cd "$cad_review_acceptance_root"
python3 test/assembled-fixture-pins/prepare-next-contract.py pins \
  --base-pins /mnt/data10tb/codi-acad-multiprofile-pins-20261109-r1.json \
  --core-source "$cad_core_build_root" --core-commit "$cad_core_build_oid" \
  --desktop-source "$cad_host_build_root" --host-commit "$cad_host_build_oid" \
  --acceptance-commit "$cad_review_acceptance_oid" \
  --stage "$cad_stage_root" --apps "$cad_apps_root" \
  --reviewed-contract "$cad_review_acceptance_root/test/assembled-fixture-pins/reviewed/next-contract.json" \
  --output "$cad_new_signed_pins"
```

Only derivation-acceptance location/HEAD and I/O byte count may differ between phases; the actual compiled/stage tuple, component metadata, selected records, source blobs, helper policy and every logical mapping must match. New pins remain metadata input for later whole execution, not qualification. No helper execution was performed while preparing this source packet.
