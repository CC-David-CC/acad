/** Runnable ordinary command recipe. No private model, kernel or file access. */
import {createCadAgent} from './cad-agent.mjs';
const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Expected one '+label+'.');return rows[0];};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export function createSourceBoundPatternExample(options={}){
 const agent=createCadAgent(options);let busy=false;
 const call=(command,args={})=>agent.execute(command,args);
 const serial=async work=>{if(busy)throw Error('Wait for the current recipe step to finish.');busy=true;try{return await work();}finally{busy=false;}};
 async function hole(bodyId,sourceFeatureId,kind,dimensions){const i=await call('inspect-through-holes'),t=one(i.targets?.filter(t=>t.bodyId===bodyId&&t.sourceFeatureId===sourceFeatureId),'source-bound hole target');if(!i.ready||!t.creation?.[kind]?.canCreate)throw Error(t.creation?.[kind]?.reason||i.reason||'Hole creation unavailable.');return call('create-through-hole',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:t.engineRevision,bodyId,sourceFeatureId,kind,...dimensions});}
 async function edgeTarget(bodyId){const i=await call('inspect-edge-treatments'),t=one(i.targets?.filter(t=>t.bodyId===bodyId),'edge-treatment target');if(!i.ready||!t.canCreate||t.selections?.status!=='available')throw Error(t.reason||i.reason||'Authored edge selections unavailable.');return{i,t};}
 async function treatment(bodyId,kind,size,edgeIds,originFeatureId){const{i,t}=await edgeTarget(bodyId);for(const id of edgeIds)one(t.selections.plan.edges.filter(e=>e.id===id&&e.role==='connector'&&e.geometry==='line'&&e.originFeatureId===originFeatureId),'retained source connector');const result=await call('create-edge-treatment',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:t.engineRevision,bodyId,kind,edgeIds,size});return{...result,edgeIds};}
 return Object.freeze({
  windowId:agent.windowId,
  build:()=>serial(async()=>{
   const d=await call('inspect');if(d.operationCount!==0||d.sketchCount!==0||d.path||d.dirty)throw Error('Use a new empty unsaved CAD window. Existing work was not replaced.');
   const available=await call('inspect-rectangle-creation');if(!available.ready)throw Error(available.reason||'Rectangle creation unavailable.');
   const rectangle=await call('create-rectangle-sketch',{revision:available.revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0}),faceId=rectangle.faceId;
   const selected=await call('inspect-selected-profiles');if(!selected.ready)throw Error(selected.reason||'Selected-profile creation unavailable.');const discovery=await call('inspect-selected-regions',{revision:selected.revision,faceId,depth:20}),region=one(discovery.regions?.filter(r=>r.support==='supported'),'supported rectangle region');
   const profile=await call('create-selected-extrusion',{revision:selected.revision,faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision:selected.engineRevision,depth:20,bodyPolicy:'separate'});
   const center=await hole(profile.outputId,profile.featureId,'centered-through',{diameter:10}),corners=await hole(center.outputId,profile.featureId,'four-corner-through',{diameter:4,offsetX:8,offsetY:8});
   const discovered=await edgeTarget(corners.outputId),connectors=discovered.t.selections.plan.edges.filter(e=>e.role==='connector'&&e.geometry==='line'&&e.originFeatureId===profile.featureId);
   if(connectors.length!==4||new Set(connectors.map(e=>e.id)).size!==4||connectors.some(e=>!Array.isArray(e.incidentCurveIds)||e.incidentCurveIds.length!==2||new Set(e.incidentCurveIds).size!==2))throw Error('Expected four unambiguous original source connectors.');
   const first=connectors[0],opposite=one(connectors.filter(e=>e.id!==first.id&&e.incidentCurveIds.every(id=>!first.incidentCurveIds.includes(id))),'opposite source connector');
   const filletIds=[first.id,opposite.id],chamferIds=connectors.filter(e=>!filletIds.includes(e.id)).map(e=>e.id),curveIds=[...new Set(connectors.flatMap(e=>e.incidentCurveIds))];
   if(chamferIds.length!==2||curveIds.length!==4)throw Error('Original source connector incidence is ambiguous.');
   const fillet=await treatment(corners.outputId,'fillet',3,filletIds,profile.featureId),chamfer=await treatment(fillet.outputId,'chamfer-equal',1,chamferIds,profile.featureId);
   const patterns=await call('inspect-linear-hole-patterns'),target=one(patterns.targets?.filter(t=>t.bodyId===chamfer.outputId&&t.seedFeatureId===center.featureId),'authenticated centered-hole seed');if(!patterns.ready||!target.canCreate)throw Error(target.reason||patterns.reason||'Pattern creation unavailable.');
   const pattern=await call('create-linear-hole-pattern',{revision:patterns.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:target.engineRevision,bodyId:target.bodyId,seedFeatureId:center.featureId,axis:'source-local-x-positive',count:3,spacing:20});
   return freeze({faceId,regionId:region.regionId,curveIds,connectors,profile,center,corners,fillet,chamfer,pattern});
  }),
  resize:(binding,{width=150,height=30,depth=25}={})=>serial(async()=>{const i=await call('inspect-rectangle-dimensions'),r=one(i.candidates?.filter(r=>r.faceId===binding.faceId),'original rectangle');await call('edit-rectangle-dimensions',{revision:i.revision,faceId:r.faceId,width,height});const history=await call('inspect-selected-profile-history'),p=one(history.features?.filter(p=>p.featureId===binding.profile.featureId),'original profile feature');return call('edit-selected-profile-depth',{revision:history.revision,index:p.index,featureId:p.featureId,depth});}),
  editSeed:(binding,diameter=14)=>serial(async()=>{const h=await call('inspect-through-hole-history'),f=one(h.features?.filter(f=>f.featureId===binding.center.featureId),'original centered hole');return call('edit-through-hole',{revision:h.revision,index:f.index,featureId:f.featureId,diameter});}),
  editPattern:(binding,{count=3,spacing=20}={})=>serial(async()=>{const h=await call('inspect-linear-hole-pattern-history'),f=one(h.features?.filter(f=>f.featureId===binding.pattern.featureId),'original linear pattern');return call('edit-linear-hole-pattern',{revision:h.revision,index:f.index,featureId:f.featureId,count,spacing});}),
  setDisplayUnits:lengthUnit=>serial(async()=>{const i=await call('inspect-display-units');return call('set-display-units',{revision:i.revision,lengthUnit});}),
  travel:direction=>serial(()=>agent.travel(direction)),
  save:path=>serial(()=>agent.save(path)),
  inspect:()=>serial(()=>call('inspect-worker-solids'))
 });
}
