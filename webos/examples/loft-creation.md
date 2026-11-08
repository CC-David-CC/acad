# Unequal-rectangle loft example

Exact recipe bytes from qualified whole42040/FIRST independent oracle,
ACAD150f399, actualCoreb097185/Desktop00e12613a. Start a normal fresh project
with its existing document-bound createCadAgent. Select the actually advertised
adaptive engineRevision ed06b634.../bc8895ce..., without an automatic fallback.
Import createLoftCreationExample from loft-creation.mjs:

```js
const api = {
  execute: (id, args) => agent.execute(id, args),
  inspect: async faceId => {
    const s = await agent.execute('inspect-closed-sketches');
    return agent.execute('inspect-closed-sketch', {revision:s.revision, faceId});
  }
};
const recipe = createLoftCreationExample(api, engineRevision);
const sources = await recipe.sources();
const {result} = await recipe.create(sources);
const part = {...sources, featureId:result.featureId, bodyId:result.outputId};
await recipe.width(part, 100, 120);
await recipe.plane(part, 40);
await agent.save('/Unequal-sections.cad');
```

Await each step. The inspection convenience method above uses public commands;
it is not an extra createCadAgent built-in. Two actual unequal rectangles and
real advertised vertex seams are discovered; opaque IDs are never parsed or
constructed. Save/Open stay explicit; renew the agent after external New/Open.

The complete workflow proved immediate actual LOFT creation removal/restoration,
16shared travels,250Native taper/material/cap classes, four refusals/two no-ops
and three.cad browser/server/fresh signed Open/reedit cycles. Canonical evidence:
ACAD/test/loft-creation-public-workflow/evidence-r1. Native/source budgets are
retained. This is not arbitrary topology conversion/typed loft/all-engine/human
UI/Gate1 qualification. The unedited final screenshot exposes tiny default part
framing; combined G10 viewing/framing remains open despite correct geometry.
