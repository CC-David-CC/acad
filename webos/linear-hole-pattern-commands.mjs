import {settleScopedCommand} from './scoped-command.mjs';

// Host/window/account custody only. Shared Craft authenticates the successful
// seed, reserves native work and publishes semantic history atomically.
export function registerLinearHolePatternCommands(host,context){
 const stops=[],revisionPattern='^sha256:[a-f0-9]{64}:[a-f0-9]{64}$',revisionRE=new RegExp(revisionPattern);
 const text=maxLength=>({type:'string',minLength:1,maxLength}),positiveSchema={type:'number',exclusiveMinimum:0,maximum:1000000},featureSchema={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},countSchema={type:'integer',minimum:2,maximum:17};
 const spec=(keys,properties)=>({type:'object',additionalProperties:false,required:keys.slice(),properties});
 function copy(value,keys){const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length)throw Error('Expected exact linear-hole-pattern command fields.');const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Pattern command fields must be own data.');out[key]=d.value;}return out;}
 const bounded=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max,positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=1e6,feature=v=>Number.isSafeInteger(v)&&v>0,count=v=>Number.isSafeInteger(v)&&v>=2&&v<=17;
 function target(method){const captured=context(),session=host.session(),valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true}catch{return false}};if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('Linear-hole-pattern commands are unavailable in this modeling window.');return{craft:captured.craft,valid};}
 const scoped=t=>Object.freeze({signal:host.signal,valid:t.valid});
 function inspect(command,method,description){stops.push(host.commands.register({id:command,description,parameters:spec([],{})},args=>{copy(args,[]);const t=target(method),result=t.craft[method]();if(!t.valid())throw Error('The window or account changed.');return result;}));}
 try{
  inspect('inspect-linear-hole-patterns','inspectWorkerLinearHolePatterns','Inspect authenticated centered-hole seeds on current targets and explicit native pattern capacity. Shape/layout requires Worker validation.');
  const create=['revision','version','unit','engine','engineRevision','bodyId','seedFeatureId','axis','count','spacing'];
  stops.push(host.commands.register({id:'create-linear-hole-pattern',description:'Pattern an inspected centered-through seed along source-local positive X. Count includes the seed; supported counts2–17. Use shared authored undo/redo and save separately.',parameters:spec(create,{revision:text(256),version:{type:'integer',enum:[1]},unit:{enum:['millimeter']},engine:{enum:['occ']},engineRevision:{type:'string',minLength:136,maxLength:136,pattern:revisionPattern},bodyId:text(1024),seedFeatureId:featureSchema,axis:{enum:['source-local-x-positive']},count:countSchema,spacing:positiveSchema})},async args=>{
   const v=copy(args,create);if(!bounded(v.revision,256)||v.version!==1||v.unit!=='millimeter'||v.engine!=='occ'||typeof v.engineRevision!=='string'||v.engineRevision.length!==136||!revisionRE.test(v.engineRevision)||!bounded(v.bodyId,1024)||!feature(v.seedFeatureId)||v.axis!=='source-local-x-positive'||!count(v.count)||!positive(v.spacing))throw Error('Provide a current target/seed, explicit OCC build, supported integer count and positive numeric spacing. Seed-only count1 requires an unsupported owned identity operation.');
   const intent=Object.freeze(v),t=target('createWorkerLinearHolePattern'),scope=scoped(t);return settleScopedCommand(t.craft.createWorkerLinearHolePattern(intent,scope),scope);
  }));
  inspect('inspect-linear-hole-pattern-history','inspectWorkerLinearHolePatternHistory','Inspect semantic linear-hole-pattern definitions and the shared authored-edit revision.');
  const edit=['revision','index','featureId','count','spacing'];
  stops.push(host.commands.register({id:'edit-linear-hole-pattern',description:'Edit only count/spacing through shared atomic replay. Seed, target, axis and build stay fixed; travel-authored-edit performs undo/redo.',parameters:spec(edit,{revision:text(256),index:{type:'integer',minimum:0,maximum:255},featureId:featureSchema,count:countSchema,spacing:positiveSchema})},async args=>{
   const v=copy(args,edit);if(!bounded(v.revision,256)||!Number.isSafeInteger(v.index)||v.index<0||v.index>255||!feature(v.featureId)||!count(v.count)||!positive(v.spacing))throw Error('Provide a current inspected feature, supported integer count and positive numeric spacing.');
   const intent=Object.freeze(v),t=target('editWorkerLinearHolePattern'),scope=scoped(t);return settleScopedCommand(t.craft.editWorkerLinearHolePattern(intent,scope),scope);
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
