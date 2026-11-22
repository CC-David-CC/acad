import {extractPrismTopology} from '../mount/profile-topology.mjs';
import {measureExactSignedMeshVolume} from '../mount/exactMeshVolume.mjs';

function requireGeometry(condition, message) {
  if (!condition) throw Error(message);
}

function coords(point) { return [point.X(), point.Y(), point.Z()]; }
const indices = [0, 1, 2];

function readPrism(oc, own, shape, prism, sketchEdges, prepared) {
  own(new oc.BRepMesh_IncrementalMesh(shape, 0.1, false, 0.5, false));
  const nativeFaces = [], nativeEdges = [], rawFaces = [], orientedTriangles = [];
  const boundaryCounts = new Map();
  const getPoint = vertex => coords(own(oc.BRep_Tool.Pnt(own(vertex))));
  function readFace(face) {
    const planar = own(new oc.BRepAdaptor_Surface(face, true));
    requireGeometry(planar.GetType() === oc.GeomAbs_SurfaceType.GeomAbs_Plane, 'Expected a planar face');
    const plane = own(planar.Plane());
    const inverted = face.Orientation() === oc.TopAbs_Orientation.TopAbs_REVERSED;
    const surface = {
      TYPE: 'PLANE', origin: coords(own(plane.Location())),
      normal: coords(own(own(plane.Axis()).Direction())), direct: plane.Direct(),
    };
    const loc = own(new oc.TopLoc_Location());
    const mesh = own(oc.BRep_Tool.Triangulation(face, loc, 0));
    const transform = own(loc.Transformation());
    requireGeometry(mesh && mesh.NbTriangles() > 0 && mesh.NbTriangles() <= 32, 'Invalid planar mesh');
    const tess = [];
    for (let i = 1; i <= mesh.NbTriangles(); i++) {
      const tri = own(mesh.Triangle(i));
      const points = [1, 2, 3].map(k => {
        const p = own(mesh.Node(tri.Value(k)));
        p.Transform(transform);
        return coords(p);
      });
      tess.push([points]);
      const oriented = inverted ? [points[0], points[2], points[1]] : points;
      orientedTriangles.push(oriented);
      for (const j of indices) {
        const a = oriented[j].join(','), b = oriented[(j + 1) % 3].join(',');
        const key = [a, b].sort().join('|');
        const count = boundaryCounts.get(key) || {uses: 0, orientation: 0};
        count.uses++;
        count.orientation += a < b ? 1 : -1;
        boundaryCounts.set(key, count);
      }
    }
    const wire = own(oc.BRepTools.OuterWire(face));
    const walk = own(new oc.BRepTools_WireExplorer(wire, face));
    const edges = [];
    while (walk.More()) {
      const edge = own(walk.Current());
      const curve = own(new oc.BRepAdaptor_Curve(edge));
      requireGeometry(curve.GetType() === oc.GeomAbs_CurveType.GeomAbs_Line, 'Expected a straight edge');
      let index = nativeEdges.findIndex(item => item.IsSame(edge));
      if (index < 0) { index = nativeEdges.length; nativeEdges.push(edge); }
      const a = getPoint(oc.TopExp.FirstVertex(edge, false)), b = getPoint(oc.TopExp.LastVertex(edge, false));
      edges.push({
        edgeRef: index + 1, a, b, inverted: edge.Orientation() === oc.TopAbs_Orientation.TopAbs_REVERSED,
        curveBounds: [curve.FirstParameter(), curve.LastParameter()],
        curve: {TYPE: 'B-SPLINE', deg: 1, cp: [a, b], weights: [1, 1]}, tess: [a, b],
      });
      walk.Next();
    }
    return {surface, inverted, loops: [edges], tess};
  }
  const explorer = own(new oc.TopExp_Explorer(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE));
  while (explorer.More()) {
    const face = own(oc.TopoDS.Face(own(explorer.Current())));
    nativeFaces.push(face);
    rawFaces.push(readFace(face));
    explorer.Next();
  }
  const capFaces = [own(prism.FirstShape()), own(prism.LastShape())].map(s => nativeFaces.findIndex(f => f.IsSame(s)));
  const delta = prepared.direction.map(n => n * prepared.depth);
  const distance = (p, q) => Math.hypot(...p.map((n, j) => n - q[j]));
  const edgeFaces = sketchEdges.map((edge, i) => {
    const generated = own(prism.Generated(edge));
    requireGeometry(generated.Size() === 1, 'Ambiguous swept face history');
    const swept = own(generated.First());
    const faceOrdinal = nativeFaces.findIndex(face => face.IsSame(swept));
    const a = prepared.worldVertices[i], b = prepared.worldVertices[(i + 1) % 4];
    const witnesses = [a, b, a.map((n,j) => n + delta[j]), b.map((n,j) => n + delta[j])];
    const matches = rawFaces.flatMap((f, ordinal) => witnesses.every(p =>
      f.tess.some(([triangle]) => triangle.some(q => distance(p, q) <= 1e-6))) ? [ordinal] : []);
    requireGeometry(matches.length === 1 && faceOrdinal === matches[0], 'Swept-face geometry disagrees with builder history');
    const origin = getPoint(oc.TopExp.FirstVertex(edge, false));
    return {
      sourceEdgeId: prepared.edges[i].id, sourceReversed: prepared.edges[i].reversed,
      baseEdgeReversed: distance(origin, a) > 1e-6, faceOrdinal, faceInverted: rawFaces[faceOrdinal].inverted,
      binding: 'kernel-history-and-geometric-match',
    };
  });
  requireGeometry(capFaces.every(i => i >= 0) && new Set([...capFaces, ...edgeFaces.map(e => e.faceOrdinal)]).size === 6,
    'Expected separate end caps and four unique swept faces');
  const portableTopology = extractPrismTopology({faces: rawFaces}, prepared, edgeFaces);
  requireGeometry([...boundaryCounts.values()].every(count => count.uses === 2 && count.orientation === 0), 'Mesh boundary is open or inconsistently oriented');
  const points = orientedTriangles.flat(), flat = Float64Array.from(points.flat());
  const {signedVolume} = measureExactSignedMeshVolume(flat);
  const props = own(new oc.GProp_GProps());
  oc.BRepGProp.VolumeProperties(shape, props, true, false, false);
  const nativeVolume = props.Mass();
  requireGeometry(Number.isFinite(nativeVolume) && nativeVolume > 0 &&
    Math.abs(signedVolume - nativeVolume) <= Math.max(1e-7, nativeVolume * 1e-8), 'Mesh disagrees with native volume');
  const bounds = {
    min: indices.map(i => Math.min(...points.map(p => p[i]))),
    max: indices.map(i => Math.max(...points.map(p => p[i]))),
  };
  const expectedPoints = [...prepared.worldVertices, ...prepared.worldVertices.map(p => p.map((n,i)=>n+delta[i]))];
  for (const i of indices) {
    const samples = expectedPoints.map(p=>p[i]);
    requireGeometry(Math.abs(bounds.min[i]-Math.min(...samples)) <= 1e-6 && Math.abs(bounds.max[i]-Math.max(...samples)) <= 1e-6,
      'Native bounds disagree with authored profile');
  }
  const edgeFieldNames = [...new Set(rawFaces.flatMap(f=>f.loops[0].flatMap(e=>Object.keys(e).filter(key=>key!=='edgeRef'))))].sort();
  const topologySummary = {
    surfaceTypes: rawFaces.map(f=>f.surface.TYPE), loopLengths: rawFaces.map(f=>f.loops.map(loop=>loop.length)),
    edgeFieldNames, curveTypes:[...new Set(rawFaces.flatMap(f=>f.loops[0].map(edge=>edge.curve.TYPE)))],
    uniqueEdgeGroups: portableTopology.edges.length, edgeUseCounts: portableTopology.edges.map(e=>e.uses.length).sort(),
  };
  return {
    portableTopology,
    evidence: {faces: rawFaces.length, triangles: orientedTriangles.length, bounds, signedVolume, triangulatedClosed:true, triangleOrientationConsistent:true, topologySummary},
    provenance: {revision:prepared.revision,sketchDigest:prepared.sketchDigest,faceId:prepared.faceId,regionId:prepared.regionId,edgeFaces},
  };
}

