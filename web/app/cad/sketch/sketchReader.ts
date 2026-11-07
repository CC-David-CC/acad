import * as sm from './sketchModel'
import {Graph} from '../../utils/graph'
import Joints from 'gems/joints';
import sketchObjectGlobalId from './sketchObjectGlobalId';
import {strictEqual2D, areEqual, TOLERANCE} from "math/equality";
import {Contour, Segment, SketchPrimitive} from "./sketchModel";
import Vector from "math/vector";

export class SketchGeom {

  connections: SketchPrimitive[];
  loops: SketchPrimitive[];
  constructionSegments: SketchPrimitive[];
  points: sm.SketchPoint[];
  _contours: Contour[];

  constructor() {
    this.connections = [];
    this.loops = [];
    this.constructionSegments = [];
    this.points = [];
    this._contours = null;
  }

  fetchContours() {
    if (this._contours === null) {
      this._contours = FetchContours(this);
    }
    return this._contours;
  }

  get contours(): Contour[] {
    return this.fetchContours();
  }
  
  getAllObjects() {
    return [...this.connections, ...this.loops, ...this.constructionSegments, ...this.points];
  }
}

export function ReadSketch(sketch, sketchId, readConstructionSegments) {
  const getID = obj => sketchObjectGlobalId(sketchId, obj.id);
  const out = new SketchGeom();

  const coiJoints = new Joints();
  
  if (sketch.constraints !== undefined) {
    for (let i = 0; i < sketch.constraints.length; ++i) {
      const c = sketch.constraints[i];
      const name = c[0];
      const ps = c[1];
      if (name === 'coi') {
        coiJoints.connect(ps[0], ps[1]);
      }
    }
  }
  const pointsById = new Map();
  function ReadSketchPoint(pt): Vector {
    // Projection must retain authored coordinates. The generic VectorFactory
    // welds unrelated points within 1e-3: it can close a real gap or move a
    // circle's center merely because an earlier Point is nearby. Topological
    // connectivity is determined below, independently from numerical solving.
    return new Vector(pt.x, pt.y, 0);
  }
  if (sketch.version !== 3) {
    return out;
  }
  for (const obj of sketch.objects) {
    const isConstructionObject = obj.role === 'construction';
    if (isConstructionObject && !readConstructionSegments) continue;
    // if (isConstructionObject && obj._class !== 'TCAD.TWO.Segment') continue;

    const data = obj.data;
    // Construction is a display role for every supported primitive, never a
    // profile edge. The historical collection name is kept for its consumers.
    const add = (primitive, collection) =>
      (isConstructionObject ? out.constructionSegments : out[collection]).push(primitive);
    if (obj.type === 'Point') {
      add(new sm.SketchPoint(getID(obj), ReadSketchPoint(data)), 'points');
    } else if (obj.type === 'Segment') {
      const segA = ReadSketchPoint(data.a);
      const segB = ReadSketchPoint(data.b);
      add(new sm.Segment(getID(obj), segA, segB), 'connections');
    } else if (obj.type === 'Arc') {
      // The generic vertex factory welds within 1e-3. It must not collapse a
      // short partial Arc or choose its sweep: native Arc/DXF use the stricter
      // coordinate predicate below. Preserve these authored coordinates.
      const arcA = new Vector(data.a.x, data.a.y, 0);
      const arcB = new Vector(data.b.x, data.b.y, 0);
      const arcCenter = new Vector(data.c.x, data.c.y, 0);
      if (areEqual(data.a.x, data.b.x, TOLERANCE) && areEqual(data.a.y, data.b.y, TOLERANCE)) {
        // A full sweep is a closed curve, not a zero-length trimmed arc. This
        // is derived topology only; the editable native object remains Arc.
        add(new sm.Circle(getID(obj), arcCenter, arcA.minus(arcCenter).length()), 'loops');
      } else {
        add(new sm.Arc(getID(obj), arcA, arcB, arcCenter), 'connections');
      }
    } else if (obj.type === 'EllipticalArc') {
      if (data.ep1) {
        continue;
      }
      const c = ReadSketchPoint(data.c);
      const rx = readSketchFloat(data.rx);
      const ry = readSketchFloat(data.ry);
      const rot = readSketchFloat(data.rot);
      const a = ReadSketchPoint(data.a);
      const b = ReadSketchPoint(data.b);
      add(new sm.EllipticalArc(getID(obj), c, rx, ry, rot, a, b), 'loops');
    } else if (obj.type === 'BezierCurve') {
      const a = ReadSketchPoint(data.cp1);
      const b = ReadSketchPoint(data.cp4);
      const cp1 = ReadSketchPoint(data.cp2);
      const cp2 = ReadSketchPoint(data.cp3);
      add(new sm.BezierCurve(getID(obj), a, b, cp1, cp2), 'connections');
    } else if (obj.type === 'BSpline') {
      const degree = data.degree as number;
      const knots = data.kValues as number[];
      const rawPoints = data.cPoints as {x: number; y: number}[];
      if (!Array.isArray(rawPoints) || rawPoints.length < 2 ||
          !Number.isInteger(degree) || degree < 1 || degree >= rawPoints.length ||
          !Array.isArray(knots) || knots.length !== rawPoints.length + degree + 1 ||
          !knots.every((k, i) => Number.isFinite(k) && (i === 0 || knots[i - 1] <= k) &&
            (i <= degree || k !== knots[i - degree - 1])) ||
          knots[degree] >= knots[rawPoints.length] ||
          !rawPoints.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))) {
        throw new Error('Invalid B-spline geometry in sketch ' + sketchId + '.');
      }
      const points = rawPoints.map(p => ({x: p.x, y: p.y, z: 0}));
      // Topology uses geometric endpoints, not fitting points or control
      // vertices: these differ for open, non-clamped knot vectors.
      const a = ReadSketchPoint(evaluateSplineEndpoint(points, knots, degree, false));
      const b = ReadSketchPoint(evaluateSplineEndpoint(points, knots, degree, true));
      const curve = new sm.BSplineCurve(getID(obj), degree, knots, points, a, b);
      if (Math.hypot(a.x - b.x, a.y - b.y) < 1e-6) {
        add(curve, 'loops');
      } else {
        add(curve, 'connections');
      }
    } else if (obj.type === 'Circle') {
      const circleCenter = ReadSketchPoint(data.c);
      add(new sm.Circle(getID(obj), circleCenter, readSketchFloat(data.r)), 'loops');
    } else if (obj.type === 'Ellipse') {
      if (data.ep1) {
        continue;
      }
      const c = ReadSketchPoint(data.c);
      const rx = readSketchFloat(data.rx);
      const ry = readSketchFloat(data.ry);
      const rot = readSketchFloat(data.rot);
      add(new sm.Ellipse(getID(obj), c, rx, ry, rot), 'loops');
    }
  }
  return out;
}

