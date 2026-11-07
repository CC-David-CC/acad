import {runSketchSolve, SketchSolveOptions} from './client';
const invalid=():never=>{throw Error('Invalid DXF export data.');};
function record(value:any,keys?:string[]) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))return invalid();
  const names=Reflect.ownKeys(value);if(names.some(k=>typeof k!=='string')||keys&&(names.length!==keys.length||keys.some(k=>!names.includes(k))))return invalid();
  const out=Object.create(null);for(const key of names as string[]){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))return invalid();out[key]=d.value;}return out;
}
function frameCopy(value:any) {
  const f=record(value,['origin','x','y','z']);for(const key of Object.keys(f)){const a=f[key];if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length!==3||Reflect.ownKeys(a).length!==4)return invalid();f[key]=Object.freeze([0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!('value'in d)||typeof d.value!=='number'||!Number.isFinite(d.value))return invalid();return d.value;}));}return Object.freeze(f);
}
function captureBoundary(value:any){
  const b=record(value,['lines','arcs','circles','nurbses']),out:any={},point=(value:any)=>{const p=record(value,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e9))return invalid();return Object.freeze(p);};let count=0;
  for(const kind of ['lines','arcs','circles','nurbses']){const a=b[kind];if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||Reflect.ownKeys(a).length!==a.length+1||(count+=a.length)>10000)return invalid();if(kind==='nurbses'&&a.length)throw Error('NURBS face boundaries are not supported by DXF export.');const rows=[];for(let i=0;i<a.length;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))return invalid();const row=record(d.value,kind==='lines'?['id','a','b']:kind==='arcs'?['id','a','b','c']:['id','c','r']);if(typeof row.id!=='string'||!row.id||row.id.length>1024)return invalid();if('a'in row)row.a=point(row.a);if('b'in row)row.b=point(row.b);if('c'in row)row.c=point(row.c);if('r'in row&&(typeof row.r!=='number'||!Number.isFinite(row.r)||row.r<=0||row.r>1e9))return invalid();rows.push(Object.freeze(row));}out[kind]=Object.freeze(rows);}return Object.freeze(out);
}
let outstanding=0;
export function runSketchDXFExport(workerUrl:string,input:any,options:SketchSolveOptions={}) {
  if(outstanding>=2)throw Error('Too many pending sketch exports in this window.');
  outstanding++;return execute(workerUrl,input,options).finally(()=>{outstanding--;});
}
async function execute(workerUrl:string,input:any,options:SketchSolveOptions) {
  const args=record(input,['revision','unit','sketchJSON','frame','currentBoundary','externalParameters','parameterSource']),opts=record(options);
  if(Object.keys(opts).some(k=>!['signal','valid','timeoutMs'].includes(k))||opts.valid!==undefined&&typeof opts.valid!=='function')return invalid();
  if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{return invalid();}
  const timeout=opts.timeoutMs===undefined?30000:opts.timeoutMs;if(!Number.isSafeInteger(timeout)||timeout<1||timeout>30000)return invalid();
  const deadline=performance.now()+timeout,current=(checkDeadline=true)=>{let okay=false;try{okay=!opts.signal?.aborted&&(!opts.valid||opts.valid()===true)&&!opts.signal?.aborted}catch{}if(!okay)throw new DOMException('Sketch export cancelled or superseded.','AbortError');if(checkDeadline&&performance.now()>=deadline)throw Error('Sketch export timed out.');};
  if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||args.unit!=='millimeter'||args.sketchJSON!==null&&(typeof args.sketchJSON!=='string'||args.sketchJSON.length>1048576)||args.parameterSource!==null&&(typeof args.parameterSource!=='string'||args.parameterSource.length>65536))return invalid();
  const frame=frameCopy(args.frame),currentBoundary=captureBoundary(args.currentBoundary),external=record(args.externalParameters);if(Object.keys(external).length>1024||Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])||Math.abs(external[k])>1e9)||args.parameterSource!==null&&Object.keys(external).length)return invalid();
  const payload=Object.freeze({task:'sketch-export-dxf',revision:args.revision,unit:args.unit,sketchJSON:args.sketchJSON,frame,currentBoundary,externalParameters:Object.freeze(external),parameterSource:args.parameterSource});
  current();const result=await runSketchSolve(workerUrl,payload,{signal:opts.signal,valid:()=>{try{current(false);return true}catch{return false}},timeoutMs:timeout});current();
  if(!result.ok){const failed=record(result,['revision','ok','error']),error=record(failed.error,['code','message']);if(failed.revision!==args.revision||typeof error.code!=='string'||!error.code||error.code.length>64||typeof error.message!=='string'||error.message.length>512)return invalid();return Object.freeze({revision:args.revision,ok:false,error:Object.freeze(error)});}
  const output=record(result,['revision','ok','blob','unit','coordinates','frame']),returned=frameCopy(output.frame);
  let size:number,type:string;try{size=Object.getOwnPropertyDescriptor(Blob.prototype,'size').get.call(output.blob);type=Object.getOwnPropertyDescriptor(Blob.prototype,'type').get.call(output.blob);}catch{return invalid();}
  if(output.revision!==args.revision||output.unit!=='millimeter'||output.coordinates!=='sketch-local'||!Number.isSafeInteger(size)||size<1||size>8*1024*1024||type!=='application/dxf'||Object.keys(frame).some(k=>frame[k].some((n,i)=>!Object.is(n,returned[k][i]))))return invalid();
  current();return Object.freeze({revision:args.revision,ok:true,blob:output.blob,unit:'millimeter',coordinates:'sketch-local',frame:returned});
}
