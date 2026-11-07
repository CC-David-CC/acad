/** Runnable ordinary command recipe. No private model, kernel or file access. */
import {createCadAgent} from './cad-agent.mjs';
const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Expected one '+label+'.');return rows[0];};
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const samePair=(a,b)=>Array.isArray(a)&&a.length===2&&a.slice().sort().every((id,i)=>id===b.slice().sort()[i]);
function sourceSides(info,faceId,width,height){
 const rows=info.objects.filter(o=>o.type==='Segment'),points=new Map(info.points.map(p=>[p.id,p])),sides={};
 if(rows.length!==4)throw Error('Expected the newly authored four-edge source rectangle.');
 for(const row of rows){const a=points.get(row.id+':A'),b=points.get(row.id+':B');if(!a||!b)throw Error('Rectangle points unavailable.');let side;
  if(Math.abs(a.y)<1e-8&&Math.abs(b.y)<1e-8)side='bottom';else if(Math.abs(a.x-width)<1e-8&&Math.abs(b.x-width)<1e-8)side='right';else if(Math.abs(a.y-height)<1e-8&&Math.abs(b.y-height)<1e-8)side='top';else if(Math.abs(a.x)<1e-8&&Math.abs(b.x)<1e-8)side='left';
  if(!side||sides[side])throw Error('Rectangle side identity is ambiguous.');sides[side]=faceId+'/'+row.id;
 }
 if(Object.keys(sides).length!==4)throw Error('Rectangle side identities unavailable.');return sides;
}
export function createSourceBoundPatternExample(options={}){
 const agent=createCadAgent(options);let busy=false;
 const call=(command,args={})=>agent.execute(command,args);
 const serial=async work=>{if(busy)throw Error('Wait for the current recipe step to finish.');busy=true;try{return await work();}finally{busy=false;}};
 async function hole(bodyId,sourceFeatureId,kind,dimensions){const i=await call('inspect-through-holes'),t=one(i.targets?.filter(t=>t.bodyId===bodyId&&t.sourceFeatureId===sourceFeatureId),'source-bound hole target');if(!i.ready||!t.creation?.[kind]?.canCreate)throw Error(t.creation?.[kind]?.reason||i.reason||'Hole creation unavailable.');return call('create-through-hole',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:t.engineRevision,bodyId,sourceFeatureId,kind,...dimensions});}
 async function treatment(bodyId,kind,size,pairs){const i=await call('inspect-edge-treatments'),t=one(i.targets?.filter(t=>t.bodyId===bodyId),'edge-treatment target');if(!i.ready||!t.canCreate||t.selections?.status!=='available')throw Error(t.reason||i.reason||'Authored edge selections unavailable.');const edgeIds=pairs.map(pair=>one(t.selections.plan.edges.filter(e=>e.role==='connector'&&e.geometry==='line'&&samePair(e.incidentCurveIds,pair)),'source connector').id);const result=await call('create-edge-treatment',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:t.engineRevision,bodyId,kind,edgeIds,size});return{...result,edgeIds};}
 return Object.freeze({
  windowId:agent.windowId,
  build:()=>serial(async()=>{
   const d=await call('inspect');if(d.operationCount!==0||d.sketchCount!==0||d.path||d.dirty)throw Error('Use a new empty unsaved CAD window. Existing work was not replaced.');
   const available=await call('inspect-rectangle-creation');if(!available.ready)throw Error(available.reason||'Rectangle creation unavailable.');
   const rectangle=await call('create-rectangle-sketch',{revision:available.revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0}),faceId=rectangle.faceId;
   const sketches=await call('inspect-closed-sketches'),sketch=await call('inspect-closed-sketch',{revision:sketches.revision,faceId}),sides=sourceSides(sketch,faceId,100,50);
   const selected=await call('inspect-selected-profiles');if(!selected.ready)throw Error(selected.reason||'Selected-profile creation unavailable.');const discovery=await call('inspect-selected-regions',{revision:selected.revision,faceId,depth:20}),region=one(discovery.regions?.filter(r=>r.support==='supported'),'supported rectangle region');
   const profile=await call('create-selected-extrusion',{revision:selected.revision,faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision:selected.engineRevision,depth:20,bodyPolicy:'separate'});
   const center=await hole(profile.outputId,profile.featureId,'centered-through',{diameter:10}),corners=await hole(center.outputId,profile.featureId,'four-corner-through',{diameter:4,offsetX:8,offsetY:8});
   const fillet=await treatment(corners.outputId,'fillet',3,[[sides.bottom,sides.left],[sides.right,sides.top]]),chamfer=await treatment(fillet.outputId,'chamfer-equal',1,[[sides.bottom,sides.right],[sides.left,sides.top]]);
   const patterns=await call('inspect-linear-hole-patterns'),target=one(patterns.targets?.filter(t=>t.bodyId===chamfer.outputId&&t.seedFeatureId===center.featureId),'authenticated centered-hole seed');if(!patterns.ready||!target.canCreate)throw Error(target.reason||patterns.reason||'Pattern creation unavailable.');
   const pattern=await call('create-linear-hole-pattern',{revision:patterns.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:target.engineRevision,bodyId:target.bodyId,seedFeatureId:center.featureId,axis:'source-local-x-positive',count:3,spacing:20});
   return freeze({faceId,regionId:region.regionId,curveIds:Object.values(sides),sides,profile,center,corners,fillet,chamfer,pattern});
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
