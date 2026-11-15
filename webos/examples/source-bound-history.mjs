import {createCadAgent} from './cad-agent.mjs';
const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Choose exactly one '+label+'.');return rows[0];};

// Public commands only; importing this module performs no authoring. These
// source-ready history controls await their composed application workflow.
export function createSourceBoundHistoryExample({engineRevision,...options}={}){
 if(typeof engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(engineRevision))throw Error('Select a genuinely staged modern OCC build.');
 const agent=createCadAgent(options);let busy=false;
 const call=(command,args={})=>agent.execute(command,args),serial=async work=>{if(busy)throw Error('Wait for the current history recipe step.');busy=true;try{return await work();}finally{busy=false;}};
 async function center(bodyId,sourceFeatureId,diameter){const i=await call('inspect-through-holes'),t=one(i.targets.filter(r=>r.bodyId===bodyId&&r.sourceFeatureId===sourceFeatureId),'actual source-bound target');if(!i.ready||!t.creation['centered-through'].canCreate||t.engineRevision!==engineRevision)throw Error(t.creation['centered-through'].reason||i.reason||'Hole unavailable.');return call('create-through-hole',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,bodyId,sourceFeatureId,kind:'centered-through',diameter});}
 return Object.freeze({
  windowId:agent.windowId,
  build:()=>serial(async()=>{
   const d=await call('inspect');if(d.operationCount||d.sketchCount||d.path||d.dirty)throw Error('Use a new empty unsaved document.');
   const r=await call('inspect-rectangle-creation'),rectangle=await call('create-rectangle-sketch',{revision:r.revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});
   const p=await call('inspect-selected-profiles',{engineRevision});if(!p.ready||p.profileVersion!==3)throw Error(p.reason||'Modern selected extrusion unavailable.');
   const regions=await call('inspect-selected-regions',{revision:p.revision,faceId:rectangle.faceId,depth:20,engineRevision}),region=one(regions.regions.filter(r=>r.support==='supported'),'source rectangle region');
   const profile=await call('create-selected-extrusion',{revision:p.revision,unit:'millimeter',engine:'occ',engineRevision,faceId:rectangle.faceId,regionId:region.regionId,depth:20,bodyPolicy:'separate'});
   const s=await call('inspect-worker-solids'),box=await call('create-worker-solid-box',{revision:s.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,origin:[200,0,0],dimensions:[30,20,10]});
   const hole=await center(profile.outputId,profile.featureId,10);
   return Object.freeze({rectangle,profile,box,hole,faceId:rectangle.faceId,regionId:region.regionId});
  }),
  inspect:()=>serial(()=>call('inspect-worker-history-controls')),
  suppress:(featureId,suppressed)=>serial(async()=>{const i=await call('inspect-worker-history-controls'),f=one(i.features.filter(r=>r.featureId===featureId),'authored feature');return call('set-worker-feature-suppressed',{revision:i.revision,index:f.index,featureId:f.featureId,suppressed});}),
  prefix:afterFeatureId=>serial(async()=>{const i=await call('inspect-worker-history-controls');return call('set-worker-history-prefix',{revision:i.revision,afterFeatureId});}),
  branch:()=>serial(async()=>{const i=await call('inspect-worker-history-controls');if(!i.canBranch)throw Error(i.branchReason||'Branch unavailable.');return call('commit-worker-history-branch',{revision:i.revision,afterFeatureId:i.afterFeatureId});}),
  createCenteredHole:({bodyId,sourceFeatureId,diameter})=>serial(()=>center(bodyId,sourceFeatureId,diameter)),
  addOuterFillet:binding=>serial(async()=>{const i=await call('inspect-edge-treatments'),t=one(i.targets.filter(r=>r.bodyId===binding.hole.outputId),'current hole output'),edges=t.selections?.plan?.edges?.filter(r=>r.role==='connector'&&r.geometry==='line'&&r.originFeatureId===binding.profile.featureId);if(!t.canCreate||!Array.isArray(edges)||edges.length!==4)throw Error(t.reason||'Four original source connectors required.');return call('create-edge-treatment',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,bodyId:t.bodyId,kind:'fillet',edgeIds:[edges[0].id],size:3});}),
  travel:direction=>serial(()=>agent.travel(direction)),
  save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))
 });
}
