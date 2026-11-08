import {ParametricManager} from '../parametric';
import {IO,registerHeadlessSketchEvaluationOwner} from '../io';
import {SketchGenerator} from '../generators/sketchGenerator';
import {GroundObjectsGeneratorSchema} from '../generators/groundObjectsGenerator';

// Nonvisual host for the same IO, shapes, generators, constraints and solver
// used by the editor. Each solve runs in its own disposable Worker realm.
class ModelLayer {
  name: string;
  objects: any[] = [];
  viewer: any;
  constructor(name, viewer) { this.name = name; this.viewer = viewer; }
  add(object) {
    if (object.layer !== undefined) {
      if (object.layer != null) object.layer.remove(object);
      if (object.layer === this) return;
      object.layer = this;
    }
    this.objects.push(object);
    if (!object.stage) this.viewer.parametricManager.stage.assignObject(object);
    this.viewer.objectsUpdate();
  }
  remove(object) {
    const i = this.objects.indexOf(object);
    if (i < 0) return false;
    this.objects.splice(i, 1);
    if (object.stage) object.stage.unassignObject(object);
    this.viewer.objectsUpdate();
    return true;
  }
  traverseSketchObjects(callback) {
    for (const object of this.objects) if (typeof object.traverse === 'function') object.traverse(callback);
  }
}

export class HeadlessSketchWorkspace {
  safeExpressions = true;
  layers: ModelLayer[];
  dimLayer: ModelLayer;
  annotationLayer: ModelLayer;
  labelLayer: ModelLayer;
  dimLayers: ModelLayer[];
  parametricManager: any;
  io: IO;
  constructor(externalParameters) {
    this.layers = [new ModelLayer('ground', this), new ModelLayer('sketch', this)];
    this.dimLayer = new ModelLayer('_dim', this);
    this.annotationLayer = new ModelLayer('_annotations', this);
    this.labelLayer = new ModelLayer('_labels', this);
    this.dimLayers = [this.dimLayer, this.annotationLayer, this.labelLayer];
    this.parametricManager = new ParametricManager(this as any);
    this.parametricManager.externalConstantResolver = value => Object.prototype.hasOwnProperty.call(externalParameters, value) ? externalParameters[value] : value;
    this.parametricManager.messageSink = message => { throw new Error(String(message)); };
    this.io = new IO(this as any);
    this.createGroundObjects();
    registerHeadlessSketchEvaluationOwner(this);
  }
  createGroundObjects() {
    const generator = new SketchGenerator({}, GroundObjectsGeneratorSchema);
    this.parametricManager.addGeneratorToStage(generator, this.parametricManager.groundStage);
  }
  findLayerByName(name) { return this.layers.find(layer => layer.name === name) || null; }
  createIndex() {
    const index = Object.create(null);
    for (const layer of this.layers) layer.traverseSketchObjects(object => { index[object.id] = object; });
    return index;
  }
  screenToModel2(x, y, out) { out.x = x; out.y = y; }
  refresh() {}
  objectsUpdate() {}
  deselectAll() {}
}
