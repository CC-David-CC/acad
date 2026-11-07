import {makeEmptySketch} from './emptySketch';
import {solveSketch} from './solve';
import {HeadlessSketchWorkspace} from './workspace';

export class RectangleInputError extends Error {
  readonly code: 'RECTANGLE_DOMAIN' | 'RECTANGLE_PRECISION';
  constructor(code: 'RECTANGLE_DOMAIN' | 'RECTANGLE_PRECISION', message: string) { super(message); this.name = 'RectangleInputError'; this.code = code; }
}

// Research-only draft. Call in a disposable Worker; this does not publish a
// document or open an editor. Coordinates are sketch-local millimeters.
export function makeRectangleDraft(unit: string, frame: any, origin: number[], width: number, height: number) {
  const sketch=makeEmptySketch(unit,frame);
  const basis=sketch.metadata.boundaryFrame;
  const xy=[[1,0,0],[0,1,0],[0,0,1]];
  if (![basis.x,basis.y,basis.z].every((axis:number[],i:number)=>axis.every((v:number,j:number)=>Math.abs(v-xy[i][j])<=1e-9))) throw new Error('Only the principal XY plane is supported for rectangle drafts.');
  if (!Array.isArray(origin) || origin.length !== 2 || Reflect.ownKeys(origin).sort().join(',') !== '0,1,length') throw new RectangleInputError('RECTANGLE_DOMAIN', 'A two-coordinate sketch origin is required.');
  const entries=Object.getOwnPropertyDescriptors(origin), values=[];
  for(let i=0;i<2;i++) {
    const d=entries[String(i)], n=d?.value;
    if (!d?.enumerable || !Object.prototype.hasOwnProperty.call(d,'value') || typeof n!=='number' || !Number.isFinite(n) || Math.abs(n)>1e8) throw new RectangleInputError('RECTANGLE_DOMAIN', 'Invalid sketch origin.');
    values.push(n);
  }
  if (![width,height].every(n=>typeof n==='number' && Number.isFinite(n) && n>=0.001 && n<=1e6)) throw new RectangleInputError('RECTANGLE_DOMAIN', 'Width and height must be between 0.001 and 1,000,000 mm.');
  const [x,y]=values, x1=x+width, y1=y+height;
  if (!Number.isFinite(x1) || !Number.isFinite(y1) || Math.abs(x1)>1e8 || Math.abs(y1)>1e8) throw new RectangleInputError('RECTANGLE_DOMAIN', 'Rectangle corners must remain within the local coordinate limit.');
  if (Math.abs((x1-x)-width)>Math.max(1e-9,width*1e-9) || Math.abs((y1-y)-height)>Math.max(1e-9,height*1e-9)) throw new RectangleInputError('RECTANGLE_PRECISION', 'Rectangle dimensions exceed numerical precision at this origin.');
  const points=[[x,y],[x1,y],[x1,y1],[x,y1]];
  sketch.objects=points.map(([ax,ay],i)=>({id:'rect-'+i,type:'Segment',role:null,stage:0,data:{a:{x:ax,y:ay},b:{x:points[(i+1)%4][0],y:points[(i+1)%4][1]}}}));
  const constraint=(typeId:string,objects:string[],constants?:any)=>({typeId,objects,...(constants?{constants}:{}),admission:{version:1,state:'accepted'}});
  const rows=[];
  for(let i=0;i<4;i++) rows.push(constraint('PCoincident',['rect-'+i+':B','rect-'+((i+1)%4)+':A']));
  rows.push(constraint('Horizontal',['rect-0'],{angle:'0'}),constraint('Vertical',['rect-1'],{angle:'90'}),
    constraint('Horizontal',['rect-2'],{angle:'180'}),constraint('Vertical',['rect-3'],{angle:'270'}),
    constraint('LockPoint',['rect-0:A'],{x:String(x),y:String(y)}),
    constraint('SegmentLength',['rect-0'],{length:String(width)}),constraint('SegmentLength',['rect-1'],{length:String(height)}));
  sketch.stages[0].constraints=rows;
  // Round-trip through the actual strict IO to obtain canonical stage and
  // annotation records before the independent residual-checked solve.
  const workspace=new HeadlessSketchWorkspace(Object.create(null));
  workspace.io._loadSketch(sketch,{strict:true});
  const normalized=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));
  normalized.boundary=JSON.parse(JSON.stringify(sketch.boundary));
  const solved=solveSketch({revision:'rectangle-draft',sketch:normalized,boundary:JSON.parse(JSON.stringify(normalized.boundary)),externalParameters:{}});
  if (!solved.ok) throw new Error(solved.error?.message || 'Rectangle could not be solved.');
  return {sketch:solved.sketch,evidence:solved.evidence};
}
