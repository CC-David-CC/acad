import {Circle, Segment} from './sketchModel';
import {profilePlan, rectangleProfile, validateSegmentLoop} from '../../../../modules/workbenches/modeler/features/extrude/profilePlan.mjs';
import {deriveAuthoredRegions} from '../../../../modules/workbenches/modeler/features/extrude/authoredRegions.mjs';

// Returns one descriptor per bounded region for the deliberately narrow P0
// shape family. Other geometry must never be approximated as a chosen region.
export function describeSketchRegions(faceId, sketch) {
 const contours=sketch.contours;
 if(!contours.length)throw Error('A closed profile is required.');
 const included=new Set(contours.flatMap(contour=>contour.segments));
 if([...sketch.connections,...sketch.loops].some(segment=>!included.has(segment)))throw Error('Every non-construction profile must be closed.');
 for(const contour of contours)if(contour.segments.every(s=>s instanceof Segment))validateSegmentLoop(contour.segments);
 const profiles=contours.map(contour=>{
  if(contour.segments.length===1&&contour.segments[0] instanceof Circle){const c=contour.segments[0];return {kind:'circle',x:c.c.x,y:c.c.y,r:c.r};}
  if(contour.segments.every(s=>s instanceof Segment))return rectangleProfile(contour.segments);
  return null;
 });
 // This validates the geometric subset including intersections and limits.
 profilePlan(profiles);
 return deriveAuthoredRegions(faceId,contours.map(c=>c.segments.map(s=>s.id)),profiles);
}
