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
 const id={type:'string',minLength:1,maxLength:256};
 try{
  stops.push(host.commands.register({id:'inspect-worker-features',description:'Discover supported worker extrusion and centered-hole candidates and the current revision; execution validates geometry.',parameters:{type:'object',additionalProperties:false}},args=>{
   exact(args,[]);const t=target('inspectWorkerFeatureCommands'),result=t.craft.inspectWorkerFeatureCommands();
   if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  for(const [command,method,keys,properties,description] of [
   ['create-worker-extrusion','createWorkerExtrusion',['revision','faceId','regionId','depth'],{revision:id,faceId:id,regionId:id,depth:{type:'number'}},'Extrude an inspected supported region in millimeters. The result is unsaved until Save.'],
   ['create-worker-centered-hole','createWorkerCenteredHole',['revision','bodyId','lidFaceId','diameter'],{revision:id,bodyId:id,lidFaceId:id,diameter:{type:'number',exclusiveMinimum:0}},'Create a centered through-hole in an inspected supported OCC body in millimeters. The result is unsaved until Save.']
  ])stops.push(host.commands.register({id:command,description,parameters:{type:'object',required:keys,additionalProperties:false,properties}},async args=>{
   exact(args,keys);const t=target(method);return await t.craft[method](args,{signal:host.signal,valid:t.valid});
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
