/** Browser examples for the mounted CAD command API. No model or file internals. */
export function createCadAgent({api = globalThis.codiDesktopCommands, windowId, signal, onStep = () => {}} = {}) {
  if (typeof api?.list !== 'function' || typeof api?.execute !== 'function') throw Error('Open CAD Modeler in the signed-in desktop first.');
  const windows = () => [...new Set(api.list().filter(c => c.appId === 'jsketcher').map(c => c.windowId))];
  if (windowId === undefined) {
    const ids = windows();
    if (ids.length !== 1) throw Error('Select one CAD window explicitly using its windowId.');
    windowId = ids[0];
  }
  if (typeof windowId !== 'string' || !windows().includes(windowId)) throw Error('The selected CAD window is unavailable.');
  let running = false;
  const current = () => {
    if (signal?.aborted) throw new DOMException('The example was cancelled.', 'AbortError');
    if (!windows().includes(windowId)) throw Error('The selected CAD window or account changed.');
  };
  const notify = event => { try { onStep(Object.freeze(event)); } catch { /* A log callback cannot change command outcomes. */ } };
  async function call(command, args = {}) {
    current();
    if (!api.list().some(c => c.appId === 'jsketcher' && c.windowId === windowId && c.id === command)) throw Error('Command unavailable in this build: ' + command);
    notify({command, phase: 'started'});
    try {
      const result = await api.execute({windowId, command, args});
      notify({command, phase: 'accepted', result});
      // The registry/handler own in-flight cancellation. Return their accepted
      // receipt; a subsequent call checks lifetime before starting another step.
      return result;
    } catch (error) {
      notify({command, phase: 'rejected', error: {message: String(error.message), committed: error.committed === true, possiblyCommitted: error.possiblyCommitted === true}});
      throw error; // Never retry a mutation or an uncertain file write.
    }
  }
  async function serial(work) {
    if (running) throw Error('Wait for the current example operation to finish.');
    running = true;
    try { current(); return await work(); } finally { running = false; }
  }
  const one = (items, label) => {
    if (!Array.isArray(items) || items.length !== 1) throw Error('Select exactly one supported ' + label + ' before continuing.');
    return items[0];
  };
  const feature = (history, type) => one(history.features?.filter(f => f.type === type), type);
  return Object.freeze({
    windowId,
    discover: () => { current(); return api.list().filter(c => c.appId === 'jsketcher' && c.windowId === windowId); },
    execute: (command, args = {}) => serial(() => call(command, args)),
    inspect: () => serial(() => call('inspect')),
    // Feature-detected: older deployed builds have no public new/open command.
    newProject: () => serial(async () => { const d = await call('inspect'); return call('new-project', {revision: d.revision}); }),
    open: path => serial(async () => { const d = await call('inspect'); return call('open-project', {revision: d.revision, path}); }),
    buildBracket: () => serial(async () => {
      const document = await call('inspect');
      if (document.operationCount !== 0 || document.sketchCount !== 0 || document.path || document.dirty) throw Error('Run this demo in a new, empty, unsaved CAD window. Existing work was not replaced.');
      const rectangle = await call('inspect-rectangle-creation');
      if (rectangle.ready !== true) throw Error('Rectangle creation is not ready.');
      const created = await call('create-rectangle-sketch', {revision: rectangle.revision, unit: 'millimeter', origin: [0, 0], width: 100, height: 50, depth: 0});
      let info = await call('inspect-worker-features');
      const region = one(info.extrusionCandidates?.filter(c => c.faceId === created.faceId && c.regionId === created.regionId), 'rectangle region');
      await call('create-worker-extrusion', {revision: info.revision, ...region, depth: 20});
      info = await call('inspect-worker-features');
      await call('create-worker-centered-hole', {revision: info.revision, ...one(info.centeredHoleCandidates, 'centered-hole candidate'), diameter: 10});
      info = await call('inspect-worker-features');
      await call('create-worker-four-corner-holes', {revision: info.revision, ...one(info.fourCornerCandidates, 'four-hole candidate'), diameter: 4, offsetX: 10, offsetY: 10});
      return call('inspect-published-worker-geometry');
    }),
    resizeBracket: ({width = 150, height = 30, depth = 35} = {}) => serial(async () => {
      const rectangles = await call('inspect-rectangle-dimensions');
      const rectangle = one(rectangles.candidates, 'rectangle');
      await call('edit-rectangle-dimensions', {revision: rectangles.revision, faceId: rectangle.faceId, width, height});
      const history = await call('inspect-worker-history');
      const extrusion = feature(history, 'WORKER_RECTANGLE_EXTRUDE_V1');
      await call('edit-worker-extrusion', {revision: history.revision, index: extrusion.index, featureId: extrusion.featureId, depth});
      return call('inspect-published-worker-geometry');
    }),
    verifyRejectedEdit: () => serial(async () => {
      const before = await call('inspect-published-worker-geometry');
      const history = await call('inspect-worker-history');
      const holes = feature(history, 'WORKER_FOUR_CORNER_THROUGH_HOLES_V1');
      let refusal;
      try {
        await call('edit-worker-four-corner-holes', {revision: history.revision, index: holes.index, featureId: holes.featureId, diameter: 25, offsetX: 10, offsetY: 10});
      } catch (error) {
        if (error.name === 'AbortError' || error.committed || error.possiblyCommitted) throw error;
        refusal = String(error.message);
      }
      if (refusal === undefined) throw Error('The proposed edit was accepted; inspect the model instead of treating this as a successful rejection test.');
      const after = await call('inspect-published-worker-geometry');
      if (JSON.stringify(after.bodies) !== JSON.stringify(before.bodies)) throw Error('Published geometry changed after the rejected edit.');
      return {rejected: true, refusal, publishedGeometryPreserved: true};
    }),
    travel: direction => serial(async () => {
      const edits = await call('inspect-authored-edits');
      return call('travel-authored-edit', {revision: edits.revision, direction});
    }),
    save: path => serial(async () => {
      const document = await call('inspect');
      if (document.path && path !== undefined && path !== document.path) throw Error('Use File > Save a copy for a different existing-project path.');
      return call('save', {revision: document.revision, ...(!document.path ? {path} : {})});
    }),
    exportSketchDxf: path => serial(async () => {
      const sketches = await call('inspect-sketch-dxf-exports');
      const sketch = one(sketches.candidates, 'exportable sketch');
      return call('export-sketch-dxf', {revision: sketches.revision, faceId: sketch.faceId, path});
    }),
    exportCore3mf: path => serial(async () => {
      const manufacturing = await call('inspect-manufacturing');
      return call('export-core-3mf', {revision: manufacturing.revision, path});
    })
  });
}
