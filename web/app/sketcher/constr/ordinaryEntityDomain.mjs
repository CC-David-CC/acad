import {arcBranchFacts} from '../shapes/arcBranch.mjs';
// Existing ordinary sketch domains, not a profile/constraint/kernel verdict.
// Append-specific coordinate/radius caps and its Arc branch limit stay separate.
import {captureBezierRecord} from '../shapes/cubicCurveRecord.mjs';
import {captureEllipseRecordData} from '../shapes/ellipseRecord.mjs';
export const ORDINARY_SKETCH_ENTITY_MIN_LENGTH_MM=1e-9;
const point=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function ordinarySketchEntityDomainValid(type,data){
 const d=data,min=ORDINARY_SKETCH_ENTITY_MIN_LENGTH_MM;
 if(type==='BezierCurve'){try{captureBezierRecord(d);return true;}catch{return false;}}
 if(type==='Ellipse'){try{captureEllipseRecordData(d);return true;}catch{return false;}}
 if(type==='Segment')return !!d&&point(d.a)&&point(d.b)&&Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y)>min;
 if(type==='Circle')return !!d&&point(d.c)&&Number.isFinite(d.r)&&d.r>min;
 if(type==='Arc'){try{arcBranchFacts(d);return point(d.a)&&point(d.b)&&point(d.c)&&Math.hypot(d.a.x-d.c.x,d.a.y-d.c.y)>min&&Math.hypot(d.b.x-d.c.x,d.b.y-d.c.y)>min;}catch{return false;}}
 throw new TypeError('Ordinary entity domain checks support only Segment, Circle, Arc, Ellipse and BezierCurve.');
}
export function assertOrdinarySketchEntityDomain(type,data){
 if(!ordinarySketchEntityDomainValid(type,data))throw Object.assign(new Error('The saved '+type+' is outside the supported nondegenerate sketch entity domain.'),{code:'INVALID_SKETCH_ENTITY_DOMAIN'});
 return true;
}
