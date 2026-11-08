// Public registry recipe; definitions are a directed dependency graph, not a
// simultaneous constraint system. Nothing executes merely by importing it.
import {createCadAgent} from './cad-agent.mjs';
const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Expected one '+label);return rows[0];};
export const mechanicalParameterDefinitions=()=>[
 {name:'width',dimension:'length',expression:'mm(100)'},
 {name:'height',dimension:'length',expression:'width / 2'},
 {name:'depth',dimension:'length',expression:'width / 5'},
 {name:'hole',dimension:'length',expression:'width / 10'},
 {name:'corner',dimension:'length',expression:'hole * 0.4'},
 {name:'edge',dimension:'length',expression:'width * 0.08'}
];
export function createModernParametersExample({engineRevision,...options}={}){
 if(typeof engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(engineRevision))throw Error('Choose an actually staged explicit modern through-hole build.');
 const agent=createCadAgent(options);let busy=false;const call=(id,args={})=>agent.execute(id,args),serial=async work=>{if(busy)throw Error('Wait for the current parameter recipe step.');busy=true;try{return await work();}finally{busy=false;}};
 async function hole(bodyId,sourceFeatureId,kind,dimensions){const i=await call('inspect-through-holes'),t=one(i.targets.filter(row=>row.bodyId===bodyId&&row.sourceFeatureId===sourceFeatureId),'actual through-hole target');if(!i.ready||!t.creation[kind].canCreate||t.engineRevision!==engineRevision)throw Error(t.creation[kind].reason||i.reason||'Recorded hole build unavailable');return call('create-through-hole',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,bodyId,sourceFeatureId,kind,...dimensions});}
 async function bind(binding,definitions){let p=await call('inspect-physical-parameters');const profile=one(p.selectedProfiles.filter(row=>row.featureId===binding.profile.featureId&&row.faceId===binding.faceId&&row.regionId===binding.regionId),'actual selected source');if(!p.ready||profile.engineRevision!==engineRevision)throw Error(p.reason||'Recorded selected source unavailable');await call('apply-physical-selected-profile',{revision:p.revision,index:profile.index,featureId:profile.featureId,width:'width',height:'height',depth:'depth',definitions});
  p=await call('inspect-physical-parameters');const center=one(p.features.filter(row=>row.featureId===binding.center.featureId&&row.type==='WORKER_THROUGH_HOLES_V1'),'authored centered hole'),corners=one(p.features.filter(row=>row.featureId===binding.corners.featureId&&row.type==='WORKER_THROUGH_HOLES_V1'),'authored corner holes');
  const changes=[[center,'diameter','hole'],[corners,'diameter','corner'],[corners,'offsetX','edge'],[corners,'offsetY','edge']].map(([row,field,parameter])=>({index:row.index,featureId:row.featureId,type:row.type,field,parameter}));return call('apply-physical-bindings',{revision:p.revision,changes,definitions});
 }
 return Object.freeze({
  windowId:agent.windowId,
  build:()=>serial(async()=>{const document=await call('inspect');if(document.operationCount||document.sketchCount||document.path||document.dirty)throw Error('Use a new empty unsaved CAD document.');const r=await call('inspect-rectangle-creation'),rectangle=await call('create-rectangle-sketch',{revision:r.revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0}),p=await call('inspect-selected-profiles',{engineRevision});if(!p.ready||p.profileVersion!==3||p.engineRevision!==engineRevision)throw Error(p.reason||'Explicit modern profile build unavailable');const d=await call('inspect-selected-regions',{revision:p.revision,faceId:rectangle.faceId,depth:20,engineRevision}),region=one(d.regions.filter(row=>row.support==='supported'),'supported source rectangle region'),profile=await call('create-selected-extrusion',{revision:p.revision,faceId:rectangle.faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision,depth:20,bodyPolicy:'separate'}),center=await hole(profile.outputId,profile.featureId,'centered-through',{diameter:10}),corners=await hole(center.outputId,profile.featureId,'four-corner-through',{diameter:4,offsetX:8,offsetY:8});return Object.freeze({faceId:rectangle.faceId,regionId:region.regionId,rectangle,profile,center,corners});}),
  bind:(binding,definitions=mechanicalParameterDefinitions())=>serial(()=>bind(binding,definitions)),
  replaceDefinitions:definitions=>serial(async()=>{const p=await call('inspect-physical-parameters');if(!p.ready)throw Error(p.reason||'Parameter editing unavailable');return call('apply-physical-bindings',{revision:p.revision,changes:[],definitions});}),
  inspect:()=>serial(async()=>({parameters:await call('inspect-physical-parameters'),solids:await call('inspect-worker-solids')})),
  setDisplayUnits:lengthUnit=>serial(async()=>{const i=await call('inspect-display-units');return call('set-display-units',{revision:i.revision,lengthUnit});}),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))
 });
}
