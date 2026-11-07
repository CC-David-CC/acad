import {MObject} from './mobject';
import {EntityKind} from './entities';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';
const measurements=new WeakMap<MWorkerEmpty,Readonly<any>>();
// Verified native output with no geometry. This is never a shell/body proxy.
export class MWorkerEmpty extends MObject {
 static TYPE=EntityKind.EMPTY_RESULT;
 readonly featureId:number;
 constructor(featureId:number,engine:'occ'|'manifold'|'smlib',runtime:Readonly<Record<string,string>>,metrics:Readonly<any>){
  super(MWorkerEmpty.TYPE,solidBodyId(featureId));
  if(!['occ','manifold','smlib'].includes(engine)||!runtime||!Object.isFrozen(runtime)||!metrics||!Object.isFrozen(metrics)||metrics.runtime!==runtime||metrics.resultKind!=='empty'||metrics.bounds!==null||metrics.triangleCount!==0||metrics.reportedVolume!==0||[metrics.materialRegions,metrics.voidRegions,metrics.solidCount].some(n=>n!==null&&n!==0))throw Error('Invalid empty worker output.');
  // Preserve the v1 opaque feature identity across empty/nonempty edits.
  Object.defineProperties(this,{id:{value:solidBodyId(featureId),enumerable:true},featureId:{value:featureId,enumerable:true}});
  Object.defineProperty(this.ext,'workerGeometry',{value:Object.freeze({version:1,engine,representation:'worker-owned-'+engine+'-empty-result',resultKind:'empty',unit:'millimeter',featureId,runtime,quality:'no-geometry',editableTopology:false}),enumerable:true});measurements.set(this,metrics);
 }
 get parent(){return null;}
 inspectKernelMetrics():Readonly<any>{return measurements.get(this)!;}
}
