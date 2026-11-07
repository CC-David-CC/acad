/** Public command recipe. Geometry, source ownership and files stay in Craft. */
import {createCadAgent} from './cad-agent.mjs';
const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Choose exactly one '+label+'.');return rows[0];};
export function createSourceBoundSweepExample(options={}){
 const agent=createCadAgent(options);let busy=false;
 const call=(command,args={})=>agent.execute(command,args);
 const serial=async work=>{if(busy)throw Error('Wait for the current recipe step.');busy=true;try{return await work();}finally{busy=false;}};
 async function plane(orientation){const i=await call('inspect-sketch-creation');if(!i.ready)throw Error(i.reason||'Source plane creation unavailable.');return call('create-empty-sketch-plane',{revision:i.revision,unit:'millimeter',plane:orientation,depth:0});}
 async function primitive(faceId,kind,data){const i=await call('inspect-closed-sketches');return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:0,data});}
 return Object.freeze({
  windowId:agent.windowId,
  buildStraightCircle:({radius=2,length=10}={})=>serial(async()=>{
   if(![radius,length].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>1e-4&&v<=1e6))throw Error('Use positive supported millimeter dimensions.');
   const document=await call('inspect');if(document.operationCount!==0||document.sketchCount!==0||document.path||document.dirty)throw Error('Use a new empty unsaved CAD window; existing work was not replaced.');
   // Detect availability before authoring either plane. A future ambiguous build
   // selection must be resolved explicitly, never by an implicit engine switch.
   const available=await call('inspect-worker-sweeps');if(!available.ready)throw Error(available.reason||'Sweep unavailable.');
   const build=one(available.builds?.filter(row=>row.canCreate),'available explicit sweep build');
   const section=await plane('XY'),circle=await primitive(section.faceId,'Circle',{c:{x:0,y:0},r:radius});
   const spine=await plane('XZ'),line=await primitive(spine.faceId,'Segment',{a:{x:0,y:0},b:{x:0,y:length}});
   const info=await call('inspect-worker-sweeps');
   const discovered=await call('inspect-worker-sweep-regions',{revision:info.revision,faceId:section.faceId,pathFaceId:spine.faceId,engineRevision:build.engineRevision});
   const region=one(discovered.regions?.filter(row=>row.support==='supported'&&row.descriptor?.outerCurveIds?.length===1&&row.descriptor.outerCurveIds[0]===circle.primitive.id&&row.descriptor.holeCurveIds?.length===0),'actual circle region');
   const result=await call('create-worker-sweep',{revision:discovered.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:build.engineRevision,faceId:section.faceId,regionId:region.regionId,pathFaceId:spine.faceId,pathCurves:[{curveId:line.primitive.id,reversed:false}],transport:'corrected-frenet',bodyPolicy:'separate'});
   return Object.freeze({faceId:section.faceId,pathFaceId:spine.faceId,profileCurveId:circle.primitive.id,pathCurveId:line.primitive.id,regionId:region.regionId,engineRevision:build.engineRevision,result});
  }),
  inspect:()=>serial(()=>call('inspect-worker-solids')),
  history:()=>serial(()=>call('inspect-worker-sweep-history')),
  travel:direction=>serial(()=>agent.travel(direction)),
  save:path=>serial(()=>agent.save(path)),
  open:path=>serial(()=>agent.open(path))
 });
}
