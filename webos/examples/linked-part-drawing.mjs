/** Public registry recipe for caller-supplied authored drawing definitions.
 * Importing this file does nothing. It never constructs geometry/selection IDs.
 */
import {createCadAgent} from './cad-agent.mjs';
const required=['inspect-linked-part-drawing','create-linked-part-drawing','replace-linked-part-drawing','remove-linked-part-drawing','export-linked-part-drawing-svg','inspect-authored-edits','travel-authored-edit','save','open-project'];
// Detach bounded caller metadata before the first inspection await. Semantic
// validation is exclusively the shared command/manager's existing schema.
function snapshot(value){
 let units=0,nodes=0;const active=new WeakSet();
 const charge=n=>{units+=n;if(units>65536)throw Error('Drawing definition exceeds64KiB.');};
 const visit=(v,depth)=>{
  if(++nodes>65536||depth>16)throw Error('Drawing definition nesting exceeds its bound.');
  if(v===null||typeof v==='boolean'){charge(v===null?4:v?4:5);return v;}
  if(typeof v==='number'&&Number.isFinite(v)){charge(String(v).length);return v;}
  if(typeof v==='string'){charge(v.length+2);return v;}
  if(!v||typeof v!=='object'||active.has(v))throw Error('Supply an acyclic own-data drawing definition.');
  active.add(v);
  try{
   const array=Array.isArray(v),out=array?[]:{};
   if(array){
    const n=Object.getOwnPropertyDescriptor(v,'length')?.value;
    if(!Number.isSafeInteger(n)||n>65536||Reflect.ownKeys(v).length!==n+1)throw Error('Drawing arrays must be dense own data.');
    for(let i=0;i<n;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Drawing arrays must be own data.');if(i)charge(1);out.push(visit(d.value,depth+1));}
   }else{
    const p=Object.getPrototypeOf(v),c=p&&Object.getOwnPropertyDescriptor(p,'constructor');
    if(p!==null&&!(Object.getPrototypeOf(p)===null&&c&&Object.hasOwn(c,'value')&&typeof c.value==='function'&&c.value.prototype===p))throw Error('Drawing records must be plain data.');
    let first=true;for(const key of Reflect.ownKeys(v)){
     if(typeof key!=='string')throw Error('Drawing definitions cannot contain symbols.');const d=Object.getOwnPropertyDescriptor(v,key);
     if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Drawing definitions must be own data.');
     charge(key.length+3+(first?0:1));first=false;Object.defineProperty(out,key,{value:visit(d.value,depth+1),enumerable:true});
    }
   }
   charge(2);return Object.freeze(out);
  }finally{active.delete(v);}
 };
 const result=visit(value,0);if(new TextEncoder().encode(JSON.stringify(result)).byteLength>65536)throw Error('Drawing definition exceeds64KiB UTF-8.');return result;
}
function identity(value){if(typeof value!=='string'||!value||value.length>128)throw Error('Use the actual inspected drawing ID.');return value;}
function path(value,suffix){if(typeof value!=='string'||!value.trim()||value.length>1024||/[\u0000-\u001f\u007f]/u.test(value)||!value.toLowerCase().endsWith(suffix))throw Error('Use a normal My files '+suffix+' path.');return value;}
export function createLinkedPartDrawingExample(options={}){
 // One helper pins the actual public document token for its whole lifetime.
 const agent=createCadAgent(options);let busy=false;
 const call=(command,args={})=>agent.execute(command,args);
 const serial=async work=>{if(busy)throw Error('Wait for the current drawing example operation.');busy=true;try{return await work();}finally{busy=false;}};
 async function inspect(){const info=await call('inspect-linked-part-drawing');if(info.version!==1||info.unit!=='millimeter'||typeof info.revision!=='string'||typeof info.geometryRevision!=='string')throw Error('This build has no supported drawing inspection.');return info;}
 const binding=info=>({version:1,unit:'millimeter',revision:info.revision,geometryRevision:info.geometryRevision});
 return Object.freeze({
  windowId:agent.windowId,
  discover:()=>{const commands=agent.discover();return Object.freeze({windowId:agent.windowId,documentToken:commands[0].documentToken,commands,missing:Object.freeze(required.filter(id=>!commands.some(c=>c.id===id)))});},
  inspect:()=>serial(inspect),
  create:definition=>serial(async()=>{
   const captured=snapshot(definition),info=await inspect();if(!info.ready)throw Error(info.reason||'Drawing publication is unavailable.');if(info.definition!==null)throw Error('A drawing already exists. Inspect it and explicitly replace it.');
   return call('create-linked-part-drawing',{...binding(info),definition:captured});
  }),
  replace:definition=>serial(async()=>{
   const captured=snapshot(definition),info=await inspect();if(!info.ready)throw Error(info.reason||'Drawing publication is unavailable.');if(!info.definition||captured.drawingId!==info.definition.drawingId)throw Error('Replacement must retain the current inspected drawing ID.');
   return call('replace-linked-part-drawing',{...binding(info),drawingId:info.definition.drawingId,definition:captured});
  }),
  remove:drawingId=>serial(async()=>{
   const selected=identity(drawingId),info=await inspect();if(!info.ready)throw Error(info.reason||'Drawing publication is unavailable.');if(info.definition?.drawingId!==selected)throw Error('The selected drawing no longer exists.');
   return call('remove-linked-part-drawing',{...binding(info),drawingId:selected});
  }),
  exportSvg:filename=>serial(async()=>{
   const selected=path(filename,'.svg'),info=await inspect();if(!info.definition)throw Error('Create or open an authored drawing definition first.');
   return call('export-linked-part-drawing-svg',{revision:info.revision,path:selected});
  }),
  travel:direction=>serial(()=>agent.travel(direction)),
  save:filename=>serial(()=>agent.save(filename===undefined?undefined:path(filename,'.jsketcher.json'))),
  open:filename=>serial(()=>agent.open(path(filename,'.jsketcher.json')))
 });
}
