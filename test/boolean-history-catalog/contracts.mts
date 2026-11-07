import type {BooleanSolid,BooleanHistorySolid,SolidRequest,TransientShapeHandle,ReadSolidSelections,PrismSelectionsResult,SolidSelectionsResult,SelectionPlanV2,SelectionDeletionEvidence,SolidResultFacts,SolidKernel} from '../../modules/engine/solid/SolidKernel.js';
declare const handle:TransientShapeHandle;
const operands={op:'solid.boolean.subtract',version:1,unit:'millimeter',a:handle,b:handle} as const;
const legacy:BooleanSolid=operands;
const modern:BooleanHistorySolid={...operands,featureId:30,producerAFeatureId:10,producerBFeatureId:20};
const oldRequest:SolidRequest=legacy,newRequest:SolidRequest=modern;
// @ts-expect-error incomplete modern producer binding must not fall into legacy
const partial:SolidRequest={...operands,featureId:30,producerAFeatureId:10};
// @ts-expect-error modern protocol is not a legacy request
const mislabeled:BooleanSolid=modern;
// @ts-expect-error all modern producer fields are mandatory
const missing:BooleanHistorySolid=operands;
// @ts-expect-error producer identities are numeric
const wrong:BooleanHistorySolid={...modern,producerBFeatureId:'20'};
const read:ReadSolidSelections={op:'solid.selections.read',version:1,handle,featureId:30};
const commonRead:SolidRequest=read;
const plan:SelectionPlanV2={version:2,featureId:30,scope:'authored-source',source:'kernel-operation-history',sourceContexts:[{kind:'sketch-profile',featureId:10,regionId:'actual-region'}],vertices:[],edges:[{id:'opaque',role:'connector',geometry:'line',originFeatureId:10,incidentCurveIds:['a','b']}],faces:[],unresolved:[{kind:'edge',id:'lost',reason:'NO_DESCENDANT',candidateCount:0,reportedDeleted:[{input:0,reportedDeleted:false},{input:1,reportedDeleted:true}],featureId:29,originFeatureId:10},{kind:'vertex',count:8,reason:'UNCLAIMED_KERNEL_ENTITY'}]};
const result:SolidSelectionsResult={contractVersion:1,op:'solid.selections.read',unit:'millimeter',selection:{status:'available',plan}};
const unavailable:SolidSelectionsResult={contractVersion:1,op:'solid.selections.read',unit:'millimeter',selection:{status:'unavailable',reason:'BOOLEAN_HISTORY_RESOURCE_LIMIT'}};
const oldEvidence:SelectionDeletionEvidence=true,oneInput:SelectionDeletionEvidence=[{input:1,reportedDeleted:false}];
// @ts-expect-error no invented native input slots
const badEvidence:SelectionDeletionEvidence=[{input:2,reportedDeleted:false}];
// @ts-expect-error no top regionId on a multi-source plan
plan.regionId;
// @ts-expect-error contexts and descriptors are readonly
plan.sourceContexts[0].regionId='changed';
// @ts-expect-error origin feature required for every resolved descriptor
const missingOrigin:SelectionPlanV2['edges']=[{id:'x',role:'connector',geometry:'line'}];
// @ts-expect-error common read cannot claim old prism transport op
const oldOp:ReadSolidSelections={...read,op:'solid.prism.selections.read'};
const emptyFacts:SolidResultFacts={nativeVolume:0,nativeBounds:null,resultKind:'empty',solidCount:0};
declare const prism:PrismSelectionsResult;
if(prism.selection.status==='available'){const oldVersion:1=prism.selection.plan.version;const oldRegion:string=prism.selection.plan.regionId;void[oldVersion,oldRegion];}
if(result.selection.status==='available'){const newVersion:2=result.selection.plan.version;void newVersion;}
declare const kernel:SolidKernel;
kernel.execute(modern);kernel.execute(read);kernel.execute(legacy);
void[oldRequest,newRequest,partial,mislabeled,missing,wrong,commonRead,result,unavailable,oldEvidence,oneInput,badEvidence,missingOrigin,oldOp,emptyFacts];
