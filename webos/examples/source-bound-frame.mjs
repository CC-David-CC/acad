import {createCadAgent} from './cad-agent.mjs';
const identity=()=>({origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
// No automatic execution, source seeds, Native handles or caller allocated IDs.
export function createSourceBoundFrameExample(options={}){
 const agent=createCadAgent(options);let running=false;
 const call=(command,args={})=>agent.execute(command,args),serial=async work=>{if(running)throw Error('Finish the current frame recipe.');running=true;try{return await work();}finally{running=false;}};
 const inspect=()=>call('inspect-source-frames');
 async function create(parent,placement){const i=await inspect();if(!i.ready)throw Error(i.reason||'Source frames unavailable.');return call('create-source-frame',{revision:i.revision,unit:'millimeter',parent,placement});}
 async function edit(source,placement){const i=await inspect(),row=i.features.find(f=>f.featureId===source.featureId&&f.faceId===source.faceId);if(!row?.canEdit)throw Error('Source frame is unavailable.');return call('edit-source-frame',{revision:i.revision,index:row.index,featureId:row.featureId,faceId:row.faceId,placement});}
 return Object.freeze({windowId:agent.windowId,execute:call,inspect:()=>serial(inspect),
  build:()=>serial(async()=>{const doc=await call('inspect');if(doc.operationCount||doc.sketchCount||doc.path||doc.dirty)throw Error('Use a new empty unsaved document.');const parent=await create(null,{kind:'basis',frame:identity()}),child=await create({featureId:parent.featureId,faceId:parent.faceId},{kind:'basis',frame:{origin:[10,20,30],x:[0,1,0],y:[-1,0,0],z:[0,0,1]}});return Object.freeze({parent,child});}),
  create:(parent,placement)=>serial(()=>create(parent,placement)),edit:(source,placement)=>serial(()=>edit(source,placement)),
  parentPose:(parent,z=3)=>serial(()=>edit(parent,{kind:'rigid',frame:identity(),axis:[0,0,1],angleDegrees:90,pivot:[0,0,0],translation:[1,2,z]})),
  pivot:parent=>serial(()=>edit(parent,{kind:'rigid',frame:{...identity(),origin:[12,0,0]},axis:[0,0,1],angleDegrees:90,pivot:[10,0,0],translation:[0,0,0]})),
  points:(source,direction,points)=>serial(async()=>{const i=await inspect();return call('inspect-source-frame-points',{revision:i.revision,featureId:source.featureId,faceId:source.faceId,direction,points});}),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))});
}
