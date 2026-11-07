import {View} from './view';
import * as SceneGraph from 'scene/sceneGraph';
import {TriangulatePolygons} from 'cad/tess/triangulation';
import {createSolidMaterial, surfaceAndPolygonsToGeom} from './viewUtils';
import {DoubleSide, Mesh} from 'three';
import Vector from 'math/vector';
import {SKETCH_REGION} from 'cad/model/entities';
import {setAttribute} from 'scene/objectData';

// Unlike a contour view, the clickable mesh covers exactly one bounded region:
// the outer contour with its direct children removed.
export class SketchRegionView extends View {
  constructor(ctx, region, parent) {
    super(ctx, region, parent);
    this.rootGroup=SceneGraph.createGroup();
    const contours=[region.outerContour,...region.holeContours];
    const polygons=contours.map(c=>c.tessellateInCoordinateSystem(region.face.csys));
    const triangles=TriangulatePolygons(polygons,region.face.csys.z,v=>v.data(),a=>new Vector().set3(a));
    const geometry=surfaceAndPolygonsToGeom(region.face.surface,triangles);
    this.mesh=new Mesh(geometry,createSolidMaterial({side:DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,visible:false}));
    setAttribute(this.mesh,SKETCH_REGION,this);
    this.mesh.raycastPriority=11;
    this.mesh.onMouseEnter=()=>{if(!this.isDisposed)ctx.highlightService.highlight(this.model.id)};
    this.mesh.onMouseLeave=()=>{if(!this.isDisposed)ctx.highlightService.unHighlight(this.model.id)};
    this.rootGroup.add(this.mesh);
  }
  updateVisuals(){if(!this.markColor)this.mesh.material.visible=false;else{this.mesh.material.color.set(this.markColor);this.mesh.material.visible=true;}}
  dispose(){this.mesh.geometry.dispose();this.mesh.material.dispose();super.dispose();}
}
