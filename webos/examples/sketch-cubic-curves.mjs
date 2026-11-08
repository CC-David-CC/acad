// Registered public workflow recipe only; no private model/source mutation.
import {createCadAgent} from './cad-agent.mjs';
export function createSketchCubicCurvesExample(options={}){
 const agent=createCadAgent(options),call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(rows.length!==1)throw Error('One '+label+' required.');return rows[0];};let busy=false;
 const serial=async work=>{if(busy)throw Error('Wait for the current cubic recipe.');busy=true;try{return await work();}finally{busy=false;}};
 async function inspect(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:i.revision,faceId});}
 async function append(faceId,kind,data){const i=await inspect(faceId);return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:i.stageCount-1,data});}
 const bezier=points=>({cp1:points[0],cp2:points[1],cp3:points[2],cp4:points[3]});
 return Object.freeze({
  build:()=>serial(async()=>{const state=await call('inspect');if(state.path||state.dirty||state.operationCount||state.sketchCount)throw Error('Use a new empty unsaved document.');const start=await call('inspect-rectangle-creation');if(!start.ready)throw Error(start.reason);const rectangle=await call('create-rectangle-sketch',{revision:start.revision,unit:'millimeter',origin:[0,0],width:10,height:10,depth:0}),faceId=rectangle.faceId,unrelated=await append(faceId,'Point',{x:7,y:9});const a=await append(faceId,'BezierCurve',bezier([{x:20,y:0},{x:20,y:10},{x:30,y:10},{x:30,y:0}])),b=await append(faceId,'BSpline',{degree:3,type:'Clamped',method:0,controlPoints:[{x:40,y:0},{x:40,y:10},{x:50,y:10},{x:50,y:0}]}),c=await append(faceId,'BSpline',{degree:3,type:'Clamped',method:0,controlPoints:[{x:60,y:0},{x:60,y:10},{x:65,y:10},{x:70,y:10},{x:70,y:0}]}),reverse=await append(faceId,'BezierCurve',bezier([{x:90,y:0},{x:90,y:10},{x:80,y:10},{x:80,y:0}]));const i=await inspect(faceId),ids=[a.primitive.id,b.primitive.id,c.primitive.id,reverse.primitive.id];for(const id of ids)if(!one(i.curves.filter(c=>c.id===id),'actual native cubic').canEdit)throw Error('New native cubic controls are unavailable.');return Object.freeze({faceId,rectangle,unrelatedId:unrelated.primitive.id,bezierId:ids[0],spline4Id:ids[1],spline5Id:ids[2],reverseId:ids[3]});}),
  inspect:binding=>serial(()=>inspect(binding.faceId)),
  edit:(binding,id,coordinates)=>serial(async()=>{const i=await inspect(binding.faceId),row=one(i.curves.filter(c=>c.id===id),'actual curve');if(!row.canEdit||coordinates.length!==row.controls.length)throw Error(row.reason||'Use the complete existing controls.');return call('edit-closed-sketch-control-points',{revision:i.revision,faceId:binding.faceId,id,points:row.controls.map((p,j)=>({pointId:p.pointId,x:coordinates[j].x,y:coordinates[j].y}))});}),
  sample:(binding,id,parameters=[0,.25,.5,.75,1])=>serial(async()=>{const i=await inspect(binding.faceId);return call('inspect-closed-sketch-curve-points',{revision:i.revision,faceId:binding.faceId,id,parameters});}),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))
 });
}
