# Exact assembled fixture pin preparation (source only)

This helper is NOT executed or qualified by this source packet. It prepares metadata only; no CAD/Native/browser/test execution, no asset deployment, no fixture/account mutation. Root reviews it before executing once against the existing immutable staged fixture.

Frozen producer: Core `556cc3553ffbb4d881463b7efd650bb87d914172`, Host `0fee14964910613df24df860369a22f751c6b92a`. Actual apps manifest at `/mnt/data10tb/codi-acad-assembled-stage-20261110-r1-apps/apps.json` has SHA256 `f03930d19b067aca3bd3350c9916c798cefae68843b84ee213654053a136940a`. Actual new Jsketcher outer bundle is `017f9ab706dd15fa1a2a5a5d09bbcacf6ec61a277a04e204441f4fedebbb6b33`; entry SHA `47f954f77c9ab28cfacabd36669f518b82e177d3e7c824ec271e330b2a180fb5`. Files app tuple remains its real `ee2a712c…/96b36034…` tuple; no guessed copied identity.

Historical input `/mnt/data10tb/codi-acad-multiprofile-pins-20261109-r1.json` is exactly 298 entries, 43,252 bytes, SHA256 `2b5368247522dc75099c8ced55c2ce510fac2a95a5f8c3d79e15d2b6bcb54808`, Core14299d0/Host1a2435f. It remains byte-for-byte untouched. Every old logical pin survives; five content-hashed Worker filenames are mapped to their unique ACTUAL current manifest role, while current bytes/hashes are explicitly updated to the newly compiled producer. The new output embeds the complete original pin receipt and its SHA/byte custody plus all old→current mappings. It never pretends rebuilt files have unchanged old hashes.

## Bounded selection and cost

`assembled-r1-contract.json` freezes the actual manifest records, source HEADs, stage/builder metadata and seven component manifests. Selected browser map is exactly **367 paths / 314,931,800 bytes**, versus all660 inner files /681,003,868 bytes. This preserves all298 old logical obligations and adds69 paths: complete currently emitted six retained cohorts (manufacturing, Shell, circular, adaptive, mechanical Native, finite query), complete25-file genuine analytic cohort, every42 actual projection identity/frame/intent resource copy across all retained graph namespaces and legacy flat rewrites, and the actual hashed prism-semantic Worker (previous receipt omitted this new projection dependency). Main/sketch/physical/project/archive/manufacturing Workers retain their current manifest pins. No unrelated images/fonts or unused large Native cohorts are added by walking the entire asset tree.

Actual Native analytic pair remains JS `717767d46f3f260b1458d702e1e61d2a1a90f6e3c48400ac5943a11db577c484` / WASM `47c9d4c96b61ba1a2792c72ccf1b7f2e22d5faa5b50948db144032436edeba25`; all25 emitted analytic files, including actual source/world/provenance/branch/arithmetic closure, are pinned. Distinct legacy flat projection hashes are retained honestly beside verbatim modern graph copies.

Prepared component manifests can include non-emitted producer roots (e.g. manufacturing has95 prepared files but67 actual emitted app assets). The contract pins the complete prepared manifest bytes and binds EVERY actual emitted record to it; it does not request nonexistent app URLs for unused roots. The analytic stage emits its entire25-file manifest and must match exactly. Existing build/factory closed-resource checks remain authoritative; this tool neither widens availability nor invents kernel capability.

The helper streams ONLY the367 frozen selected files once, plus both actual outer entry modules: **318,330,079 bytes** in1MiB chunks. No 681MB traversal/hash, no network fetch, no JS/module eval. Future existing `h.pinFiles(Object.keys(pins.files))` checks only this exact selected map per context (~300.3MiB, not649.5MiB); this packet does not drop inherited pins, alter the harness, share browser contexts or claim a new memory qualification. Further per-workflow reduced maps would require a separate explicit scope decision and are not silently substituted here.

## Exact Root recipe, after review

Run the committed helper from its own clean source branch/worktree; it records its actual repo/commit/path/Git blob/bytes separately from the immutable compiled producer. All input paths are exact frozen inputs; use an exclusive new output OUTSIDE producing source/fixture directories. Do not overwrite old pins.

```sh
python3 /mnt/data10tb/codi-acad-source-projection-20261109/test/assembled-fixture-pins/prepare-pins.py \
  --base-pins /mnt/data10tb/codi-acad-multiprofile-pins-20261109-r1.json \
  --apps /mnt/data10tb/codi-acad-assembled-stage-20261110-r1-apps \
  --stage /mnt/data10tb/codi-acad-assembled-stage-20261110-r1 \
  --core-source /mnt/data10tb/codi-acad-assembled-20261110-r1 \
  --desktop-source /mnt/data10tb/codi-desktop-assembled-20261110-r1 \
  --output /mnt/data10tb/codi-acad-assembled-pins-20261110-r1.json
```

The helper verifies exact Core/Host HEAD and clean tracked sources before/after; historical pins and actual catalog/stage/builder/component bytes; complete selected cohort/projection/Worker censuses; current app→stage→component associations; actual SHA/size for selected physical files with before/after file-stat identity; and unchanged tool Git bytes. Output uses exclusive `xb`, flush+fsync. A mismatch produces no successful pin output. Known partial output on disk write/fsync failure is preserved, never retried/replaced automatically. Prior source/runtime/receipt artifacts remain intact.

Root must retain helper stdout/stderr and actual output SHA as preparation custody. Only then use new pins.source/pins.desktop as exact expected runtime values and use those corresponding immutable source checkouts with the whole driver's strict compiled-checkout roster. The new helper commit is a separate metadata producer, not a retroactive runtime source pin. Existing historical pin files/receipts remain valid for their original producers. This helper does not run or qualify the eventual whole/artifact oracle.
