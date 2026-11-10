export function getSketchBoundaries(sceneFace) {
  const boundary = { lines: [], arcs: [], circles: [], nurbses: [] };
  const w2sTr = sceneFace.worldToSketchTransformation;
  let _w2sTrArr = null;
  const w2sTrArr = () => _w2sTrArr || (_w2sTrArr = w2sTr.toArray());
  if (!sceneFace.brepFace) {
    return boundary;
  }
  for (const he of sceneFace.brepFace.edges) {
    const edge = sceneFace.shell.brepRegistry.get(he.edge);
    if (!edge) {
      continue;
    }
    const id = edge.id;
    const curve = he.edge.curve.impl;
    if (curve.constructor.name === 'NurbsCurve' && curve.degree() !== 1) {
      const curve2d = curve.transform(w2sTrArr());
      // Sampled derivatives/proximity cannot authenticate an analytic full or
      // proper trim. Preserve the REAL transformed NURBS and its reference.
      // A positive analytic handoff needs Root's scoped owned topology/trim
      // context; the plane-only attachment read is not such authority.
      const data=curve2d.serialize();data.id=id;boundary.nurbses.push(data);
    } else {
      const addSegment = (id, a, b) => {
        boundary.lines.push({
          id,
          a: { x: a.x, y: a.y },
          b: { x: b.x, y: b.y }
        });
      };
      addSegment(id, w2sTr.apply(he.vertexA.point), w2sTr.apply(he.vertexB.point));
    }
  }
  return boundary;
}
