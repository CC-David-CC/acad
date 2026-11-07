import {unchangedSketchSave} from './unchangedSketchSave.mjs';
import {bindSketchConstants} from './sketchConstantResolver';
import {getSketchBoundaries} from './sketchBoundaries';
import {state, stream} from 'lstream';
import {InPlaceSketcher} from './inPlaceSketcher';
import {createWorkerSketchViewService} from './workerSketchViewService';
import {createSketchDXFExports} from './sketchDXFExports';
import {desktopFileMode,requestDesktopFileAction} from '../desktopFileActions';
import sketcherUIContrib from './sketcherUIContrib';
import initReassignSketchMode from './reassignSketchMode';
import {Viewer} from "sketcher/viewer2d";
import {IO} from "sketcher/io";
import {Generator} from "sketcher/id-generator";
import {MFace} from "cad/model/mface";
import {assertLegacyGeometry} from 'cad/model/workerGeometry';
import {createSketchDiagnosticService} from './sketchDiagnosticService';

export function defineStreams(ctx) {
  ctx.streams.sketcher = {
    update: stream(),
    sketchingFace: state(null),
    sketcherAppContext: state(null)
  };
  ctx.streams.sketcher.sketchingMode = ctx.streams.sketcher.sketcherAppContext.map(ctx => !!ctx);
}

