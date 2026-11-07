import {settleScopedCommand} from './scoped-command.mjs';

// File ownership and write settlement remain in the mounted app's coordinator.
export function registerDrawingExportCommand(host,{inspect,exportDrawing}) {
 return host.commands.register({id:'export-linked-part-drawing-svg',description:'Export the current linked part reference drawing to a new My files SVG. Unresolved references are visibly labeled; native project retains editable intent.',parameters:{type:'object',additionalProperties:false,required:['revision','path'],properties:{revision:{type:'string',minLength:1,maxLength:256},path:{type:'string',minLength:1,maxLength:1024}}}},async args=>{
  if(!args||typeof args!=='object'||Array.isArray(args)||Reflect.ownKeys(args).length!==2)throw Error('Provide the inspected document revision and a new SVG path.');
  const copy={};for(const key of ['revision','path']){const d=Object.getOwnPropertyDescriptor(args,key);if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>(key==='path'?1024:256))throw Error('Invalid drawing export arguments.');copy[key]=d.value;}
  if(!/\.svg$/i.test(copy.path))throw Error('Use a .svg filename.');
  const session=host.session(),valid=()=>!!session&&!host.signal.aborted&&host.session()===session;
  if(!valid()||inspect().revision!==copy.revision)throw Error('The document changed; inspect it again.');
  return settleScopedCommand(exportDrawing(Object.freeze(copy)),{signal:host.signal,valid});
 });
}
