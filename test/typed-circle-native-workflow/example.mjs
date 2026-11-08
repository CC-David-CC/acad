// No automatic execution. Pass an existing createCadAgent() bound to one
// window/document; all mutations use public registry commands.
export const typedCircleDefinitions=(radius=5)=>[
 {name:'radius',dimension:'length',expression:'mm('+radius+')'},
 {name:'height',dimension:'length',expression:'4 * radius'},
 {name:'occ',dimension:'length',expression:'mm(1)'},
 {name:'millimeter',dimension:'length',expression:'mm(2)'}
];
export function createTypedCircleExample(agent,{engineRevision}={}){
 if(typeof agent?.execute!=='function'||typeof engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(engineRevision))throw Error('Use a document-bound CAD agent and an actually staged explicit profile build.');
 const call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Expected one '+label);return rows[0];};let busy=false;
 async function serial(work){if(busy)throw Error('Wait for this recipe operation.');busy=true;try{return await work();}finally{busy=false;}}
 async function inspect(faceId){const s=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:s.revision,faceId});}
 async function radius(binding,value){const i=await inspect(binding.faceId),r=one(i.dimensionTargets.filter(r=>r.typeId==='RadiusLength'&&r.objects.length===1&&r.objects[0]===binding.id&&r.canEdit),'actual RadiusLength');return call('edit-closed-sketch-dimension',{revision:i.revision,faceId:binding.faceId,constraintId:r.constraintId,value});}
 async function definitions(rows){const p=await call('inspect-physical-parameters');if(!p.ready)throw Error(p.reason);return call('apply-physical-bindings',{revision:p.revision,changes:[],definitions:rows});}
 return Object.freeze({inspect,
  build:()=>serial(async()=>{
   const document=await call('inspect');if(document.operationCount||document.sketchCount||document.path||document.dirty)throw Error('Use a new empty unsaved CAD document.');
   const ready=await call('inspect-sketch-creation'),plane=await call('create-empty-sketch-plane',{revision:ready.revision,unit:'millimeter',plane:'XY',depth:0}),faceId=plane.faceId;
   let i=await inspect(faceId);const appended=await call('append-sketch-primitive',{revision:i.revision,faceId,kind:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r:5}}),id=appended.primitive.id;
   i=await inspect(faceId);const extra=await call('append-sketch-primitive',{revision:i.revision,faceId,kind:'Point',role:null,stage:0,data:{x:7,y:9}});
   i=await inspect(faceId);await call('apply-closed-sketch-radius',{revision:i.revision,faceId,id,radius:5});
   const p=await call('inspect-selected-profiles',{engineRevision});if(!p.ready||p.profileVersion!==3||p.engineRevision!==engineRevision)throw Error(p.reason||'Exact staged version3 profile build unavailable.');
   const d=await call('inspect-selected-regions',{revision:p.revision,faceId,depth:20,engineRevision}),region=one(d.regions.filter(r=>r.support==='supported'&&r.descriptor.outerCurveIds?.length===1&&r.descriptor.outerCurveIds[0]===id&&!r.descriptor.holeCurveIds.length),'genuine Circle region');
   const body=await call('create-selected-extrusion',{revision:p.revision,faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision,depth:20,bodyPolicy:'separate'});
   return Object.freeze({faceId,id,unrelatedId:extra.primitive.id,plane,regionId:region.regionId,body});
  }),
  bind:binding=>serial(async()=>{const p=await call('inspect-physical-parameters'),row=one(p.features.filter(r=>r.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'&&r.featureId===binding.body.featureId),'actual extrusion');await call('apply-physical-bindings',{revision:p.revision,changes:[{index:row.index,featureId:row.featureId,type:row.type,field:'depth',parameter:'height'}],definitions:typedCircleDefinitions()});return radius(binding,'radius');}),
  setRadius:(binding,value)=>serial(()=>radius(binding,value)),
  replaceDefinitions:rows=>serial(()=>definitions(rows)),
  replaceRadius:radius=>serial(()=>definitions(typedCircleDefinitions(radius))),
  tryRectangleControls:binding=>serial(async()=>{const p=await call('inspect-physical-parameters'),row=one(p.selectedProfiles.filter(r=>r.featureId===binding.body.featureId&&r.faceId===binding.faceId&&r.regionId===binding.regionId),'selected source candidate');return call('apply-physical-selected-profile',{revision:p.revision,index:row.index,featureId:row.featureId,width:'radius',height:'radius',depth:'height',definitions:p.definitions});}),
  setDisplayUnits:lengthUnit=>serial(async()=>{const i=await call('inspect-display-units');return call('set-display-units',{revision:i.revision,lengthUnit});}),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))
 });
}
