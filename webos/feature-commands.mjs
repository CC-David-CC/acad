import {settleScopedCommand} from './scoped-command.mjs';
// The desktop exposes the same validated craft operations used by CAD history.
// No native handles, raw history writes, or implicit saves cross this boundary.
export function registerFeatureCommands(host,getTarget){
 const stops=[];
 const exact=(args,keys)=>{
  if(!args||typeof args!=='object'||Array.isArray(args)||Reflect.ownKeys(args).length!==keys.length||Reflect.ownKeys(args).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Invalid feature command arguments.');
  for(const key of keys){const field=Object.getOwnPropertyDescriptor(args,key);if(!field?.enumerable||!Object.hasOwn(field,'value'))throw Error('Invalid feature command arguments.');}
 };
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>!!session&&!host.signal.aborted&&host.session()===session&&captured.valid();
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('This feature command is unavailable in this modeling window.');
  return {craft:captured.craft,valid};
 }
 const id=maxLength=>({type:'string',minLength:1,maxLength});
 const dimension={type:'number',exclusiveMinimum:0,maximum:1000000};
 try{
  const enclosureFields=['width','length','height','wall','clearance','lidThickness','lipDepth'],labelFields=['labelWidth','labelLength','labelDepth'],enclosureDimension={type:'number',exclusiveMinimum:0,maximum:100000};
  stops.push(host.commands.register({id:'create-worker-enclosure',description:'Create an inspected OCC enclosure body and separate lid; version 2 includes a recessed label. Save separately to keep it.',parameters:{type:'object',additionalProperties:false,required:['revision','version','unit',...enclosureFields],properties:{revision:id(256),version:{type:'integer',enum:[1,2]},unit:{enum:['millimeter']},...Object.fromEntries([...enclosureFields,...labelFields].map(k=>[k,enclosureDimension]))}}},async args=>{const d=Object.getOwnPropertyDescriptor(args||{},'version');if(!d?.enumerable||!Object.hasOwn(d,'value')||![1,2].includes(d.value))throw Error('Invalid enclosure command.');const keys=['revision','version','unit',...enclosureFields,...(d.value===2?labelFields:[])];exact(args,keys);const copy={};for(const k of keys)copy[k]=Object.getOwnPropertyDescriptor(args,k).value;if(typeof copy.revision!=='string'||!copy.revision||copy.revision.length>256||copy.unit!=='millimeter'||[...enclosureFields,...(d.value===2?labelFields:[])].some(k=>typeof copy[k]!=='number'||!Number.isFinite(copy[k])||copy[k]<=0||copy[k]>100000))throw Error('Invalid enclosure command.');const t=target('createWorkerEnclosure');return await settleScopedCommand(t.craft.createWorkerEnclosure(Object.freeze(copy),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});}));
  stops.push(host.commands.register({id:'inspect-worker-features',description:'Discover supported worker extrusion, centered-hole and four-corner candidates and the current revision; execution validates geometry.',parameters:{type:'object',additionalProperties:false}},args=>{
   exact(args,[]);const t=target('inspectWorkerFeatureCommands'),result=t.craft.inspectWorkerFeatureCommands();
   if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'inspect-published-worker-geometry',description:'Inspect bounded published OCC plate IDs, bounds and analytic hole measurements.',parameters:{type:'object',additionalProperties:false}},args=>{
   exact(args,[]);const t=target('inspectPublishedWorkerGeometry'),result=t.craft.inspectPublishedWorkerGeometry();
   if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'inspect-worker-history',description:'Inspect authored worker extrusion IDs, dimensions, current history position and revision.',parameters:{type:'object',additionalProperties:false}},args=>{
   exact(args,[]);const t=target('inspectWorkerHistory'),result=t.craft.inspectWorkerHistory();
   if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  for(const [command,method,repair,description] of [
   ['begin-worker-centered-hole-parent-repair','beginWorkerCenteredParentRepair',false,'Prepare an inspected hole-parent repair view and return eligible semantic parent IDs. This changes the feature cursor; it does not commit a reference or save.'],
   ['repair-worker-centered-hole-parent','repairWorkerCenteredHoleParent',true,'Commit one explicit eligible parent choice through the shared checked suffix replay. Preserve the hole identity and diameter; Save separately.']
  ]){
   const keys=['revision','index','featureId',...(repair?['faceId']:[])],properties={revision:id(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1},...(repair?{faceId:id(1024)}:{})};
   stops.push(host.commands.register({id:command,description,parameters:{type:'object',additionalProperties:false,required:keys,properties}},async args=>{
    exact(args,keys);const copy=Object.fromEntries(keys.map(k=>[k,Object.getOwnPropertyDescriptor(args,k).value]));
    if(typeof copy.revision!=='string'||!copy.revision||copy.revision.length>256||!Number.isSafeInteger(copy.index)||copy.index<0||copy.index>255||!Number.isSafeInteger(copy.featureId)||copy.featureId<1||(repair&&(typeof copy.faceId!=='string'||!copy.faceId||copy.faceId.length>1024)))throw Error('Provide a current inspected repair target.');
    const t=target(method);return settleScopedCommand(t.craft[method](Object.freeze(copy),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
   }));
  }
  stops.push(host.commands.register({id:'inspect-authored-edits',description:'Inspect supported authored edits and qualified feature-creation transactions, including current Undo/Redo targets and revision.',parameters:{type:'object',additionalProperties:false}},args=>{
   exact(args,[]);const t=target('inspectAuthoredEdits'),result=t.craft.inspectAuthoredEdits();
   if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'travel-authored-edit',description:'Undo or redo the inspected supported authored transaction. Creation coverage is explicitly reported by its target kind.',parameters:{type:'object',additionalProperties:false,required:['revision','direction'],properties:{revision:id(256),direction:{type:'string',enum:['undo','redo']}}}},async args=>{
   exact(args,['revision','direction']);if(typeof args.revision!=='string'||!args.revision||!['undo','redo'].includes(args.direction))throw Error('Invalid authored history command.');
   const t=target('authoredEditTravel');return await settleScopedCommand(t.craft.authoredEditTravel(args,{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  stops.push(host.commands.register({id:'edit-worker-extrusion',description:'Edit an inspected worker extrusion using its feature ID and current revision.',parameters:{type:'object',additionalProperties:false,required:['revision','index','featureId','depth'],properties:{revision:id(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1},depth:dimension}}},async args=>{
   exact(args,['revision','index','featureId','depth']);const t=target('editWorkerExtrusion');return await settleScopedCommand(t.craft.editWorkerExtrusion(args,{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  for(const [command,method,dimensions] of [['edit-worker-centered-hole','editWorkerCenteredHole',['diameter']],['edit-worker-four-corner-holes','editWorkerFourCornerHoles',['diameter','offsetX','offsetY']]]){
   const keys=['revision','index','featureId',...dimensions],properties={revision:id(256),index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1}};
   for(const key of dimensions)properties[key]=dimension;
   stops.push(host.commands.register({id:command,description:'Edit an inspected worker hole feature using its feature ID and current revision.',parameters:{type:'object',additionalProperties:false,required:keys,properties}},async args=>{exact(args,keys);const t=target(method);return await settleScopedCommand(t.craft[method](args,{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});}));
  }
  for(const [command,method,keys,properties,description] of [
   ['create-worker-extrusion','createWorkerExtrusion',['revision','faceId','regionId','depth'],{revision:id(256),faceId:id(1024),regionId:id(8192),depth:dimension},'Extrude an inspected supported region in millimeters. The result is unsaved until Save.'],
   ['create-worker-centered-hole','createWorkerCenteredHole',['revision','bodyId','lidFaceId','diameter'],{revision:id(256),bodyId:id(1024),lidFaceId:id(1024),diameter:dimension},'Create a centered through-hole in an inspected supported OCC body in millimeters. The result is unsaved until Save.'],
   ['create-worker-four-corner-holes','createWorkerFourCornerHoles',['revision','bodyId','centerWallId','sideIds','diameter','offsetX','offsetY'],{revision:id(256),bodyId:id(1024),centerWallId:id(1024),sideIds:{type:'object',additionalProperties:false,required:['minX','maxX','minY','maxY'],properties:{minX:id(1024),maxX:id(1024),minY:id(1024),maxY:id(1024)}},diameter:dimension,offsetX:dimension,offsetY:dimension},'Create four edge-offset through-holes on an inspected supported OCC plate. The result is unsaved until Save.']
  ])stops.push(host.commands.register({id:command,description,parameters:{type:'object',required:keys,additionalProperties:false,properties}},async args=>{
   exact(args,keys);
   if(method==='createWorkerFourCornerHoles') {
    const descriptor=Object.getOwnPropertyDescriptor(args,'sideIds');
    if(!descriptor?.enumerable||!Object.hasOwn(descriptor,'value'))throw Error('Invalid feature command arguments.');
    const sides=descriptor.value;exact(sides,['minX','maxX','minY','maxY']);
    for(const key of ['minX','maxX','minY','maxY']){const d=Object.getOwnPropertyDescriptor(sides,key);if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>1024)throw Error('Invalid feature command arguments.');}
   }
   const t=target(method);return await settleScopedCommand(t.craft[method](args,{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
