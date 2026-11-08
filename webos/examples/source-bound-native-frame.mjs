import {createCadAgent} from './cad-agent.mjs';
const identity=()=>({origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
// Explicit invocation only; target comes from genuine public model receipts.
export function createSourceBoundNativeFrameExample(options={}){
 const agent=createCadAgent(options);let running=false;
 const call=(command,args={})=>agent.execute(command,args),serial=async work=>{if(running)throw Error('Finish the current native attachment recipe.');running=true;try{return await work();}finally{running=false;}};
 const inspect=()=>call('inspect-source-frames');
 async function parent(target){const solids=await call('inspect-worker-solids'),bodyId=target.bodyId??target.outputId??target.id,bodies=solids.bodies.filter(row=>row.featureId===target.featureId&&(!bodyId||row.id===bodyId));if(bodies.length!==1)throw Error('Select one actual current native body.');const i=await inspect(),read=await call('inspect-source-frame-attachments',{revision:i.revision,bodyId:bodies[0].id,featureId:bodies[0].featureId}),rows=read.parents.filter(row=>row.observation.role==='last-cap'&&row.observation.quality==='native-owned-planar-attachment');if(rows.length!==1)throw Error('Choose one genuine unambiguous native cap.');const p=rows[0].parent;return{kind:'native-planar-face',bodyId:p.bodyId,featureId:p.featureId,selectionId:p.selectionId};}
 async function attach(target,placement){const p=await parent(target),i=await inspect();return call('create-source-frame',{revision:i.revision,unit:'millimeter',parent:p,placement});}
 return Object.freeze({windowId:agent.windowId,execute:call,inspect:()=>serial(inspect),
  discover:target=>serial(()=>parent(target)),attach:(target,placement={kind:'basis',frame:identity()})=>serial(()=>attach(target,placement)),
  repair:(source,target)=>serial(async()=>{const p=await parent(target),i=await inspect(),rows=i.features.filter(row=>row.featureId===source.featureId&&row.faceId===source.faceId);if(rows.length!==1)throw Error('The independent source is no longer current.');const row=rows[0];return call('repair-source-frame-parent',{revision:i.revision,index:row.index,featureId:row.featureId,faceId:row.faceId,parent:p});}),
  depth:(target,depth)=>serial(async()=>{const i=await call('inspect-selected-profile-history'),rows=i.features.filter(row=>row.featureId===target.featureId);if(rows.length!==1)throw Error('The selected extrusion is unavailable.');const row=rows[0];return call('edit-selected-profile-depth',{revision:i.revision,index:row.index,featureId:row.featureId,depth});}),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))});
}
