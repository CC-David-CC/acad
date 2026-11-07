import {MObject} from './mobject';
import {EntityKind} from './entities';

// Full authored-boundary descriptor in the ID ensures changed child boundaries
// fail lookup rather than silently binding a historical selection elsewhere.
export class MSketchRegion extends MObject {
  face: any;
  descriptor: any;
  outerContour: any;
  holeContours: any[];
  constructor(face, descriptor, outerContour, holeContours) {
    const id='sketch-region:'+JSON.stringify(descriptor);
    if(id.length>8192)throw new Error('Sketch region identity is too large.');
    super(EntityKind.SKETCH_REGION,id);
    this.face=face;
    this.descriptor=descriptor;
    this.outerContour=outerContour;
    this.holeContours=holeContours;
  }
  get parent(){return this.face;}
}
