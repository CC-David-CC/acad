import './style.css';
import {inspectedProjectIsDirty} from './inspect-state.mjs';
import {readVersionedBytes,acquireVersionedSnapshot} from './file-read.mjs';
import {registerSketchCommands} from './sketch-commands.mjs';
import {createRectangleController} from './rectangle-commands.mjs';
import {registerFeatureCommands} from './feature-commands.mjs';
import {registerMaterialCommands} from './material-commands.mjs';
import {registerDocumentSaveCommand} from './document-commands.mjs';
import {openCadSources} from './source-dialog.mjs';

// The embedded CAD app owns only its temporary model. The host owns account
// storage, confirmation, version checks and the lifetime of every iframe.
export function mount(host){
 const {w}=host,{make,textButton}=host.ui,{mirrorFileContext,signedInSubject}=host.storage;
 const owner=w.launchContext?.owner||signedInSubject(),session=host.session?.(),state=w.jsketcher??={path:null,version:null};w.ownerSub=owner;
 const body=make('div','window-content jsketcher-app'),stage=make('div','jsketcher-stage'),status=make('p','app-status','Loading jSketcher…'),warning=make('p','jsketcher-file-warning');
 warning.hidden=true;warning.setAttribute('role','status');status.setAttribute('aria-live','polite');stage.setAttribute('aria-label','jSketcher modeling workspace');
 const operations=host.documentOperations;if(!operations)throw Error('Document operation coordination is unavailable.');
 let disposed=false,busy=operations.busy,active=null,candidate=null,baseline=null,watch=()=>{},watchRevision=0,checkRevision=0;
 let actionCleanup=()=>{};
 const sourceMenus=new WeakSet(),sourceLifetime=new AbortController();let sourceOpening=false,sourceClose=null;
 const abortSources=()=>sourceLifetime.abort();if(host.signal.aborted)abortSources();else host.signal.addEventListener('abort',abortSources,{once:true});
 const unsubscribeOperations=operations.subscribe(state=>{busy=state.busy;if(active&&frames.has(active))syncCurrentActions();});
 let updateActions=()=>{};function syncCurrentActions(){updateActions();}
 function bindActions(ctx){
  if(!sourceMenus.has(ctx)){
   ctx.actionService.registerActions([{id:'DesktopSources',appearance:{label:'Sources & licenses'},invoke:()=>{
    if(!valid()||active?.contentWindow?.__CAD_APP!==ctx)return;
    if(sourceOpening||sourceClose)return;sourceOpening=true;void openCadSources({read:(name,options)=>host.storage.readCadSource(owner,name,options),valid,signal:sourceLifetime.signal,onClose:()=>{sourceClose=null;}}).then(close=>{if(valid())sourceClose=close;else close();}).catch(()=>tell('Sources and licenses are unavailable.')).finally(()=>{sourceOpening=false;});
   }}]);
   ctx.streams.ui.menu.all.update(menus=>menus.map(menu=>menu.id==='file'?{...menu,actions:[...menu.actions,'-','DesktopSources']}:menu));
   sourceMenus.add(ctx);
  }
  actionCleanup();const cleanups=[],updates=[];
  for(const id of ['Save','DesktopSaveAs','DesktopExport3MF','NativeFormatImport']){
   const stream=ctx?.streams?.action?.state?.[id];if(!stream?.attach||!stream?.next)continue;
   let writing=false,base=!!stream.value?.enabled;
   const update=()=>{
    const value=stream.value;if(!value)return;const enabled=base&&!busy;
    if(value.enabled!==enabled){writing=true;try{stream.next({...value,enabled});}finally{writing=false;}}
   };
   const stop=stream.attach(value=>{if(!writing){base=!!value?.enabled;update();}});
   cleanups.push(stop);updates.push(update);update();
  }
  updateActions=()=>updates.forEach(fn=>fn());
  actionCleanup=()=>{cleanups.forEach(fn=>fn());updateActions=()=>{};};
 }
 function begin(kind){const token=operations.begin(kind);if(!token)tell('Wait for the current file operation to finish.');return token;}
 function current(token){return !!token?.current()&&valid();}
 function claim(token,path){if(!token.claimDocument('mirror:'+path)||!current(token))throw Error('This file is busy in another window.');}

 const frames=new Set(),timers=new Map(),valid=()=>!disposed&&!host.signal.aborted&&body.isConnected&&signedInSubject()===owner&&host.session?.()===session;
 const tell=message=>{if(valid())status.textContent=message;};
 const pause=ms=>new Promise((resolve,reject)=>{if(disposed||host.signal.aborted){reject(Error('Window closed.'));return;}const id=setTimeout(()=>{timers.delete(id);resolve();},ms);timers.set(id,reject);});
 function detach(frame){if(!frame)return;frames.delete(frame);try{frame.contentWindow?.__CAD_APP?.projectService?.dispose?.();}catch(error){console.error('CAD document cleanup failed',error);}try{frame.src='about:blank';}catch{}frame.remove();}
 function createFrame(hidden){const frame=document.createElement('iframe');frame.title='jSketcher CAD modeler';frame.sandbox='allow-scripts allow-same-origin allow-modals';frame.className='jsketcher-frame'+(hidden?' jsketcher-staging':'');frame.src=new URL('./node_modules/jsketcher-build/index-webos.html?DEFAULT&webos=1',import.meta.url).href;frames.add(frame);stage.append(frame);return frame;}
 async function waitReady(frame){const deadline=Date.now()+60000;while(valid()&&frames.has(frame)){let ctx;try{ctx=frame.contentWindow?.__CAD_APP;}catch{}if(ctx?.streams?.lifecycle?.projectLoaded?.value&&ctx.projectManager?.snapshotCurrentProject&&ctx.projectManager?.restoreSnapshotInEmptyWorkspace){if(typeof ctx.projectService?.bindHostLifetime==='function'&&!ctx.projectService.hasHostLifetime)ctx.projectService.bindHostLifetime({signal:host.signal,valid:()=>valid()&&frames.has(frame)&&frame.contentWindow?.__CAD_APP===ctx});return ctx;}if(Date.now()>deadline)throw Error('jSketcher took too long to start.');await pause(50);}throw Error('The window or account changed.');}
 function supportedEnvelope(value){if(value?.format!=='codi-jsketcher-project'||value.version!==2||value.unit!=='millimeter'||!value.project||typeof value.project!=='object'||Array.isArray(value.project))throw Error('The CAD runtime returned an unsupported project format or units.');return value;}
 function snapshot(frame=active){if(!valid()||!frame||!frames.has(frame))throw Error('The modeling window is unavailable.');const ctx=frame.contentWindow?.__CAD_APP;if(!ctx?.projectManager)throw Error('The model is still loading.');return JSON.stringify(supportedEnvelope(ctx.projectManager.snapshotCurrentProject()));}
 function unchanged(frame,previous){try{return frame===active&&snapshot(frame)===previous;}catch{return false;}}
 function inspectSaveTarget(){
  if(busy||!valid()||!active||baseline===null||!frames.has(active))throw Error('Wait for this modeling window to finish loading or saving.');
  const ctx=active.contentWindow?.__CAD_APP,craft=ctx?.craftService;
  if(!ctx?.streams?.lifecycle?.projectLoaded?.value||craft?.isProcessing||craft?.pipelineFailure$?.value||craft?.isEditingHistory||ctx.services?.sketcher?.inPlaceEditor?.inEditMode||ctx.wizardService?.workingRequest$?.value)throw Error('Finish the current sketch, operation or history edit before saving.');
  const revision=ctx.projectManager?.inspectDocumentRevision?.();
  if(typeof revision!=='string'||!revision)throw Error('Document revision inspection is unavailable.');
  return {revision,path:state.path};
 }
 // The desktop must call this from its close guard; if the model is in an
 // unsupported intermediate state, prefer a confirmation to data loss.
 state.hasChanges=()=>{if(busy||!valid()||!active||baseline===null)return true;try{return snapshot()!==baseline;}catch{return true;}};
 if(host.commands){
  const unregister=host.commands.register({id:'inspect',description:'Inspect bounded modeling history and save state for this CAD window.',parameters:{type:'object',additionalProperties:false}},args=>{
   if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).length)throw Error('This command accepts no arguments.');
   if(busy||!valid()||!active||baseline===null||!frames.has(active))throw Error('Wait for this model to finish loading or its file operation to finish.');
   const ctx=active.contentWindow?.__CAD_APP,craft=ctx?.craftService;
   if(!ctx?.streams?.lifecycle?.projectLoaded?.value||typeof craft?.isProcessing!=='boolean'||!ctx?.projectService||!ctx?.services?.storage)throw Error('Model readiness is unavailable.');
   if(craft.isProcessing||craft.pipelineFailure$.value||craft.isEditingHistory||ctx.services.sketcher.inPlaceEditor.inEditMode||ctx.wizardService.workingRequest$.value)throw Error('Finish the current sketch, operation or history edit before inspecting.');
   const history=craft.modifications$.value.history,assembly=ctx.assemblyService.getConstraints(),workbench=ctx.workbenchService.currentWorkbench$.value;
   if(!Array.isArray(history)||!Array.isArray(assembly)||assembly.length||(workbench&&!workbench.internal&&workbench.workbenchId!==ctx.workbenchService.defaultWorkbenchId))throw Error('This project uses an unsupported assembly or workbench.');
   const namespace=ctx.projectService.sketchStorageNamespace,keys=ctx.services.storage.getAllKeysFromNamespace(namespace).sort();
   const model={history,expressions:ctx.expressionService.script$.value,assembly};
   if(ctx.projectService.counterGenerator)model.counters=ctx.projectService.counterGenerator.projectCounters;
   // Recreate the saved snapshot from read-only state; do not call the fork's
   // snapshotCurrentProject(), which writes its project to workspace storage.
   const savedModel=JSON.parse(JSON.stringify(model)),sketches=keys.map(key=>({id:key.substring(namespace.length),data:JSON.parse(ctx.services.storage.get(key))}));
   const surfacing=ctx.surfacingService?.save();
   const operations=history.slice(0,100).map(op=>{if(!op||typeof op.type!=='string')throw Error('The operation history is unavailable.');return op.type.slice(0,128);});
   const project={model:savedModel,sketches,...(surfacing?{surfacing}:{})};
   const getter=typeof ctx.projectManager?.getManufacturingMetadata==='function'?()=>ctx.projectManager.getManufacturingMetadata():null;
   return {path:state.path,revision:inspectSaveTarget().revision,dirty:inspectedProjectIsDirty(project,baseline,getter,ctx.projectManager.unit),surfacingPatchCount:surfacing?.scene?.patches?.length||0,operationCount:history.length,operations,operationsTruncated:history.length>100,sketchCount:keys.length,note:'Modeling data only; this does not validate CAD geometry or physical manufacturing.'};
  });host.onDispose(unregister);
  host.onDispose(registerDocumentSaveCommand(host,{inspect:inspectSaveTarget,save:args=>saveProject(false,args)}));
  host.onDispose(registerSketchCommands(host,()=>{
   if(busy||!valid()||!active||baseline===null||!frames.has(active))throw Error('Wait for this modeling window to finish loading.');
   const frame=active,ctx=frame.contentWindow?.__CAD_APP,editor=ctx?.services?.sketcher?.inPlaceEditor,context=editor?.sketcherAppContext;
   if(!editor?.inEditMode||!context?.viewer||ctx.projectManager?.unit!=='millimeter'||ctx.craftService?.isProcessing)throw Error('Open a supported sketch before using sketch commands.');
   return {context,valid:()=>valid()&&!busy&&active===frame&&frames.has(frame)&&frame.contentWindow?.__CAD_APP===ctx&&editor.inEditMode&&editor.sketcherAppContext===context&&!ctx.craftService.isProcessing};
  }));
 }
 const rectangle=createRectangleController(host,()=>{
  if(busy||!valid()||!active||baseline===null||!frames.has(active))throw Error('Wait for this modeling window to finish loading.');
  const frame=active,ctx=frame.contentWindow?.__CAD_APP;
  return {craft:ctx?.craftService,valid:()=>valid()&&!busy&&active===frame&&frames.has(frame)&&frame.contentWindow?.__CAD_APP===ctx};
 });
 if(host.commands){host.onDispose(rectangle.register());host.onDispose(registerFeatureCommands(host,()=>rectangle.target()));}
 if(host.commands)host.onDispose(registerMaterialCommands(host,()=>{
  if(busy||!valid()||!active||baseline===null||!frames.has(active))throw Error('Wait for this modeling window to finish loading.');
  const frame=active,ctx=frame.contentWindow?.__CAD_APP,manager=ctx?.projectManager;
  return {manager,valid:()=>valid()&&!busy&&active===frame&&frames.has(frame)&&frame.contentWindow?.__CAD_APP===ctx&&ctx?.projectManager===manager};
 }));
 let rectangleDialog=null;
 function closeRectangleDialog(){if(rectangleDialog){clearInterval(rectangleDialog.timer);rectangleDialog.controller.abort();rectangleDialog.dialog.remove();rectangleDialog=null;}}
 function openRectangleDialog(){
  if(rectangleDialog)return;closeRectangleEditDialog();
  let target,capability;try{target=rectangle.target();capability=target.craft.inspectRectangleCreation();if(!target.valid())throw Error('The window or account changed.');if(!capability.ready)throw Error(capability.reason||'Finish the current operation first.');}catch(e){tell(e.message);return;}
  const dialog=document.createElement('dialog');dialog.className='jsketcher-rectangle-dialog';
  const form=document.createElement('form');form.method='dialog';
  const heading=document.createElement('h2');heading.textContent='Dimensioned rectangle';form.append(heading);
  const help=document.createElement('p');help.textContent='XY plane · dimensions and position in millimeters';form.append(help);
  const inputs={};for(const [key,label,value] of [['width','Width',100],['height','Height',50],['x','Origin X',0],['y','Origin Y',0],['depth','Plane depth',0]]){
   const row=document.createElement('label'),field=document.createElement('input');row.textContent=label;field.type='number';field.step='any';field.required=true;field.value=String(value);field.name=key;row.append(field);form.append(row);inputs[key]=field;
  }
  const error=document.createElement('p');error.setAttribute('role','alert');form.append(error);
  const actions=document.createElement('div'),cancel=document.createElement('button'),submit=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';submit.type='submit';submit.textContent='Create';actions.append(cancel,submit);form.append(actions);dialog.append(form);body.append(dialog);
  const controller=new AbortController(),timer=setInterval(()=>{if(!target.valid())closeRectangleDialog();},100);rectangleDialog={dialog,timer,controller};cancel.addEventListener('click',closeRectangleDialog);dialog.addEventListener('cancel',e=>{e.preventDefault();closeRectangleDialog();});
  form.addEventListener('submit',async e=>{e.preventDefault();if(!target.valid()){closeRectangleDialog();return;}
   const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,Number(input.value)]));
   if(Object.values(inputs).some(input=>!input.value.trim())||Object.values(values).some(n=>!Number.isFinite(n))){error.textContent='Enter finite numbers for all fields.';return;}
   submit.disabled=true;error.textContent='';
   try{await rectangle.create({revision:capability.revision,unit:'millimeter',origin:[values.x,values.y],width:values.width,height:values.height,depth:values.depth},target,controller.signal);closeRectangleDialog();tell('Rectangle created in the workspace. Save the project to My files to keep it.');}
   catch(e){if(!target.valid()){closeRectangleDialog();return;}error.textContent=e?.message||'Could not create rectangle.';submit.disabled=false;}
  });dialog.showModal();
 }
 let rectangleEditDialog=null;
 function closeRectangleEditDialog(){if(rectangleEditDialog){clearInterval(rectangleEditDialog.timer);rectangleEditDialog.controller.abort();rectangleEditDialog.dialog.remove();rectangleEditDialog=null;}}
 function openRectangleEditDialog(){
  if(rectangleEditDialog)return;closeRectangleDialog();
  let target,capability;try{target=rectangle.target();capability=rectangle.inspectDimensions(target);if(!target.valid())throw Error('The window or account changed.');if(!capability.ready)throw Error(capability.reason||'Finish the current operation first.');if(!capability.candidates.length)throw Error('No supported authored rectangles are available.');}catch(e){tell(e.message);return;}
  const dialog=document.createElement('dialog');dialog.className='jsketcher-rectangle-dialog';
  const form=document.createElement('form');form.method='dialog';
  const heading=document.createElement('h2');heading.textContent='Edit rectangle dimensions';form.append(heading);
  const help=document.createElement('p');help.textContent='Dimensions in millimeters';form.append(help);
  const choiceRow=document.createElement('label'),choice=document.createElement('select');choiceRow.textContent='Rectangle';
  capability.candidates.forEach((candidate,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`Rectangle ${index+1} (${candidate.width} × ${candidate.height} mm)`;choice.append(option);});choiceRow.append(choice);form.append(choiceRow);
  const inputs={};for(const [key,label] of [['width','Width'],['height','Height']]){const row=document.createElement('label'),field=document.createElement('input');row.textContent=label;field.type='number';field.step='any';field.required=true;field.name=key;row.append(field);form.append(row);inputs[key]=field;}
  const selectCandidate=()=>{const candidate=capability.candidates[Number(choice.value)];if(candidate){inputs.width.value=String(candidate.width);inputs.height.value=String(candidate.height);}};choice.addEventListener('change',selectCandidate);selectCandidate();
  const error=document.createElement('p');error.setAttribute('role','alert');form.append(error);
  const actions=document.createElement('div'),cancel=document.createElement('button'),submit=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';submit.type='submit';submit.textContent='Update';actions.append(cancel,submit);form.append(actions);dialog.append(form);body.append(dialog);
  const controller=new AbortController(),timer=setInterval(()=>{if(!target.valid())closeRectangleEditDialog();},100);rectangleEditDialog={dialog,timer,controller};cancel.addEventListener('click',closeRectangleEditDialog);dialog.addEventListener('cancel',e=>{e.preventDefault();closeRectangleEditDialog();});
  form.addEventListener('submit',async e=>{e.preventDefault();if(!target.valid()){closeRectangleEditDialog();return;}const candidate=capability.candidates[Number(choice.value)],width=Number(inputs.width.value),height=Number(inputs.height.value);
   if(!candidate||!inputs.width.value.trim()||!inputs.height.value.trim()||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0){error.textContent='Enter positive finite dimensions.';return;}
   submit.disabled=true;error.textContent='';try{await rectangle.edit({revision:capability.revision,faceId:candidate.faceId,width,height},target,controller.signal);closeRectangleEditDialog();tell('Rectangle updated in the workspace. Save the project to My files to keep it.');}catch(e){if(!target.valid()){closeRectangleEditDialog();return;}error.textContent=e?.message||'Could not edit rectangle.';submit.disabled=false;}
  });dialog.showModal();
 }
 function setWatch(c,path,version){watch();watch=()=>{};const serial=++watchRevision;warning.hidden=true;warning.textContent='';const check=async()=>{const seq=++checkRevision;let message='';try{const entry=await c.files.stat(path);if(entry.status==='conflict')message='This project has conflicting copies. Resolve them in Files before saving.';else if(entry.version!==version)message='The saved project changed. Save a copy or open it again.';}catch{message='The saved project is unavailable. Your current model remains open.';}if(valid()&&c.valid()&&serial===watchRevision&&seq===checkRevision&&state.path===path&&state.version===version){warning.textContent=message;warning.hidden=!message;}};watch=c.files.subscribe(check);queueMicrotask(check);}
 async function reviewManufacturing(){
  if(!valid()||!active)return;const token=begin('review');if(!token)return;const frame=active,manager=frame.contentWindow?.__CAD_APP?.projectManager;
  try{
   if(typeof manager?.proposeHostManufacturingRebind!=='function'||typeof manager?.confirmHostManufacturingRebind!=='function')throw Error('Assignment review is unavailable.');
   const proposal=await manager.proposeHostManufacturingRebind();if(!current(token)||frame!==active)return;
   const accepted=await host.ui.confirm(`The model changed. ${proposal.regionCount} regions in ${proposal.objectCount} printable objects still have uniquely identified producing operations. Assignments: ${proposal.details.join('; ')}. Inspect the model and assignments before confirming. This does not verify geometry or manufacturing safety.`,{title:'Review material assignments',confirmLabel:'Keep these assignments',cancelLabel:'Keep editing',signal:token.signal});
   if(!accepted||!current(token)||frame!==active){manager.cancelHostManufacturingRebind?.();return;}
   manager.confirmHostManufacturingRebind(proposal.token);review.hidden=true;tell('Assignments updated for this model. Save to keep the changes.');
  }catch(e){manager?.cancelHostManufacturingRebind?.();tell('Could not update assignments: '+e.message);}finally{token.finish();}
 }
 async function openProject(selected,{initial=false,token:reserved=null}={}){
  const token=reserved||begin('open');if(!token)return;if(!current(token)||!active){token.finish();return;}tell('Preparing to open a project…');let next=null,file=null;
  try{
   const previous=active,prior=snapshot(previous);
   if(baseline===null||prior!==baseline){const accepted=await host.ui.confirm('Discard the unsaved model and open a different project?',{title:'Unsaved changes',confirmLabel:'Discard and open',cancelLabel:'Keep editing',danger:true,signal:token.signal});if(!accepted||!current(token))return;if(!unchanged(previous,prior))throw Error('The model changed during confirmation. Try again.');}
   const chosen=selected||await host.storage.pickFile({extensions:['.jsketcher.json'],signal:token.signal});if(!chosen||!current(token))return;if(!unchanged(previous,prior))throw Error('The model changed while choosing a file. Try again.');
   const c=await mirrorFileContext();if(!current(token)||!c.valid())return;const p=c.path(chosen);claim(token,p);file=await acquireVersionedSnapshot(c.files,p,{maximumBytes:128*1024*1024,valid:()=>current(token)&&c.valid()&&previous===active,signal:token.signal});if(!current(token)||!c.valid())return;
   if(!unchanged(previous,prior))throw Error('The model changed while opening. Try again.');tell('Rebuilding the selected model…');next=createFrame(true);candidate=next;const ctx=await waitReady(next);if(!current(token)||!c.valid())return;
   if(typeof ctx.projectManager.restoreSnapshotBytesInEmptyWorkspace!=='function')throw Error('This CAD runtime cannot validate file snapshots in a worker.');
   await ctx.projectManager.restoreSnapshotBytesInEmptyWorkspace(file.data,{signal:token.signal,valid:()=>current(token)&&c.valid()&&previous===active&&candidate===next&&frames.has(next)});if(!current(token)||!c.valid())return;
   const restored=snapshot(next),now=await c.files.stat(p);if(!current(token)||!c.valid())return;if(now.version!==file.version||now.status==='conflict')throw Error('The project changed while opening. Try again.');if(!unchanged(previous,prior))throw Error('The model changed while opening. Try again.');
   if(!token.setDocument('mirror:'+p)||!current(token))throw Error('The window or file changed.');
   active=next;candidate=null;next=null;bindActions(active.contentWindow?.__CAD_APP);active.classList.remove('jsketcher-staging');detach(previous);baseline=restored;state.path=p;state.version=file.version;w.launchContext=Object.freeze({version:1,storage:'mirror',path:p,owner});w.title=p.split('/').pop()+' — jSketcher';setWatch(c,p,file.version);retry.hidden=true;review.hidden=true;tell('Opened '+p+'.');
  }catch(e){tell('Could not open project: '+e.message+(initial?'':' The current model remains open.'));}finally{file?.release();if(next)detach(next);if(candidate===next)candidate=null;token.finish();}
 }
 async function saveProject(asCopy=false,command=null){
  if(command){const target=inspectSaveTarget();if(target.revision!==command.revision)throw Error('The model changed; inspect it before saving.');if(target.path&&Object.hasOwn(command,'path'))throw Error('Save uses the open project path.');}
  if(!valid()||!active)return;const token=begin(asCopy?'save-as':'save');if(!token)return;let writeStarted=false;
  try{
   const frame=active;let capture,content;
   {
    const manager=frame.contentWindow?.__CAD_APP?.projectManager;
    if(command&&frame.contentWindow?.__CAD_APP?.projectManager?.inspectDocumentRevision?.()!==command.revision)throw Error('The model changed before saving; inspect it again.');
    if(typeof manager?.prepareHostSave!=='function')throw Error('Manufacturing save validation is unavailable.');
    capture=await manager.prepareHostSave({signal:token.signal,valid:()=>current(token)&&frame===active});
    if(!current(token)||frame!==active)return;
    if(!capture.isCurrent())throw Error('The model changed while preparing the save. Try again.');
    content=JSON.stringify(supportedEnvelope(capture.envelope));
   }
   if(new Blob([content]).size>128*1024*1024)throw Error('Project exceeds 128 MiB.');
   let chosen=state.path||command?.path;if(asCopy||!chosen){if(command)throw Error('An untitled project needs a My files path.');const defaultName=chosen||'/Design.jsketcher.json';chosen=await host.ui.prompt('Save the project to My files:',{title:asCopy?'Save project as':'Save project',value:defaultName,confirmLabel:'Save',signal:token.signal});if(chosen===null||!current(token))return;}
   const c=await mirrorFileContext();if(!current(token)||!c.valid()||frame!==active)return;const p=c.path(chosen);claim(token,p);if(!/\.jsketcher\.json$/i.test(p))throw Error('Use a .jsketcher.json filename.');let expected=null,old;
   try{old=await c.files.stat(p);}catch(e){if(e.message!=='File not found.')throw e;}
   if(old){if(old.status==='conflict')throw Error('Resolve this project conflict in Files first.');if(p===state.path&&state.version){if(old.version!==state.version)throw Error('The saved project changed. Save a copy or reopen it.');}else{if(command)throw Error('The selected filename already exists. Choose a new filename or open that project first.');if(!await host.ui.confirm('Replace '+p+'?',{title:'Replace project?',confirmLabel:'Replace',cancelLabel:'Keep existing',danger:true,signal:token.signal}))return;if(!current(token)||!c.valid()||frame!==active)return;const latest=await c.files.stat(p);if(latest.status==='conflict'||latest.version!==old.version)throw Error('The project changed while confirming. Try again.');}expected=old.version;
   }else if(p===state.path&&state.version)throw Error('The saved project was removed. Save a copy or reopen it.');
   if(!current(token)||!c.valid()||frame!==active)return;if(!capture.isCurrent())throw Error('The model changed while choosing where to save. Try again.');writeStarted=true;const result=await c.files.write(p,content,expected);if(!current(token)||!c.valid()||frame!==active)return;if(!token.setDocument('mirror:'+p)||!current(token))throw Error('The window or file changed after saving.');state.path=p;state.version=result.version;w.launchContext=Object.freeze({version:1,storage:'mirror',path:p,owner});w.title=p.split('/').pop()+' — jSketcher';baseline=content;setWatch(c,p,result.version);const earlier=!capture.isCurrent();tell(result.status==='conflict'?'Saved on this device with a conflict. Resolve it in Files.':earlier?'Saved an earlier model on this device; newer changes remain unsaved.':'Saved on this device; syncing with the server: '+p+'.');
   return Object.freeze({path:p,version:result.version,status:result.status,dirty:earlier,persistence:'browser',serverStatus:'not-verified'});
  }catch(e){if(/review material assignments/i.test(e.message))review.hidden=false;tell('Could not finish saving: '+e.message+(writeStarted?' The file may have been saved; check Files before retrying.':''));if(command){if(writeStarted)Object.defineProperty(e,'possiblyCommitted',{value:true,enumerable:true});throw e;}}finally{token.finish();}
 }
 // Research-only, scoped to supported assigned models. The iframe never gets
 // account credentials; this host owns file selection and version checks.
 async function export3mf(){
  if(!valid()||!active)return;const token=begin('export-3mf');if(!token)return;let writeStarted=false;
  try{
   const frame=active,prior=snapshot(frame),manager=frame.contentWindow?.__CAD_APP?.projectManager;
   if(typeof manager?.exportCore3mfResearch!=='function')throw Error('3MF export is unavailable.');
   const chosen=await host.ui.prompt('Export the model to My files:',{title:'Export 3MF',value:'/Design.3mf',confirmLabel:'Export',signal:token.signal});
   if(chosen===null||!current(token))return;
   if(!unchanged(frame,prior))throw Error('The model changed while choosing a file. Try again.');
   const c=await mirrorFileContext();if(!current(token)||!c.valid()||frame!==active)return;
   const p=c.path(chosen);claim(token,p);if(!/\.3mf$/i.test(p))throw Error('Use a .3mf filename.');let expected=null,old;
   try{old=await c.files.stat(p);}catch(e){if(e.message!=='File not found.')throw e;}
   if(old){
    if(old.status==='conflict')throw Error('Resolve this file conflict in Files first.');
    if(!await host.ui.confirm('Replace '+p+'?',{title:'Replace export?',confirmLabel:'Replace',cancelLabel:'Keep existing',danger:true,signal:token.signal}))return;
    if(!current(token)||!c.valid()||frame!==active)return;
    const latest=await c.files.stat(p);if(latest.status==='conflict'||latest.version!==old.version)throw Error('The file changed while confirming. Try again.');expected=old.version;
   }
   if(!unchanged(frame,prior))throw Error('The model changed while preparing export. Try again.');
   tell('Preparing the 3MF model…');const bytes=await manager.exportCore3mfResearch({signal:token.signal,valid:()=>current(token)&&frame===active});
   if(!current(token)||!c.valid()||frame!==active)return;
   if(!(bytes instanceof frame.contentWindow.Uint8Array)||bytes.byteLength>128*1024*1024)throw Error('The 3MF export is invalid or too large.');
   if(!unchanged(frame,prior))throw Error('The model changed during export. Try again.');
   writeStarted=true;const result=await c.files.write(p,bytes,expected);
   if(!current(token)||!c.valid()||frame!==active)return;
   tell(result.status==='conflict'?'Export saved with a conflict. Resolve it in Files.':!unchanged(frame,prior)?'Exported the earlier model; newer changes are not included.':'Exported to My files; syncing with the server: '+p+'.');
  }catch(e){tell('Could not export 3MF: '+e.message+(writeStarted?' The file may have been saved; check Files before retrying.':''));}finally{token.finish();}
 }
 async function importDxf(){
  if(!valid()||!active)return;const token=begin('import-dxf');if(!token)return;
  try{
   const frame=active,service=frame.contentWindow?.__CAD_APP?.services?.sketcher,editor=service?.inPlaceEditor,viewer=editor?.viewer;
   if(!editor?.inEditMode||!viewer||typeof service.importDxfSketch!=='function')throw Error('Open a sketch before importing a DXF file.');
   if(viewer.toolManager.tool!==viewer.toolManager.defaultTool)throw Error('Finish or cancel the current drawing tool first.');
   const before=viewer.io.serializeSketch(undefined,{strict:true});
   const selected=await host.storage.pickFile({extensions:['.dxf'],signal:token.signal});if(!selected||!current(token))return;
   if(frame!==active||service.inPlaceEditor.viewer!==viewer||viewer.io.serializeSketch(undefined,{strict:true})!==before)throw Error('The sketch changed while choosing a file. Try again.');
   const c=await mirrorFileContext();if(!current(token)||!c.valid())return;const p=c.path(selected);claim(token,p);const file=await readVersionedBytes(c.files,p,{maximumBytes:16*1024*1024,valid:()=>current(token)&&c.valid()&&frame===active,signal:token.signal});
   if(!current(token)||!c.valid())return;if(file.status==='conflict')throw Error('Resolve this file conflict in Files first.');
   if(file.data.byteLength>16*1024*1024)throw Error('DXF files must be 16 MiB or smaller.');
   const text=new TextDecoder('utf-8',{fatal:true}).decode(file.data),now=await c.files.stat(p);
   if(!current(token)||!c.valid())return;if(now.version!==file.version||now.status==='conflict')throw Error('The file changed while opening. Try again.');
   if(frame!==active||service.inPlaceEditor.viewer!==viewer||viewer.io.serializeSketch(undefined,{strict:true})!==before)throw Error('The sketch changed while opening the file. Try again.');
   tell('Importing DXF shapes…');await service.importDxfSketch(viewer,text,before);
   if(current(token)&&frame===active)tell('Imported supported shapes from '+p+'. Save the project to keep them.');
  }catch(e){tell('Could not import DXF: '+e.message+' The existing sketch was kept where recovery was possible.');}finally{token.finish();}
 }
 function receive(event){if(!valid()||event.origin!==location.origin||event.source!==active?.contentWindow)return;const data=event.data?.codiJSketcher;if(data?.type==='rectangle-dialog'&&Object.keys(data).length===1){openRectangleDialog();return;}if(data?.type==='rectangle-edit-dialog'&&Object.keys(data).length===1){openRectangleEditDialog();return;}if(!data||data.type!=='file-action'||!['open','save','save-as','import-dxf','export-3mf'].includes(data.action))return;if(busy){tell('Wait for the current file operation to finish.');return;}if(data.action==='open')void openProject();else if(data.action==='import-dxf')void importDxf();else if(data.action==='export-3mf')void export3mf();else void saveProject(data.action==='save-as');}
 window.addEventListener('message',receive);
 const retry=textButton('Retry opening project',()=>{if(w.launchContext?.storage==='mirror'&&w.launchContext.owner===owner)void openProject(w.launchContext.path,{initial:true});});retry.hidden=true;
 const review=textButton('Review material assignments',()=>void reviewManufacturing());review.hidden=true;
 body.append(warning,stage,status,retry,review);
 const initialToken=begin('initial-load');
 queueMicrotask(async()=>{if(!initialToken)return;try{if(!current(initialToken))return;active=createFrame(false);const ctx=await waitReady(active);if(!current(initialToken))return;bindActions(ctx);baseline=snapshot();tell('New model. Use File to open or save a project in My files.');if(w.launchContext?.storage==='mirror'&&w.launchContext.owner===owner){await openProject(w.launchContext.path,{initial:true,token:initialToken});if(valid()&&state.path!==w.launchContext.path)retry.hidden=false;}}catch(e){tell('Could not start jSketcher: '+e.message);}finally{initialToken.finish();}});
 return {element:body,dispose(){if(disposed)return;disposed=true;abortSources();sourceClose?.();sourceClose=null;host.signal.removeEventListener('abort',abortSources);unsubscribeOperations();actionCleanup();closeRectangleDialog();closeRectangleEditDialog();watchRevision++;checkRevision++;watch();delete state.hasChanges;window.removeEventListener('message',receive);for(const [id,reject] of timers){clearTimeout(id);reject(Error('Window closed.'));}timers.clear();for(const frame of [...frames])detach(frame);candidate=null;active=null;}};
}
