import {settleScopedCommand} from './scoped-command.mjs';

// Transport only. Craft owns face provenance, native replay, feature allocation,
// publication, journal travel and files. No native IDs or geometry enter here.
export function registerShellCommands(host,getTarget){
 const stops=[],create=['revision','version','unit','engine','engineRevision','bodyId','removedFaceIds','thickness','direction'],edit=['revision','index','featureId','thickness'];
 const text=maxLength=>({type:'string',minLength:1,maxLength}),positive={type:'number',exclusiveMinimum:0,maximum:1000000},buildPattern='^sha256:[a-f0-9]{64}:[a-f0-9]{64}$',buildRE=new RegExp(buildPattern);
 const properties={revision:text(256),version:{type:'integer',enum:[1]},unit:{enum:['millimeter']},engine:{enum:['occ']},engineRevision:{type:'string',minLength:136,maxLength:136,pattern:buildPattern},bodyId:text(1024),removedFaceIds:{type:'array',minItems:1,maxItems:16,uniqueItems:true,items:text(16384)},thickness:positive,direction:{enum:['inward']},index:{type:'integer',minimum:0,maximum:255},featureId:{type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER}};
 const schema=keys=>({type:'object',additionalProperties:false,required:keys.slice(),properties:Object.fromEntries(keys.map(key=>[key,properties[key]]))});
 const bounded=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max;
 const thickness=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1e6;
 function data(value,keys){
  const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)))throw Error('Expected exact shell command fields.');
  const out={};for(const key of keys){const field=Object.getOwnPropertyDescriptor(value,key);if(!field?.enumerable||!Object.hasOwn(field,'value'))throw Error('Shell command fields must be enumerable own data.');out[key]=field.value;}
  return out;
 }
 function faces(value){
  if(!Array.isArray(value)||value.length<1||value.length>16||Reflect.ownKeys(value).length!==value.length+1)throw Error('Select one to sixteen distinct inspected face IDs.');
  const out=[];for(let i=0;i<value.length;i++){const field=Object.getOwnPropertyDescriptor(value,String(i));if(!field?.enumerable||!Object.hasOwn(field,'value')||!bounded(field.value,16384)||out.includes(field.value))throw Error('Shell face IDs must be distinct bounded dense data.');out.push(field.value);}
  return Object.freeze(out);
 }
 function target(name){
  const captured=getTarget(),session=host.session(),signal=host.signal,commands=host.commands,documentToken=commands?.documentToken?.(),craft=captured.craft,method=craft?.[name];
  const owner=()=>host.signal===signal&&!signal.aborted&&host.session()===session&&host.commands===commands&&commands.documentToken()===documentToken&&captured.craft===craft&&craft?.[name]===method;
  const valid=()=>{try{return !!session&&bounded(documentToken,256)&&owner()&&captured.valid()===true&&owner();}catch{return false;}};
  if(typeof method!=='function'||!valid())throw Error('Shell commands require a current bound CAD window and matching shared service.');
  return{craft,method,valid,scope:Object.freeze({signal,valid})};
 }
 function inspect(id,name,description){stops.push(host.commands.register({id,description,parameters:schema([])},args=>{data(args,[]);const t=target(name),result=t.method.call(t.craft);if(!t.valid())throw Error('The modeling window, account or document changed.');return result;}));}
 try{
  inspect('inspect-worker-shells','inspectWorkerShells','Inspect current shell targets, actual box-origin face descriptors, opaque selection IDs and explicit backend. Eligibility is request admission; native shell geometry is checked during replay.');
  stops.push(host.commands.register({id:'create-worker-shell',description:'Create an inward shell using actual inspected face IDs and the same explicit part backend. Consumes its source through shared replay; save separately.',parameters:schema(create)},args=>{
   const input=data(args,create);
   if(!bounded(input.revision,256)||input.version!==1||input.unit!=='millimeter'||input.engine!=='occ'||typeof input.engineRevision!=='string'||input.engineRevision.length!==136||!buildRE.test(input.engineRevision)||!bounded(input.bodyId,1024)||!thickness(input.thickness)||input.direction!=='inward')throw Error('Use a current body/revision, explicit OCC build, inward direction and positive bounded thickness.');
   input.removedFaceIds=faces(input.removedFaceIds);const request=Object.freeze(input),t=target('createWorkerShell');return settleScopedCommand(t.method.call(t.craft,request,t.scope),t.scope);
  }));
  inspect('inspect-worker-shell-history','inspectWorkerShellHistory','Inspect saved shell source/face identities, numeric thickness and shared authored-edit revision. No native handles or ordinals are exposed.');
  stops.push(host.commands.register({id:'edit-worker-shell',description:'Edit only an inspected shell thickness through shared full-part replay. Target/build/ordered faces remain fixed; use shared travel and Save separately.',parameters:schema(edit)},args=>{
   const input=data(args,edit);
   if(!bounded(input.revision,256)||!Number.isSafeInteger(input.index)||input.index<0||input.index>255||!Number.isSafeInteger(input.featureId)||input.featureId<1||!thickness(input.thickness))throw Error('Use the inspected authored revision/index/feature and a positive bounded numeric thickness.');
   const request=Object.freeze(input),t=target('editWorkerShell');return settleScopedCommand(t.method.call(t.craft,request,t.scope),t.scope);
  }));
 }catch(error){for(const stop of stops.splice(0).reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
