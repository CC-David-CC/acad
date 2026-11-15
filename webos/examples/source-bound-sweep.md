# Source-bound sweep example — pending signed-runtime qualification

The app entry exports `createSourceBoundSweepExample`. This source recipe is
not yet a deployed or qualified workflow. Discover the installed four sweep
commands before use; older beta builds do not contain them.

Using the current immutable app module URL and the intended CAD window, as
described in the examples README:

```js
const {createSourceBoundSweepExample} = await import(currentCadAppModuleURL);
const sweep = createSourceBoundSweepExample({windowId});
const part = await sweep.buildStraightCircle();
console.log(await sweep.inspect());
await sweep.travel('undo');
await sweep.travel('redo');
await sweep.save('/Projects/straight-pipe.jsketcher.json');
```

Create the destination folder in My files first. Default section radius2mm and
path length10mm imply volume40πmm³. That arithmetic is an expected result, not
evidence that a particular run succeeded. Native measurements and save/reopen
must be independently checked by the signed acceptance test.

The recipe requires a new empty unsaved window and explicitly inspects the
available sweep build. It creates actual XY and XZ source planes, appends one
Circle and one Segment, selects the region by its actual source membership and
uses the Segment ID returned by authoring. It never parses an opaque region ID,
seeds a native model, bypasses Craft or guesses a kernel selection.

Every step is a normal separate accepted transaction. If a later step fails,
earlier authored steps remain; inspect them rather than automatically retrying.
Creation does not save. Native Save/Open uses My files and the shared mount;
closing with unsaved work may lose it. The helper does not download to the PC.

The one helper pins the authoritative document token across all internal steps,
not a freshly inspected token for each call. A different caller's New/Open in the
same window stops later recipe dispatches. Earlier accepted steps keep their
actual outcomes; there is no automatic retry into the replacement document.
The helper's explicit `open()` is an intentional transition: only its matching
accepted receipt may rebind the helper. An older/unbound command service refuses
helper construction. These source/transport controls still require the combined
signed-browser acceptance before a working application claim.
