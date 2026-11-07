import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD as v2,OCC_POLYGON_PROFILE_BUILD as v3,OCC_MECHANICAL_PROFILE_BUILD as mechanical} from '../../modules/engine/mount/engineCatalog.mjs';
import {genericHistoryBuild,selectSelectedProfileHistoryBuild,requireSelectedProfileBuild,selectedProfileVersion} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from '../../modules/engine/mount/selectedProfileBudget.mjs';
import {hasOnlyUnconsumedSketchHistory} from '../../web/app/cad/craft/unconsumedSketchSave.mjs';
import {selectSolidContinuationBuild} from '../../modules/engine/solid/solidOperandRuntime.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';

const entry=(build,type='WORKER_SELECTED_PROFILE_EXTRUDE_V2',featureId=2)=>({type,params:{version:1,unit:'millimeter',engine:build.id,engineRevision:build.revision,featureId,faceId:'1/SURFACE',regionId:'sketch-region:["authored"]',depth:5,bodyPolicy:'separate'}});
const output=(build,empty=false)=>({outputId:'native',engine:build.id,resultKind:empty?'empty':'solid',metrics:{runtime:{...build.runtimeAssets,mountEngine:build.mountEngine,representation:build.representation}}});
test('new profile intent selects mechanical V3; every recorded profile build retains its identity',()=>{
 assert.equal(genericHistoryBuild([]),null);assert.equal(selectSelectedProfileHistoryBuild([]),mechanical);
 for(const build of [v2,v3,mechanical]){assert.equal(genericHistoryBuild([entry(build)]),build);assert.equal(selectSelectedProfileHistoryBuild([entry(build)]),build);assert.equal(requireSelectedProfileBuild(build.id,build.revision),build);}
 assert.equal(selectedProfileVersion(v2),2);assert.equal(selectedProfileVersion(v3),3);assert.equal(selectedProfileVersion(CAD_ENGINES.occ),null);assert.equal(selectedProfileVersion({...v3}),null);
});
test('consumed/empty results retain their history and runtime backend without fallback',()=>{
 for(const build of [v2,v3,mechanical])for(const empty of [false,true]){const h=[entry(build,'WORKER_SOLID_BOX_V1'),entry(build,'WORKER_SOLID_BOOLEAN_V1',3)];assert.equal(genericHistoryBuild(h),build);assert.equal(selectSelectedProfileHistoryBuild(h),build);assert.equal(selectSolidContinuationBuild([output(build,empty)],'occ',CAD_ENGINES.occ.revision),build);}
});
test('mixed history, old box backend, unavailable revisions and sparse/accessor identities refuse',()=>{
 assert.throws(()=>selectSelectedProfileHistoryBuild([entry(v2),entry(v3)]),{code:'ENGINE_REVISION_MISMATCH'});
 assert.throws(()=>selectSelectedProfileHistoryBuild([entry(CAD_ENGINES.occ,'WORKER_SOLID_BOX_V1')]),{code:'UNSUPPORTED_PROFILE_BUILD'});
 assert.throws(()=>requireSelectedProfileBuild('occ','sha256:'+'0'.repeat(64)+':'+'0'.repeat(64)),{code:'ENGINE_REVISION_MISMATCH'});
 assert.throws(()=>genericHistoryBuild([,entry(v3)]),{code:'INVALID_REQUEST'});
 let reads=0;const bad={};Object.defineProperty(bad,'type',{enumerable:true,get(){reads++;throw Error('read');}});assert.throws(()=>genericHistoryBuild([bad]),{code:'INVALID_REQUEST'});assert.equal(reads,0);
});
test('V2 and V3 count all generic native results and refuse result33 before append',()=>{
 for(const build of [v2,v3,mechanical])for(const count of [0,1,31,32,33]){const history=Array.from({length:count},(_,i)=>entry(build,i%3===0?'WORKER_SELECTED_PROFILE_EXTRUDE_V2':i%3===1?'WORKER_SOLID_BOX_V1':'WORKER_SOLID_BOOLEAN_V1',i+1)),budget=selectedProfileHistoryBudget(history,build.revision);assert.equal(budget.plannedNativeResults,count);assert.equal(budget.canAppend,count<32);assert.equal(budget.remainingNativeResults,Math.max(0,32-count));}
});
test('unrelated fast Save accepts only exact registered selected V2/V3 ancestry',()=>{
 const plane={type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}};
 for(const build of [v2,v3,mechanical]){const h=[plane,entry(build)];assert.equal(hasOnlyUnconsumedSketchHistory(h,'other/SURFACE'),true);assert.equal(hasOnlyUnconsumedSketchHistory(h,'1/SURFACE'),false);const box={type:'WORKER_SOLID_BOX_V1',params:{version:1,unit:'millimeter',engine:'occ',engineRevision:build.revision,featureId:3,x:0,y:0,z:0,width:1,depth:1,height:1}},boolean={type:'WORKER_SOLID_BOOLEAN_V1',params:{version:1,unit:'millimeter',engine:'occ',engineRevision:build.revision,featureId:4,kind:'union',a:solidBodyId(2),b:solidBodyId(3)}};assert.equal(hasOnlyUnconsumedSketchHistory([...h,box,boolean],'other/SURFACE'),true);assert.equal(hasOnlyUnconsumedSketchHistory([...h,box,boolean],'1/SURFACE'),false);const wrong=structuredClone(box);wrong.params.engineRevision=(build===v2?v3:v2).revision;assert.equal(hasOnlyUnconsumedSketchHistory([...h,wrong],'other/SURFACE'),false);}
 assert.equal(hasOnlyUnconsumedSketchHistory([plane,entry(CAD_ENGINES.occ)],'other/SURFACE'),false);
});

test('edge treatment preserves parent source dependencies and consumed result ownership',()=>{
 const base=entry(mechanical),edge={type:'WORKER_SOLID_EDGE_TREATMENT_V1',params:{version:1,unit:'millimeter',engine:'occ',engineRevision:mechanical.revision,featureId:3,target:solidBodyId(2),producerFeatureId:2,kind:'fillet',edgeIds:['source-edge'],size:3}},history=[base,edge];
 assert.equal(genericHistoryBuild(history),mechanical);assert.equal(selectedProfileHistoryBudget(history,mechanical.revision).plannedNativeResults,2);assert.equal(hasOnlyUnconsumedSketchHistory(history,'other/SURFACE'),true);assert.equal(hasOnlyUnconsumedSketchHistory(history,'1/SURFACE'),false);
 const repeated=structuredClone(edge);repeated.params.featureId=4;assert.equal(hasOnlyUnconsumedSketchHistory([...history,repeated],'other/SURFACE'),false);
 const wrong=structuredClone(edge);wrong.params.engineRevision=v3.revision;assert.equal(hasOnlyUnconsumedSketchHistory([base,wrong],'other/SURFACE'),false);
});
