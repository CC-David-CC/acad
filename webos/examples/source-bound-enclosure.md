# Source-bound enclosure BODY and separately printable inset-label LID

This is a reusable ordinary public-command example, not an assembly. It creates six real authored features on one explicitly selected SHELL build: body source box80×50×30 at[0,0,0], inward2mm shell with its genuinely discovered box-builder Z_MAX face removed, lid base80×50×4 at[100,0,0], real subtract tool30×20×3 at[125,15,2], and flush label30×20×2 at that same origin. The two printable parts contain three regions: body/main PLA, lid/main PLA and lid/label PETG. Reusing local main names and the same PLA material pair is intentional.

```js
const {createSourceBoundEnclosureExample, SHELL_ENGINE_REVISION} = await import(actualCadAppModuleUrl);
const example = createSourceBoundEnclosureExample({windowId, engineRevision:SHELL_ENGINE_REVISION});
const binding = await example.build();
await example.assignMaterials(binding);
await example.save('/Enclosure.jsketcher.json');
await example.editBodyWidth(binding,100);
await example.editLidWidth(binding,100);
await example.editThickness(binding,3);
await example.editPocketWidth(binding,36);
await example.editLabelWidth(binding,36);
const reviewed = await example.rebindMaterials();
await example.save('/Enclosure.jsketcher.json');
```

The actual bundled module URL/window ID come from the mounted Desktop, not a guessed runtime. The recipe uses the existing document-pinned createCadAgent, captures actual returned/discovered source/body/face/producer IDs and routes every mutation through the registered shared commands. No caller Native ordinal/handle/source seed, substitute shape, hidden geometry repair, fallback backend or separate model is used. Each source edit is intentionally a separate transaction; between pocket/label edits the geometry may be a temporary underfill and is not claimed exportable. Use shared travel('undo'|'redo') normally. Explicit material rebind retains current part/region/material identities and is itself in the shared authored metadata journal.

The whole model must use the currently staged explicit SHELL cohort; the example refuses another revision. It preserves a single authoritative history and native Save/Open. STEP/3MF exports are derived artifacts and remain separate from native editable project Save. Use the normal current inspect-manufacturing/export-core-3mf command to export to My files after all intended geometry edits and rebind settle.

This source has not been executed or qualified by itself. The complete acceptance driver/oracle are under test/agent-cad-corpus/source-bound-enclosure/. Parent composes/builds and runs that whole workflow. Native component and prior shell/inset proofs do not establish this combined model. There is no automatic print, slicer, fit/tolerance, hinge, fastener, physical manufacture or assembly constraint claim. At width100 the body reaches the lid's x100 placement; they remain distinct requested printable parts/build items, with no union or implied assembly relationship.
