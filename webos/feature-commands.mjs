// The desktop exposes the same validated craft operations used by CAD history.
// No native handles, raw history writes, or implicit saves cross this boundary.
export function registerFeatureCommands(host,getTarget){
 const stops=[];
 const exact=(args,keys)=>{
  if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).sort().join(',')!==keys.slice().sort().join(','))throw Error('Invalid feature command arguments.');
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
  stops.push(host.commands.register({id:'inspect-worker-features',description:'Discover supported worker extrusion, centered-hole and four-corner candidates and the current revision; execution validates geometry.',parameters:{type:'object',additionalProperties:false}},args=>{
   exact(args,[]);const t=target('inspectWorkerFeatureCommands'),result=t.craft.inspectWorkerFeatureCommands();
   if(!t.valid())throw Error('The window or account changed.');return result;
  }));
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
   const t=target(method);return await t.craft[method](args,{signal:host.signal,valid:t.valid});
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
