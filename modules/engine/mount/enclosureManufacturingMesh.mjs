// Strictly bounded planar enclosure qualification. Coordinates are indexed
// exactly as received; no tolerance-based welding or geometry repair.
import { enclosurePlan, enclosurePlanV2, validateManifoldEnclosureInput, validateManifoldEnclosureInputV2 } from './enclosurePlan.mjs';

const fail = () => {
  throw Object.assign(new Error('Enclosure manufacturing geometry is unsupported or invalid.'), {
    code: 'INVALID_MANUFACTURING_MESH'
  });
};

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

const area = p => {
  if (p.length < 3) return 0;
  let sum = 0;

  for (let i = 1; i + 1 < p.length; i++) sum += cross(p[0], p[i], p[i + 1]);

  return Math.abs(sum) / 2;
};

function intersection(subject, clip) {
  let out = subject.slice();

  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i],
          b = clip[(i + 1) % clip.length],
          input = out;
    out = [];

    for (let j = 0; j < input.length; j++) {
      const p = input[j],
            q = input[(j + 1) % input.length],
            dp = cross(a, b, p),
            dq = cross(a, b, q),
            pi = dp >= 0,
            qi = dq >= 0;
      if (pi) out.push(p);

      if (pi !== qi) {
        const t = dp / (dp - dq);
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    }
  }

  return out;
}

function rect(x0, x1, y0, y1) {
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}

function surfaces(input, role) {
  const {
    width: w,
    length: l,
    height: h,
    wall: t,
    clearance: c,
    lidThickness: s,
    lipDepth: p
  } = input;

  const face = (axis, pos, sign, a, b, hole = null) => ({
    axis,
    pos,
    sign,
    a,
    b,
    hole,
    tris: [],
    actual: 0,
    expected: (a[1] - a[0]) * (b[1] - b[0]) - (hole ? (hole[1] - hole[0]) * (hole[3] - hole[2]) : 0)
  });

  if (role === 'BODY') return [face(0, 0, -1, [0, l], [0, h]), face(0, w, 1, [0, l], [0, h]), face(1, 0, -1, [0, h], [0, w]), face(1, l, 1, [0, h], [0, w]), face(2, 0, -1, [0, w], [0, l]), face(2, h, 1, [0, w], [0, l], [t, w - t, t, l - t]), face(0, t, 1, [t, l - t], [t, h]), face(0, w - t, -1, [t, l - t], [t, h]), face(1, t, 1, [t, h], [t, w - t]), face(1, l - t, -1, [t, h], [t, w - t]), face(2, t, 1, [t, w - t], [t, l - t])];

  const label = input.label, lx=label?(w-label.width)/2:0, ly=label?(l-label.length)/2:0, lz=label?h+s-label.depth:0;
  if (role === 'LABEL' && label) return [face(0,lx,-1,[ly,ly+label.length],[lz,h+s]),face(0,lx+label.width,1,[ly,ly+label.length],[lz,h+s]),face(1,ly,-1,[lz,h+s],[lx,lx+label.width]),face(1,ly+label.length,1,[lz,h+s],[lx,lx+label.width]),face(2,lz,-1,[lx,lx+label.width],[ly,ly+label.length]),face(2,h+s,1,[lx,lx+label.width],[ly,ly+label.length])];
  if (role === 'LID') {
    const x = t + c,
          y = t + c;
    const base = [face(0, 0, -1, [0, l], [h, h + s]), face(0, w, 1, [0, l], [h, h + s]), face(1, 0, -1, [h, h + s], [0, w]), face(1, l, 1, [h, h + s], [0, w]), face(2, h + s, 1, [0, w], [0, l],label?[lx,lx+label.width,ly,ly+label.length]:null), face(2, h, -1, [0, w], [0, l], [x, w - x, y, l - y]), face(0, x, -1, [y, l - y], [h - p, h]), face(0, w - x, 1, [y, l - y], [h - p, h]), face(1, y, -1, [h - p, h], [x, w - x]), face(1, l - y, 1, [h - p, h], [x, w - x]), face(2, h - p, -1, [x, w - x], [y, l - y])];
    if(label)base.push(face(0,lx,1,[ly,ly+label.length],[lz,h+s]),face(0,lx+label.width,-1,[ly,ly+label.length],[lz,h+s]),face(1,ly,1,[lz,h+s],[lx,lx+label.width]),face(1,ly+label.length,-1,[lz,h+s],[lx,lx+label.width]),face(2,lz,1,[lx,lx+label.width],[ly,ly+label.length]));return base;
  }

  fail();
}

