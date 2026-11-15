// Public recipe only. No source bytes, handles or parsed native identity grammar.
import {createCadAgent} from './cad-agent.mjs';
export function createSketchEllipseExample(options){
 const agent=createCadAgent(options),one=(rows,label)=>{if(rows.length!==1)throw Error('Expected one '+label);return rows[0];},call=(command,args)=>agent.execute(command,args);
 async function inspect(faceId){const current=await call('inspect-closed-sketches',{});return call('inspect-closed-sketch',{revision:current.revision,faceId});}
 async function edit(binding,parameters){const i=await inspect(binding.faceId),row=one(i.ellipses.filter(e=>e.id===binding.ellipseId),'current Ellipse');if(!row.canEdit)throw Error('Ellipse edit unavailable: '+row.reason);return call('edit-closed-sketch-ellipse',{revision:i.revision,faceId:binding.faceId,id:row.id,...parameters});}
 return Object.freeze({
  async build(){const state=await call('inspect',{});if(state.path||state.dirty||state.operationCount||state.sketchCount)throw Error('Use a new empty unsaved CAD document; existing work is not replaced.');const current=await call('inspect-rectangle-creation',{});if(!current.ready)throw Error(current.reason);const rectangle=await call('create-rectangle-sketch',{revision:current.revision,unit:'millimeter',origin:[0,0],width:10,height:10,depth:0});let i=await inspect(rectangle.faceId);const unrelated=await call('append-sketch-primitive',{revision:i.revision,faceId:rectangle.faceId,kind:'Point',role:null,stage:i.stageCount-1,data:{x:7,y:9}});i=await inspect(rectangle.faceId);const ellipse=await call('append-sketch-primitive',{revision:i.revision,faceId:rectangle.faceId,kind:'Ellipse',role:null,stage:i.stageCount-1,data:{c:{x:40,y:20},rx:10,ry:5,rot:0}});i=await inspect(rectangle.faceId);const row=one(i.ellipses.filter(e=>e.id===ellipse.primitive.id),'authored Ellipse');return Object.freeze({faceId:rectangle.faceId,rectangle,unrelatedId:unrelated.primitive.id,ellipseId:row.id,centerId:row.centerId});},
  edit,inspect:binding=>inspect(binding.faceId),travel:direction=>agent.travel(direction),save:path=>agent.save(path),open:path=>agent.open(path)
 });
}