export function extrudeRectangle(oc, prepared) {
  const owned = [];
  const own = value => { if (value) owned.push(value); return value; };
  let resultShape;
  try {
    const vertices = prepared.worldVertices.map(p => own(own(new oc.BRepBuilderAPI_MakeVertex(own(new oc.gp_Pnt(...p)))).Vertex()));
    const wire = own(new oc.BRepBuilderAPI_MakeWire());
    const edges = vertices.map((v,i) => {
      const arm = own(new oc.BRepBuilderAPI_MakeEdge(v, vertices[(i+1)%vertices.length]));
      const edge = own(arm.Edge());
      wire.Add(edge);
      return edge;
    });
    requireGeometry(wire.IsDone(), 'Could not assemble sketch wire');
    const face = own(own(new oc.BRepBuilderAPI_MakeFace(own(wire.Wire()), true)).Face());
    const vector = own(new oc.gp_Vec(...prepared.direction.map(n=>n*prepared.depth)));
    const prism = own(new oc.BRepPrimAPI_MakePrism(face, vector, false, true));
    resultShape = prism.Shape();
    requireGeometry(own(new oc.BRepCheck_Analyzer(resultShape)).IsValid(), 'Invalid native solid');
    return {shape: resultShape, result: readPrism(oc,own,resultShape,prism,edges,prepared)};
  } catch (error) {
    resultShape?.delete();
    throw error;
  } finally {
    for (const value of owned.reverse()) value.delete();
  }
}
