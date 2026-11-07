# Source-bound plate and linear-hole pattern

This recipe uses one generic owned OCC part, one authoritative source rectangle,
and registered commands shared with agents and the application. It does not use
the older separate-mount bracket helper. Start with a new empty CAD window.
The module is source-only until included in a qualified desktop bundle; import
its served URL from that bundle, rather than assuming the current site has it.

```js
import {createSourceBoundPatternExample} from './source-bound-pattern.mjs';
const example = createSourceBoundPatternExample(); // Select windowId if several CAD windows exist.
const binding = await example.build();
// Rectangle100×50, extrusion20, centerD10, four cornerD4 at8mm offsets,
// twoR3 fillets, two1mm chamfers, then count3 INCLUDING the seed at20mm spacing.
await example.resize(binding, {width:150, height:30, depth:25});
await example.editSeed(binding, 14); // Also changes the two derived pattern bores.
await example.editPattern(binding, {count:2, spacing:30});
await example.travel('undo');
await example.travel('redo');
await example.setDisplayUnits('inch'); // Presentation only; authored geometry stays in millimeters.
await example.save('/Source-bound-pattern.jsketcher.json');
```

Every source/region/edge/seed/target ID is discovered from current registered
commands. The opaque region ID is selected only when exactly one supported
region exists. The four original line connectors are selected from their actual
public records: one and its unique opposite (disjoint incident curve IDs) receive
fillets, and the remaining two receive chamfers. No endpoint or qualified curve
ID is constructed by the caller. The returned `binding` contains public semantic receipts, not
native indices/handles or a second editable model. Reopened files can be
reinspected with the public history commands; preserve the binding only for the
same document and semantic feature identities.

The pattern direction is source-local positiveX; count includes the existing
centered-through seed. Count1 is explicitly unsupported until an owned identity
result is qualified. Additional bores must fit the source/current target without
overlap, and full replay must fit the native work/triangle budgets. A refusal
must preserve the previous accepted model. Do not retry an uncertain or
committed failure automatically. The example stops at the first failure and
keeps earlier accepted steps, so it is not a single multi-feature transaction.

A cancellation signal stops subsequent example steps; the registry and shared
commands own in-flight cancellation and committed-outcome reporting. Run one
example operation at a time. File sync and reopen are separate from Save's
browser-persistence receipt. This example does not establish manufacturing
fitness or independent native validity; the signed acceptance driver applies
separate numerical and saved-intent checks.
