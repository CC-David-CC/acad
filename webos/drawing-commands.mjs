import {settleScopedCommand} from './scoped-command.mjs';

// Authored definitions only; Native measurement and file publication remain
// separate shared services. This adapter owns no drawing model or Undo stack.
export function registerDrawingCommands(host,getTarget){
 const stops=[],text=maxLength=>({type:'string',minLength:1,maxLength}),integer={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER};
 const record=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
 const point={type:'array',minItems:2,maxItems:2,items:{type:'number',minimum:0,maximum:10000}};
 // Descriptions are bounded registry metadata, not a second semantic
 // validator. The shared manager captures the full exact definition schema.
 const ref=name=>({$ref:'#/$defs/'+name});
 const refs={source:{type:'object'},face:{type:'object'},edge:{type:'object'},hole:{type:'object'},point};
 // Exact source/native/BoreReference fieldsets remain in shared Core. Compact
 // transport metadata preserves the registry's existing4KiB schema ceiling.
 const view=record({viewId:text(128),basis:{enum:['top','front','right','isometric','bore-center-section','detail']},paperOrigin:ref('point'),visibility:{enum:['visible-and-hidden','cut-boundary-only','inherit']}});
 Object.assign(view.properties,{hole:ref('hole'),retainedSide:{enum:['positive-datum-y']},parentViewId:text(128),focus:ref('hole'),aperture:{type:'object'},scale:{type:'object'}});
 const dimension=record({dimensionId:text(128),viewId:text(128),kind:{enum:['source-distance','plane-distance','edge-length','hole-diameter','hole-offset']},label:ref('point')});
 // Variant fields are conditional; actual fieldsets are enforced by PM.
 dimension.required=['dimensionId','viewId','kind','label'];
 Object.assign(dimension.properties,{axis:{enum:['datum-x','datum-y','datum-normal']},from:ref('source'),to:ref('source'),first:ref('face'),second:ref('face'),edge:ref('edge'),hole:ref('hole')});
 // Canonical physical values and references are admitted by the shared PM.
 const definition=record({version:{enum:[1,2,3]},unit:{enum:['millimeter']},drawingId:text(128),title:{type:'string',maxLength:256},
  target:record({featureId:integer,operationType:text(128),engine:{enum:['occ']},engineRevision:{type:'string',pattern:'^sha256:[a-f0-9]{64}:[a-f0-9]{64}$'},output:{enum:['complete-native-result']}}),
  datum:record({featureId:integer,faceId:text(256),regionId:text(8192)}),
  sheet:record({width:{type:'number',exclusiveMinimum:0,maximum:10000},height:{type:'number',exclusiveMinimum:0,maximum:10000},scale:record({numerator:{type:'integer',minimum:1,maximum:10000},denominator:{type:'integer',minimum:1,maximum:10000}})}),
  views:{type:'array',minItems:1,maxItems:6,items:view},dimensions:{type:'array',maxItems:16,items:dimension}});
 definition.properties.annotations={type:'array',maxItems:16,items:{type:'object'}};
 function plain(value){const p=Object.getPrototypeOf(value);if(p===null)return true;const c=Object.getOwnPropertyDescriptor(p,'constructor');return Object.getPrototypeOf(p)===null&&c&&Object.hasOwn(c,'value')&&typeof c.value==='function'&&c.value.prototype===p;}
 function own(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||!plain(value)||Reflect.ownKeys(value).length!==keys.length)throw Error('Expected exact drawing command fields.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Drawing command fields must be own data.');out[key]=d.value;}return out;
 }
 function detach(value){
  let size=0,nodes=0;const path=new WeakSet();
  const charge=n=>{size+=n;if(size>65536)throw Error('Drawing command exceeds64KiB.');};
  const copy=(v,depth)=>{
   if(++nodes>65536||depth>16)throw Error('Drawing command nesting exceeds its bound.');
   if(v===null||typeof v==='boolean'){charge(v===null?4:v?4:5);return v;}
   if(typeof v==='number'&&Number.isFinite(v)){charge(String(v).length);return v;}
   if(typeof v==='string'){charge(v.length+2);return v;}
   if(!v||typeof v!=='object'||path.has(v))throw Error('Drawing command must contain acyclic JSON data.');
   path.add(v);
   try{
    let out;if(Array.isArray(v)){
     const n=Object.getOwnPropertyDescriptor(v,'length')?.value;
     if(!Number.isSafeInteger(n)||n>65536||Reflect.ownKeys(v).length!==n+1)throw Error('Drawing arrays must be dense own data.');
     out=[];for(let i=0;i<n;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Drawing arrays must be own data.');out.push(copy(d.value,depth+1));if(i)charge(1);}
    }else{
     if(!plain(v))throw Error('Drawing records must be plain data.');out={};let first=true;
     for(const key of Reflect.ownKeys(v)){if(typeof key!=='string')throw Error('Drawing records cannot contain symbols.');const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Drawing records must be own data.');charge(key.length+3+(first?0:1));first=false;Object.defineProperty(out,key,{value:copy(d.value,depth+1),enumerable:true});}
    }
    charge(2);return Object.freeze(out);
   }finally{path.delete(v);}
  };
  const result=copy(value,0);if(new TextEncoder().encode(JSON.stringify(result)).byteLength>65536)throw Error('Drawing command exceeds64KiB UTF-8.');return result;
 }
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true;}catch{return false;}};
  if(!valid()||typeof captured.manager?.[method]!=='function')throw Error('Linked drawing commands are unavailable in this modeling window.');return{manager:captured.manager,valid};
 }
 try{
  stops.push(host.commands.register({id:'inspect-linked-part-drawing',description:'Inspect the persisted authored drawing definition and document/geometry revisions. Definition readiness does not prove Native reference resolution or measured dimensions.',parameters:record({})},args=>{
   own(args,[]);const t=target('inspectLinkedPartDrawing'),result=t.manager.inspectLinkedPartDrawing();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  for(const [id,op] of [['create-linked-part-drawing','drawing.create'],['replace-linked-part-drawing','drawing.replace'],['remove-linked-part-drawing','drawing.remove']]){
   const properties={version:{enum:[1]},unit:{enum:['millimeter']},revision:text(256),geometryRevision:text(256),...(op==='drawing.create'?{}:{drawingId:text(128)}),...(op==='drawing.remove'?{}:{definition})};
   stops.push(host.commands.register({id,description:'Publish a linked drawing in the shared journal. V1/v2 views retained; v3 allows up to6 role-bound views and16 typed bore annotations. Section requires exact Shell Native caps; detail is absolute2:1. Values remain physical reference dimensions. Section adds hole:BoreReference, retainedSide:positive-datum-y, visibility:cut-boundary-only. Detail adds parentViewId:TOP, focus:corner BoreReference, aperture:{kind:rectangle,halfWidth,halfHeight}, scale:{numerator:2,denominator:1}, visibility:inherit. V3 hole-diameter accepts an actual discovered BoreReference. Use both revisions; Save separately. References may be unresolved.',parameters:{...record(properties),...(op==='drawing.remove'?{}:{$defs:refs})}},args=>{
    const request=detach({op,...own(args,Object.keys(properties))}),t=target('applyLinkedPartDrawingOperation'),scope={signal:host.signal,valid:t.valid};
    return settleScopedCommand(t.manager.applyLinkedPartDrawingOperation(request,scope),scope);
   }));
  }
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return()=>{for(const stop of stops.splice(0).reverse())stop();};
}
