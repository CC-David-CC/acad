/** One shared public manufacturing example. No geometry/model/file internals. */
import {createCadAgent} from './cad-agent.mjs';
import {SHELL_ENGINE_REVISION} from './source-bound-shell.mjs';
const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Choose exactly one '+label+'.');return rows[0];};
const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=1e6;
export function createSourceBoundEnclosureExample({engineRevision,...options}={}){
 if(engineRevision!==SHELL_ENGINE_REVISION)throw Error('Choose the explicitly staged SHELL build for this entire example.');
 const agent=createCadAgent(options),call=(name,args={})=>agent.execute(name,args);let busy=false;
 const serial=async work=>{if(busy)throw Error('Wait for the current enclosure example operation.');busy=true;try{return await work();}finally{busy=false;}};
 async function box(origin,dimensions){const i=await call('inspect-worker-solids'),r=await call('create-worker-solid-box',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,origin,dimensions});if(r.engineRevision!==engineRevision)throw Error('The requested whole-part backend changed.');return Object.freeze(r);}
 async function editBox(binding,changes){const i=await call('inspect-worker-solid-history'),f=one(i.features?.filter(f=>f.featureId===binding.featureId),'actual authored source box');if(f.engine!=='occ'||binding.engineRevision!==engineRevision)throw Error('The source backend changed.');return call('edit-worker-solid-box',{revision:i.revision,index:f.index,featureId:f.featureId,engine:'occ',x:f.x,y:f.y,z:f.z,width:f.width,depth:f.depth,height:f.height,...changes});}
 return Object.freeze({
  windowId:agent.windowId,
  discover:()=>agent.discover(),
  build:()=>serial(async()=>{
   const d=await call('inspect');if(d.operationCount!==0||d.sketchCount!==0||d.path||d.dirty)throw Error('Use a new empty unsaved CAD window.');
   const source=await box([0,0,0],[80,50,30]),i=await call('inspect-worker-shells'),t=one(i.targets?.filter(t=>t.bodyId===source.outputId&&t.featureId===source.featureId),'actual body box');if(!t.canCreate||t.engineRevision!==engineRevision||t.selections?.status!=='available')throw Error(t.reason||'Actual shell source faces unavailable.');
   const context=one(t.selections.plan.sourceContexts?.filter(c=>c.kind==='box'&&c.featureId===source.featureId&&c.regionId===null),'actual box-builder source'),removedFace=one(t.selections.plan.faces?.filter(f=>f.role==='Z_MAX'&&f.geometry==='plane'&&f.originFeatureId===context.featureId&&t.removedFaceIds.includes(f.id)),'discovered top face');
   const body=await call('create-worker-shell',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,bodyId:source.outputId,removedFaceIds:[removedFace.id],thickness:2,direction:'inward'}),base=await box([100,0,0],[80,50,4]),tool=await box([125,15,2],[30,20,3]),j=await call('inspect-worker-solids'),lid=await call('create-worker-solid-boolean',{revision:j.revision,version:1,unit:'millimeter',engine:'occ',kind:'subtract',a:base.outputId,b:tool.outputId}),label=await box([125,15,2],[30,20,2]);
   return Object.freeze({engineRevision,source,body:Object.freeze(body),removedFace:Object.freeze({...removedFace}),base,tool,lid:Object.freeze(lid),label});
  }),
  assignMaterials:binding=>serial(async()=>{
   const i=await call('inspect-printable-parts'),target=b=>{const t=one(i.targets?.filter(t=>t.bodyId===b.outputId&&t.featureId===b.featureId),'actual current printable region');if(!t.canAssign||t.engineRevision!==engineRevision)throw Error(t.reason||'Current target cannot be assigned.');return{bodyId:t.bodyId,featureId:t.featureId};};
   if(i.targets.length!==3)throw Error('This example requires exactly its three current printable outputs.');const current=await call('inspect-manufacturing');if(current.metadata?.objects?.some(p=>!['body','lid'].includes(p.id)))throw Error('Other printable parts are present; their assignments were not replaced.');const body=target(binding.body),lid=target(binding.lid),label=target(binding.label);
   return call('assign-printable-parts',{revision:i.revision,materials:[{id:'pla',name:'PLA'},{id:'petg',name:'PETG'}],appearances:[{id:'blue',name:'Blue',color:'#3366ff'},{id:'white',name:'White',color:'#ffffff'}],parts:[{id:'body',name:'Open enclosure body',regions:[{id:'main',...body,materialId:'pla',appearanceId:'blue'}]},{id:'lid',name:'Inset-label lid',regions:[{id:'main',...lid,materialId:'pla',appearanceId:'blue'},{id:'label',...label,materialId:'petg',appearanceId:'white'}]}]});
  }),
  editBodyWidth:(binding,width)=>serial(()=>{if(!positive(width))throw Error('Use positive finite millimeters.');return editBox(binding.source,{width});}),
  editLidWidth:(binding,width)=>serial(()=>{if(!positive(width))throw Error('Use positive finite millimeters.');return editBox(binding.base,{width});}),
  editPocketWidth:(binding,width)=>serial(()=>{if(!positive(width))throw Error('Use positive finite millimeters.');return editBox(binding.tool,{width});}),
  editLabelWidth:(binding,width)=>serial(()=>{if(!positive(width))throw Error('Use positive finite millimeters.');return editBox(binding.label,{width});}),
  editThickness:(binding,thickness)=>serial(async()=>{if(!positive(thickness))throw Error('Use positive finite millimeters.');const i=await call('inspect-worker-shell-history'),f=one(i.features?.filter(f=>f.featureId===binding.body.featureId),'same body shell');if(!i.ready||!f.canEdit||f.target!==binding.source.outputId||f.producerFeatureId!==binding.source.featureId||f.engineRevision!==engineRevision||f.direction!=='inward'||f.removedFaceIds.length!==1||f.removedFaceIds[0]!==binding.removedFace.id)throw Error(f.reason||'The actual shell/source binding changed.');return call('edit-worker-shell',{revision:i.revision,index:f.index,featureId:f.featureId,thickness});}),
  rebindMaterials:()=>serial(async()=>{const i=await call('inspect-manufacturing'),proposal=await call('propose-material-rebind',{revision:i.revision});if(typeof proposal.token!=='string')throw Error('No current explicit assignment proposal.');return{proposal,result:await call('confirm-material-rebind',{token:proposal.token})};}),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))
 });
}