// De Boor evaluation at either end of the curve's actual knot domain.
// At the upper boundary use the final non-empty span from the left.
function evaluateSplineEndpoint(points, knots: number[], degree: number, atEnd: boolean) {
  const n = points.length - 1;
  const u = atEnd ? knots[n + 1] : knots[degree];
  let span = atEnd ? n : degree;
  if (!atEnd) {
    while (span < n && knots[span + 1] <= u) ++span;
  } else {
    while (span > degree && knots[span] >= u) --span;
  }
  const d = Array.from({length: degree + 1}, (_, j) => ({...points[span - degree + j]}));
  for (let r = 1; r <= degree; ++r) {
    for (let j = degree; j >= r; --j) {
      const i = span - degree + j;
      const denominator = knots[i + degree - r + 1] - knots[i];
      const alpha = denominator === 0 ? 0 : (u - knots[i]) / denominator;
      d[j] = {x: (1 - alpha) * d[j - 1].x + alpha * d[j].x,
              y: (1 - alpha) * d[j - 1].y + alpha * d[j].y, z: 0};
    }
  }
  return d[degree];
}

export function FetchContours(geom): Contour[] {
  const contours = findClosedContours(geom.connections);
  for (const loop of geom.loops) {
    const contour = new sm.Contour();
    contour.add(loop);
    contours.push(contour);
  }
  for (const contour of contours) {
    if (!contour.isCCW()) {
      contour.reverse();
    }
  }
  return contours;
}

