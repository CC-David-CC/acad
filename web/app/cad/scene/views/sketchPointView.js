import {View} from './view';
import {BufferAttribute, BufferGeometry, Group, Points, PointsMaterial} from 'three';

// Points need their own projection: a one-vertex polyline draws no segment.
export class SketchPointView extends View {
  constructor(ctx, model, sketchToWorldTransformation) {
    super(ctx, model);
    const color = model.construction ? 0x964B00 : 0x0000FF;
    const position = sketchToWorldTransformation.apply(model.sketchPrimitive.p);
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(position.data()), 3));
    this.material = new PointsMaterial({color, size: 7, sizeAttenuation: false, depthTest: false, depthWrite: false});
    this.representation = new Points(this.geometry, this.material);
    // Display-only: do not invent an edge/axis or a picking collider for a
    // standalone point. Agent/model identity remains on the MSketchObject.
    this.representation.raycast = () => {};
    this.rootGroup = new Group();
    this.rootGroup.add(this.representation);
    this.setColor(color);
  }
  updateVisuals() { this.material.color.set(this.markColor || this.color); }
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    super.dispose();
  }
}