export function activate(ctx) {
  
  const {streams, services} = ctx;
  
  sketcherUIContrib(ctx);
  
  const onSketchUpdate = evt => {
    const prefix = ctx.projectService.sketchStorageNamespace;
    if (evt.key.indexOf(prefix) < 0) return;
    const sketchFaceId = evt.key.substring(prefix.length);
    const sketchFace = services.cadRegistry.findFace(sketchFaceId);
    if (sketchFace) {
      updateSketchForFace(sketchFace);
      services.viewer.requestRender();
    }
  };

  services.storage.addListener(onSketchUpdate);

  // Standalone compatibility only. WebOS expressions are prepared by the
  // nonvisual Worker command and published atomically with sketches/models.
  let headlessCanvas: HTMLCanvasElement = null;

  function reevaluateAllSketches() {
    const allShells = services.cadRegistry.getAllShells();
    allShells.forEach(mShell => mShell.faces.forEach(mFace => reevaluateSketch(mFace.defaultSketchId)));
  }

  function reevaluateSketch(sketchId) {
    const savedSketch = ctx.sketchStorageService.getSketchData(sketchId);
    if (savedSketch === null) {
      return null;
    }

    let sketch;
    try {
      sketch = JSON.parse(savedSketch);
    } catch (e) {
      console.error(e);
      return null;
    }

    const signature = ctx.expressionService.signature;
    if (sketch && (!sketch.metadata || sketch.metadata.expressionsSignature !== signature)) {
      try {
        if (!headlessCanvas) headlessCanvas = document.createElement('canvas');
        const viewer = new Viewer(headlessCanvas, IO, {});
        bindSketchConstants(viewer, ctx.expressionService);
        // viewer.historyManager.init(savedSketch);
        viewer.io._loadSketch(sketch);
        viewer.parametricManager.refresh();
        const updated = JSON.parse(viewer.io.serializeSketch({
          ...sketch.metadata, expressionsSignature: signature
        }));
        // Keep the boundary/frame provenance associated with the geometry
        // being re-evaluated; upstream replay must still check it later.
        if (sketch.boundary) updated.boundary = sketch.boundary;
        if (!unchangedSketchSave(savedSketch, updated)) {
          services.storage.set(ctx.projectService.sketchStorageKey(sketchId), JSON.stringify(updated));
        }
        Generator.resetIDGenerator();
      } catch (e) {
        console.error(e);
        return null;
      }
    }
  }

  async function exportFaceToDXF(sceneFace) {
    assertLegacyGeometry(sceneFace, 'Exporting this sketch');
    if(desktopFileMode)return requestDesktopFileAction('export-dxf',sceneFace.id);
    // Standalone callers explicitly consume the immutable export Blob.
    // WebOS always delegates destination and permissions to My files.
    const info=ctx.craftService.inspectSketchDXFExports();
    return ctx.craftService.exportSketchDXFBlob({revision:info.revision,faceId:sceneFace.id});
  }

  ctx.craftService.models$.attach(models => models.forEach(model => model.traverse(m => {
    if (m instanceof MFace) {
      if (!m.ext.sketchInitialized) {
        m.ext.sketchInitialized = true;
        updateSketchForFace(m);
      }
    }
  })));

  function updateSketchForFace(mFace) {
    const sketch = ctx.sketchStorageService.readSketch(mFace.defaultSketchId);
    mFace.setSketch(sketch);
    ctx.cadRegistry.reindexFace(mFace);
    streams.sketcher.update.next(mFace); // updates UI face views
  }

  function updateAllSketches() {
    const allShells = services.cadRegistry.getAllShells();
    allShells.forEach(mShell => mShell.faces.forEach(mFace => updateSketchForFace(mFace)));
    services.viewer.requestRender();
  }
  
  function updateSketchBoundaries(sceneFace) {
    assertLegacyGeometry(sceneFace, 'Sketching on this generated face');
    
    const sketchStorageKey = ctx.projectService.sketchStorageKey(sceneFace.id);

    const sketch = services.storage.get(sketchStorageKey);

    const data = sketch === null ? {} : JSON.parse(sketch);

    data.boundary = getSketchBoundaries(sceneFace);
    services.storage.set(sketchStorageKey, JSON.stringify(data));
  }

  const inPlaceEditor = new InPlaceSketcher(ctx);
  function sketchFace(face) {
    assertLegacyGeometry(face, 'Sketching on this generated face');
    if (inPlaceEditor.inEditMode) {
      inPlaceEditor.exit();
    }
    inPlaceEditor.enter(face);
  }
  
  function sketchFace2D(face) {
    assertLegacyGeometry(face, 'Sketching on this generated face');
    updateSketchBoundaries(face);
    const sketchURL = ctx.projectService.getSketchURL(face.id);
    ctx.appTabsService.show(face.id, 'Sketch ' + face.id, 'sketcher.html#' + sketchURL);
  }
  
  function reassignSketch(fromId, toId) {
    const sourceId = typeof fromId === 'string' ? fromId : fromId?.id;
    const targetId = typeof toId === 'string' ? toId : toId?.id;
    const source = services.cadRegistry.findFace(sourceId), target = services.cadRegistry.findFace(targetId);
    if (!source || !target) throw new Error('Sketch reassignment requires two existing faces.');
    assertLegacyGeometry(source, 'Reassigning a sketch');
    assertLegacyGeometry(target, 'Reassigning a sketch');
    const sketchData = ctx.sketchStorageService.getSketchData(sourceId);
    if (!sketchData) {
      return;
    }
    if (sourceId === targetId) return;
    ctx.sketchStorageService.setSketchData(targetId, sketchData);
    ctx.sketchStorageService.removeSketchData(sourceId);
    updateSketchForFace(source);
    updateSketchForFace(target);
    services.viewer.requestRender();
  }
  
  streams.craft.models.attach(() => {
    if (inPlaceEditor.inEditMode) {
      if (!inPlaceEditor.face.ext.view) {
        inPlaceEditor.exit();
      }
    }
  });
  let previousTableWasTyped = ctx.expressionService.isTyped;
  ctx.expressionService.table$.attach(() => {
    if (desktopFileMode) return;
    // Typed changes, including a transition back to legacy values, are
    // published by guarded worker replay, never by this canvas path.
    const typed = ctx.expressionService.isTyped;
    const skipLegacyReevaluation = typed || previousTableWasTyped;
    previousTableWasTyped = typed;
    if (skipLegacyReevaluation) return;
    if (inPlaceEditor.viewer !== null) {
      inPlaceEditor.viewer.parametricManager.refresh();
    }
    reevaluateAllSketches();
  });


  services.sketcher = {
    sketchFace, sketchFace2D, updateAllSketches, inPlaceEditor, reassignSketch,
    exportFaceToDXF,
    reassignSketchMode: initReassignSketchMode(ctx)
  };
  ctx.sketcherService = services.sketcher;
  Object.assign(ctx.craftService,createSketchDXFExports(ctx));
  const workerView=createWorkerSketchViewService(ctx);
  Object.assign(ctx.craftService,{openWorkerSketchView:workerView.open,inspectWorkerSketchView:workerView.inspect,selectWorkerSketchView:workerView.select,closeWorkerSketchView:workerView.close});
  ctx.sketchDiagnosticService = createSketchDiagnosticService(ctx);
}

export interface SketcherService {

}


export interface SketcherBundleContext {

  sketcherService: SketcherService;
  sketchDiagnosticService: ReturnType<typeof createSketchDiagnosticService>;
}

export const BundleName = "@Sketcher";
