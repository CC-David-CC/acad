// Registered shared operations only. No model/source mutation or ID grammar.
import {createCadAgent} from './cad-agent.mjs';
export function createStraightSlotExample(options={}){
 const agent=createCadAgent(options),call=(id,args={})=>agent.execute(id,args);let busy=false;
 const serial=async work=>{if(busy)throw Error('Wait for the current Slot operation.');busy=true;try{return await work();}finally{busy=false;}};
 const inspect=async faceId=>{const info=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:info.revision,faceId});};
 return Object.freeze({
  build:()=>serial(async()=>{const state=await call('inspect');if(state.path||state.dirty||state.operationCount||state.sketchCount)throw Error('Use a new empty unsaved document.');const info=await call('inspect-rectangle-creation');if(!info.ready)throw Error(info.reason);const rectangle=await call('create-rectangle-sketch',{revision:info.revision,unit:'millimeter',origin:[-30,-30],width:10,height:10,depth:0}),faceId=rectangle.faceId;let i=await inspect(faceId);const unrelated=await call('append-sketch-primitive',{revision:i.revision,faceId,kind:'Point',role:null,stage:i.stageCount-1,data:{x:7,y:9}});i=await inspect(faceId);const result=await call('create-closed-sketch-slot',{revision:i.revision,faceId,a:{x:0,y:0},b:{x:20,y:0},radius:3});return Object.freeze({faceId,rectangle,unrelatedId:unrelated.primitive.id,slotId:result.slot.slotId,members:result.slot.members});}),
  inspect:binding=>serial(()=>inspect(binding.faceId)),
  edit:(binding,intent)=>serial(async()=>{const i=await inspect(binding.faceId);return call('edit-closed-sketch-slot',{revision:i.revision,faceId:binding.faceId,slotId:binding.slotId,...intent});}),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))
 });
}