function findClosedContours(segments) {
  const result = [];
  findClosedContoursFromPairedCurves(segments, result);
  findClosedContoursFromGraph(segments, result);
  return result;
}

function findClosedContoursFromPairedCurves(segments, result) {
  const curved = segments.map(segment => segment.isCurve);
  // No two straight segments form the paired-curve special case.
  if (!curved.some(Boolean)) return;
  for (let i = 0; i < segments.length; i++) {
    const s1 = segments[i];
    for (let j = i; j < segments.length; j++) {
      if (i === j) continue;
      const s2 = segments[j];
      if (curved[i] || curved[j]) {
        let paired = false;
        if (strictEqual2D(s1.a, s2.a) && strictEqual2D(s1.b, s2.b)) {
          paired = true;
          s2.invert();
        } else if (strictEqual2D(s1.a, s2.b) && strictEqual2D(s1.b, s2.a)) {
          paired = true;
        }
        if (paired) {
          const contour = new sm.Contour();
          contour.add(s1);
          contour.add(s2);
          result.push(contour);
        }
      }
    }
  }
}

function findClosedContoursFromGraph(segments, result) {

  // Exact numeric identities avoid hash collision chains on regular grids.
  // Preserve point insertion order and last directed-edge replacement.
  const byX = new Map<number, Map<number, any>>(), points = [];
  const edges = new Map<number, Map<number, any>>();
  function pointRecord(point) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error('Nonfinite sketch contour point.');
    let ys = byX.get(point.x);
    if (!ys) { ys = new Map(); byX.set(point.x, ys); }
    let entry = ys.get(point.y);
    if (!entry) { entry = {point, index: points.length, dirs: []}; ys.set(point.y, entry); points.push(point); }
    return entry;
  }
  function findRecord(point) { return byX.get(point.x)?.get(point.y); }
  for (const segment of segments) {
    const a = pointRecord(segment.a), b = pointRecord(segment.b);
    a.dirs.push(segment.b); b.dirs.push(segment.a);
    let outgoing = edges.get(a.index);
    if (!outgoing) { outgoing = new Map(); edges.set(a.index, outgoing); }
    outgoing.set(b.index, segment);
  }
  function edgeBetween(a, b) { return edges.get(findRecord(a).index)?.get(findRecord(b).index); }
  const graph = {
    connections: point => findRecord(point)?.dirs || [],
    at: index => points[index], size: () => points.length
  };
  const loops = Graph.findAllLoops(graph, point => findRecord(point).index,
    (a, b) => a.x === b.x && a.y === b.y);
  for (const loop of loops) {
    const contour = new sm.Contour();
    for (let pi = 0; pi < loop.length; ++pi) {
      const point = loop[pi];
      const next = loop[(pi + 1) % loop.length];
      let edge = edgeBetween(point, next);
      if (edge === undefined) {
        edge = edgeBetween(next, point);
        edge.invert();
      }
      contour.add(edge);
    }
    result.push(contour);
  }
}

const READ_AS_IS = v => v;
const READ_AS_INT = v => Math.round(v);

export let readSketchFloat = READ_AS_IS;

export function setSketchPrecision(precision) {
  if (precision === undefined) {
    readSketchFloat = READ_AS_IS;
  } else if (precision === 0) {
    readSketchFloat = READ_AS_INT;
  } else {
    const factor = Math.pow(10, precision);
    readSketchFloat =  v => Math.round(v * factor) / factor;
  }
}
