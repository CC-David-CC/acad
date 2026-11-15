# Midpoint and directed angle groups

`sketch-constraint-groups.mjs` exports `createSketchConstraintGroupsExample`.
This is source prepared for the complete composed workflow; it has not been
executed against a new signed runtime. Importing it performs no authoring.
Use an outer-page public command API and a new empty CAD document:

```js
const recipe = createSketchConstraintGroupsExample({windowId});
console.table(recipe.discover());
const midpoint = await recipe.buildMidpoint();
await recipe.resizeMidpointSource(midpoint, 4);
await recipe.travel('undo');
await recipe.travel('redo');
await recipe.addIndependentAxisSymmetry(midpoint);
await recipe.save('/Midpoint.jsketcher.json');
```

The first source is a genuinely anchored rectangle with bottom A(-1,0), B(1,0).
An appended P(0,5) must become (0,0): both coordinates of `2P=A+B` are required.
Changing the discovered bottom length to4 moves B to(3,0) and P to(1,0).
A separate Point(7,9) remains unchanged. Independent-axis reflection is a
separate `AxisSymmetry` operation: fixed P(20,2) reflects Q to(20,-2) about the
actual bottom supporting line. `Symmetry` is only a legacy midpoint alias.

In a separate empty document:

```js
const angles = await recipe.buildAngleChain();
await recipe.editAngleChain(angles, 40);
await recipe.travel('undo');
await recipe.travel('redo');
await recipe.save('/Angle-chain.jsketcher.json');
```

The chain uses the fixed bottom A, a length10 segment B initially30degrees,
and a separately anchored length10 segment C initially80degrees. The existing
A/B30degree relation is reused; a complete30degree group must move C to60degrees.
Editing the same group to40degrees must give B40/C80 as one accepted transaction.
All endpoint and segment IDs come from real public receipts and inspection;
there are no generated endpoint suffixes or saved constraint-locator guesses.

Initial group scope is one nongenerated ordinary analytic sketch stage,2–16
segments, numeric angles strictly between0 and180degrees, positive segment
polar directions and no crossing of the directed zero/360degree branch. Typed
angle expressions and general wrapped-angle branches are not advertised. Human
midpoint/angle actions and these commands share the same transaction admission.
The existing authored sketch-byte journal owns creation/edit Undo/Redo. Normal
Save/Open persists the actual native constraint definitions, not this helper or
inspection locators. The helper pins its window/document for its whole lifetime.
