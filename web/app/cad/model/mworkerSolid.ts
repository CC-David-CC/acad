import {MShell} from './mshell';
import CSys from 'math/csys';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';
const positions=new WeakMap<MWorkerSolid,Float32Array>();
const measurements=new WeakMap<MWorkerSolid,Readonly<any>>();
const projections=new WeakMap<MWorkerSolid,Readonly<any>>();
export type WorkerSolidDisplay={displayBuffer:ArrayBuffer;displayStatus:'available'|'unavailable';displayReason:null|'float32-overflow'|'float32-collapsed-triangle'|'material-orientation-unqualified'};
// One complete native result, not separately selectable material/solid regions.
export class MWorkerSolid extends MShell {
 readonly featureId:number;
 constructor(featureId:number,engine:'occ'|'manifold'|'smlib',triangles:Float64Array|WorkerSolidDisplay,runtime:Readonly<Record<string,string>>,metrics:Readonly<any>){
  super(solidBodyId(featureId));
  if(!runtime||!Object.isFrozen(runtime)||!metrics||!Object.isFrozen(metrics)||metrics.runtime!==runtime||metrics.resultKind==='empty'||!Number.isSafeInteger(metrics.triangleCount)||metrics.triangleCount<1||!['occ','manifold','smlib'].includes(engine))throw Error('Invalid worker solid output.');
  if(engine==='smlib'&&metrics.materialRegions>1&&metrics.voidRegions>0&&(triangles instanceof Float64Array||triangles.displayStatus!=='unavailable'||triangles.displayReason!=='material-orientation-unqualified'))throw Error('Material-side preview orientation is unqualified.');
  let copy:Float32Array,status:'available'|'unavailable'='available',reason:WorkerSolidDisplay['displayReason']=null;
  if(triangles instanceof Float64Array){
   // Temporary bounded main-thread fallback; modern providers validate Float32
   // in the Worker and transfer custody without conversion/check loops here.
   if(triangles.length<9||triangles.length%9||triangles.length>512*9||triangles.length/9!==metrics.triangleCount)throw Error('Legacy display above512 triangles requires a verified Worker Float32 projection.');
   copy=new Float32Array(triangles.length);
   for(let i=0;i<triangles.length;i++){if(!Number.isFinite(triangles[i]))throw Error('Invalid display coordinate.');copy[i]=triangles[i];if(!Number.isFinite(copy[i])){status='unavailable';reason='float32-overflow';}}
   if(status==='available')for(let i=0;i<copy.length;i+=9){const ax=copy[i+3]-copy[i],ay=copy[i+4]-copy[i+1],az=copy[i+5]-copy[i+2],bx=copy[i+6]-copy[i],by=copy[i+7]-copy[i+1],bz=copy[i+8]-copy[i+2];if(Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)===0){status='unavailable';reason='float32-collapsed-triangle';break;}}
   if(status==='unavailable')copy=new Float32Array(0);
  }else{
   const buffer=triangles?.displayBuffer;status=triangles?.displayStatus;reason=triangles?.displayReason;
   if(!(buffer instanceof ArrayBuffer)||!['available','unavailable'].includes(status)||(status==='available'?(reason!==null||buffer.byteLength/36!==metrics.triangleCount):(buffer.byteLength!==0||!['float32-overflow','float32-collapsed-triangle','material-orientation-unqualified'].includes(reason)))||typeof (ArrayBuffer.prototype as any).transfer!=='function')throw Error('Invalid verified Worker display projection.');
   if(reason==='material-orientation-unqualified'&&(engine!=='smlib'||metrics.resultKind!=='multi-material'||metrics.materialRegions<2||metrics.voidRegions<1))throw Error('Orientation qualification does not match the native result.');
   copy=new Float32Array((ArrayBuffer.prototype as any).transfer.call(buffer));
  }
  this.csys=CSys.ORIGIN;
  Object.defineProperties(this,{id:{value:solidBodyId(featureId),enumerable:true},featureId:{value:featureId,enumerable:true}});
  Object.defineProperty(this.ext,'workerGeometry',{value:Object.freeze({version:1,engine,representation:'worker-owned-'+engine+'-solid',resultKind:metrics.resultKind||'unclassified-nonempty',selection:'complete-native-result',unit:'millimeter',featureId,runtime,quality:'display-only',editableTopology:false}),enumerable:true});positions.set(this,copy);measurements.set(this,metrics);projections.set(this,Object.freeze({status,reason,sourceTriangleCount:metrics.triangleCount,renderTriangleCount:copy.length/9}));
 }
 inspectKernelMetrics():Readonly<any>{return measurements.get(this)!;}
 inspectDisplayProjection():Readonly<any>{return projections.get(this)!;}
 hasDisplayProjection():boolean{return projections.get(this)?.status==='available';}
 copyDisplayPositions():Float32Array{return positions.get(this)!.slice();}
}
