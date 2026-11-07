import {MShell} from './mshell';
import CSys from 'math/csys';
const positions=new WeakMap<MWorkerEnclosureBody,Float32Array>();
export type EnclosureRole='BODY'|'LID'|'LABEL';
export type EnclosureEngine='occ'|'manifold';
// Display only: candidate ownership and native validity remain outside this class.
// No selectable BRep faces, edges or native handles are invented here.
export class MWorkerEnclosureBody extends MShell {
 readonly featureId:number;
 readonly outputRole:EnclosureRole;
 constructor(featureId:number,role:EnclosureRole,triangles:Float64Array,engine:EnclosureEngine='occ',version:1|2=1){
  super('worker-enclosure:'+version+':'+JSON.stringify([featureId,role]));
  if(engine!=='occ'&&engine!=='manifold')throw Error('Unsupported enclosure display engine.');
  if((version!==1&&version!==2)||(version===1&&role==='LABEL'))throw Error('Unsupported enclosure display version or role.');
  if(!Number.isSafeInteger(featureId)||featureId<=0||!['BODY','LID','LABEL'].includes(role)||!(triangles instanceof Float64Array)||triangles.length<36||triangles.length%9||triangles.length>512*9)throw Error('Invalid bounded enclosure display projection.');
  const copy=new Float32Array(triangles.length);
  for(let i=0;i<triangles.length;i++){if(!Number.isFinite(triangles[i])||Math.abs(triangles[i])>1e7)throw Error('Invalid display coordinate.');copy[i]=triangles[i];}
  for(let i=0;i<copy.length;i+=9){
   const ax=copy[i+3]-copy[i],ay=copy[i+4]-copy[i+1],az=copy[i+5]-copy[i+2],bx=copy[i+6]-copy[i],by=copy[i+7]-copy[i+1],bz=copy[i+8]-copy[i+2];
   if(Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)===0)throw Error('Display precision collapses enclosure geometry.');
  }
  this.csys=CSys.ORIGIN;
  Object.defineProperties(this,{id:{value:'worker-enclosure:'+version+':'+JSON.stringify([featureId,role]),enumerable:true},featureId:{value:featureId,enumerable:true},outputRole:{value:role,enumerable:true}});
  Object.defineProperty(this.ext,'workerGeometry',{value:Object.freeze({engine,representation:engine==='occ'?'worker-owned-occ-enclosure':'worker-owned-manifold-enclosure',unit:'millimeter',featureId,role,version,quality:'display-only',editableTopology:false}),enumerable:true});
  positions.set(this,copy);
 }
 copyDisplayPositions():Float32Array{return positions.get(this).slice();}
}
