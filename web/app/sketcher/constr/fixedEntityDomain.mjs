import {projectedDirectionValid} from './projectedDistanceDomain.mjs';

const MAX=1e6,MIN=1e-9,POSITION_TOLERANCE=1e-6,ANGLE_TOLERANCE=1e-8,TAU=2*Math.PI;
const literal=/^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[+-]?\d+)?$/i;
const near=(a,b,tolerance=POSITION_TOLERANCE)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tolerance;
const angleDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const polarAngle=(a,c)=>Math.atan2(a.y-c.y,a.x-c.x);
function sweep(arc) {
  // Match Arc.drawImpl's coincident-endpoint full-circle convention.
  if(Math.abs(arc.a.x-arc.b.x)<1e-6&&Math.abs(arc.a.y-arc.b.y)<1e-6)return TAU;
  const d=polarAngle(arc.b,arc.c)-polarAngle(arc.a,arc.c);return (d%TAU+TAU)%TAU;
}
export function fixedSchemaFor(object) {
  return object?._class==='TCAD.TWO.Segment'?'FixSegment':object?._class==='TCAD.TWO.Circle'?'FixCircle':object?._class==='TCAD.TWO.Arc'?'FixArc':null;
}
export function fixedGeometry(object) {
  const schema=fixedSchemaFor(object);let values;
  if(schema==='FixSegment'){
    if(!projectedDirectionValid(object))throw Error('The segment is degenerate or has inconsistent direction.');
    const dx=object.b.x-object.a.x,dy=object.b.y-object.a.y;
    values={ax:object.a.x,ay:object.a.y,bx:object.b.x,by:object.b.y,length:Math.hypot(dx,dy),direction:Math.atan2(dy,dx)};
  } else if(schema==='FixCircle'){
    values={cx:object.c.x,cy:object.c.y,radius:object.r.get()};
    if(!(values.radius>MIN))throw Error('The circle radius must be positive.');
  } else if(schema==='FixArc'){
    const a=object.a,b=object.b,c=object.c,r=Math.hypot(a.x-c.x,a.y-c.y),rb=Math.hypot(b.x-c.x,b.y-c.y);
    if(!(r>MIN)||!near(r,rb)||!near(r,object.r.get())||
       !near(angleDifference(object.ang1.get(),polarAngle(a,c)),0,ANGLE_TOLERANCE)||
       !near(angleDifference(object.ang2.get(),polarAngle(b,c)),0,ANGLE_TOLERANCE))throw Error('The arc is degenerate or inconsistent.');
    values={ax:a.x,ay:a.y,bx:b.x,by:b.y,cx:c.x,cy:c.y,radius:r,sweep:sweep(object)};
    if(!(values.sweep>0&&values.sweep<=TAU))throw Error('The arc sweep is invalid.');
  } else throw Error('Fix supports a segment, circle or arc.');
  if(Object.values(values).some(v=>!Number.isFinite(v)||Math.abs(v)>MAX))throw Error('The entity exceeds the supported coordinate or size limits.');
  return {schema,values};
}
export function fixedLiteralConstants(schema,values) {
  if(!values||typeof values!=='object'||Array.isArray(values))return false;
  const keys=schema==='FixSegment'?['ax','ay','bx','by','length','direction']:
    schema==='FixCircle'?['cx','cy','radius']:schema==='FixArc'?['ax','ay','bx','by','cx','cy','radius','sweep']:null;
  if(!(!!keys&&Object.keys(values).length===keys.length&&keys.every(k=>{
    const value=values[k],text=typeof value==='number'?String(value):value;
    return typeof text==='string'&&literal.test(text)&&Number.isFinite(Number(text))&&Math.abs(Number(text))<=MAX;
  })))return false;
  if(schema==='FixSegment'&&!(Number(values.length)>MIN))return false;
  if((schema==='FixCircle'||schema==='FixArc')&&!(Number(values.radius)>MIN))return false;
  return schema!=='FixArc'||(Number(values.sweep)>0&&Number(values.sweep)<=TAU);
}
export function fixedEntityValid(constraint) {
  const id=constraint?.schema?.id,object=constraint?.objects?.[0],constants=constraint?.constants;
  if(!fixedLiteralConstants(id,constants))return false;
  try {
    const actual=fixedGeometry(object);if(actual.schema!==id)return false;
    return Object.entries(actual.values).every(([key,value])=>key==='direction'?
      near(angleDifference(value,Number(constants[key])),0,ANGLE_TOLERANCE):
      near(value,Number(constants[key]),key==='sweep'?ANGLE_TOLERANCE:POSITION_TOLERANCE));
  } catch {return false;}
}