export function validateEnclosureManufacturingRequest(input, role, engine, maxDeviationMm) {
  const labeled=Object.hasOwn(input,'label');
  const plan = engine === 'manifold' ? (labeled?validateManifoldEnclosureInputV2:validateManifoldEnclosureInput)(input) : engine === 'occ' ? (labeled?enclosurePlanV2:enclosurePlan)(input) : fail();
  const scale = Math.max(input.width, input.length, input.height + input.lidThickness),
        minimum = engine === 'manifold' ? Math.max(1e-6, scale * 2 ** -22) : 1e-6;
  const smallest = Math.min(input.wall, input.clearance, input.lidThickness, input.lipDepth, input.width - 2 * (input.wall + input.clearance), input.length - 2 * (input.wall + input.clearance), input.height - input.wall - input.lipDepth);
  const labelMinimum=labeled?Math.min(input.label.width,input.label.length,input.label.depth,input.lidThickness-input.label.depth,(input.width-input.label.width)/2,(input.length-input.label.length)/2):Infinity;
  if (!Number.isFinite(maxDeviationMm) || maxDeviationMm < minimum || maxDeviationMm > 0.01 || maxDeviationMm * 16 >= Math.min(smallest,labelMinimum)) throw Object.assign(new Error('Requested manufacturing deviation is unsupported.'), {
    code: 'UNSUPPORTED_PRECISION'
  });
  surfaces(input, role);
  return plan;
}
export function qualifyEnclosureManufacturingMesh(buffer, count, input, role, engine, maxDeviationMm) {
  const plan = validateEnclosureManufacturingRequest(input, role, engine, maxDeviationMm);
  if (!(buffer instanceof ArrayBuffer) || !Number.isSafeInteger(count) || count < 4 || count > 128 || buffer.byteLength !== count * 9 * 8) fail();
  const values = new Float64Array(buffer),
        faces = surfaces(input, role),
        vertices = [],
        indices = [],
        byPoint = new Map(),
        edges = new Map(),
        links = new Map(),
        parents = Array.from({
    length: count
  }, (_, i) => i);
  let deviation = 0,
      volume = 0,
      origin = null;

  const find = i => {
    while (parents[i] !== i) {
      parents[i] = parents[parents[i]];
      i = parents[i];
    }

    return i;
  };

  const index = p => {
    const key = p.map(x => Object.is(x, -0) ? '0' : String(x)).join(',');

    if (!byPoint.has(key)) {
      if (vertices.length >= 384) fail();
      byPoint.set(key, vertices.length);
      vertices.push(p.map(x => Object.is(x, -0) ? 0 : x));
    }

    return byPoint.get(key);
  };

  for (let j = 0; j < count; j++) {
    const tri = [];

    for (let k = 0; k < 3; k++) {
      const p = [0, 1, 2].map(i => values[j * 9 + k * 3 + i]);
      if (p.some(x => !Number.isFinite(x) || Math.abs(x) > 1e6)) fail();
      tri.push(p);
    }

    if (!origin) origin = tri[0];
    const [a, b, c] = tri,
          u = b.map((x, i) => x - a[i]),
          v = c.map((x, i) => x - a[i]),
          n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (!Number.isFinite(Math.hypot(...n)) || Math.hypot(...n) <= 1e-14) fail();
    const matches = [];

    for (const f of faces) {
      const ai = (f.axis + 1) % 3,
            bi = (f.axis + 2) % 3,
            uv = tri.map(p => [p[ai], p[bi]]);
      if (n[f.axis] * f.sign <= 0 || tri.some(p => Math.abs(p[f.axis] - f.pos) > maxDeviationMm) || uv.some(p => p[0] < f.a[0] - maxDeviationMm || p[0] > f.a[1] + maxDeviationMm || p[1] < f.b[0] - maxDeviationMm || p[1] > f.b[1] + maxDeviationMm)) continue;
      matches.push({
        f,
        uv
      });
    }

    if (matches.length !== 1) fail();
    const {
      f,
      uv
    } = matches[0];

    for (const p of tri) deviation = Math.max(deviation, Math.abs(p[f.axis] - f.pos));

    const polygon = cross(...uv) < 0 ? [uv[0], uv[2], uv[1]] : uv,
          triangleArea = area(polygon);
    if (!(triangleArea > 0)) fail();

    if (f.hole) {
      const [x0, x1, y0, y1] = f.hole,
            t = maxDeviationMm,
            hole = intersection(polygon, rect(x0 + t, x1 - t, y0 + t, y1 - t));
      if (hole.length >= 3 && area(hole) > 0) fail();
    }

    for (const other of f.tris) {
      const overlap = intersection(polygon, other);
      if (overlap.length >= 3 && area(overlap) > Math.max(1e-12, f.expected * Number.EPSILON * 16)) fail();
    }

    f.tris.push(polygon);
    f.actual += triangleArea;
    const ids = tri.map(index);
    if (new Set(ids).size !== 3) fail();
    indices.push(...ids);

    for (let k = 0; k < 3; k++) {
      const x = ids[k],
            y = ids[(k + 1) % 3],
            key = x < y ? x + ':' + y : y + ':' + x,
            e = edges.get(key) || {
        count: 0,
        sign: 0,
        tri: []
      };
      e.count++;
      e.sign += x < y ? 1 : -1;
      e.tri.push(j);
      if (e.count > 2) fail();
      if (e.count === 2) parents[find(j)] = find(e.tri[0]);
      edges.set(key, e);
    }

    volume += ((a[0] - origin[0]) * n[0] + (a[1] - origin[1]) * n[1] + (a[2] - origin[2]) * n[2]) / 6;
  }

  for (const f of faces) {
    const per = 2 * (f.a[1] - f.a[0] + (f.b[1] - f.b[0])) + (f.hole ? 2 * (f.hole[1] - f.hole[0] + (f.hole[3] - f.hole[2])) : 0);
    if (!f.tris.length || Math.abs(f.actual - f.expected) > Math.max(1e-8, per * maxDeviationMm * 4)) fail();
  }

  for (const [key, e] of edges) {
    if (e.count !== 2 || e.sign !== 0) fail();

    for (const v of key.split(':').map(Number)) {
      if (!links.has(v)) links.set(v, new Map());
      const graph = links.get(v),
            [a, b] = e.tri;
      if (!graph.has(a)) graph.set(a, []);
      if (!graph.has(b)) graph.set(b, []);
      graph.get(a).push(b);
      graph.get(b).push(a);
    }
  }

  if (new Set(parents.map((_, i) => find(i))).size !== 1) fail();

  for (const graph of links.values()) {
    if ([...graph.values()].some(v => v.length !== 2)) fail();
    const todo = [graph.keys().next().value],
          seen = new Set();

    while (todo.length) {
      const n = todo.pop();
      if (seen.has(n)) continue;
      seen.add(n);
      todo.push(...graph.get(n));
    }

    if (seen.size !== graph.size) fail();
  }

  const expected = role === 'BODY' ? plan.body.volume : role === 'LABEL' ? plan.label.volume : plan.lid.volume,
        surfaceArea = faces.reduce((n, f) => n + f.expected, 0);
  if (!Number.isFinite(volume) || volume <= 0 || Math.abs(volume - expected) > Math.max(1e-6, surfaceArea * maxDeviationMm * 4)) fail();
  return {
    vertices: Float64Array.from(vertices.flat()),
    triangles: Uint32Array.from(indices),
    evidence: {
      version: 1,
      role,
      unit: 'millimeter',
      engine,
      maxDeviationMm,
      observedPlaneDeviationMm: deviation,
      volume,
      vertexCount: vertices.length,
      triangleCount: count,
      surfaceCount: faces.length
    }
  };
}
