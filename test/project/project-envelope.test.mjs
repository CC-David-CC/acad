import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodeProjectEnvelope,decodeProjectEnvelope,validateProjectTree} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
const project=()=>({model:{history:[],expressions:''},sketches:[]});
test('revision 2 roundtrips without legacy top-level fields',()=>{
 const envelope=encodeProjectEnvelope(project());assert.equal(envelope.format,'codi-jsketcher-project');assert.equal(envelope.version,2);assert.equal(envelope.unit,'millimeter');
 assert.equal(Object.hasOwn(envelope,'model'),false);assert.equal(Object.hasOwn(envelope,'sketches'),false);
 assert.deepEqual(decodeProjectEnvelope(envelope),{project:project(),manufacturing:null});
});
test('rejects legacy, unknown revisions, invalid metadata and extra envelope fields',()=>{
 for(const value of [project(),{format:'codi-jsketcher-project',version:1,project:project()}, {format:'codi-jsketcher-project',version:1,unit:'inch',project:project()},{format:'codi-jsketcher-project',version:1,unit:'millimeter',project:project()}, {format:'codi-jsketcher-project',version:3,unit:'millimeter',project:project()},
 {format:'codi-jsketcher-manufacturing',version:1,project:project(),manufacturing:{}},
 {format:'codi-jsketcher-project',version:2,unit:'millimeter',project:project(),extra:1},
 {format:'codi-jsketcher-project',version:2,unit:'millimeter',project:project(),manufacturing:null}]) assert.throws(()=>decodeProjectEnvelope(value));
});
test('rejects unknown model and project fields rather than silently losing them',()=>{
 const extraModel=encodeProjectEnvelope(project());extraModel.project.model.padding='x';assert.throws(()=>decodeProjectEnvelope(extraModel),/structure/);
 const extraProject=encodeProjectEnvelope(project());extraProject.project.unknown={};assert.throws(()=>decodeProjectEnvelope(extraProject),/structure/);
});
test('rejects non-finite numeric values from valid JSON exponent syntax',()=>{
 const envelope=encodeProjectEnvelope(project());envelope.project.model.history.push({type:'BOX',params:{width:'OVERFLOW'}});
 const parsed=JSON.parse(JSON.stringify(envelope).replace('"OVERFLOW"','1e309'));
 assert.throws(()=>validateProjectTree(parsed),/non-finite/);
});
test('manufacturing metadata stays in canonical envelope and is validated',()=>{
 const metadata={version:1,unit:'millimeter',revision:'r1',materials:[{id:'p',name:'PLA'}],appearances:[{id:'red',name:'Red',color:'#ff0000'}],bindings:[{id:'body',featureId:1,operationType:'BOX'}],objects:[{id:'part',name:'Part',regions:[{id:'region',bodyId:'body',materialId:'p',appearanceId:'red',transform:[1,0,0,0,1,0,0,0,1,0,0,0]}]}]};
 const envelope=encodeProjectEnvelope(project(),metadata);assert.deepEqual(decodeProjectEnvelope(envelope),{project:project(),manufacturing:metadata});
 const inch=structuredClone(metadata);inch.unit='inch';assert.throws(()=>encodeProjectEnvelope(project(),inch),/unit/);
 const altered=encodeProjectEnvelope(project(),metadata);altered.manufacturing.unit='inch';assert.throws(()=>decodeProjectEnvelope(altered),/unit/);
 envelope.manufacturing.objects[0].regions[0].materialId='missing';assert.throws(()=>decodeProjectEnvelope(envelope));
});
