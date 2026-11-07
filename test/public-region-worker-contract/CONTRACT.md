# Narrow next contract: authored selected-region extrusion

Status: proposed implementation queue, not implemented by this test-only branch.
Keep one authoritative authored document, feature history and sketch solver.
Reuse existing persisted region descriptors. Extend the common modeling
interface; do not add another hardcoded rectangle/circle demonstration.

## Admission and model ownership

1. [ ] Expose revision-bound public region discovery with descriptor ID, source
   face ID, exact analytic boundary kinds, and **per-backend** support or a
   machine-readable refusal reason. Region existence, solver status and backend
   support must be separate fields. Do not label a valid unsupported region
   invalid geometry. Offer an executable candidate only after the same bounded
   planner used by execution accepts its whole request, including frame and
   unselected ordinary geometry.
2. [ ] Public authored intent selects current region IDs, source face, depth and
   units, chosen kernel, and explicit body policy (`separate` / `union`). Define
   whether union permits disconnected multi-solid results, requires a connected
   result, or refuses that case; never silently arrange or merge parts.
3. [ ] Resolve the descriptors against a Worker-solved, current source and exact
   boundary/frame revision. Keep the existing source digest, parameter binding,
   candidate owner, cancellation and publication checks. Preserve no-write
   failure behavior and the documented never-reused feature-ID high-water policy.
4. [ ] Extract ordered geometric boundaries from the accepted sketch contours;
   sorted IDs in descriptors express identity, **not geometric traversal**.
   Preserve exact solved coordinates. Never replace a near-rectangle with its
   classifier bounding box or close a gap merely because it is small.
5. [ ] Preserve access to unselected source regions after an extrusion. The
   existing whole-plane consumption is insufficient if another disjoint region
   must be extruded later. Persist explicit source/feature references and test
   subsequent region selection rather than duplicating editable source models.

## Common kernel boundary

6. [ ] Add a typed, versioned selected-profile extrusion request/capability to
   `SolidKernel`, with explicit analytic boundaries, frame, units, result shape
   handles, operation errors and resource ownership. Generalize the existing
   verified Worker transport/binding; do not call UI or private in-page OCC.
7. [ ] Qualify one actual backend first (OCC is the current intended primary).
   Other engines advertise unsupported until independently implemented and
   qualified. Reconstruct the **whole part history** on a selected engine. An
   explicit alternate-kernel reevaluation can compare independent results; no
   hidden per-feature fallback or repeated cross-kernel conversion.
8. [ ] `separate` returns independently addressable authored outputs and owned
   handles, one per selected region according to the defined policy. A single
   multi-solid handle/container is not several independently selectable bodies.
   Stable output identity derives from feature + authored-region identity,
   never array indices or raw kernel face numbering.
9. [ ] Remove constant six-face / four-straight-edge / eight-vertex assumptions
   from the generalized path. Report available analytic geometry and topology
   evidence honestly; circles, annuli and periodic seams differ from rectangles.
   Do not fabricate rectangle roles for curved outputs. Distinguish topological
   partition differences from measurable geometry defects.
10. [ ] Close all owned handles/mounts on abort, stale source, failed proof and
    document close. Preserve the previous valid authored/history/model state.
    Cancellation must remain current through final publication, not only before
    launching a Worker.

## Bounded first acceptance corpus

| Case | Independent expected result / required control |
|---|---|
| One 10 × 10 rectangle, depth 5 | One valid prism, bounds 10 × 10 × 5, volume 500 mm³. |
| One circle r10, depth 5 | One valid cylinder, analytic volume 500π mm³ and ±10 radius bounds. |
| Concentric r30/r20/r10 | Three descriptors; outer annulus, middle annulus and central disk selectable independently. Selected regions determine empty/filled space; nesting alone does not. |
| Annulus r20 minus r10, depth 5 | Through opening retained, volume 1500π mm³; inspect the opening independently of display triangles. |
| Disjoint 10 × 10 rectangles | Selecting either alone succeeds without including the other. Selecting both under separate policy yields two independent outputs, each volume 500. |
| Adjacent annulus + its interior disk | Policy explicitly defines touching outputs / union; no unintended hole or silent non-manifold merge. |
| XY / XZ / ZY transformed frames | Exact placement and right-handed normal/extrusion direction, or honest unsupported discovery before submission. |
| Thin .0005 × 1 rectangle | Exact authored projection first; backend acceptance/degeneracy separately established under documented tolerances. |
| Open, crossing, coincident, touching or too-close contours | Explicit supported decomposition or precise refusal, source/model/history retained. No general arrangement claim for the current conservative planner. |
| Dimension / parameter edit | Deterministic regeneration, selected-region identity retained if unchanged; changed outer/hole membership requires explicit repair/reselection. |
| Stale revision / stale descriptor / source replacement / close | No late publication, no leaked native owner/mount, prior valid model preserved. |
| Undo / redo / native save-reopen | Authored region choice, kernel choice, body policy, references and downstream identity survive; derived mesh is not the editable source. |

Test these through public discovery and commands with independent analytic
oracles. Backend agreement is useful cross-evidence, not proof. An
underconstrained sketch can still define a valid region; a fully constrained
sketch can still have invalid topology. Preserve those separate diagnoses.
