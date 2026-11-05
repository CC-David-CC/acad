// Register a narrow CAD domain interface with the existing desktop registry.
// The supplied target owns the actual frame/editor and must stay current.
export function registerSketchCommands(host,getTarget){
 const registrations=[];
 const exact=(args,keys)=>{
  if(!args||typeof args!=='object'||Array.isArray(args)||Reflect.ownKeys(args).length!==keys.length||Reflect.ownKeys(args).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Invalid sketch command arguments.');
  for(const key of keys){const field=Object.getOwnPropertyDescriptor(args,key);if(!field?.enumerable||!Object.hasOwn(field,'value'))throw Error('Sketch command arguments must be data properties.');}
 };
 function target(actionName='Concentric'){
  const captured=getTarget(),session=host.session();
  const valid=()=>!host.signal.aborted&&host.session()===session&&captured.valid();
  if(!session||!valid()||!captured.context?.actions?.[actionName])throw Error('An active authorized sketch is required.');
  return {context:captured.context,action:captured.context.actions[actionName],options:{valid,signal:host.signal},valid};
 }
 const register=(descriptor,handler)=>registrations.push(host.commands.register(descriptor,handler));
 try{
  register({id:'sketch-diameter-targets',description:'Inspect circles and arcs for driving diameter; returns IDs and a single-use revision.',parameters:{type:'object',additionalProperties:false}},async args=>{
   exact(args,[]);const t=target('DiameterLength');
   if(typeof t.action.inspect!=='function')throw Error('Diameter inspection is unavailable.');
   const result=await t.action.inspect(t.context,t.options);
   if(!t.valid())throw Error('The sketch window or account changed.');return result;
  });
  register({id:'sketch-diameter',description:'Set a driving diameter through the shared sketch operation. Requires objectId and revision from sketch-diameter-targets. The edit is unsaved until Save.',parameters:{type:'object',additionalProperties:false,required:['objectId','diameter','revision'],properties:{objectId:{type:'string',minLength:1,maxLength:256},diameter:{type:'number',exclusiveMinimum:0,maximum:1000000},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['objectId','diameter','revision']);const {objectId,diameter,revision}=args;
   if(typeof objectId!=='string'||!objectId||objectId.length>256||typeof revision!=='string'||!revision||revision.length>128||typeof diameter!=='number'||!Number.isFinite(diameter)||diameter<=0||diameter>1e6)throw Error('Provide one object ID, a positive bounded diameter, and the inspected revision.');
   const t=target('DiameterLength');if(typeof t.action.invokeById!=='function')throw Error('The diameter operation is unavailable.');
   const result=await t.action.invokeById(t.context,objectId,diameter,revision,t.options);
   if(!t.valid())throw Error('The sketch window or account changed; inspect it before continuing.');return result;
  });
  register({id:'sketch-circular-objects',description:'Inspect circles/arcs and concentric relationships in the active sketch; returns stable IDs and a single-use revision.',parameters:{type:'object',additionalProperties:false}},async args=>{
   exact(args,[]);const t=target();
   if(typeof t.action.inspect!=='function')throw Error('Sketch inspection is unavailable.');
   const result=await t.action.inspect(t.context,t.options);
   if(!t.valid())throw Error('The sketch window or account changed.');
   return result;
  });
  register({id:'sketch-concentric',description:'Keep exactly two circles/arcs concentric through the same operation as the UI. Requires IDs and revision from sketch-circular-objects.',parameters:{type:'object',required:['ids','revision'],additionalProperties:false,properties:{ids:{type:'array',minItems:2,maxItems:2,items:{type:'string',minLength:1,maxLength:256}},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['ids','revision']);
   if(!Array.isArray(args.ids)||args.ids.length!==2||args.ids.some(id=>typeof id!=='string'||!id||id.length>256)||args.ids[0]===args.ids[1]||typeof args.revision!=='string'||!args.revision||args.revision.length>128)throw Error('Provide two distinct object IDs and the inspected revision.');
   const t=target();if(typeof t.action.invokeByIds!=='function')throw Error('The concentric operation is unavailable.');
   const result=await t.action.invokeByIds(t.context,args.ids,args.revision,t.options);
   if(!t.valid())throw Error('The sketch window or account changed; inspect it before continuing.');
   return result;
  });
 }catch(error){for(const unregister of registrations.reverse())unregister();throw error;}
 return ()=>{for(const unregister of registrations.splice(0).reverse())unregister();};
}
