/** Public command example; copy beside cad-agent.mjs for the Desktop bundle. */
import {createCadAgent} from './cad-agent.mjs';

export const SHELL_ENGINE_REVISION='sha256:57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858:60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947';
const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Choose exactly one '+label+'.');return rows[0];};
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1e6;

export function createSourceBoundShellExample({engineRevision,...options}={}){
 if(typeof engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(engineRevision))throw Error('Choose the explicit staged shell-capable build.');
 const agent=createCadAgent(options);let busy=false;
 const call=(command,args={})=>agent.execute(command,args);
 const serial=async work=>{if(busy)throw Error('Wait for the current recipe step.');busy=true;try{return await work();}finally{busy=false;}};
 const shellHistory=async binding=>{
  const info=await call('inspect-worker-shell-history'),feature=one(info.features?.filter(f=>f.featureId===binding.shell.featureId),'current shell history entry');
  if(!info.ready||!feature.canEdit)throw Error(feature.reason||info.reason||'Shell editing is unavailable.');
  if(feature.engineRevision!==engineRevision||feature.producerFeatureId!==binding.box.featureId||feature.target!==binding.box.outputId||feature.direction!=='inward'||feature.removedFaceIds.length!==1||feature.removedFaceIds[0]!==binding.removedFace.id)throw Error('The source, selection or backend changed.');
  return {info,feature};
 };
 return Object.freeze({
  windowId:agent.windowId,
  discover:()=>agent.discover(),
  build:({width=100,depth=50,height=20,thickness=2}={})=>serial(async()=>{
   if(![width,depth,height,thickness].every(positive))throw Error('Use positive bounded millimeter dimensions.');
   const required=['inspect-worker-solids','create-worker-solid-box','inspect-worker-shells','create-worker-shell','inspect-worker-shell-history','edit-worker-shell'];
   const commands=agent.discover();for(const id of required)if(!commands.some(row=>row.id===id))throw Error('Command unavailable: '+id);
   const document=await call('inspect');if(document.operationCount!==0||document.sketchCount!==0||document.path||document.dirty)throw Error('Use a new empty unsaved CAD window; existing work was not replaced.');
   const shellInfo=await call('inspect-worker-shells');if(!shellInfo.ready)throw Error(shellInfo.reason||'Shell commands are unavailable.');
   const solids=await call('inspect-worker-solids');if(!solids.ready)throw Error(solids.reason||'Solid creation is unavailable.');
   const box=await call('create-worker-solid-box',{revision:solids.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,origin:[0,0,0],dimensions:[width,depth,height]});
   if(box.engineRevision!==engineRevision)throw Error('The requested box backend was not retained.');
   const discovered=await call('inspect-worker-shells'),target=one(discovered.targets?.filter(t=>t.bodyId===box.outputId&&t.featureId===box.featureId),'current native box target');
   if(!target.canCreate||target.engineRevision!==engineRevision||target.selections?.status!=='available')throw Error(target.reason||'Box face provenance is unavailable.');
   const plan=target.selections.plan,origin=one(plan.sourceContexts?.filter(c=>c.kind==='box'&&c.featureId===box.featureId&&c.regionId===null),'genuine box construction origin');
   const removedFace=one(plan.faces?.filter(face=>face.role==='Z_MAX'&&face.geometry==='plane'&&face.originFeatureId===origin.featureId&&target.removedFaceIds.includes(face.id)),'actual box-builder top face');
   const shell=await call('create-worker-shell',{revision:discovered.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,bodyId:box.outputId,removedFaceIds:[removedFace.id],thickness,direction:'inward'});
   return Object.freeze({engineRevision,box:Object.freeze(box),shell:Object.freeze(shell),removedFace:Object.freeze({...removedFace})});
  }),
  inspect:()=>serial(()=>call('inspect-worker-solids')),
  history:()=>serial(()=>call('inspect-worker-shell-history')),
  editThickness:(binding,thickness)=>serial(async()=>{
   if(!positive(thickness))throw Error('Use a positive bounded millimeter thickness.');
   const {info,feature}=await shellHistory(binding);
   return call('edit-worker-shell',{revision:info.revision,index:feature.index,featureId:feature.featureId,thickness});
  }),
  resizeBox:(binding,{width,depth,height})=>serial(async()=>{
   if(![width,depth,height].every(positive))throw Error('Use positive bounded millimeter source dimensions.');
   await shellHistory(binding);
   const info=await call('inspect-worker-solid-history'),feature=one(info.features?.filter(f=>f.featureId===binding.box.featureId),'original source box');
   if(feature.engine!=='occ')throw Error('The original source backend changed.');
   return call('edit-worker-solid-box',{revision:info.revision,index:feature.index,featureId:feature.featureId,engine:'occ',x:feature.x,y:feature.y,z:feature.z,width,depth,height});
  }),
  travel:direction=>serial(()=>agent.travel(direction)),
  save:path=>serial(()=>agent.save(path)),
  open:path=>serial(()=>agent.open(path))
 });
}
