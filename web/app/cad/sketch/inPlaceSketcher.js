import {assertProjectionSourceReadonly} from 'workbenches/modeler/features/sourceProjection/sourceProjection.operation';
import {bindSketchConstants} from './sketchConstantResolver';
import {DelegatingPanTool} from 'sketcher/tools/pan';
import {Matrix4} from 'three/src/math/Matrix4';
import {CAMERA_MODE} from '../scene/viewer';
import DPR from 'dpr';
import {createEssentialAppContext} from "sketcher/sketcherContext";
import {ORIGIN} from "math/vector";
import {lookAtFace} from "cad/actions/usabilityActions";
import {Styles} from "sketcher/styles";
import {createFunctionList} from "gems/func";
import {View} from "cad/scene/views/view";
import {getSketchBoundaries} from './sketchBoundaries';
import {boundaryGeometryClose, sketchBoundaryFrame} from './boundaryValidity';
import {assertLegacyGeometry} from 'cad/model/workerGeometry';
import {unchangedSketchSave} from './unchangedSketchSave.mjs';
import {beginUnconsumedSketchSave,isStableSketchForSave,sameSketchSaveFrame,makeSketchSaveReceipt} from '../craft/unconsumedSketchSave.mjs';
import {captureActiveSketchForDiagnostics} from 'sketcher/headless/diagnosticCapture.mjs';
import {runSketchSolve} from 'sketcher/headless/client';
import sketchWorkerUrl from 'codi-headless-sketch-worker';
import {sketchMutationEpoch} from 'sketcher/sketchMutationEpoch.mjs';

export class InPlaceSketcher {
  
  constructor(ctx) {
    this.face = null; // should be only one in the state
    this.ctx = ctx;
    this.sketcherAppContext = null;
    this.pickControlToken = 0;
    this.exiting = false;
    Styles.DEFAULT.strokeStyle = '#3477eb';
  }

  get viewer() {
    return this.sketcherAppContext ? this.sketcherAppContext.viewer : null;
  }

  get inEditMode() {
    return !!this.face    
  }
  
  enter(face, headless) {
    if (this.exiting) throw new Error('The previous sketch editor is still closing.');
    assertProjectionSourceReadonly(this.ctx,face);
    assertLegacyGeometry(face, 'Sketching on this generated face');
    const viewer3d = this.ctx.services.viewer;
    const previousCameraMode = viewer3d.getCameraMode();
    let canvas = null, switched = false, pickAcquired = false;
    this.disposers = null;
    try {
    this.face = face;
    this.boundaryAtOpen = getSketchBoundaries(face);
    this.boundaryFrameAtOpen = sketchBoundaryFrame(face);
    this.face.ext.view.sketchGroup.visible = false;
    viewer3d.setCameraMode(CAMERA_MODE.ORTHOGRAPHIC);
    lookAtFace(this.ctx.viewer, face);
    viewer3d.render(); // updates camera projection matrix
    
    const container = viewer3d.sceneSetup.container;
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.right = 0;
    canvas.style.bottom = 0;

    container.appendChild(canvas);
    this.sketcherAppContext = createEssentialAppContext(canvas);
    bindSketchConstants(this.viewer, this.ctx.expressionService);

    this.syncWithCamera();
    this.viewer.toolManager.setDefaultTool(new DelegatingPanTool(this.viewer, viewer3d.sceneSetup.renderer.domElement));
    this.disposers = createFunctionList();

    const cameraListenerDetacher = viewer3d.sceneSetup.sceneRendered$.attach(this.onCameraChange);
    this.disposers.add(cameraListenerDetacher);

    switched = true;
    this.ctx.workbenchService.switchWorkbench('sketcher');

    // Opening a stale dependent sketch for inspection must not overwrite its
    // persisted authored boundary until the user explicitly saves.
    const saved = this.ctx.services.storage.get(this.sketchStorageKey);
    const sketchData = saved === null ? {} : JSON.parse(saved);
    sketchData.boundary = this.boundaryAtOpen;
    this.viewer.io.loadSketch(JSON.stringify(sketchData));
    this.viewer.historyManager.init(this.viewer.io.serializeSketch(undefined, {strict: true}));
    this.authoredSaveGuard = beginUnconsumedSketchSave(this.ctx, face);
    this.ctx.streams.sketcher.sketchingFace.next(face);
    this.ctx.streams.sketcher.sketcherAppContext.next(this.sketcherAppContext);

    this.pickControlToken = this.ctx.pickControlService.takePickControl(this.sketcherPickControl);
    pickAcquired = true;

    this.disposers.add(
      this.ctx.viewer.sceneSetup.viewportSizeUpdate$.attach(this.onCameraChange)
    );
    } catch (error) {
      // A refused sketch must not leave an active editor, canvas, or listeners.
      try { this.disposers?.call(); } catch (_) {}
      if (pickAcquired) try { this.ctx.pickControlService.releasePickControl(this.pickControlToken); } catch (_) {}
      try { this.viewer?.dispose(); } catch (_) {}
      try { canvas?.remove(); } catch (_) {}
      if (face.ext?.view?.sketchGroup) face.ext.view.sketchGroup.visible = true;
      this.face = null; this.sketcherAppContext = null; this.disposers = null; this.authoredSaveGuard = null;
      this.ctx.streams.sketcher.sketchingFace.next(null);
      this.ctx.streams.sketcher.sketcherAppContext.next(null);
      if (switched) try { this.ctx.workbenchService.switchToDefaultWorkbench(); } catch (_) {}
      try { viewer3d.setCameraMode(previousCameraMode); viewer3d.requestRender(); } catch (_) {}
      throw error;
    }
  }

