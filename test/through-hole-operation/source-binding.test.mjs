import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,PlaneDouble} from './fixture.mjs';
import {evaluateWorkerSolid} from '../../modules/engine/solid/solidLedger.mjs';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
test('profile source bindings reject malformed own-data identity before creating a mount',async()=>{
 const f=await fixture();try{
  let reads=0;
  const good=f.steps[0].sourceBinding,getter={...good};Object.defineProperty(getter,'featureId',{enumerable:true,get(){reads++;return good.featureId;}});
  const hidden={...good};Object.defineProperty(hidden,'regionId',{value:good.regionId,enumerable:false});
  const inherited=Object.create(good);Object.assign(inherited,{one:1,two:2,three:3});
  const cases=[null,[],{...good,extra:1},{...good,featureId:99},{...good,regionId:'other'},{...good,faceId:'missing'},getter,hidden,inherited];
  for(const binding of cases){const doc=new AbortController(),pool=createEvaluationResourcePool(),owner=pool.begin({signal:doc.signal,valid:()=>true});let creates=0;
   try{await assert.rejects(evaluateWorkerSolid({owner,kind:'profile',request:f.steps[0].intent,sourceBinding:binding,registry:{find:()=>undefined,findFace:id=>id===f.face.id?f.face:undefined},createMount:()=>{creates++;throw Error('No transport allowed');},validateMount:()=>{},createModel:()=>{throw Error('No model allowed');},valid:()=>true}));assert.equal(creates,0);assert.equal(pool.usage.mounts,0);}finally{owner.close();}
  }
  assert.equal(reads,0);assert(f.plane instanceof PlaneDouble);
 }finally{f.close();}
});
test('different candidate owner cannot reuse another candidate ledger source or target',async()=>{
 const f=await fixture(),doc=new AbortController(),pool=createEvaluationResourcePool(),owner=pool.begin({signal:doc.signal,valid:()=>true});try{
  const n=f.calls.length;f.ctx.engineEvaluation=owner;await assert.rejects(f.run(),{code:'INVALID_OPERAND'});assert.equal(f.calls.length,n);assert.equal(owner.state,'candidate');assert.equal(pool.usage.mounts,0);assert.equal(f.objects.get(f.base.outputId),f.base.model);
 }finally{owner.close();f.close();}
});
