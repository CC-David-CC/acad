import {admissionCause,withAdmissionCause} from '../constr/admissionCause.mjs';
import {inspectStageGenerators} from './stageGeneratorPolicy.mjs';
import {directionalRelation,directionalRelationValid} from '../constr/lineRelationDomain.mjs';
import {rigidGroupValid} from '../rigid/rigidGroupDomain.mjs';
import {validateCurvedBoundary,referencedCurvedBoundaries,assertUnchangedCurvedBoundaries,assertFixedCurvedBoundary} from './curvedBoundaryPolicy.mjs';
import {inspectBoundedSpline,SPLINE_WORK_LIMIT} from './splinePolicy.mjs';
import {inspectCarriedCurve} from './carriedCurvePolicy.mjs';
import {assertRegisteredConstraintDomain,registeredResidualProfile} from './registeredConstraintPolicy.mjs';
import {ordinarySketchEntityDomainValid} from '../constr/ordinaryEntityDomain.mjs';

const LIMIT = 10000;
const MAX_COORD = 1e9;
const LENGTH_TOLERANCE_MM = 1e-6;
const signature = {
  StraightSlot:['Segment','Segment','Arc','Segment','Arc'],
  PCoincident: ['Point','Point'], LockPoint: ['Point'],
  Horizontal: ['Segment'], Vertical: ['Segment'], SegmentLength: ['Segment'], EqualLength: ['Segment','Segment'], LengthRelation: ['Segment','Segment'],
  RadiusLength: [['Circle','Arc']], DiameterLength: [['Circle','Arc']], DistancePL: ['Point','Segment'], PointOnLine: ['Point','Segment'],
  SignedDistanceX: ['Point','Point'], SignedDistanceY: ['Point','Point'], ProjectedDistance: ['Point','Point','Segment'],
  Collinear: ['Segment','Segment'], AxisSymmetry: ['Point','Point','Segment'],
  Concentric:[['Circle','Arc'],['Circle','Arc']],EqualRadius:[['Circle','Arc'],['Circle','Arc']],
  Angle:['Segment'],AngleBetween:['Segment','Segment'],Parallel:['Segment','Segment'],Perpendicular:['Segment','Segment'],
  DistancePP:['Point','Point'],PointInMiddle:['Point','Segment'],Symmetry:['Point','Segment'],
  TangentLC:['Segment',['Circle','Arc']],PointOnCircle:['Point',['Circle','Arc']],
  PointOnBezier:['Point','BezierCurve'],TangentLineBezier:['Segment','BezierCurve'],PointOnEllipse:['Point',['Ellipse','EllipticalArc']],
  Polar:['Segment','Point','Point'],ArcConsistency:['Arc'],Fillet:['Segment','Segment','Arc'],
  FixSegment:['Segment'],FixCircle:['Circle'],FixArc:['Arc']
};
export class SketchSolveError extends Error { code: string; constructor(code, message) { super(message); this.code = code; } }
export const fail = (code, message, cause = undefined): never => { throw withAdmissionCause(new SketchSolveError(code, message),cause); };
export const record = o => o && typeof o === 'object' && !Array.isArray(o);
export const only = (o, keys) => record(o) && Object.keys(o).every(key => keys.includes(key));
const pointRecord = p => only(p,['x','y']) && [p.x,p.y].every(Number.isFinite);
export function inspectTree(root) {
  const todo = [[root, 0]], seen = new Set(); let count = 0, characters = 0;
  while (todo.length) {
    const [value, depth] = todo.pop();
    if (++count > 100000 || depth > 64) fail('LIMIT', 'Sketch exceeds structural limits.');
    if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > MAX_COORD)) fail('INVALID', 'Sketch contains a non-finite or out-of-range number.');
    if (typeof value === 'string' && (value.length > 1024 * 1024 || (characters += value.length) > 4 * 1024 * 1024)) fail('LIMIT', 'Sketch string exceeds limits.');
    if (value && typeof value === 'object') {
      if (seen.has(value)) fail('INVALID', 'Sketch data must be a tree.');
      seen.add(value);
      if (Array.isArray(value) && value.length > LIMIT) fail('LIMIT','Sketch array exceeds limits.');
      const children=Object.entries(value);
      if (children.length + todo.length + count > 100000) fail('LIMIT','Sketch exceeds structural limits.');
      for (const [key,child] of children) {
        if ((characters += key.length) > 4 * 1024 * 1024) fail('LIMIT','Sketch string exceeds limits.');
        todo.push([child, depth + 1]);
      }
    }
  }
}
function lineTypes(boundary) {
  if (!only(boundary,['lines','arcs','circles','nurbses']) || !['lines','arcs','circles','nurbses'].every(k => Array.isArray(boundary[k]))) fail('INVALID', 'Invalid boundary data.');
  if (boundary.nurbses.length) fail('UNSUPPORTED', 'NURBS boundaries are unsupported.');
  try{validateCurvedBoundary(boundary)}catch{fail('INVALID','Invalid analytic boundary geometry.');}
  if (boundary.lines.length > LIMIT) fail('LIMIT', 'Too many boundary lines.');
  const map = new Map();
  for (const edge of boundary.lines) {
    if (!only(edge,['id','a','b']) || typeof edge.id !== 'string' || !edge.id || map.has(edge.id) || !pointRecord(edge.a) || !pointRecord(edge.b) || Math.hypot(edge.b.x-edge.a.x,edge.b.y-edge.a.y) <= 1e-9) fail('INVALID', 'Invalid, duplicate or degenerate boundary line.');
    map.set(edge.id, edge);
  }
  return map;
}
export function typeIndex(sketch, boundary) {
  const index = new Map([['ground/ORIGIN', 'Point']]);
  const add = (id, type) => { if (typeof id !== 'string' || !id || index.has(id)) fail('INVALID', 'Duplicate or invalid sketch reference.'); index.set(id, type); };
  for (const edge of boundary.lines) { const id = 'boundary/' + edge.id; add(id,'Segment'); add(id+':A','Point'); add(id+':B','Point'); }
  for(const edge of boundary.circles){const id='boundary/'+edge.id;add(id,'Circle');add(id+':C','Point');}
  for(const edge of boundary.arcs){const id='boundary/'+edge.id;add(id,'Arc');add(id+':A','Point');add(id+':B','Point');add(id+':C','Point');}
  let splineWork=0;
  for (const object of sketch.objects) {
    if (!only(object,['id','type','role','stage','data'])) fail('UNSUPPORTED','Unsupported sketch object fields.');
    if (!['Point','Segment','Circle','Arc','RigidGroup','BSpline','Ellipse','EllipticalArc','BezierCurve'].includes(object.type)) fail('UNSUPPORTED', 'Unsupported sketch geometry: '+object.type);
    add(object.id, object.type);
    const d=object.data;
    if (!record(d)) fail('INVALID','Invalid sketch geometry.');
    if(object.type==='BSpline'){let spline;try{spline=inspectBoundedSpline(object.id,d)}catch(error){fail(error?.code==='SPLINE_RESOURCE_LIMIT'?'LIMIT':error?.code==='UNSUPPORTED_SPLINE_SOURCE'?'UNSUPPORTED':'INVALID',typeof error?.message==='string'?error.message:'Invalid B-spline source.',error?.code==='UNSUPPORTED_SPLINE_SOURCE'?undefined:admissionCause(error?.code==='SPLINE_RESOURCE_LIMIT'?'resource-limit':'invalid-domain'));}splineWork+=spline.work;if(splineWork>SPLINE_WORK_LIMIT)fail('LIMIT','B-spline sampling exceeds limits.');for(const child of spline.childRefs)add(child.id,child.type);}
    if (object.type === 'Segment' && (!only(d,['a','b']) || !pointRecord(d.a) || !pointRecord(d.b) || !ordinarySketchEntityDomainValid('Segment',d))) fail('INVALID','Degenerate sketch segment.',admissionCause('invalid-domain'));
    if (object.type === 'Circle' && (!only(d,['c','r']) || !pointRecord(d.c) || !ordinarySketchEntityDomainValid('Circle',d))) fail('INVALID','Degenerate sketch circle.',admissionCause('invalid-domain'));
    if (object.type === 'Arc' && (!only(d,['a','b','c']) || !pointRecord(d.a) || !pointRecord(d.b) || !pointRecord(d.c) || !ordinarySketchEntityDomainValid('Arc',d))) fail('INVALID','Degenerate sketch arc.',admissionCause('invalid-domain'));
    if (['Ellipse','EllipticalArc','BezierCurve'].includes(object.type)) for(const [suffix,type] of inspectCarriedCurve(object.type,d)) add(object.id+suffix,type);
    if (object.type === 'Point' && !pointRecord(d)) fail('INVALID','Invalid sketch point.');
    if (object.type === 'Segment') { add(object.id+':A','Point'); add(object.id+':B','Point'); }
    if (object.type === 'Circle' || object.type === 'Arc') add(object.id+':C','Point');
    if (object.type === 'Arc') { add(object.id+':A','Point'); add(object.id+':B','Point'); }
  }
  return index;
}
export function assertSemantics(sketch, oldBoundary, currentBoundary) {
  if (!['objects','dimensions','labels','stages'].every(key => Array.isArray(sketch[key]))) fail('INVALID','Invalid sketch arrays.');
  const oldLines=lineTypes(oldBoundary), currentLines=lineTypes(currentBoundary);
  try{assertUnchangedCurvedBoundaries(oldBoundary,currentBoundary,referencedCurvedBoundaries(sketch,oldBoundary))}catch{fail('AMBIGUOUS_BOUNDARY','A referenced curved boundary changed or is unavailable.');}
  const oldIndex=typeIndex(sketch,oldBoundary), nextIndex=typeIndex(sketch,currentBoundary);
  try { inspectStageGenerators(sketch); } catch { fail('UNSUPPORTED', 'Invalid or unsupported stage/generator graph.'); }
  if (sketch.objects.length > LIMIT) fail('LIMIT', 'Too many sketch objects.');
  let count=0;
  for (const stage of sketch.stages) {
    if (!only(stage,['constraints','generators']) || !Array.isArray(stage.constraints) || !Array.isArray(stage.generators)) fail('INVALID', 'Invalid sketch stage.');
    for (const c of stage.constraints) {
      if (!only(c,['typeId','objects','constants','stage','annotations','admission'])) fail('UNSUPPORTED','Unsupported constraint fields.');
      if (++count > LIMIT) fail('LIMIT','Too many sketch constraints.');
      const expected=c.typeId==='RigidGroup' && Array.isArray(c.objects) && c.objects.length>=3 && c.objects.length<=33 ?
        ['RigidGroup',...Array(c.objects.length-1).fill('Segment')] :
        Object.prototype.hasOwnProperty.call(signature,c.typeId) ? signature[c.typeId] : null;
      if (!expected) fail('UNSUPPORTED','Unsupported sketch constraint: '+c.typeId);
      if (!c.admission || !['accepted','redundant'].includes(c.admission.state)) fail('UNSUPPORTED','Rejected or missing admission intent cannot be regenerated.');
      if (!Array.isArray(c.objects) || c.objects.length !== expected.length) fail('INVALID','Invalid constraint references.');
      if((['Collinear','AxisSymmetry','Concentric','EqualRadius','AngleBetween','Parallel','Perpendicular','Fillet'].includes(c.typeId))&&c.objects[0]===c.objects[1])fail('INVALID','Relation targets must be distinct.');
      c.objects.forEach((id,i)=>{const allowed=Array.isArray(expected[i])?expected[i]:[expected[i]];if(!allowed.includes(oldIndex.get(id))||!allowed.includes(nextIndex.get(id))||oldIndex.get(id)!==nextIndex.get(id))fail('INVALID','Missing or type-changed constraint reference: '+id);});
    }
  }
  // Also reject a changed or missing saved boundary before solving, even if
  // a caller accidentally passes a different line under the same child ID.
  for (const [id,previous] of oldLines) {
    const current=currentLines.get(id);
    if (!current) continue;
    const ax=previous.b.x-previous.a.x, ay=previous.b.y-previous.a.y, bx=current.b.x-current.a.x, by=current.b.y-current.a.y;
    // Side choices and endpoint references depend on line orientation. With
    // only two revisions, a reversal or 90-degree turn cannot be safely
    // distinguished from a changed orientation branch. Require provenance
    // or a more capable branch model before accepting those edits.
    if (ax*bx+ay*by <= 1e-12*Math.hypot(ax,ay)*Math.hypot(bx,by)) fail('AMBIGUOUS_BOUNDARY','Boundary line orientation changed ambiguously.');
  }
}
export function assertFixedBoundary(index, boundary) {
  try{assertFixedCurvedBoundary(index,boundary)}catch{fail('BOUNDARY_CHANGED','A fixed curved boundary changed during solving.');}
  for (const edge of boundary.lines) {
    const line = index['boundary/' + edge.id];
    if (!line || line.TYPE !== 'Segment' || !line.a || !line.b ||
        line.a.x !== edge.a.x || line.a.y !== edge.a.y || line.b.x !== edge.b.x || line.b.y !== edge.b.y) {
      fail('BOUNDARY_CHANGED','A fixed boundary changed during solving.');
    }
    const dx=edge.b.x-edge.a.x, dy=edge.b.y-edge.a.y, expectedAngle=Math.atan2(dy,dx), expectedLength=Math.hypot(dx,dy);
    const difference=Math.atan2(Math.sin(line.ang-expectedAngle),Math.cos(line.ang-expectedAngle));
    if (!Number.isFinite(line.ang) || !Number.isFinite(line.t) || Math.abs(difference)>1e-12 || Math.abs(line.t-expectedLength)>LENGTH_TOLERANCE_MM) {
      fail('BOUNDARY_CHANGED','A fixed boundary direction or length changed during solving.');
    }
  }
}
export function incomingIntent(sketch) {
  return sketch.stages.map(stage => stage.constraints.map(c => ({typeId:c.typeId,objects:c.objects,constants:c.constants,stage:c.stage,annotations:c.annotations,admission:c.admission})));
}
// Shared validation of ORIGINAL registered equations at the model's current
// coordinates. It does not solve, classify, normalize or mutate geometry.
export function validateConstraintGeometry(c: any) {
  if(directionalRelation(c)&&!directionalRelationValid(c))fail('DIRECTION_DOMAIN','A relation direction is degenerate or inconsistent.',admissionCause('invalid-domain'));
  if(c.schema.id==='RigidGroup'&&!rigidGroupValid(c.objects[0],c.objects.slice(1)))fail('RIGID_DOMAIN','A rigid group has inconsistent transformed geometry.',admissionCause('invalid-domain'));
  const polynomials=[];c.collectPolynomials(polynomials);
  try {assertRegisteredConstraintDomain(c);} catch(error) {throw withAdmissionCause(error,admissionCause('invalid-domain'));}
  const profile=registeredResidualProfile(c,polynomials.map(p=>p.value()));
  if(!profile.residuals.every((value,i)=>Number.isFinite(value)&&Math.abs(value)<=profile.tolerances[i]))fail('RESIDUAL','A constraint residual exceeds its numerical tolerance.',admissionCause('original-residual-failure'));
  return profile;
}