  get sketchStorageKey() {
    return this.ctx.projectService.sketchStorageKey(this.face.defaultSketchId);
  }

  exit() {
    const face = this.face, context = this.sketcherAppContext;
    if (!face && !context) return;
    this.saveAborter?.abort();
    const viewer = context?.viewer, disposers = this.disposers;
    const pickToken = this.pickControlToken;
    this.exiting = true;
    let failed = false, firstError;
    const cleanup = action => {
      try { action(); }
      catch (error) { if (!failed) { failed = true; firstError = error; } }
    };
    // A failed tool cleanup must not leave this closed editor owning streams,
    // listeners or picking. Clear ownership before notifying any observers.
    this.face = null;
    this.authoredSaveGuard = null;
    this.sketcherAppContext = null;
    this.disposers = null;
    this.pickControlToken = null;
    cleanup(() => { if (face?.ext?.view?.sketchGroup) face.ext.view.sketchGroup.visible = true; });
    cleanup(() => { const canvas = viewer?.canvas; if (canvas?.parentNode) canvas.parentNode.removeChild(canvas); });
    cleanup(() => viewer?.dispose());
    cleanup(() => disposers?.call());
    cleanup(() => this.ctx.pickControlService.releasePickControl(pickToken));
    cleanup(() => this.ctx.streams.sketcher.sketchingFace.next(null));
    cleanup(() => this.ctx.streams.sketcher.sketcherAppContext.next(null));
    cleanup(() => this.ctx.workbenchService.switchToDefaultWorkbench());
    cleanup(() => this.ctx.services.viewer.requestRender());
    this.exiting = false;
    if (failed) throw firstError;
  }

  onCameraChange = () => {
    this.syncWithCamera();
    this.viewer.refresh();
  };

  syncWithCamera() {
    const face = this.face;
    const sceneSetup = this.ctx.services.viewer.sceneSetup;
    
    _projScreenMatrix.multiplyMatrices( sceneSetup.oCamera.projectionMatrix,
      sceneSetup.oCamera.matrixWorldInverse );

    const csys = face.csys;

    // let sketchToWorld = face.sketchToWorldTransformation;
    // let sketchOrigin = sketchToWorld.apply(ORIGIN);
    // let basisX = sketchToWorld.apply(AXIS.X);
    // let basisY = sketchToWorld.apply(AXIS.Y);

    const sketchOrigin = csys.origin;
    const basisX = csys.x;
    const basisY = csys.y;

    const o = ORIGIN.three().applyMatrix4(_projScreenMatrix);
    const xx = basisX.three().applyMatrix4(_projScreenMatrix);
    const yy = basisY.three().applyMatrix4(_projScreenMatrix);

    const sketchOriginDelta = sketchOrigin.three().applyMatrix4(_projScreenMatrix);

    const width = sceneSetup.container.clientWidth * DPR / 2;
    const height = sceneSetup.container.clientHeight * DPR /2;

    xx.sub(o);
    yy.sub(o);

    this.viewer.setTransformation(xx.x * width, xx.y * height, yy.x * width, yy.y* height,
      (sketchOriginDelta.x) * width + width,
      (sketchOriginDelta.y) * height + height, sceneSetup.oCamera.zoom);
  }
  
