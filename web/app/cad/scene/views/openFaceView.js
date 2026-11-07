import {setAttribute} from 'scene/objectData';
import {FACE, SHELL} from 'cad/model/entities';
import {SketchingView} from './faceView';
import {View} from './view';
import {SketchMesh} from './shellView';
import {BufferAttribute, BufferGeometry} from 'three';
import * as vec from "math/vec";
import {normalOfCCWSeq} from "cad/cad-utils";
import {openFaceDisplayBounds} from './openFaceDisplayBounds';

function releaseOwnedResources(steps) {
  let failed = false, firstError;
  for (const release of steps) {
    try {
      release();
    } catch (error) {
      if (!failed) {
        failed = true;
        firstError = error;
      } else {
        console.error('Additional open face view cleanup failure.', error);
      }
    }
  }
  if (failed) throw firstError;
}

function disposeFailedConstruction(view, error) {
  try {
    view.dispose();
  } catch (cleanupError) {
    console.error('Open face view cleanup failed after construction failure.', cleanupError);
  }
  throw error;
}

export class OpenFaceShellView extends View {

  constructor(ctx, shell) {
    super(ctx, shell);
    try {
      this.openFace = new OpenFaceView(ctx, shell.face, this);
      setAttribute(this.rootGroup, SHELL, this);
      setAttribute(this.rootGroup, View.MARKER, this);
    } catch (error) {
      disposeFailedConstruction(this, error);
    }
  }
  
  get rootGroup() {
    return this.openFace?.rootGroup
  }
  
  dispose() {
    if (this.isDisposed || this.releaseStarted) return;
    this.releaseStarted = true;
    releaseOwnedResources([() => this.openFace?.dispose(), () => super.dispose()]);
  }
}

export class OpenFaceView extends SketchingView {

  constructor(ctx, mFace, parent) {
    super(ctx, mFace, parent);
    try {
      this.material = new THREE.MeshPhongMaterial({
      // color: 0xB0C4DE,
      shininess: 0,
      polygonOffset : true,
      polygonOffsetFactor : 1,
      polygonOffsetUnits : 2,
      side : THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
      });
      this.updateSketch();
    } catch (error) {
      disposeFailedConstruction(this, error);
    }
  }

  dropGeometry() {
    if (this.mesh) {
      const mesh = this.mesh;
      this.mesh = null;
      releaseOwnedResources([() => this.rootGroup.remove(mesh), () => mesh.geometry.dispose()]);
    }
  }

  createGeometry() {

    const vertices = [];
    const normals = [];
    const normal = normalOfCCWSeq(this.bounds);
    this.bounds.forEach((v, i) => {
      vertices.push(v.x, v.y, v.z);
      normals.push(normal.x, normal.y, normal.z);
    });
    const index = [
      0, 1, 2,
      0, 2, 3
    ];

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute( new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new BufferAttribute( new Float32Array(normals), 3));
    geometry.setIndex(index);

    this.mesh = new SketchMesh(geometry, this.material);
    setAttribute(this.mesh, FACE, this)
    this.rootGroup.add(this.mesh);
    this.mesh.onMouseEnter = () => {
      this.ctx.highlightService.highlight(this.model.id);
    }
    this.mesh.onMouseLeave = () => {
      this.ctx.highlightService.unHighlight(this.model.id);
    }
  }

  updateBounds() {
    this.dropGeometry();
    
    const bounds2d = [];
    for (const mSketchObject of this.model.sketchObjects) {
      mSketchObject.sketchPrimitive.tessellate().forEach(p => bounds2d.push(p));
    }
    this.bounds = openFaceDisplayBounds(this.model.shell.surfacePrototype, bounds2d, 750, 750, 50);

    this.createGeometry();
    this.updateVisuals();
  }

  traverse(visitor) {
    super.traverse(visitor);
  }

  updateSketch() {
    // SketchingView invokes this virtual method before our material exists.
    // Populate sketch/bounds once, after construction owns their resources.
    if (!this.material) return;
    super.updateSketch();
    this.updateBounds();
  }

  dispose() {
    if (this.isDisposed || this.releaseStarted) return;
    this.releaseStarted = true;
    releaseOwnedResources([() => this.dropGeometry(), () => this.material?.dispose(), () => super.dispose()]);
  }
}
