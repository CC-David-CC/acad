// Synthetic legacy metadata, constructed/captured/equal-compared entirely in
// Workers. This is not geometry, native validity, or UI-thread performance proof.
import {parentPort} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {transport} from './transport.mjs';
import {assignEnclosureMaterials} from '../../web/app/cad/projectManager/enclosureMaterialAssignment.mjs';
import {prepareManufacturingInWorker} from '../../web/app/cad/projectManager/manufacturingPublicationClient.mjs';
import {readManufacturingWorkerPreparation} from '../../web/app/cad/projectManager/documentMetadataPreparation.mjs';
const args={geometryRevision:'sha256-'+'a'.repeat(64),featureId:7,history:[{type:'WORKER_ENCLOSURE_V1',params:{featureId:7}}],bodies:['BODY','LID'].map(outputRole=>({id:'worker-enclosure:1:'+JSON.stringify([7,outputRole]),featureId:7,originatingOperation:0,outputRole})),roles:Object.fromEntries(['BODY','LID'].map(role=>[role,{material:{id:role,name:role},appearance:null}]))};
const before=assignEnclosureMaterials({...args,metadata:null,revision:args.geometryRevision});
for(let i=2;i<10000;i++)before.materials.push({id:'legacy-'+i,name:'x'.repeat(256)});
const units=JSON.stringify(before).length,charge=units*2;assert.ok(charge>4194304&&charge<8388608);
const t=transport();globalThis.Worker=t.Adapter;
try{
 const p=readManufacturingWorkerPreparation(await prepareManufacturingInWorker('publication',{action:'enclosure',before,args}));assert.equal(p.changed,false);assert.equal(p.after,before);
 const changed={...args,roles:{...args.roles,BODY:{...args.roles.BODY,appearance:{id:'new',name:'New',color:'#000000'}}}};
 await assert.rejects(prepareManufacturingInWorker('publication',{action:'enclosure',before,args:changed}),{code:'RESOURCE_LIMIT'});
 const small=readManufacturingWorkerPreparation(await prepareManufacturingInWorker('publication',{action:'enclosure',before:null,args}));assert.equal(small.changed,true);
 await t.drain();assert.equal(t.usage.created,3);assert.equal(t.usage.terminated,3);assert.deepEqual(t.usage.errors,[]);
 parentPort.postMessage({scope:'synthetic legacy metadata; actual preparation Worker',materialCount:10000,payloadUTF16Charge:charge,noop:true,pairOverBudgetRefused:true,healthyRetry:true,workersCreated:t.usage.created,workersTerminated:t.usage.terminated});
}finally{await t.close();}