  async save() {
    if (this.savePending) throw new Error('A sketch save is already in progress.');
    this.savePending = true;
    try {
    if (this.viewer.historyManager.recoverySnapshot) {
      throw new Error('Recover the sketch before saving; the earlier sketch remains in memory.');
    }
    if (!isStableSketchForSave(this.viewer)) throw new Error('Finish the current sketch operation and resolve rejected constraints before saving.');
    if (!boundaryGeometryClose(getSketchBoundaries(this.face), this.boundaryAtOpen) ||
        !sameSketchSaveFrame(sketchBoundaryFrame(this.face), this.boundaryFrameAtOpen)) {
      throw new Error('Sketch boundary changed while editing. Reopen the sketch before saving.');
    }
    const initialFace=this.face, initialViewer=this.viewer, initialEpoch=sketchMutationEpoch();
    const draft = this.viewer.io.serializeSketch({
      expressionsSignature: this.ctx.expressionService.signature
    }, {strict:true});
    const sketch = JSON.parse(draft);
    if(this.face!==initialFace||this.viewer!==initialViewer||sketchMutationEpoch()!==initialEpoch)throw new DOMException('Sketch save was superseded.','AbortError');
    sketch.boundary = this.boundaryAtOpen;
    sketch.metadata = {...sketch.metadata, boundaryFrame:this.boundaryFrameAtOpen};
    // Preserve stored bytes for a genuine no-op. The live expression clock
    // and its conservative cache-invalidation consumer remain unchanged.
    if(this.ctx.services.storage!==this.ctx.storageService)throw Error('The sketch workspace changed.');
    const storedBefore=this.ctx.services.storage.get(this.sketchStorageKey);
    if (unchangedSketchSave(storedBefore, sketch)) {
      const ctx=this.ctx,face=this.face,viewer=this.viewer,project=ctx.projectService,document=project.documentGeneration,storage=ctx.storageService,registry=ctx.cadRegistry,key=this.sketchStorageKey,namespace=project.sketchStorageNamespace,version=storage.versionOf(key),frame=JSON.parse(JSON.stringify(this.boundaryFrameAtOpen)),boundaryStamp=JSON.stringify(this.boundaryAtOpen),epoch=sketchMutationEpoch(),expressions=ctx.expressionService,streams=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$],revisions=streams.map(s=>s.revision);
      if(!Number.isSafeInteger(storage.namespaceRevision(namespace)))throw Error('A versioned sketch workspace is required.');
      let ownPending=true;
      const receipt=makeSketchSaveReceipt(()=> (ownPending||!this.savePending)&&ctx.projectService===project&&project.isDocumentCurrent(document)&&ctx.storageService===storage&&ctx.services.storage===storage&&ctx.cadRegistry===registry&&registry.findFace(face.id)===face&&project.sketchStorageNamespace===namespace&&this.face===face&&this.viewer===viewer&&sameSketchSaveFrame(this.boundaryFrameAtOpen,frame)&&sameSketchSaveFrame(sketchBoundaryFrame(face),frame)&&JSON.stringify(this.boundaryAtOpen)===boundaryStamp&&boundaryGeometryClose(getSketchBoundaries(face),this.boundaryAtOpen)&&storage.versionOf(key)===version&&storage.get(key)===storedBefore&&sketchMutationEpoch()===epoch&&ctx.expressionService===expressions&&streams.every((s,i)=>s.revision===revisions[i])&&viewer.io.serializeSketch({expressionsSignature:expressions.signature},{strict:true})===draft&&sketchMutationEpoch()===epoch&&isStableSketchForSave(viewer),false);
      await Promise.resolve();
      receipt.verifyBeforeExit();ownPending=false;return receipt;
    }
    if (!isStableSketchForSave(this.viewer)) throw new Error('Finish the current sketch operation and resolve rejected constraints before saving.');
    const bytes = JSON.stringify(sketch);
    const ctx=this.ctx,face=this.face,viewer=this.viewer,project=ctx.projectService,document=project.documentGeneration,storage=ctx.storageService,registry=ctx.cadRegistry,expressions=ctx.expressionService,key=this.sketchStorageKey,version=storage.versionOf(key),saved=storage.get(key),namespace=project.sketchStorageNamespace,namespaceVersion=storage.namespaceRevision(namespace),frame=JSON.parse(JSON.stringify(this.boundaryFrameAtOpen)),boundaryStamp=JSON.stringify(this.boundaryAtOpen),source=expressions.script$.value,table=expressions.table$.value,typed=expressions.isTyped,streams=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$],revisions=streams.map(s=>s.revision),capture=captureActiveSketchForDiagnostics(viewer),guard=this.authoredSaveGuard;
    if(!Number.isSafeInteger(namespaceVersion))throw Error('A versioned sketch workspace is required.');
    if(typed&&(!expressions.hasCurrentPhysicalResult()||typeof source!=='string'||source.length>65536))throw Error('Typed parameters are unavailable.');
    const external=Object.create(null);if(!typed){if(!table||typeof table!=='object'||Array.isArray(table)||Object.keys(table).length>256)throw Error('Shared parameters are invalid.');for(const name of Object.keys(table)){const d=Object.getOwnPropertyDescriptor(table,name);if(!d?.enumerable||!Object.hasOwn(d,'value')||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(name)||typeof d.value!=='number'||!Number.isFinite(d.value))throw Error('Shared parameters are invalid.');external[name]=d.value}}
    const keys=Object.keys(external),controller=new AbortController(),documentSignal=project.documentSignal,stop=()=>controller.abort();this.saveAborter=controller;documentSignal?.addEventListener('abort',stop,{once:true});
    const current=()=>{try{return this.saveAborter===controller&&!controller.signal.aborted&&ctx.projectService===project&&project.isDocumentCurrent(document)&&ctx.storageService===storage&&ctx.services.storage===storage&&sameSketchSaveFrame(this.boundaryFrameAtOpen,frame)&&ctx.cadRegistry===registry&&registry.findFace(face.id)===face&&this.face===face&&this.viewer===viewer&&this.authoredSaveGuard===guard&&storage.versionOf(key)===version&&storage.get(key)===saved&&project.sketchStorageNamespace===namespace&&storage.namespaceRevision(namespace)===namespaceVersion&&ctx.expressionService===expressions&&expressions.script$.value===source&&expressions.table$.value===table&&expressions.isTyped===typed&&streams.every((s,i)=>s.revision===revisions[i])&&(!typed||expressions.hasCurrentPhysicalResult())&&(typed||Object.keys(table).length===keys.length&&keys.every(k=>Object.is(Object.getOwnPropertyDescriptor(table,k)?.value,external[k])))&&capture.quickValid()}catch{return false}};
    try{if(!current())throw new DOMException('Sketch save was superseded.','AbortError');const revision=crypto.randomUUID(),result=await runSketchSolve(sketchWorkerUrl,{task:'sketch-save-validation',revision,sketchJSON:bytes,frame,parameterSource:typed?source:null,externalParameters:external},{signal:controller.signal,valid:current});if(!current())throw new DOMException('Sketch save was superseded.','AbortError');if(!result?.ok||result.revision!==revision||result.validated!==true)throw Object.assign(new Error(result?.error?.message||'The sketch could not be validated for saving.'),{code:result?.error?.code});capture.verify();if(!current()||JSON.stringify(this.boundaryAtOpen)!==boundaryStamp||!boundaryGeometryClose(getSketchBoundaries(face),this.boundaryAtOpen)||!sameSketchSaveFrame(sketchBoundaryFrame(face),frame))throw new DOMException('Sketch save was superseded.','AbortError');if(guard)guard.commit(bytes);else storage.set(key,bytes);const committedVersion=storage.versionOf(key);let ownPending=true;const receipt=makeSketchSaveReceipt(()=>{if(!(ownPending||!this.savePending)||ctx.projectService!==project||!project.isDocumentCurrent(document)||ctx.storageService!==storage||ctx.services.storage!==storage||ctx.cadRegistry!==registry||registry.findFace(face.id)!==face||this.face!==face||this.viewer!==viewer||this.authoredSaveGuard!==guard||project.sketchStorageNamespace!==namespace||storage.versionOf(key)!==committedVersion||storage.get(key)!==bytes||ctx.expressionService!==expressions||expressions.script$.value!==source||expressions.table$.value!==table||expressions.isTyped!==typed||streams.some((s,i)=>s.revision!==revisions[i])||JSON.stringify(this.boundaryAtOpen)!==boundaryStamp||!boundaryGeometryClose(getSketchBoundaries(face),this.boundaryAtOpen)||!sameSketchSaveFrame(this.boundaryFrameAtOpen,frame)||!sameSketchSaveFrame(sketchBoundaryFrame(face),frame))return false;capture.verify();return true},true);receipt.verifyBeforeExit();ownPending=false;return receipt;}
    finally{documentSignal?.removeEventListener('abort',stop);if(this.saveAborter===controller)this.saveAborter=null;}
    } finally { this.savePending = false; }
  }

  sketcherPickControl = (obj) => {
    return false;
  }
}

const _projScreenMatrix = new Matrix4();
