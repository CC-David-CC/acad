import {settleScopedCommand} from './scoped-command.mjs';
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
 const signedAction=axis=>axis==='x'?'SignedDistanceX':axis==='y'?'SignedDistanceY':axis==='projected'?'ProjectedDistance':null;
 const lineAction=kind=>kind==='collinear'?'Collinear':kind==='axis-symmetry'?'AxisSymmetry':null;
 try{
  register({id:'sketch-fix-entity-targets',description:'Inspect whole-entity fix targets: segments, circles and arcs.',parameters:{type:'object',additionalProperties:false}},async args=>{
   exact(args,[]);const t=target('FixEntity');if(typeof t.action.inspect!=='function')throw Error('Entity fix inspection is unavailable.');
   return settleScopedCommand(t.action.inspect(t.context,t.options),{signal:host.signal,valid:t.valid});
  });
  register({id:'sketch-fix-entity',description:'Fix the full physical geometry of one inspected segment, circle or arc. Save separately.',parameters:{type:'object',additionalProperties:false,required:['objectId','revision'],properties:{objectId:{type:'string',minLength:1,maxLength:256},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['objectId','revision']);const {objectId,revision}=args;if(typeof objectId!=='string'||!objectId||objectId.length>256||typeof revision!=='string'||!revision||revision.length>128)throw Error('Provide an inspected entity ID and revision.');
   const t=target('FixEntity');if(typeof t.action.invokeById!=='function')throw Error('Whole-entity fixing is unavailable.');
   return settleScopedCommand(t.action.invokeById(t.context,objectId,revision,t.options),{signal:host.signal,valid:t.valid});
  });
  register({id:'sketch-line-relation-targets',description:'Inspect current point/segment IDs for collinear supporting lines or symmetry about an independent line.',parameters:{type:'object',additionalProperties:false,required:['kind'],properties:{kind:{enum:['collinear','axis-symmetry']}}}},async args=>{
   exact(args,['kind']);const name=lineAction(args.kind);if(!name)throw Error('Choose collinear or axis-symmetry.');
   const t=target(name);if(typeof t.action.inspect!=='function')throw Error('Line relation inspection is unavailable.');
   return settleScopedCommand(t.action.inspect(t.context,t.options),{signal:host.signal,valid:t.valid});
  });
  register({id:'sketch-line-relation',description:'Relate two segments as collinear, or mirror two points about a third selected segment. The supporting line is infinite.',parameters:{type:'object',additionalProperties:false,required:['kind','ids','revision'],properties:{kind:{enum:['collinear','axis-symmetry']},ids:{type:'array',minItems:2,maxItems:3,items:{type:'string',minLength:1,maxLength:256}},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['kind','ids','revision']);const {kind,ids,revision}=args,name=lineAction(kind),count=kind==='collinear'?2:3;
   if(!name||!Array.isArray(ids)||ids.length!==count||Reflect.ownKeys(ids).length!==count+1||typeof revision!=='string'||!revision||revision.length>128)throw Error('Provide current line relation targets and inspected revision.');
   const copy=[];for(let i=0;i<count;i++){const d=Object.getOwnPropertyDescriptor(ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Sketch target IDs must be data properties.');copy.push(d.value);}
   if(copy[0]===copy[1])throw Error('Choose distinct relation targets.');
   const t=target(name);if(typeof t.action.invokeByIds!=='function')throw Error('Line relation editing is unavailable.');
   return settleScopedCommand(t.action.invokeByIds(t.context,Object.freeze(copy),revision,t.options),{signal:host.signal,valid:t.valid});
  });
  register({id:'sketch-signed-distance-targets',description:'Inspect points and direction segments for a driving signed X, Y or projected distance.',parameters:{type:'object',additionalProperties:false,required:['axis'],properties:{axis:{enum:['x','y','projected']}}}},async args=>{
   exact(args,['axis']);const name=signedAction(args.axis);if(!name)throw Error('Choose x, y or projected distance.');
   const t=target(name);if(typeof t.action.inspect!=='function')throw Error('Signed distance inspection is unavailable.');
   return settleScopedCommand(t.action.inspect(t.context,t.options),{signal:host.signal,valid:t.valid});
  });
  register({id:'sketch-signed-distance',description:'Drive signed first-to-second point displacement in millimeters. Projected distance also requires an oriented live segment as the third ID.',parameters:{type:'object',additionalProperties:false,required:['axis','ids','distance','revision'],properties:{axis:{enum:['x','y','projected']},ids:{type:'array',minItems:2,maxItems:3,items:{type:'string',minLength:1,maxLength:256}},distance:{type:'number',minimum:-1000000,maximum:1000000},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['axis','ids','distance','revision']);const {axis,ids,distance,revision}=args,name=signedAction(axis),count=axis==='projected'?3:2;
   if(!name||!Array.isArray(ids)||ids.length!==count||Reflect.ownKeys(ids).length!==count+1||typeof distance!=='number'||!Number.isFinite(distance)||Math.abs(distance)>1e6||typeof revision!=='string'||!revision||revision.length>128)throw Error('Provide signed distance targets, a finite bounded distance and inspected revision.');
   const copy=[];for(let i=0;i<count;i++){const d=Object.getOwnPropertyDescriptor(ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Sketch target IDs must be data properties.');copy.push(d.value);}
   if(copy[0]===copy[1])throw Error('Choose two distinct points.');
   const t=target(name);if(typeof t.action.invokeByIds!=='function')throw Error('Signed distance editing is unavailable.');
   return settleScopedCommand(t.action.invokeByIds(t.context,Object.freeze(copy),distance,revision,t.options),{signal:host.signal,valid:t.valid});
  });
  register({id:'sketch-diameter-targets',description:'Inspect circles and arcs for driving diameter; returns IDs and a single-use revision.',parameters:{type:'object',additionalProperties:false}},async args=>{
   exact(args,[]);const t=target('DiameterLength');
   if(typeof t.action.inspect!=='function')throw Error('Diameter inspection is unavailable.');
   const result=await settleScopedCommand(t.action.inspect(t.context,t.options),{signal:host.signal,valid:t.valid});
   if(!t.valid())throw Error('The sketch window or account changed.');return result;
  });
  register({id:'sketch-diameter',description:'Set a driving diameter through the shared sketch operation. Requires objectId and revision from sketch-diameter-targets. The edit is unsaved until Save.',parameters:{type:'object',additionalProperties:false,required:['objectId','diameter','revision'],properties:{objectId:{type:'string',minLength:1,maxLength:256},diameter:{type:'number',exclusiveMinimum:0,maximum:1000000},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['objectId','diameter','revision']);const {objectId,diameter,revision}=args;
   if(typeof objectId!=='string'||!objectId||objectId.length>256||typeof revision!=='string'||!revision||revision.length>128||typeof diameter!=='number'||!Number.isFinite(diameter)||diameter<=0||diameter>1e6)throw Error('Provide one object ID, a positive bounded diameter, and the inspected revision.');
   const t=target('DiameterLength');if(typeof t.action.invokeById!=='function')throw Error('The diameter operation is unavailable.');
   const result=await settleScopedCommand(t.action.invokeById(t.context,objectId,diameter,revision,t.options),{signal:host.signal,valid:t.valid});
   if(!t.valid())throw Error('The sketch window or account changed; inspect it before continuing.');return result;
  });
  register({id:'sketch-length-relation-targets',description:'Inspect reference segment-length measurements and driving length relations; returns IDs and a single-use revision.',parameters:{type:'object',additionalProperties:false}},async args=>{
   exact(args,[]);const t=target('LengthRelation');
   if(typeof t.action.inspect!=='function')throw Error('Length relation inspection is unavailable.');
   const result=await settleScopedCommand(t.action.inspect(t.context,t.options),{signal:host.signal,valid:t.valid});
   if(!t.valid())throw Error('The sketch window or account changed.');return result;
  });
  register({id:'sketch-length-relation',description:'Create a driving relation: first segment length equals factor times the second plus offset in millimeters.',parameters:{type:'object',additionalProperties:false,required:['ids','factor','offset','revision'],properties:{ids:{type:'array',minItems:2,maxItems:2,items:{type:'string',minLength:1,maxLength:256}},factor:{type:'number',minimum:0},offset:{type:'number'},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['ids','factor','offset','revision']);const {ids,factor,offset,revision}=args;
   const slots=Array.isArray(ids)?[Object.getOwnPropertyDescriptor(ids,'0'),Object.getOwnPropertyDescriptor(ids,'1')]:[];
   if(!Array.isArray(ids)||ids.length!==2||slots.some(d=>!d||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)||slots[0].value===slots[1].value||typeof factor!=='number'||!Number.isFinite(factor)||factor<0||typeof offset!=='number'||!Number.isFinite(offset)||typeof revision!=='string'||!revision||revision.length>128)throw Error('Provide two distinct segment IDs, finite relation values and the inspected revision.');
   const t=target('LengthRelation');if(typeof t.action.invokeByIds!=='function')throw Error('The length relation operation is unavailable.');
   const result=await settleScopedCommand(t.action.invokeByIds(t.context,slots.map(d=>d.value),{factor,offset},revision,t.options),{signal:host.signal,valid:t.valid});
   if(!t.valid())throw Error('The sketch window or account changed; inspect it before continuing.');return result;
  });
  register({id:'sketch-length-measurements',description:'Inspect convertible reference measurements and driving segment lengths.',parameters:{type:'object',additionalProperties:false}},async args=>{
   exact(args,[]);const t=target('LengthMeasurementRole');if(typeof t.action.inspect!=='function')throw Error('Length measurement inspection is unavailable.');
   const result=await settleScopedCommand(t.action.inspect(t.context,t.options),{signal:host.signal,valid:t.valid});if(!t.valid())throw Error('The sketch window or account changed.');return result;
  });
  register({id:'sketch-convert-length-role',description:'Convert one segment length without changing geometry; converting to reference removes its driving equation.',parameters:{type:'object',additionalProperties:false,required:['role','segmentId','revision'],properties:{role:{enum:['driving','reference']},segmentId:{type:'string',minLength:1,maxLength:256},dimensionId:{type:'string',minLength:1,maxLength:256},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   const role=args&&Object.getOwnPropertyDescriptor(args,'role');if(!role||!Object.hasOwn(role,'value')||!['driving','reference'].includes(role.value))throw Error('Provide a supported length role.');
   exact(args,role.value==='driving'?['role','segmentId','dimensionId','revision']:['role','segmentId','revision']);
   if(typeof args.segmentId!=='string'||!args.segmentId||args.segmentId.length>256||typeof args.revision!=='string'||!args.revision||args.revision.length>128||(args.role==='driving'&&(typeof args.dimensionId!=='string'||!args.dimensionId||args.dimensionId.length>256)))throw Error('Provide an inspected length target.');
   const t=target('LengthMeasurementRole');if(typeof t.action.invokeById!=='function')throw Error('Length role conversion is unavailable.');
   const result=await settleScopedCommand(t.action.invokeById(t.context,{...args},t.options),{signal:host.signal,valid:t.valid});if(!t.valid())throw Error('The sketch window or account changed.');return result;
  });
  register({id:'sketch-circular-objects',description:'Inspect circles/arcs and concentric relationships in the active sketch; returns stable IDs and a single-use revision.',parameters:{type:'object',additionalProperties:false}},async args=>{
   exact(args,[]);const t=target();
   if(typeof t.action.inspect!=='function')throw Error('Sketch inspection is unavailable.');
   const result=await settleScopedCommand(t.action.inspect(t.context,t.options),{signal:host.signal,valid:t.valid});
   if(!t.valid())throw Error('The sketch window or account changed.');
   return result;
  });
  register({id:'sketch-concentric',description:'Keep exactly two circles/arcs concentric through the same operation as the UI. Requires IDs and revision from sketch-circular-objects.',parameters:{type:'object',required:['ids','revision'],additionalProperties:false,properties:{ids:{type:'array',minItems:2,maxItems:2,items:{type:'string',minLength:1,maxLength:256}},revision:{type:'string',minLength:1,maxLength:128}}}},async args=>{
   exact(args,['ids','revision']);
   if(!Array.isArray(args.ids)||args.ids.length!==2||args.ids.some(id=>typeof id!=='string'||!id||id.length>256)||args.ids[0]===args.ids[1]||typeof args.revision!=='string'||!args.revision||args.revision.length>128)throw Error('Provide two distinct object IDs and the inspected revision.');
   const t=target();if(typeof t.action.invokeByIds!=='function')throw Error('The concentric operation is unavailable.');
   const result=await settleScopedCommand(t.action.invokeByIds(t.context,args.ids,args.revision,t.options),{signal:host.signal,valid:t.valid});
   if(!t.valid())throw Error('The sketch window or account changed; inspect it before continuing.');
   return result;
  });
 }catch(error){for(const unregister of registrations.reverse())unregister();throw error;}
 return ()=>{for(const unregister of registrations.splice(0).reverse())unregister();};
}
