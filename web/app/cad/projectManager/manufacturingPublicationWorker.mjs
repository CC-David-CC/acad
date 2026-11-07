import {captureLinkedPartDrawingDefinition} from '../../../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {prepareLinkedPartDrawingOperation} from '../../../../modules/drawing/linkedPartDrawingOperation.mjs';
import {assignEnclosureMaterials} from './enclosureMaterialAssignment.mjs';
import {prepareGenericManufacturingMetadata} from './genericManufacturingAssignment.mjs';
import {proposeManufacturingRebind} from './manufacturingMetadata.mjs';
import {captureManufacturingJournalPayload,prepareManufacturingJournalRecord,equalManufacturingJournalPayloads,verifyManufacturingJournalTravel,verifyDocumentMetadataJournalTravel} from '../craft/authoredEditJournal.mjs';
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))fail('Expected plain manufacturing job data.');
 const actual=Reflect.ownKeys(value);if(actual.length!==keys.length||actual.some(k=>typeof k!=='string'||!keys.includes(k)))fail('Unexpected manufacturing job fields.');
 const r={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Expected own manufacturing job data.');r[key]=d.value;}return r;
}
let used=false;
self.addEventListener('message',event=>{
 let id=null;
 try{
  const r=fields(event.data,['kind','version','id','action','before','args']);id=r.id;
  if(used||r.kind!=='prepare-manufacturing'||r.version!==1||!Number.isSafeInteger(id)||id<1)fail('Invalid or repeated manufacturing job.');used=true;
  const drawing=r.action==='drawing'||r.action==='drawing-travel',travel=r.action==='travel'||r.action==='drawing-travel';
  r.before=drawing?(r.before===null?null:captureLinkedPartDrawingDefinition(r.before)):captureManufacturingJournalPayload(r.before);
  let after,record=null,changed;
  if(r.action==='drawing'){
   const a=fields(r.args,['request','revision','geometryRevision']);
   const proposal=prepareLinkedPartDrawingOperation({request:a.request,current:{revision:a.revision,geometryRevision:a.geometryRevision,drawing:r.before}});
   after=proposal.after;record=proposal.journalRecord;changed=proposal.changed;
  }else if(r.action==='drawing-travel'){
   const a=fields(r.args,['entry','direction']);record=verifyDocumentMetadataJournalTravel(a.entry,a.direction,r.before);
   if(record.domain!=='linked-part-drawing')fail('Expected drawing history.');after=a.direction==='undo'?record.before:record.after;changed=true;
  }else if(r.action==='enclosure'){
   const a=fields(r.args,['geometryRevision','featureId','history','bodies','roles']);
   after=assignEnclosureMaterials({metadata:r.before,revision:a.geometryRevision,featureId:a.featureId,history:a.history,bodies:a.bodies,roles:a.roles});
  }else if(r.action==='generic'){
   const a=fields(r.args,['geometryRevision','request','targets']);after=prepareGenericManufacturingMetadata({request:a.request,metadata:r.before,geometryRevision:a.geometryRevision,targets:a.targets}).metadata;
  }else if(r.action==='rebind'){
   const a=fields(r.args,['geometryRevision','history','bodies']);proposeManufacturingRebind(r.before,a.history,a.bodies,a.geometryRevision);after={...r.before,revision:a.geometryRevision};
  }else if(r.action==='travel'){
   const a=fields(r.args,['entry','direction']);record=verifyManufacturingJournalTravel(a.entry,a.direction,r.before);after=a.direction==='undo'?record.before:record.after;changed=true;
  }else fail('Unknown manufacturing action.');
  if(!drawing&&!travel){
   changed=!equalManufacturingJournalPayloads(r.before,after);
   if(changed){record=prepareManufacturingJournalRecord(r.before,after);after=record.after;}
  }
  const summary=drawing?{drawingId:(after||r.before).drawingId,viewCount:after?.views.length||0,dimensionCount:after?.dimensions.length||0,quality:'authored-definition-only'}:{partCount:after?.objects.length||0,regionCount:after?.objects.reduce((n,o)=>n+o.regions.length,0)||0,bindingCount:after?.bindings.length||0,details:[],warning:''};
  if(r.action==='rebind'){
   if(summary.regionCount>10)fail('Review of more than10 regions is not available.','RESOURCE_LIMIT');
   const materials=new Map(after.materials.map(m=>[m.id,m.name])),appearances=new Map(after.appearances.map(m=>[m.id,m.name]));
   summary.details=after.objects.flatMap(o=>o.regions.map(region=>`${o.name} / ${region.id}: ${materials.get(region.materialId)||'No material'}, ${appearances.get(region.appearanceId)||'No appearance'}`));summary.warning='Review every material assignment after changing the model.';
  }
  self.postMessage({kind:'manufacturing-prepared',version:1,id,action:r.action,changed,byteSize:changed?record.byteSize:0,after:changed&&!travel?after:null,summary});
 }catch(error){
  const known=['INVALID_REQUEST','RESOURCE_LIMIT','UNSUPPORTED_METADATA','STALE_ASSIGNMENTS','IDENTITY_CONFLICT','UNSUPPORTED_GROUP','UNSUPPORTED_TARGET','UNKNOWN_MATERIAL','AMBIGUOUS_BINDING','ALIAS_COLLISION','STALE_DOCUMENT','DRAWING_ALREADY_EXISTS','DRAWING_NOT_FOUND'];
  const code=known.includes(error?.code)?error.code:'METADATA_PREPARATION_FAILED';
  self.postMessage({kind:'manufacturing-refused',version:1,id,code,message:String(error?.message||'Manufacturing preparation failed.').slice(0,1024)});
 }
});
