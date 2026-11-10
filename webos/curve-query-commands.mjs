import {settleScopedCommand} from './scoped-command.mjs';

// Public intent contains inspected identities and explicit selections only.
// Prepared source, Native replies and mathematical witnesses stay in Craft.
export function registerCurveQueryCommands(host,getTarget){
 const stops=[];
 const id=maxLength=>({type:'string',minLength:1,maxLength});
 const schema=(required,properties)=>({type:'object',additionalProperties:false,required,properties});
 const identity=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max;
 function record(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||
   Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)))throw Error('Invalid curve query arguments.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);
   if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Curve query arguments must be own data.');out[key]=d.value;}
  return out;
 }
 function target(name){
  const captured=getTarget(),craft=captured.craft,method=craft?.[name],session=host.session(),commands=host.commands,token=commands.documentToken();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&
   host.commands===commands&&commands.documentToken()===token&&captured.valid()===true&&craft[name]===method;}catch{return false;}};
  if(!identity(token,256)||typeof method!=='function'||!valid())throw Error('This curve operation is unavailable in the current CAD document.');
  return {craft,method,scope:Object.freeze({signal:host.signal,valid})};
 }
 function invoke(name,args){const t=target(name);return settleScopedCommand(t.method.call(t.craft,args,t.scope),t.scope);}
 function common(a){if(!identity(a.revision,256)||!identity(a.faceId,1024))throw Error('Use the current inspected sketch and revision.');}
 try{
  stops.push(host.commands.register({id:'inspect-closed-sketch-query-capabilities',
   description:'Discover current source-query targets, explicitly available analytic engines and finite-domain limits. This read creates no geometry or saved state.',
   parameters:schema([],{})},args=>{record(args,[]);return invoke('inspectClosedSketchQueryCapabilities',Object.freeze({}));}));
  const fields=['revision','faceId','engine','engineRevision','curveIds','domain'];
  const finite=schema(['kind'],{kind:{const:'finite-pair'}});
  const ray=schema(['kind','targetCurveId','endpoint'],{kind:{const:'endpoint-ray'},targetCurveId:id(256),endpoint:{enum:['a','b']}});
  stops.push(host.commands.register({id:'inspect-closed-sketch-intersections',
   description:'Read certified finite intersections of two current inspected curves, or an explicit Segment endpoint ray. Uncertain results grant no selectable edit. The source and saved files remain unchanged.',
   parameters:schema(fields,{revision:id(256),faceId:id(1024),engine:{const:'occ'},engineRevision:id(256),
    curveIds:{type:'array',minItems:2,maxItems:2,uniqueItems:true,items:id(256)},domain:{oneOf:[finite,ray]}})},args=>{
   const a=record(args,fields);common(a);
   if(a.engine!=='occ'||!identity(a.engineRevision,256)||!Array.isArray(a.curveIds)||a.curveIds.length!==2||Reflect.ownKeys(a.curveIds).length!==3)
    throw Error('Choose the explicit query engine and two distinct inspected curve identities.');
   const ids=[0,1].map(index=>{const d=Object.getOwnPropertyDescriptor(a.curveIds,String(index));
    if(!d?.enumerable||!Object.hasOwn(d,'value')||!identity(d.value,256))throw Error('Curve identities must be two dense own data items.');return d.value;});
   if(ids[0]===ids[1])throw Error('Choose two distinct inspected curves.');
   const kind=Object.getOwnPropertyDescriptor(a.domain||{},'kind');
   if(!kind?.enumerable||!Object.hasOwn(kind,'value')||!['finite-pair','endpoint-ray'].includes(kind.value))throw Error('Choose a finite pair or explicit endpoint ray.');
   const domain=record(a.domain,kind.value==='finite-pair'?['kind']:['kind','targetCurveId','endpoint']);
   if(domain.kind==='endpoint-ray'&&(!ids.includes(domain.targetCurveId)||!['a','b'].includes(domain.endpoint)))throw Error('The endpoint ray must select one of the requested curves and an endpoint.');
   return invoke('inspectClosedSketchIntersections',Object.freeze({...a,curveIds:Object.freeze(ids),domain:Object.freeze(domain)}));
  }));
  const edit=['revision','faceId','action','target','queryId','eventId'];
  stops.push(host.commands.register({id:'edit-closed-sketch-endpoint',
   description:'Trim or extend one inspected Segment endpoint to an explicitly chosen current query event through the shared source/history transaction. No coordinates or proof flags are accepted. Save separately.',
   parameters:schema(edit,{revision:id(256),faceId:id(1024),action:{enum:['trim','extend']},
    target:schema(['curveId','endpoint'],{curveId:id(256),endpoint:{enum:['a','b']}}),queryId:id(256),eventId:id(256)})},args=>{
   const a=record(args,edit);common(a);const selected=record(a.target,['curveId','endpoint']);
   if(!['trim','extend'].includes(a.action)||!identity(a.queryId,256)||!identity(a.eventId,256)||
    !identity(selected.curveId,256)||!['a','b'].includes(selected.endpoint))throw Error('Choose an explicit current query event and Segment endpoint.');
   return invoke('editClosedSketchEndpoint',Object.freeze({...a,target:Object.freeze(selected)}));
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.reverse())stop();};
}
