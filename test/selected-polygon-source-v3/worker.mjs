import {inspectSolvedSelectedRegions as inspect,prepareSolvedSelectedRegion as prepare} from '../../modules/engine/extrusion/selectedSketchProfile.mjs';
import {request,triangle,rotated,lshape,circle,polygon,rectangle,regular,regionId,ids} from './fixtures.mjs';
const frozen=v=>!v||typeof v!=='object'||Object.isFrozen(v)&&Object.values(v).every(frozen);
self.onmessage=async event=>{
 const name=event.data?.case;let objects,outer,holes=[],input;
 if(['triangle','xz','legacy-triangle','capture'].includes(name))objects=triangle();
 else if(name==='rotated')objects=rotated();
 else if(name==='L')objects=lshape();
 else if(name==='legacy-rectangle')objects=rectangle('r',0,0,10,10);
 else if(name==='mixed'){outer=lshape();holes=[[circle('c',3,10,40)],polygon('h',[[40,5],[60,5],[50,15]])];objects=[...holes.flat(),...outer].reverse();}
 else if(name==='nested-disjoint'){outer=rectangle('o',-50,-50,100,100);const c=circle('c',30);holes=[[c]];objects=[...lshape('d',200),...polygon('i',[[-5,-5],[5,-5],[0,5]]),c,...outer];}
 else if(name==='aggregate-cap'){objects=[...regular('a',257),...regular('b',256)];for(const o of objects.filter(o=>o.id.startsWith('b'))){o.data.a.x+=1000;o.data.b.x+=1000;}}
 else if(name==='gap'){objects=triangle();objects[0].data.a.x=1e-8;}
 else if(name==='intersect')objects=[...rectangle('a',0,0,10,10),...rectangle('b',5,5,10,10)];
 else if(name==='arc')objects=[...triangle(),{id:'arc',type:'Arc',role:null,stage:0,data:{}}];
 else throw Error('Unknown component fixture');
 input=await request(objects,name==='xz'?{frame:{origin:[3,4,5],x:[1,0,0],y:[0,0,1],z:[0,-1,0]}}:{});if(name.startsWith('legacy-'))delete input.profileVersion;
 const source=input.sketchJSON,original=crypto.subtle.digest;let digests=0,inspection,plan,error;
 Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:(...args)=>{digests++;return original.apply(crypto.subtle,args);}});
 try{
  const selected=regionId(input.faceId,ids(outer||objects),holes.map(ids));
  if(name==='capture'){
   let release;const gate=new Promise(r=>release=r);Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:(...args)=>{digests++;const actual=original.apply(crypto.subtle,args);return gate.then(()=>actual);}});
   const args={...input,regionId:selected},pending=prepare(args);args.profileVersion=2;args.frame.origin[0]=100;release();plan=await pending;
  }else{inspection=await inspect(input);if(inspection.regions.every(r=>r.support==='supported'))plan=await prepare({...input,regionId:selected});}
 }catch(e){error={code:e.code,message:e.message};}finally{delete crypto.subtle.digest;}
 self.postMessage({case:name,inspection,plan:plan?{version:plan.request.version,expected:plan.expected,regionId:plan.binding.regionId,frame:plan.request.frame}:undefined,error,digests,sourceUnchanged:input.sketchJSON===source,deepFrozen:inspection||plan?frozen(inspection)&&frozen(plan):null,dedicatedWorker:typeof document==='undefined'&&self instanceof DedicatedWorkerGlobalScope,resources:performance.getEntriesByType('resource').map(r=>r.name),scope:'Actual preparation Worker on explicit native-v3 component source fixtures; no solver/public authoring/native geometry/history proof'});
};
