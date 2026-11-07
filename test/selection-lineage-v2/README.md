# Selection lineage v2

Base `4272ce584144a8b8eb85c0d9d94339d300b2c73d`. Owns only new `modules/engine/mount/selectionLineageIndex.mjs` and this directory, implementing agreed `test/mechanical-profile-app-integration/SELECTION-V2-NEXT.md`. No transport/native/model/UI/history/Save integration changed.

Exports `liftPrismSelectionIndexV2`, `deriveBooleanSelectionIndexV2`, `deriveEdgeSelectionIndexV2`, returning private `{plan,resolveVertex,resolveEdge,resolveFace}`. Lift requires genuine initial v1 feature/region equality. Boolean uses exactly two sources; unary uses exactly one through shared `reconcileNativeSelectionClaims`. Original data is captured once; the core recaptures detached data only. No dummy source or key parsing.

Plan v2 has flat sorted/deduplicated sketch-profile sourceContexts, no top regionId, and descriptors with actual originFeatureId. Keys/role/curve metadata persist; geometry comes from result catalog. Detailed unresolved rows preserve first-failure featureId/origin and strict deletion-evidence union (old Boolean flag or actual ordered input observations). Conflicting origins/metadata/prior histories and unresolved-versus-resolved IDs refuse `SELECTION_UNAVAILABLE`. Aggregates recalculate. Blend naming follows qualified v1 attribution across all native source-edge rows. Initial vertices remain unnamed.

Strict plain own-data capture caps input/output independently at 524288 actual UTF-8 bytes. Keys retain 16384 UTF-16 units; contexts cap32, capture depth24/nodes131072/arrays4096/recordkeys32. Native bounds1024 vertices/512 edges/256 faces; selected edges1–16; unresolved total4096. Resource refusal is `SELECTION_RESOURCE_LIMIT`, integrity `ENGINE_FAILURE`; neither declares valid geometry invalid. Producer/origin/history authenticity remains the real caller's responsibility.

`final-run.json`: 29 PASS groups in an actual Node Worker. Ten replay frozen genuine prism/edge and six main Boolean records; nineteen labeled synthetic schema/conflict/resource controls. Exact snapshot524288B passes,524289B refuses; output514529B. Multibyte and independent output expansion guards pass. Earlier successful checkpoints are retained; no failed test run occurred.

Native excerpt parent receipt SHA256 `7a445e90c397b2e3c54b2b8355f5fab2588aa1afa8c853576da2d7322cda2598` (native proof72c54304). Extractor guards digest. Tests re-prepare original V3 values exactly and bind actual construction provenance/catalog through qualified helpers. Feature/region/curve names are explicit component caller fixtures, not recovered public IDs. No kernel operation or public authored model is created. Synthetic controls claim no geometry result.

Run `node test/selection-lineage-v2/run.mjs /tmp/selection-lineage-v2.json`. Receipt pins helpers, dependencies and fixtures. Full Gate1/all22, semantic holes, real app/history/Save, and handoff/backups-then-pause remain open.
