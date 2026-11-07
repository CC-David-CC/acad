import {createWorkerSolidOperation} from '../../modules/workbenches/modeler/features/workerSolid/workerSolid.operation';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
export async function exerciseDescriptor(){
 const signal=new AbortController(),owner=createEvaluationResourcePool().begin({signal:signal.signal,valid:()=>true});let validated=0,closed=0,dispatched=0;
 const revision='sha256:'+ 'a'.repeat(64)+':'+ 'b'.repeat(64);
 const mount={descriptor:{engine:'mock',representation:'mock',runtimeAssets:{jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)}},ready:Promise.resolve(),async execute(req:any){dispatched++;return {contractVersion:1,op:req.op,handle:{id:1},evidence:{}}},async readSolidMesh(req:any){return {contractVersion:1,op:req.op,unit:'millimeter',quality:'display-only',triangleCount:1,evidence:{volume:1,bounds:{min:[0,0,0],max:[1,1,1]}},buffer:new Float64Array([0,0,0,1,0,0,0,1,0]).buffer}},assertSolidBinding(){},close(){closed++}};
 const op=createWorkerSolidOperation('box',()=>mount,()=>{validated++});const stream=(value:any)=>({value,revision:0}),project={hasHostLifetime:true,documentGeneration:1,isDocumentCurrent:()=>true},craft={evaluationEpoch:1,modifications$:stream({history:[],pointer:-1})},expressions={script$:stream(''),list$:stream([]),errors$:stream([])},registry={find:()=>null},storage={revision:0},manager={unit:'millimeter'};
 const ctx:any={engineEvaluation:owner,projectService:project,craftService:craft,expressionService:expressions,cadRegistry:registry,storageService:storage,projectManager:manager};
 const raw={version:1,unit:'millimeter',engine:'smlib',engineRevision:revision,featureId:1,x:0,y:0,z:0,width:1,depth:1,height:1};
 try{const output:any=await op.run(raw,ctx,raw);owner.requireCurrent();return {validated,dispatched,id:output.created[0].id,engine:output.created[0].ext.workerGeometry.engine};}finally{owner.close();}
}
