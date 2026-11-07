import {createSketchProjectionClient} from 'sketcher/headless/projectionClient';
import {createWorkerSketchCanvas} from './workerSketchCanvas';
import {sketchBoundaryFrame} from './boundaryValidity';
import {sameSketchSaveFrame} from '../craft/unconsumedSketchSave.mjs';
const stopped=()=>new DOMException('Sketch view changed or closed.','AbortError');
function record(value:any,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid sketch view request.');const result:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Sketch view fields must be data.');result[key]=d.value}return result;}
// Opt-in drawing surface: the craft source and authored journal remain authoritative.
// Legacy tools/ParametricManager are never attached to this view.
export function createWorkerSketchViewService(ctx:any){
 let active:any=null,pending:any=null,openEpoch=0;
 function close(){
  openEpoch++;const waiting=pending,old=active;pending=null;active=null;let first:any,failed=false;
  for(const owned of [waiting,old])if(owned)try{owned.cleanup()}catch(error){if(!failed){first=error;failed=true}}
  if(failed)throw first;
 }
 function inspect(){if(!active)return Object.freeze({open:false});const a=active;a.current();return Object.freeze({open:true,faceId:a.faceId,revision:a.revision,selection:Object.freeze([...a.selection]),objects:a.projection.render.objects,unsupported:a.projection.render.unsupported,unrendered:a.projection.render.unrendered,capabilities:Object.freeze({...a.projection.render.capabilities,selection:'geometry-only'}),numericalCache:'absent',dof:null});}
 async function open(input:any,rawOptions:any={}){
  const args=record(input,['revision','faceId']);if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||typeof args.faceId!=='string'||!args.faceId||args.faceId.length>1024)throw Error('Invalid sketch view target.');
  if(!rawOptions||typeof rawOptions!=='object'||Array.isArray(rawOptions)||Reflect.ownKeys(rawOptions).some(key=>key!=='signal'&&key!=='valid'))throw Error('Invalid sketch view options.');
  const opts:any={};for(const key of Reflect.ownKeys(rawOptions) as string[]){const d=Object.getOwnPropertyDescriptor(rawOptions,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Sketch view options must be data.');opts[key]=d.value;}
  if(opts.valid!==undefined&&typeof opts.valid!=='function')throw Error('Invalid sketch view lifetime.');if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{throw Error('Invalid sketch view signal.')}
  close();const epoch=openEpoch,craft=ctx.craftService,project=ctx.projectService,storage=ctx.storageService,sketchStorage=ctx.sketchStorageService,registry=ctx.cadRegistry,expressions=ctx.expressionService,sketcher=ctx.services.sketcher,viewer3d=ctx.services.viewer;
  const generation=project.documentGeneration,namespace=project.sketchStorageNamespace,key=project.sketchStorageKey(args.faceId),source=sketchStorage.getSketchData(args.faceId),version=storage.versionOf(key),frameFace=registry.findFace(args.faceId);
  const expressionStreams=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$,craft.modifications$,craft.models$],expressionRevisions=expressionStreams.map(s=>s.revision),table=expressions.table$.value;
  const frameAtOpen=frameFace?sketchBoundaryFrame(frameFace):null,evaluationEpoch=craft.evaluationEpoch,external=Object.create(null);
  if(!table||typeof table!=='object'||Array.isArray(table)||Reflect.ownKeys(table).length>1024)throw Error('Sketch parameters are unavailable.');
  for(const name of Reflect.ownKeys(table)){if(typeof name!=='string')throw Error('Sketch parameters are unavailable.');const d=Object.getOwnPropertyDescriptor(table,name);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))throw Error('Sketch parameters are unavailable.');external[name]=d.value;}
  if(typeof source!=='string'||source.length>1048576||!project.hasHostLifetime)throw Error('A current authored sketch is required.');
  const controller=new AbortController(),stop=()=>controller.abort(),signals=[project.documentSignal,opts.signal].filter(Boolean);let owner:any=null,surface:any=null,root:any=null,timer:any=null,resize:any=null,disposed=false,state:any=null;
  // Pending installation owns its DOM/canvas too: close must release them now,
  // even if an in-flight drawing is suspended until a future animation frame.
  function cleanup(){
   if(disposed)return;disposed=true;let first:any,failed=false;
   const attempt=(run:()=>void)=>{try{run()}catch(error){if(!failed){first=error;failed=true}}};
   attempt(()=>controller.abort());attempt(()=>clearInterval(timer));attempt(()=>resize?.disconnect());
   for(const signal of signals)attempt(()=>signal.removeEventListener('abort',stop));
   attempt(()=>owner?.close());attempt(()=>surface?.close());attempt(()=>root?.remove());
   owner=null;surface=null;root=null;timer=null;resize=null;
   if(failed)throw first;
  }
  const ownership={cleanup};pending=ownership;for(const signal of signals){signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop()}
  function current(){let valid=false;try{valid=!controller.signal.aborted&&(!opts.valid||opts.valid()===true)&&!controller.signal.aborted&&openEpoch===epoch&&ctx.craftService===craft&&ctx.projectService===project&&project.isDocumentCurrent(generation)&&project.hasHostLifetime&&ctx.storageService===storage&&ctx.sketchStorageService===sketchStorage&&ctx.cadRegistry===registry&&ctx.expressionService===expressions&&ctx.services.sketcher===sketcher&&ctx.services.viewer===viewer3d&&project.sketchStorageNamespace===namespace&&storage.versionOf(key)===version&&sketchStorage.getSketchData(args.faceId)===source&&registry.findFace(args.faceId)===frameFace&&craft.evaluationEpoch===evaluationEpoch&&(!frameFace||sameSketchSaveFrame(sketchBoundaryFrame(frameFace),frameAtOpen))&&Reflect.ownKeys(table).length===Object.keys(external).length&&Object.keys(external).every(name=>Object.is(Object.getOwnPropertyDescriptor(table,name)?.value,external[name]))&&expressions.table$.value===table&&expressionStreams.every((s,i)=>s.revision===expressionRevisions[i])&&!ctx.services.sketcher.inPlaceEditor.inEditMode;}catch{}if(!valid)throw stopped();}
  try{
   current();const inspected=await craft.inspectClosedSketch(args,{signal:controller.signal,valid:()=>{try{current();return true}catch{return false}}});current();
   owner=createSketchProjectionClient(current);const ticket=await owner.prepare({revision:crypto.randomUUID(),sketchJSON:source,externalParameters:external,frame:inspected.boundaryFrame},{signal:controller.signal});current();const projection=owner.inspect(ticket);
   root=document.createElement('section');root.dataset.workerSketchView=args.faceId;root.style.cssText='position:absolute;inset:0;z-index:20;background:#222;display:flex;flex-direction:column;';
   const tools=document.createElement('div'),status=document.createElement('span'),done=document.createElement('button'),canvas=document.createElement('canvas');
   status.textContent='Sketch view · select geometry';done.textContent='Close sketch view';done.onclick=close;tools.append(status,done);canvas.style.cssText='width:100%;height:100%;min-height:0;flex:1;';root.append(tools,canvas);ctx.services.viewer.sceneSetup.container.appendChild(root);
   state={cleanup,faceId:args.faceId,revision:args.revision,selection:[],projection,owner,controller,current,root,signals,stop,canvas,surface:null,timer:null,resize:null};
   surface=createWorkerSketchCanvas(canvas,current,id=>{if(active!==state)return;select({revision:state.revision,ids:[id]}).catch(error=>{if(error?.name!=='AbortError')status.textContent=error.message})});state.surface=surface;
   await surface.install(projection.render);current();
   timer=setInterval(()=>{try{current()}catch{if(active===state)close()}},100);state.timer=timer;
   resize=new ResizeObserver(()=>{if(active!==state)return;surface.install(projection.render).catch(error=>{if(error?.name!=='AbortError'&&active===state)close()})});resize.observe(canvas);state.resize=resize;current();active=state;if(pending===ownership)pending=null;
   if(projection.render.unsupported.length||projection.render.unrendered.length)status.textContent='Partial sketch view · omitted geometry and annotations are listed by Inspect';return inspect();
  }catch(error){if(active===state)active=null;try{cleanup()}catch{/* Preserve the opening failure after attempting every cleanup. */}throw error;}
  finally{if(pending===ownership)pending=null;}
 }
 async function select(input:any){const args=record(input,['revision','ids']),a=active;if(!a)throw Error('No Worker sketch view is open.');a.current();if(args.revision!==a.revision||!Array.isArray(args.ids)||args.ids.length>64||Reflect.ownKeys(args.ids).length!==args.ids.length+1)throw Error('Select current sketch IDs.');const known=new Set(a.projection.render.objects.map(row=>row.id)),ids=[];for(let i=0;i<args.ids.length;i++){const d=Object.getOwnPropertyDescriptor(args.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!known.has(d.value)||ids.includes(d.value))throw Error('Select current sketch IDs.');ids.push(d.value)}await a.surface.select(ids);a.current();if(active!==a)throw stopped();a.selection=ids;return inspect();}
 return Object.freeze({open,inspect,select,close});
}
