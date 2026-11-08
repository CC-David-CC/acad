// Existing ordinary ellipse envelope, not a mathematical degeneracy theorem,
// BRep/profile verdict, display approximation or caller ownership certificate.
export const ELLIPSE_MIN_SEMIAXIS_MM=1e-9;
const error=(code,message)=>Object.assign(new Error(message),{code});
function record(v,keys){
 if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length)throw error('INVALID','Invalid ellipse record.');
 const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw error('INVALID','Ellipse fields must be own data.');out[key]=d.value;}return out;
}
function point(v){const p=record(v,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)))throw error('INVALID','Ellipse center/axis endpoints must be finite.');return Object.freeze({x:p.x,y:p.y});}
function parameters(c,rx,ry,rot){
 if(![rx,ry,rot].every(n=>typeof n==='number'&&Number.isFinite(n)))throw error('INVALID','Ellipse semiaxes and rotation must be finite.');
 if(rx<=ELLIPSE_MIN_SEMIAXIS_MM||ry<=ELLIPSE_MIN_SEMIAXIS_MM)throw error('DOMAIN','Ellipse semiaxes must exceed the existing 1e-9 mm ordinary numerical envelope.');
 // Labeled semiaxes: rx<ry and rx===ry are valid. Raw radians stay unchanged.
 return Object.freeze({c,rx,ry,rot});
}
export function captureEllipseParameters(value){const d=record(value,['c','rx','ry','rot']);return parameters(point(d.c),d.rx,d.ry,d.rot);}
export function captureEllipseRecordData(value){
 if(value&&typeof value==='object'&&Object.hasOwn(value,'ep1')){
  const d=record(value,['ep1','ep2','r']),a=point(d.ep1),b=point(d.ep2),dx=b.x-a.x,dy=b.y-a.y;
  // Match the actual legacy native decoder; never repair overflowing inputs.
  const c=point({x:a.x+dx*.5,y:a.y+dy*.5});
  return Object.freeze({encoding:'legacy-endpoint-axis',parameters:parameters(c,Math.sqrt(dx*dx+dy*dy)*.5,d.r,Math.atan2(dy,dx))});
 }
 return Object.freeze({encoding:'canonical-center-axes',parameters:captureEllipseParameters(value)});
}
export function captureEllipseEditIntent(value){
 const d=record(value,['id','c','rx','ry','rot']);if(typeof d.id!=='string'||!d.id||d.id.length>256)throw error('INVALID','Choose an inspected Ellipse root.');
 const p=captureEllipseParameters({c:d.c,rx:d.rx,ry:d.ry,rot:d.rot});
 if(Math.abs(p.c.x)>1e8||Math.abs(p.c.y)>1e8)throw error('DOMAIN','Ellipse edit center exceeds the existing public coordinate envelope.');
 return Object.freeze({id:d.id,...p});
}
