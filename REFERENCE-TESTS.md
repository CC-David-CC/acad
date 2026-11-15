# Owned original reference tests

These33 original test files belong to acad because their imported source modules match this repository’s exact captured blobs. Current implementation files and assertions are unchanged. Import and proven fixture/resource URL locators are ported to this repository; no cross-repository private source imports or compatibility path shims are added.

Mechanical source-test baseline `adcd54b1032d0cb28366a7f2ba4e5068235d9e1e`; merge `b395f1e8c9c4f2701d4cf5934785d7026acc26b8`. Private phase44 preserves earlier paths, explicit copy boundaries and source-to-result commit/ref maps. The locator-normalized complete AST is unchanged, not just selected assertions.

Run `npm run test:reference`. This is Node unit/reference qualification of the retained domain modules, not browser/worker/kernel/renderer/storage/authentication/human-agent acceptance. Current app hosting/build and shared-operation integration gates remain separately open.

Captured baseline and current port: 214 pass, 3 fail, 0 cancelled, 0 skipped across 217 reported Node subtests. Top-level assertion-only files count as one reported Node subtest, not individual assertions.

Three failures are preserved from the exact captured source/test baseline; no assertion is weakened or omitted. These tests describe the maintained ACAD snapshot from the old jsketcher-named path. Original JSketcher remains a separate repository. This does not qualify Gate1, actual kernel/worker or current Desktop compatibility.

Existing captured-snapshot failures:
- malformed value, extra addressing fields and absent locators refuse before dispatch
- discovery, plane and all primitive kinds use same guarded craft and detached data
- register five explicit selected-profile commands with data-only schemas and no fallback/save payload
