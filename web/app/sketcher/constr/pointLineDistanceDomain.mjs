// Existing DistancePL uses the polar-angle normal, not sign(t)*that normal.
import {projectedDirectionValid} from './projectedDistanceDomain.mjs';
export const pointLineSide=value=>value===true||value==='true'?true:value===false||value==='false'?false:null;
export function pointLineConstantsValid(constants){
 return !!constants&&typeof constants==='object'&&!Array.isArray(constants)&&Reflect.ownKeys(constants).length===2&&['distance','inverted'].every(k=>{const d=Object.getOwnPropertyDescriptor(constants,k);return d?.enumerable&&Object.hasOwn(d,'value');})&&['number','string'].includes(typeof constants.distance)&&pointLineSide(constants.inverted)!==null;
}
export function pointLineDistanceValid(value){return typeof value==='number'&&Number.isFinite(value)&&value>=0;}
export function pointLineNativeGeometry(point,line){
 if(!point||![point.x,point.y].every(Number.isFinite)||!projectedDirectionValid(line))throw Object.assign(Error('The actual supporting line has a degenerate or inconsistent Polar domain.'),{code:'POINT_LINE_DOMAIN'});
 const angleRadians=line.params.ang.get(),polarLength=line.params.t.get(),normal=[-Math.sin(angleRadians),Math.cos(angleRadians)],anchor=[line.a.x,line.a.y],signedDistance=normal[0]*(point.x-anchor[0])+normal[1]*(point.y-anchor[1]);
 if(![...normal,...anchor,signedDistance].every(Number.isFinite))throw Object.assign(Error('Supporting-line measurement is nonfinite.'),{code:'POINT_LINE_DOMAIN'});
 return {lineId:line.id,normalBasis:'native-polar-angle',anchor,angleRadians,polarLength,normal,signedDistance,quality:'source-local-supporting-line-mm'};
}
// Source-only scalar used in Worker discovery/delta classification, never
// supplied as an owned native Param/normal witness. Native read reconstructs +t.
export function pointLineSourceValue(point,line){
 if(!point||!line?.a||!line?.b)return NaN;
 const dx=line.b.x-line.a.x,dy=line.b.y-line.a.y,n=Math.hypot(dx,dy);
 return n>1e-9?Math.abs((-dy*(point.x-line.a.x)+dx*(point.y-line.a.y))/n):NaN;
}
