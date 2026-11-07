import BBox from 'math/bbox';
import {PlaneSurfacePrototype} from 'cad/model/surfacePrototype';

const planeBoundTo = PlaneSurfacePrototype.prototype.boundTo;

// Display only: the model's BRep surface and sketch frame remain authoritative.
// A degree-one plane's corner evaluations are exactly its transformed rectangle.
export function openFaceDisplayBounds(prototype, points, minWidth, minHeight, offset) {
  if (Object.getPrototypeOf(prototype) === PlaneSurfacePrototype.prototype && prototype.boundTo === planeBoundTo) {
    const box = new BBox();
    points.forEach(point => box.checkPoint(point));
    if (minWidth && box.width() < minWidth) {
      box.checkBounds(minWidth * 0.5, 0);
      box.checkBounds(-minWidth * 0.5, 0);
    }
    if (minHeight && box.height() < minHeight) {
      box.checkBounds(0, minHeight * 0.5);
      box.checkBounds(0, -minHeight * 0.5);
    }
    if (offset !== 0) {
      box.maxX += offset * 0.5;
      box.minX -= offset * 0.5;
      box.maxY += offset * 0.5;
      box.minY -= offset * 0.5;
    }
    const transform = prototype.plane.get3DTransformation();
    const polygon = box.toPolygon().map(point => transform._apply(point));
    // Preserve the existing surface's (uMin,vMin), (uMax,vMin), ... ordering.
    return [polygon[3], polygon[0], polygon[1], polygon[2]];
  }

  // Keep custom, subclassed and overridden surface behavior unchanged.
  const surface = prototype.boundTo(points, minWidth, minHeight, offset);
  return [surface.southWestPoint(), surface.southEastPoint(), surface.northEastPoint(), surface.northWestPoint()];
}
