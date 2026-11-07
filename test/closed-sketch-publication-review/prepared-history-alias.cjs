// Exact submitPreparedReplay source-method before-control. No model evaluation.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process'),babel=require('@babel/core');
const sourcePin='9b88a776698c65d6a2a3a0abde405b94f4f0e37d';
const source=cp.execFileSync('git',['show',sourcePin+':web/app/cad/craft/craftBundle.ts'],{encoding:'utf8'});
const found=source.match(/  function submitPreparedReplay\([\s\S]*?\n  \}/);assert.ok(found);
const code=babel.transformSync(found[0],{filename:'source-method.ts',configFile:false,babelrc:false,presets:[require.resolve('@babel/preset-typescript')]}).code;
const history=[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}},{type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,face:'S:0/SURFACE',regions:['region'],length:20}}];
const previous={history,pointer:1};let submitted=null;
const stream={value:previous,next(value){submitted=value}};
const submit=new Function('requireEngineCleanup','modifications$','modificationCallbacks','pendingPipelines','pendingModifications',code+';return submitPreparedReplay;')(()=>{},stream,new WeakMap(),0,0);
submit(()=>{},error=>{throw error},{requireCurrent(){}},undefined);
assert.ok(submitted);assert.notEqual(submitted.history,previous.history);assert.equal(submitted.history[1],previous.history[1]);
const original=JSON.stringify(submitted.history);previous.history[1].params.length=30;const observedDepth=submitted.history[1].params.length;previous.history[1].params.length=20;
assert.equal(observedDepth,30);assert.equal(JSON.stringify(submitted.history),original);
const result={version:1,source:sourcePin,layer:'synthetic-exact-source-method-no-model-evaluation',functionSha256:crypto.createHash('sha256').update(found[0]).digest('hex'),detachedArray:true,aliasedOperationRecord:true,transientDepthObserved:observedDepth,finalDepth:submitted.history[1].params.length,finalSignatureUnchanged:JSON.stringify(submitted.history)===original,scope:'Prepared replay input aliases mutable accepted operation records. Demonstrates source ownership gap only; no actual candidate model or publication was executed.'};
fs.writeFileSync('test/closed-sketch-publication-review/prepared-history-alias-before.json',JSON.stringify(result,null,2)+'\n');console.log('REPRODUCED mutable operation alias in prepared replay',JSON.stringify(result));
