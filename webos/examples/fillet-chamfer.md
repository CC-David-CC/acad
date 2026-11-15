# Fillet and chamfer example

Exact recipe from qualified full E11 workflow14232, proof ACADfa6dc2b,
actualCored790011/Desktop3ce2fec55. Importing it does nothing. Start a normal
fresh project with its existing document-bound createCadAgent and an actually
advertised supported engineRevision. Import createFilletChamferExample:

```js
const recipe = createFilletChamferExample(agent, engineRevision);
const part = await recipe.plate();
part.fillet = await recipe.create(part, 'fillet', 3);
part.chamfer = await recipe.create(part, 'chamfer-equal', 1);
await recipe.edit(part, 'fillet', 4);
await agent.save('/Treated-plate.cad');
```

Await each operation. The recipe discovers actual opposite connector edges,
source/regions/outputs; no opaque-ID parsing or Native ordinals. It includes
one centered/four corner holes. Save/Open remain explicit; create a fresh agent
after external New/Open. Full creation/edit/refusal/travel and three.cad cycles
passed FIRST independent source/archive/analytic Native oracle,975point classes.
No arbitrary curves/contact/typed treatment/all-engine/human gesture/Gate1 claim.
Canonical evidence: ACAD/test/fillet-chamfer-public-workflow/evidence-r1.
