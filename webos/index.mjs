import './style.css';

// The embedded CAD app owns only its temporary model. The host owns account
// storage, confirmation, version checks and the lifetime of every iframe.
export function mount(host){
 const {w}=host,{make,textButton}=host.ui,{mirrorFileContext,signedInSubject}=host.storage;
 const owner=w.launchContext?.owner||signedInSubject(),state=w.jsketcher??={path:null,version:null};w.ownerSub=owner;
 const body=make('div','window-content jsketcher-app'),stage=make('div','jsketcher-stage'),status=make('p','app-status','Loading jSketcher…'),warning=make('p','jsketcher-file-warning');
 warning.hidden=true;warning.setAttribute('role','status');status.setAttribute('aria-live','polite');stage.setAttribute('aria-label','jSketcher modeling workspace');
 let disposed=false,busy=false,active=null,candidate=null,baseline=null,watch=()=>{},watchRevision=0,checkRevision=0;
 const frames=new Set(),timers=new Map(),valid=()=>!disposed&&!host.signal.aborted&&body.isConnected&&signedInSubject()===owner;
 const tell=message=>{if(valid())status.textContent=message;};
 const pause=ms=>new Promise((resolve,reject)=>{if(disposed||host.signal.aborted){reject(Error('Window closed.'));return;}const id=setTimeout(()=>{timers.delete(id);resolve();},ms);timers.set(id,reject);});
 function detach(frame){if(!frame)return;frames.delete(frame);try{frame.src='about:blank';}catch{}frame.remove();}
 function createFrame(hidden){const frame=document.createElement('iframe');frame.title='jSketcher CAD modeler';frame.sandbox='allow-scripts allow-same-origin allow-modals';frame.className='jsketcher-frame'+(hidden?' jsketcher-staging':'');frame.src=new URL('./node_modules/jsketcher-build/index-webos.html?DEFAULT&webos=1',import.meta.url).href;frames.add(frame);stage.append(frame);return frame;}
 async function waitReady(frame){const deadline=Date.now()+60000;while(valid()&&frames.has(frame)){try{const ctx=frame.contentWindow?.__CAD_APP;if(ctx?.streams?.lifecycle?.projectLoaded?.value&&ctx.projectManager?.snapshotCurrentProject&&ctx.projectManager?.restoreSnapshotInEmptyWorkspace)return ctx;}catch{}if(Date.now()>deadline)throw Error('jSketcher took too long to start.');await pause(50);}throw Error('The window or account changed.');}
 function snapshot(frame=active){if(!valid()||!frame||!frames.has(frame))throw Error('The modeling window is unavailable.');const ctx=frame.contentWindow?.__CAD_APP;if(!ctx?.projectManager)throw Error('The model is still loading.');return JSON.stringify(ctx.projectManager.snapshotCurrentProject());}
 function unchanged(frame,previous){try{return frame===active&&snapshot(frame)===previous;}catch{return false;}}
 // The desktop must call this from its close guard; if the model is in an
 // unsupported intermediate state, prefer a confirmation to data loss.
 state.hasChanges=()=>{if(busy||!valid()||!active||baseline===null)return true;try{return snapshot()!==baseline;}catch{return true;}};
 function setWatch(c,path,version){watch();watch=()=>{};const serial=++watchRevision;warning.hidden=true;warning.textContent='';const check=async()=>{const seq=++checkRevision;let message='';try{const entry=await c.files.stat(path);if(entry.status==='conflict')message='This project has conflicting copies. Resolve them in Files before saving.';else if(entry.version!==version)message='The saved project changed. Save a copy or open it again.';}catch{message='The saved project is unavailable. Your current model remains open.';}if(valid()&&c.valid()&&serial===watchRevision&&seq===checkRevision&&state.path===path&&state.version===version){warning.textContent=message;warning.hidden=!message;}};watch=c.files.subscribe(check);queueMicrotask(check);}
 async function openProject(selected,{initial=false}={}){
  if(busy||!valid()||!active)return;tell('Preparing to open a project…');busy=true;let next=null;
  try{
   const previous=active,prior=snapshot(previous);
   if(baseline===null||prior!==baseline){const accepted=await host.ui.confirm('Discard the unsaved model and open a different project?',{title:'Unsaved changes',confirmLabel:'Discard and open',cancelLabel:'Keep editing',danger:true,signal:host.signal});if(!accepted||!valid())return;if(!unchanged(previous,prior))throw Error('The model changed during confirmation. Try again.');}
   const chosen=selected||await host.storage.pickFile({extensions:['.jsketcher.json'],signal:host.signal});if(!chosen||!valid())return;if(!unchanged(previous,prior))throw Error('The model changed while choosing a file. Try again.');
   const c=await mirrorFileContext();if(!valid()||!c.valid())return;const p=c.path(chosen),file=await c.files.read(p);if(!valid()||!c.valid())return;if(file.status==='conflict')throw Error('Resolve this project conflict in Files first.');if(file.data.byteLength>128*1024*1024)throw Error('Project exceeds 128 MiB.');const json=new TextDecoder('utf-8',{fatal:true}).decode(file.data);
   if(!unchanged(previous,prior))throw Error('The model changed while opening. Try again.');tell('Rebuilding the selected model…');next=createFrame(true);candidate=next;const ctx=await waitReady(next);if(!valid()||!c.valid())return;await ctx.projectManager.restoreSnapshotInEmptyWorkspace(json);if(!valid()||!c.valid())return;
   const restored=snapshot(next),now=await c.files.stat(p);if(!valid()||!c.valid())return;if(now.version!==file.version||now.status==='conflict')throw Error('The project changed while opening. Try again.');if(!unchanged(previous,prior))throw Error('The model changed while opening. Try again.');
   active=next;candidate=null;next=null;active.classList.remove('jsketcher-staging');detach(previous);baseline=restored;state.path=p;state.version=file.version;w.launchContext=Object.freeze({version:1,storage:'mirror',path:p,owner});w.title=p.split('/').pop()+' — jSketcher';setWatch(c,p,file.version);retry.hidden=true;tell('Opened '+p+'.');
  }catch(e){tell('Could not open project: '+e.message+(initial?'':' The current model remains open.'));}finally{if(next)detach(next);if(candidate===next)candidate=null;busy=false;}
 }
 async function saveProject(asCopy=false){
  if(busy||!valid()||!active)return;busy=true;let writeStarted=false;
  try{
   const frame=active,content=snapshot(frame);if(new Blob([content]).size>128*1024*1024)throw Error('Project exceeds 128 MiB.');
   let chosen=state.path;if(asCopy||!chosen){const defaultName=chosen||'/Design.jsketcher.json';chosen=await host.ui.prompt('Save the project to My files:',{title:asCopy?'Save project as':'Save project',value:defaultName,confirmLabel:'Save',signal:host.signal});if(chosen===null||!valid())return;}
   const c=await mirrorFileContext();if(!valid()||!c.valid()||frame!==active)return;const p=c.path(chosen);if(!/\.jsketcher\.json$/i.test(p))throw Error('Use a .jsketcher.json filename.');let expected=null,old;
   try{old=await c.files.stat(p);}catch(e){if(e.message!=='File not found.')throw e;}
   if(old){if(old.status==='conflict')throw Error('Resolve this project conflict in Files first.');if(p===state.path&&state.version){if(old.version!==state.version)throw Error('The saved project changed. Save a copy or reopen it.');}else{if(!await host.ui.confirm('Replace '+p+'?',{title:'Replace project?',confirmLabel:'Replace',cancelLabel:'Keep existing',danger:true,signal:host.signal}))return;if(!valid()||!c.valid()||frame!==active)return;const current=await c.files.stat(p);if(current.status==='conflict'||current.version!==old.version)throw Error('The project changed while confirming. Try again.');}expected=old.version;
   }else if(p===state.path&&state.version)throw Error('The saved project was removed. Save a copy or reopen it.');
   if(!valid()||!c.valid()||frame!==active)return;writeStarted=true;const result=await c.files.write(p,content,expected);if(!valid()||!c.valid()||frame!==active)return;state.path=p;state.version=result.version;w.launchContext=Object.freeze({version:1,storage:'mirror',path:p,owner});w.title=p.split('/').pop()+' — jSketcher';baseline=content;setWatch(c,p,result.version);const earlier=!unchanged(frame,content);tell(result.status==='conflict'?'Saved on this device with a conflict. Resolve it in Files.':earlier?'Saved an earlier model on this device; newer changes remain unsaved.':'Saved on this device; syncing with the server: '+p+'.');
  }catch(e){tell('Could not finish saving: '+e.message+(writeStarted?' The file may have been saved; check Files before retrying.':''));}finally{busy=false;}
 }
 function receive(event){if(!valid()||event.origin!==location.origin||event.source!==active?.contentWindow)return;const data=event.data?.codiJSketcher;if(!data||data.type!=='file-action'||!['open','save','save-as'].includes(data.action))return;if(busy){tell('Wait for the current file operation to finish.');return;}if(data.action==='open')void openProject();else void saveProject(data.action==='save-as');}
 window.addEventListener('message',receive);
 const retry=textButton('Retry opening project',()=>{if(w.launchContext?.storage==='mirror'&&w.launchContext.owner===owner)void openProject(w.launchContext.path,{initial:true});});retry.hidden=true;
 body.append(warning,stage,status,retry);
 queueMicrotask(async()=>{if(!valid())return;try{active=createFrame(false);await waitReady(active);if(!valid())return;baseline=snapshot();tell('New model. Use File to open or save a project in My files.');if(w.launchContext?.storage==='mirror'&&w.launchContext.owner===owner){await openProject(w.launchContext.path,{initial:true});if(valid()&&state.path!==w.launchContext.path)retry.hidden=false;}}catch(e){tell('Could not start jSketcher: '+e.message);}});
 return {element:body,dispose(){if(disposed)return;disposed=true;watchRevision++;checkRevision++;watch();delete state.hasChanges;window.removeEventListener('message',receive);for(const [id,reject] of timers){clearTimeout(id);reject(Error('Window closed.'));}timers.clear();for(const frame of [...frames])detach(frame);candidate=null;active=null;}};
}
