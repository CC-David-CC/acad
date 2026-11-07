// A line range has no exported origin/direction, so its absolute parameter
// origin remains unverified until the native schema supplies a line frame.
function fail() { throw new Error('Invalid prism boundary or parameter bounds'); }
const near = (a, b, tolerance = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const subtract = (a, b) => a.map((value, i) => value - b[i]);
const samePoint = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === 3 && b.length === 3 && a.every((value, i) => near(value, b[i], 1e-5));

function checkSurfacePoint(face, point) {
  const relative = subtract(point, face.origin);
  if (face.type === 'plane') {
    if (Math.abs(dot(relative, face.normal)) > 1e-5) fail();
    const u = dot(relative, face.xDirection), v = dot(relative, face.yDirection);
    if (u < face.uv[0] - 1e-5 || u > face.uv[1] + 1e-5 || v < face.uv[2] - 1e-5 || v > face.uv[3] + 1e-5) fail();
  } else if (face.type === 'cylinder') {
    const axial = dot(relative, face.axis);
    const radial = subtract(relative, face.axis.map(value => value * axial));
    if (!near(Math.hypot(...radial), face.radius, 1e-5) || axial < face.uv[2] - 1e-5 || axial > face.uv[3] + 1e-5) fail();
  } else fail();
}

function checkOuterLine(a, b, corners) {
  const ai = corners.findIndex(point => samePoint(point, a));
  const bi = corners.findIndex(point => samePoint(point, b));
  if (ai < 0 || bi < 0 || ai === bi) fail();
  const x = ai % 4, y = bi % 4;
  const vertical = x === y && Math.abs(ai - bi) === 4;
  const horizontal = Math.floor(ai / 4) === Math.floor(bi / 4) && ((x + 1) % 4 === y || (y + 1) % 4 === x);
  if (!vertical && !horizontal) fail();
}

function checkFaceBounds(face, boundary, vertices) {
  if (face.type === 'plane') {
    if (boundary.length !== 8) fail();
    const axes = [[face.xDirection, face.uv[0], face.uv[1]], [face.yDirection, face.uv[2], face.uv[3]]];
    for (const [axis, low, high] of axes) {
      const values = boundary.map(point => dot(subtract(point, face.origin), axis));
      if (!near(Math.min(...values), low, 1e-5) || !near(Math.max(...values), high, 1e-5)) fail();
    }
    return;
  }
  const coedges = face.loops.flat();
  const circles = coedges.filter(edge => edge.type === 'circle');
  if (circles.length !== 2 || !near(face.uv[1] - face.uv[0], 2 * Math.PI, 1e-7) ||
      circles.some(edge => !near(edge.range[0], face.uv[0], 1e-7) || !near(edge.range[1], face.uv[1], 1e-7))) fail();
  const points = coedges.flatMap(edge => [vertices[edge.start - 1], vertices[edge.end - 1]]);
  const values = points.map(point => dot(subtract(point, face.origin), face.axis));
  if (!near(Math.min(...values), face.uv[2], 1e-5) || !near(Math.max(...values), face.uv[3], 1e-5)) fail();
}

export function validatePrismBoundary(raw, profile, depth) {
  const base = profile.worldVertices;
  if (!Array.isArray(base) || base.length !== 4 || !Number.isFinite(depth) || depth <= 0) fail();
  const corners = [...base, ...base.map(point => [point[0], point[1], point[2] + depth])];
  const lines = new Map(), usedVertices = new Set();
  for (const face of raw.faces) {
    if (!Array.isArray(face.uv) || face.uv.length !== 4 || !face.uv.every(Number.isFinite) ||
        !(face.uv[0] < face.uv[1]) || !(face.uv[2] < face.uv[3])) fail();
    const boundary = [];
    for (const loop of face.loops) {
      for (const edge of loop) {
        usedVertices.add(edge.start);
        usedVertices.add(edge.end);
        const a = raw.vertices[edge.start - 1], b = raw.vertices[edge.end - 1];
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 3 || b.length !== 3 ||
            !a.every(Number.isFinite) || !b.every(Number.isFinite)) fail();
        checkSurfacePoint(face, a);
        checkSurfacePoint(face, b);
        if (edge.type !== 'line') continue;
        if (!Array.isArray(edge.range) || edge.range.length !== 2 || !edge.range.every(Number.isFinite) ||
            !(edge.range[0] < edge.range[1]) || !near(edge.range[1] - edge.range[0], Math.hypot(...subtract(b, a)), 1e-5)) fail();
        const previous = lines.get(edge.edge);
        if (previous && (!near(previous[0], edge.range[0]) || !near(previous[1], edge.range[1]))) fail();
        lines.set(edge.edge, edge.range);
        if (face.type === 'plane') {
          checkOuterLine(a, b, corners);
          boundary.push(a, b);
        }
      }
    }
    checkFaceBounds(face, boundary, raw.vertices);
  }
  if (usedVertices.size !== raw.vertices.length) fail();
}
