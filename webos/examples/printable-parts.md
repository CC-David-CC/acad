# Named printable parts and materials

Source integration only: discover the commands in the installed build before use.
The adapter requires the matching shared manufacturing transaction in Core314514d85
or later. A successful assignment does not certify generic3MF export. Save and
server synchronization are separate operations. Native geometry and actual browser
qualification remain tracked in the canonical work queue.

Use the existing document-bound `createCadAgent` helper in the outer desktop page.
Given `agent` for the chosen CAD window and exactly one current supported body:

```js
const info = await agent.execute('inspect-printable-parts');
const choices = info.targets.filter(target => target.canAssign);
if (!info.ready || choices.length !== 1) {
  throw Error('Choose a single supported current output first.');
}
const body = choices[0];
const receipt = await agent.execute('assign-printable-parts', {
  revision: info.revision,
  materials: [{id: 'pla', name: 'PLA'}],
  appearances: [{id: 'blue', name: 'Blue', color: '#3366ff'}],
  parts: [{id: 'plate', name: 'Mounting plate', regions: [{
    id: 'main', bodyId: body.bodyId, featureId: body.featureId,
    materialId: 'pla', appearanceId: 'blue'
  }]}]
});
// The model remains unsaved. This is the ordinary shared authored journal:
await agent.travel('undo');
await agent.travel('redo');
await agent.save('Projects/mounting-plate.jsketcher.json');
```

Part IDs describe independently arrangeable manufacturing objects. Several regions
inside the same part describe aligned material regions; multiple parts describe
separate objects. Discover existing assignments before replacing the generic part
set. The manager rejects unsupported producers, stale revisions, identity conflicts,
missing definitions, and unsupported placements. Null material/appearance remains
explicitly unknown. Never retry a rejected operation carrying `committed` or an
uncertain file result without inspecting current state.

Adapter tests use a manager protocol fixture:11pass including the retained enclosure
commands, older-runtime refusal, stale account/window cancellation, registration
cleanup, and preservation of committed/falsey errors. Core separately qualifies its
real manager/Craft/Worker transaction; neither fixture alone proves browser use.
