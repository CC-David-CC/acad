import {createCadAgent} from './examples/cad-agent.mjs';

// An ordinary app dialog over the same public command registry as console agents.
// Closing the panel stops later steps; the current atomic command may complete.
export function createAgentToolsPanel({host,valid,getFrame}){
 let dialog=null,job=null,disposed=false,timer=null;const lifetime=new AbortController();
 const alive=()=>!disposed&&!lifetime.signal.aborted&&!host.signal.aborted&&valid();
 const abort=()=>dispose();host.signal.addEventListener('abort',abort,{once:true});
 function close(){job?.controller.abort();if(dialog?.open)dialog.close();dialog?.remove();dialog=null;if(timer!==null)clearInterval(timer);timer=null;}
 function dispose(){if(disposed)return;disposed=true;lifetime.abort();close();host.signal.removeEventListener('abort',abort);}
 function open(){
  if(!alive())return;if(dialog){dialog.focus();return;}
  const ui=document.createElement('dialog');dialog=ui;ui.className='codi-confirm-dialog codi-cad-agent-tools';ui.setAttribute('aria-label','Agent tools');
  const style=document.createElement('style');style.textContent='.codi-cad-agent-tools{box-sizing:border-box;width:min(48rem,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);overflow:auto}.codi-cad-agent-tools button{min-height:44px;padding:.45rem .75rem;font:inherit}.codi-cad-agent-tools .agent-actions{display:flex;flex-wrap:wrap;gap:.4rem;margin:.6rem 0}.codi-cad-agent-tools label{display:grid;gap:.25rem;margin:.5rem 0}.codi-cad-agent-tools input{box-sizing:border-box;width:100%;font:inherit;padding:.4rem}.codi-cad-agent-tools pre{max-height:15rem;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;padding:.6rem;background:#0001}.codi-cad-agent-tools summary{cursor:pointer;min-height:32px}';
  const title=document.createElement('h2');title.textContent='Agent tools';
  const intro=document.createElement('p');intro.textContent='Local JavaScript examples using this window’s validated commands. No AI service is connected. Changes remain unsaved until Save.';
  const state=document.createElement('p');state.setAttribute('role','status');state.textContent='Discover commands to inspect this window.';
  const actions=document.createElement('div');actions.className='agent-actions';
  const log=document.createElement('pre');log.setAttribute('aria-label','Agent step log');log.setAttribute('aria-live','polite');log.textContent='';let lines=[];
  const write=message=>{if(dialog!==ui||!alive())return;lines.push(String(message).slice(0,1500));lines=lines.slice(-80);log.textContent=lines.join('\n');log.scrollTop=log.scrollHeight;};
  const paths={};for(const [key,label,value] of [['native','Native project path','/Agent-bracket.jsketcher.json'],['dxf','Sketch DXF path','/Agent-bracket.dxf'],['threeMf','Model 3MF path','/Agent-bracket.3mf']]){const row=document.createElement('label'),input=document.createElement('input');row.textContent=label;input.value=value;input.type='text';input.autocomplete='off';input.setAttribute('aria-label',label);row.append(input);paths[key]=input;ui.append(row);}
  const fields=[...ui.children];ui.replaceChildren(style,title,intro,state,actions,...fields);
  const note=document.createElement('p');note.textContent='The bracket demo requires a new empty project. DXF exports one discovered sketch; 3MF requires supported current geometry and material assignments and may refuse this model. File writes never retry automatically.';
  const examples=document.createElement('details'),summary=document.createElement('summary'),code=document.createElement('pre');summary.textContent='JavaScript calls';code.textContent='// Import createCadAgent from this loaded CAD app module.\nconst cad = createCadAgent({windowId: '+JSON.stringify(String(host.w.id))+'});\nawait cad.discover();\nawait cad.buildBracket();\nawait cad.resizeBracket();\nawait cad.verifyRejectedEdit();\nawait cad.save("/Agent-bracket.jsketcher.json");';examples.append(summary,code);
  const buttons=[];
  const commands=document.createElement('details'),commandSummary=document.createElement('summary'),commandList=document.createElement('pre');commandSummary.textContent='Discovered commands';commandList.textContent='Not yet inspected.';commands.append(commandSummary,commandList);
  function controls(){const disabled=!!job||host.documentOperations.busy;for(const b of buttons)b.disabled=disabled;for(const input of Object.values(paths))input.disabled=disabled;}
  async function perform(label,task,{replace=false}={}){
   if(job||!alive())return;const controller=new AbortController(),frame=getFrame();job={controller};controls();state.textContent=label+'…';write(label);
   try{
    const api=globalThis.codiDesktopCommands,scoped={list:()=>controller.signal.aborted||(!replace&&getFrame()!==frame)?[]:api.list(),execute:request=>{if(controller.signal.aborted||(!replace&&getFrame()!==frame))throw new DOMException('The panel or model changed.','AbortError');return api.execute(request);}};
    const agent=createCadAgent({api:scoped,windowId:String(host.w.id),signal:controller.signal,onStep:event=>{
     const result=event.result,details={};for(const key of ['revision','faceId','regionId','featureId','bodyId','path','status','changed'])if(['string','number','boolean'].includes(typeof result?.[key]))details[key]=result[key];
     write(event.command+': '+event.phase+(Object.keys(details).length?' '+JSON.stringify(details):'')+(event.error?' — '+event.error.message:''));
    }});
    const result=await task(agent);
    if(dialog!==ui||!alive()||controller.signal.aborted)return;
    if(result?.status==='cancelled'){state.textContent='Cancelled. The current project was kept.';write('Cancelled; no project replacement.');}
    else {write(label+' finished.');const d=await agent.inspect();if(dialog===ui&&alive())state.textContent=(d.path||'Unsaved project')+' · '+(d.dirty?'unsaved changes':d.path?'no new unsaved changes':'not saved yet')+' · '+d.operationCount+' operations, '+d.sketchCount+' sketches';}
   }catch(error){if(dialog===ui&&alive()){state.textContent=error?.name==='AbortError'?'Stopped. The current atomic command may already have completed.':String(error?.message||error);write((error?.committed||error?.possiblyCommitted?'Outcome may be committed; inspect the model and My files before retrying. ':'')+String(error?.message||error));}}
   finally{job=null;if(dialog===ui)controls();}
  }
  function button(label,task,options){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>void perform(label,task,options));buttons.push(b);actions.append(b);}
  button('Discover commands',async agent=>{const list=agent.discover();commandList.textContent=list.map(x=>x.id+' — '+x.description).join('\n');commands.open=true;return agent.inspect();});
  button('Run bracket demo',agent=>agent.buildBracket());
  button('Resize bracket',agent=>agent.resizeBracket());
  button('Test rejected edit',agent=>agent.verifyRejectedEdit());
  button('Undo',agent=>agent.travel('undo'));button('Redo',agent=>agent.travel('redo'));
  button('New project',agent=>agent.newProject(),{replace:true});
  button('Open project',agent=>agent.open(paths.native.value.trim()),{replace:true});
  button('Save project',agent=>agent.save(paths.native.value.trim()));
  button('Export sketch DXF',agent=>agent.exportSketchDxf(paths.dxf.value.trim()));
  button('Export model 3MF',agent=>agent.exportCore3mf(paths.threeMf.value.trim()));
  const closeButton=document.createElement('button');closeButton.type='button';closeButton.textContent='Close';closeButton.addEventListener('click',close);
  const closing=document.createElement('p');closing.textContent='Closing stops later example steps. A command already running may finish; closing the CAD window also disposes its worker operations.';
  ui.append(note,examples,commands,log,closing,closeButton);ui.addEventListener('cancel',event=>{event.preventDefault();close();});
  document.body.append(ui);host.ui.applyInputMode?.(ui);ui.showModal();controls();timer=setInterval(()=>{if(!alive())dispose();else controls();},150);
 }
 return Object.freeze({open,dispose});
}
