import {projectedDirectionValid} from './projectedDistanceDomain.mjs';
import {fixedEntityValid} from './fixedEntityDomain.mjs';
import {rigidGroupValid} from '../rigid/rigidGroupDomain.mjs';

// All three relations use one or more live, nondegenerate segment directions.
export function directionalSegments(constraint) {
  switch (constraint?.schema?.id) {
    case 'ProjectedDistance': return [constraint.objects[2]];
    case 'Collinear': return [constraint.objects[0],constraint.objects[1]];
    case 'AxisSymmetry': return [constraint.objects[2]];
    default: return [];
  }
}
export function directionalRelation(constraint) {
  return ['ProjectedDistance','Collinear','AxisSymmetry','FixSegment','FixCircle','FixArc','RigidGroup'].includes(constraint?.schema?.id);
}
export function directionalRelationValid(constraint) {
  if(['FixSegment','FixCircle','FixArc'].includes(constraint?.schema?.id))return fixedEntityValid(constraint);
  if(constraint?.schema?.id==='RigidGroup')return rigidGroupValid(constraint.objects[0],constraint.objects.slice(1));
  const segments=directionalSegments(constraint);
  return segments.length>0&&segments.every(projectedDirectionValid);
}
export function directionalSegmentNonzero(segment) {
  if(!segment?.a||!segment?.b||!segment.params?.t||!segment.params?.ang)return false;
  const dx=segment.b.x-segment.a.x,dy=segment.b.y-segment.a.y,t=segment.params.t.get(),angle=segment.params.ang.get();
  return [dx,dy,t,angle].every(Number.isFinite)&&Math.hypot(dx,dy)>1e-9&&Math.abs(t)>1e-9;
}
