import {MWorkerSolid} from '../model/mworkerSolid';

const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
const aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!);
const own=(v:any,keys:string[])=>{
  const p=v&&typeof v==='object'?Object.getPrototypeOf(v):undefined;
  if(!v||typeof v!=='object'||Array.isArray(v)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(v).length!==keys.length)fail('INVALID_REQUEST','Provide exact view command data.');
  const r:any={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))fail('INVALID_REQUEST','View fields must be own data.');r[k]=d.value;}return r;
};
const matrixKeys=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'];

// Camera-only operation. Bounds come from current published Native facts, not
// caller coordinates, scene-helper boxes, display tessellation or a new solve.
export function fitWorkerSolids(ctx:any,input:any,options:any,inspect:()=>any){
  const a=own(input,['revision','bodyIds']),o=own(options||{},Reflect.ownKeys(options||{}) as string[]);
  if(Object.keys(o).some(k=>!['signal','valid'].includes(k))||o.valid!==undefined&&typeof o.valid!=='function')fail('INVALID_REQUEST','Invalid view lifetime.');
  if(o.signal!==undefined)try{aborted(o.signal);}catch{fail('INVALID_REQUEST','Use a native cancellation signal.');}
  if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||!Array.isArray(a.bodyIds)||a.bodyIds.length<1||a.bodyIds.length>32||Reflect.ownKeys(a.bodyIds).length!==a.bodyIds.length+1)fail('INVALID_REQUEST','Select1–32 current discovered solid output IDs.');
  const ids:string[]=Array.from({length:a.bodyIds.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(a.bodyIds,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>1024)fail('INVALID_REQUEST','Solid output IDs must be bounded dense own data.');return d.value;});
  if(new Set(ids).size!==ids.length)fail('INVALID_REQUEST','Select each solid output once.');
  const project=ctx.projectService,craft=ctx.craftService,registry=ctx.cadRegistry,manager=ctx.projectManager,viewer=ctx.viewer,generation=project.documentGeneration,documentSignal=project.documentSignal,history=craft.modifications$.value,models=craft.models$.value,epoch=craft.evaluationEpoch;
  const current=()=>{
    if(o.signal!==undefined&&aborted(o.signal)||o.valid!==undefined&&o.valid()!==true)fail('CANCELLED','View command was cancelled.');
    if(ctx.projectService!==project||!project.hasHostLifetime||project.documentSignal!==documentSignal||aborted(documentSignal)||!project.isDocumentCurrent(generation)||ctx.craftService!==craft||ctx.cadRegistry!==registry||ctx.projectManager!==manager||ctx.viewer!==viewer||craft.modifications$.value!==history||craft.models$.value!==models||craft.evaluationEpoch!==epoch)fail('STALE_DOCUMENT','The viewed document changed; inspect its solids again.');
    if(craft.isProcessing||manager.isRestoring||craft.engineCleanupFailure$?.value)fail('UNAVAILABLE','Finish the current document operation before fitting its solids.');
  };
  current();const info=inspect();current();if(info.revision!==a.revision)fail('STALE_DOCUMENT','The viewed document changed; inspect its solids again.');
  if(!info.ready||typeof viewer?.fitBounds!=='function')fail('UNAVAILABLE',info.reason||'Current solid viewing is unavailable.');
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],records:any[]=[];
  for(const id of ids){
    const rows=info.outputs.filter((r:any)=>r.id===id),row=rows[0],model=registry.find(id);
    if(rows.length!==1||!(model instanceof MWorkerSolid)||model.featureId!==row.featureId)fail('UNAVAILABLE','Select actual current nonempty solid outputs.');
    const metrics=model.inspectKernelMetrics(),display=model.inspectDisplayProjection(),location=model.location$,matrix=location.value,p=row.placement,b=metrics.nativeBounds;
    if(row.metrics!==metrics||row.displayProjection!==display||display.status!=='available'||display.renderTriangleCount<1||!model.hasDisplayProjection())fail('UNAVAILABLE','The selected solid has no qualified display projection.');
    if(metrics.unit!=='millimeter'||metrics.space!=='model-local'||!b||!Array.isArray(b.min)||!Array.isArray(b.max)||b.min.length!==3||b.max.length!==3||!Array.isArray(p)||p.length!==12||p.some((n:any,i:number)=>!Number.isFinite(n)||!Object.is(n,matrix[matrixKeys[i]]))||b.min.some((n:any,i:number)=>!Number.isFinite(n)||!Number.isFinite(b.max[i])||n>b.max[i]))fail('UNAVAILABLE','The selected solid has no finite authenticated Native bounds and placement.');
    // At most256 corners, with the same affine placement used by its real view.
    for(let mask=0;mask<8;mask++){
      const q=b.min.map((n:number,i:number)=>mask&(1<<i)?b.max[i]:n);
      for(let axis=0;axis<3;axis++){const j=axis*4,v=p[j]*q[0]+p[j+1]*q[1]+p[j+2]*q[2]+p[j+3];if(!Number.isFinite(v))fail('UNAVAILABLE','The solid placement exceeds finite viewing coordinates.');min[axis]=Math.min(min[axis],v);max[axis]=Math.max(max[axis],v);}
    }
    records.push({id,model,metrics,display,location,matrix,placement:p});
  }
  current();if(inspect().revision!==a.revision)fail('STALE_DOCUMENT','The viewed document changed; inspect its solids again.');current();
  for(const r of records)if(registry.find(r.id)!==r.model||r.model.inspectKernelMetrics()!==r.metrics||r.model.inspectDisplayProjection()!==r.display||r.model.location$!==r.location||r.location.value!==r.matrix||matrixKeys.some((k,i)=>!Object.is(r.matrix[k],r.placement[i])))fail('STALE_DOCUMENT','The viewed solid changed; inspect it again.');
  const bounds=Object.freeze({min:Object.freeze(min),max:Object.freeze(max)}),camera=viewer.fitBounds(bounds);
  return Object.freeze({version:1,unit:'millimeter',revision:a.revision,bodyIds:Object.freeze(ids),bounds,boundsSource:'accepted-native-bounds',camera,authoredChanged:false});
}
