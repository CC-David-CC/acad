import {inspectSolvedSelectedRegions} from '../../modules/engine/extrusion/selectedSketchProfile.mjs';
import {circle,rectangle,request,holeLimitFixture} from './fixtures.mjs';
const frozen=value=>!value||typeof value!=='object'||Object.isFrozen(value)&&Object.values(value).every(frozen);
self.onmessage=async event=>{
 const name=event.data?.case;let input;
 if(name==='nested')input=await request([circle('outer',30),circle('middle',20),circle('inner',10)]);
 else if(name==='disjoint')input=await request([...rectangle('a',0,0,10,10),...rectangle('b',20,0,2,3)]);
 else if(name==='mixed')input=await request([...rectangle('outer',-20,-20,40,40),circle('hole',5),...rectangle('island',-1,-1,2,2)]);
 else if(name==='hole-cap')input=await request(holeLimitFixture());
 else if(name==='max-loops')input=await request(Array.from({length:128},(_,i)=>circle('c'+i,1,3*i)));
 else if(name==='utf8-over')input=await request([circle('c',1)],{source:{extra:'界'.repeat(400000)}});
 else if(name==='arc')input=await request([{id:'arc',type:'Arc',role:null,stage:0,data:{a:{x:10,y:0},b:{x:10,y:0},c:{x:0,y:0}}}]);
 else if(name==='touch')input=await request([circle('a',10),circle('b',10,20)]);
 else if(name==='digest')input={...await request([circle('c',1)]),sketchDigest:'0'.repeat(64)};
 else throw Error('Unknown test case');
 const before=JSON.stringify(input),original=crypto.subtle.digest;let digests=0,result,error;
 Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:(...args)=>{digests++;return original.apply(crypto.subtle,args);}});
 try{result=await inspectSolvedSelectedRegions(input);}catch(e){error={code:e.code,message:e.message};}
 finally{delete crypto.subtle.digest;}
 self.postMessage({case:name,result,error,digests,sourceUnchanged:JSON.stringify(input)===before,deepFrozen:result?frozen(result):null,dedicatedWorker:typeof document==='undefined'&&self instanceof DedicatedWorkerGlobalScope,resources:performance.getEntriesByType('resource').map(r=>r.name),scope:'Explicit native-data geometry fixtures; no solver admission, native CAD, public authoring or signed persistence'});
};
