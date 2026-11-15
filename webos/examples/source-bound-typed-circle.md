# Typed Circle source example

Qualified finite workflow43021 and FIRST independent source/archive/cylinder
oracle PASS, ACAD1e8856c actuald790011/3ce2fec55. Not full Gate1.
Importing the example does nothing. It creates a real Circle on a genuine empty
XY plane, discovers and consumes its actual region, then binds the existing
RadiusLength and extrusion depth to named typed lengths. No rectangle surrogate,
private source writer, automatic Save or backend substitution is used.

```js
import {createCadAgent} from './cad-agent.mjs';
import {createTypedCircleExample} from './source-bound-typed-circle.mjs';
const agent = createCadAgent({windowId});
const candidates = await agent.execute('inspect-selected-profiles');
// Choose an actual staged profileVersion3 engineRevision from discovery.
const recipe = createTypedCircleExample(agent, {engineRevision});
const binding = await recipe.build(); // new empty unsaved document required
await recipe.bind(binding);
await recipe.replaceRadius(6); // height =4*radius; physical unit remains mm
await recipe.save('/Typed-circle.cad');
```

The agent pins the window/document token. Create a new agent and recipe after
an external New/Open. `recipe.open(path)` uses the existing explicit agent Open
transition. All IDs originate from real public receipts. The extra Point stays
unrelated; no global fully-constrained claim is made. Names `occ` and
`millimeter` are legal parameter names and do not change literal engine/unit
fields. Rectangle width/height controls are unavailable for this Circle.
Shared Undo/Redo and display units use existing operations; derived quantities
and Native observations remain separate authorities. Other typed feature
families and derived arrangement cells retain their explicit refusals.
