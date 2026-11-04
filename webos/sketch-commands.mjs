// Register a narrow CAD domain interface with the existing desktop registry.
// The supplied target owns the actual frame/editor and must stay current.
export function registerSketchCommands(host,getTarget){
 const registrations=[];
 const exact=(args,keys)=>{
  if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).sort().join(',')!==[...keys].sort().join(','))throw Error('Invalid sketch command arguments.');
 };
 function target(){
  const captured=getTarget(),session=host.session();
  const valid=()=>!host.signal.aborted&&host.session()===session&&captured.valid();
  if(!session||!valid()||!captured.context?.actions?.Concentric)throw Error('An active authorized sketch is required.');
  return {context:captured.context,action:captured.context.actions.Concentric,options:{valid,signal:host.signal},valid};
 }
 const register=(descriptor,handler)=>registrations.push(host.commands.register(descriptor,handler));
 try{
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
