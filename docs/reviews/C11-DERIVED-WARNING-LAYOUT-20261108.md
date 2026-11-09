# CAD-DRAWING-ERROR-LAYOUT-01 — bounded derived warnings

Confirmed actual artifact defect, not inferred from a synthetic fixture. Root
qualified the finite bore whole R3 and source/Native/archive oracle in proof
`e98166d62f9bd14fffb643772b8b5f6db87966a1`. Root rendered/reviewed all14 SVGs;
original-invalid-reference.svg and translated-negative-invalid-reference.svg
show four unresolved bore-center warnings stacked at their SAME view.paperOrigin.
Native views, physical facts, source/history/.cad custody and the unresolved
reference result were otherwise correct. Original artifacts/checker failures
remain preserved; no retroactive presentation PASS is asserted.

## Cause and narrow source change

`web/app/cad/export/linkedPartDrawingSvg.mjs` previously chose view.paperOrigin
for EVERY unresolved bore-center annotation because a center mark/axis has no
authored paper label. Multiple errors in one view therefore shared one baseline.

Only these no-authored-label errors now collect in an observation-local derived
SVG legend, in authored annotation order. Full actual annotation ID, view binding
and first Native/reference reason remain present. Authored dimension, baseline,
ordinate and callout label positions are retained. Available center marks/axes,
Native HLR paths, physical values, nominal text, view origins and sheet scale are
unchanged. With no fallback errors, the rendered path/text/metadata expression
is byte-for-byte unchanged by source construction; this is not a new runtime
comparison claim. No saved layout/status field, second model, geometry rewrite
or Native/controller/PM/host change is introduced.

Physical legend policy (paper mm): font3 monospace, declared1.8 advance through
SVG textLength/lengthAdjust,4 baseline step,8 left/right margins and10 footer
reserve. Wrap full messages at min(120,floor((width−16)/1.8)) Unicode code points;
never truncate identity/reason text. Baselines end at sheet.height−10 and start
at≥16, with≤256 complete lines. SVG text/tspan attributes bind each exact error
and view. No warning is quietly dropped, merged or placed at an old view origin.
A sheet without physical legend room refuses RESOURCE_LIMIT during presentation
before any My files write; its structurally valid authored/native document still
persists and opens. This tiny-paper branch is explicitly source-defined and not
claimed runtime-qualified by the finite594×420 whole fixture. Existing16MiB SVG,
64KiB metadata, Native view/transfer limits and all geometric tolerances remain.

## Lifecycle invariant and whole regression

The geometry/reference lifecycle remains discovered→authored→recomputed available
or unresolved under the same current document/producer/source/slot/owner. This
fix affects ONLY unresolved→visible-warning presentation: every current missing
center/axis fact has a unique legible derived row, while rejected edits retain
the last good source and no ghost measured mark/axis is drawn. An error is not a
new persisted drawing state or a successful Native measurement.

The existing complete two-family bore workflow stays intact. The artifact oracle
is extended to require exactly ALL FOUR corner-mark errors in EACH invalid-ref
SVG, complete message membership, distinct bounded fallback baselines/text boxes,
authored error-label positions and the old positive mark/axis/layout calculations.
Split/consume one-wall warnings use the same derived rule. No geometry, Native
point, source equation, .cad equality, creation/edit/repair travel, first failures,
or budgets are removed or relaxed. Root must run the complete affected workflow,
then the independent archive/analytic/XML checker and inspect actual outputs.
No micro rendering probe substitutes for that workflow.

Source base e98166d. This lane performed NO tests/probes/TSC/build/browser/Native
execution. Section/detail planning remains secondary to actual workflow findings.
Ordinary leader placement/professional automatic layout is a separate open item.
