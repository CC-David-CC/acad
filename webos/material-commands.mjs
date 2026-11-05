// UI and agents share projectManager's transactional material assignment.
// This adapter never edits history, geometry or files directly.
export function registerMaterialCommands(host,getTarget){
 const stops=[];
 function fields(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||
    Reflect.ownKeys(value).length!==keys.length||keys.some(key=>{
     const d=Object.getOwnPropertyDescriptor(value,key);return !d?.enumerable||!Object.hasOwn(d,'value');
    }))throw Error('Invalid material command arguments.');
 }
 function bounded(value,max=256){if(typeof value!=='string'||!value.length||value.length>max)throw Error('Invalid material text.');return value;}
 function role(value){
  fields(value,['material','appearance']);fields(value.material,['id','name']);
  const material={id:bounded(value.material.id,128),name:bounded(value.material.name)};
  let appearance=null;
  if(value.appearance!==null){fields(value.appearance,['id','name','color']);appearance={id:bounded(value.appearance.id,128),name:bounded(value.appearance.name),color:bounded(value.appearance.color,9)};}
  return {material,appearance};
 }
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>!!session&&!host.signal.aborted&&host.session()===session&&captured.valid();
  if(!valid()||typeof captured.manager?.[method]!=='function')throw Error('Material assignment is unavailable in this modeling window.');
  return {manager:captured.manager,valid};
 }
 const text=maxLength=>({type:'string',minLength:1,maxLength});
 const material={type:'object',additionalProperties:false,required:['id','name'],properties:{id:text(128),name:text(256)}};
 const appearance={anyOf:[{type:'null'},{type:'object',additionalProperties:false,required:['id','name','color'],properties:{id:text(128),name:text(256),color:{type:'string',pattern:'^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$'}}}]};
 const assignment={type:'object',additionalProperties:false,required:['material','appearance'],properties:{material,appearance}};
 try{
  stops.push(host.commands.register({id:'inspect-enclosure-materials',description:'Discover enclosure feature IDs and a current revision for material assignment.',parameters:{type:'object',additionalProperties:false}},args=>{
   fields(args,[]);const t=target('inspectEnclosureMaterialRoles'),result=t.manager.inspectEnclosureMaterialRoles();
   if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  stops.push(host.commands.register({id:'assign-enclosure-materials',description:'Assign separate body and lid materials through the same operation as the CAD UI. Use the inspected revision. Changes remain unsaved until Save.',parameters:{type:'object',additionalProperties:false,required:['featureId','revision','roles'],properties:{featureId:{type:'integer',minimum:1},revision:text(1024),roles:{type:'object',additionalProperties:false,required:['BODY','LID'],properties:{BODY:assignment,LID:assignment}}}}},async args=>{
   fields(args,['featureId','revision','roles']);fields(args.roles,['BODY','LID']);
   if(!Number.isSafeInteger(args.featureId)||args.featureId<=0)throw Error('Invalid enclosure feature ID.');
   const revision=bounded(args.revision,1024),roles={BODY:role(args.roles.BODY),LID:role(args.roles.LID)},featureId=args.featureId;
   const t=target('assignEnclosureMaterialRoles');
   await t.manager.assignEnclosureMaterialRoles(featureId,roles,{revision,signal:host.signal,valid:t.valid});
   if(!t.valid())throw Error('The window or account changed.');
   return {status:'accepted',saved:false};
  }));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
