import {HeadlessSketchWorkspace} from './workspace';
import {validateProjectSketch} from '../io';

type Frame = {origin:number[], x:number[], y:number[], z:number[]};

// Call only in a disposable Worker. Headless IO and sketch generators use
// realm-local IDs, and must not share the visible editor's module globals.
export function makeEmptySketch(unit: string, frame: Frame) {
  if (unit !== 'millimeter' || !frame || typeof frame !== 'object' || Array.isArray(frame) ||
      ![Object.prototype,null].includes(Object.getPrototypeOf(frame))) throw new Error('A millimeter sketch and face frame are required.');
  const fields=['origin','x','y','z'], descriptors=Object.getOwnPropertyDescriptors(frame);
  if (Reflect.ownKeys(frame).sort().join(',') !== 'origin,x,y,z') throw new Error('Invalid sketch frame.');
  const snapshot: Frame={origin:[],x:[],y:[],z:[]};
  for (const key of fields) {
    const d=descriptors[key];
    if (!d?.enumerable || !Object.prototype.hasOwnProperty.call(d,'value')) throw new Error('Invalid sketch frame.');
    const v=d.value;
    if (!Array.isArray(v) || v.length !== 3 || Reflect.ownKeys(v).sort().join(',') !== '0,1,2,length') throw new Error('Invalid sketch frame.');
    const values=Object.getOwnPropertyDescriptors(v), copy=[];
    for (let i=0;i<3;i++) {
      const item=values[String(i)], n=item?.value;
      if (!item?.enumerable || !Object.prototype.hasOwnProperty.call(item,'value') || typeof n!=='number' || !Number.isFinite(n) || Math.abs(n)>1e9) throw new Error('Invalid sketch frame.');
      copy.push(n);
    }
    snapshot[key]=copy;
  }
  const dot=(a:number[],b:number[])=>a.reduce((v,n,i)=>v+n*b[i],0);
  const cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const tol=1e-9;
  if (['x','y','z'].some(k=>Math.abs(dot(snapshot[k],snapshot[k])-1)>tol) ||
      Math.abs(dot(snapshot.x,snapshot.y))>tol || Math.abs(dot(snapshot.x,snapshot.z))>tol || Math.abs(dot(snapshot.y,snapshot.z))>tol ||
      cross(snapshot.x,snapshot.y).some((n,i)=>Math.abs(n-snapshot.z[i])>tol)) throw new Error('Sketch frame must be right-handed and orthonormal.');
  const workspace=new HeadlessSketchWorkspace(Object.create(null));
  const sketch=JSON.parse(workspace.io.serializeSketch({boundaryFrame:snapshot},{strict:true}));
  sketch.boundary={lines:[],arcs:[],circles:[],nurbses:[]};
  validateProjectSketch(sketch);
  return sketch;
}
