import React, {Fragment, useContext, useState, useEffect, useRef} from 'react';
import ls from './Expressions.less';
import cmn from 'ui/styles/common.less';
import ToolButton from 'ui/components/ToolButton';
import Fa from 'ui/components/Fa';
import Row from 'ui/components/Row';
import bind from 'ui/bind';
import cx from 'classnames';
import {actionDecorator} from '../actions/actionDecorators';
import Folder from 'ui/components/Folder';
import Stack from 'ui/components/Stack';
import {ReactApplicationContext} from "../dom/ReactApplicationContext";
import {useStream} from "ui/effects";
import {desktopFileMode} from '../desktopFileActions';


export default function Expressions() {
  
  const ctx = useContext(ReactApplicationContext);
  const [activeTab, setActiveTab] = useState(typeof ctx.craftService.inspectPhysicalParameters === 'function' ? 'Parameters' : 'Script');
  useStream(ctx => ctx.expressionService.script$);
  const visibleTab=ctx.expressionService.isTyped && activeTab==='Script' ? 'Parameters' : activeTab;
  const synced = useStream(ctx => ctx.expressionService.synced$);
  const errors = useStream(ctx => ctx.expressionService.errors$);
  const reevaluateExpressions = ctx.expressionService.reevaluateExpressions;


  const tabBtn = (name, icon) => {
    // @ts-ignore
    return <ToolButton type='' onClick={() => setActiveTab(name)} pressed={visibleTab === name}>{icon} {name}</ToolButton>;
  };

  return <div className={ls.root}>

    <Row className={ls.switcher}>
      {!ctx.expressionService.isTyped && tabBtn('Script', <Fa fw icon='pencil' />)}
      {tabBtn('Table', <Fa fw icon='table' />)}
      {typeof ctx.craftService.inspectPhysicalParameters === 'function' && tabBtn('Parameters', <Fa fw icon='sliders' />)}
      {errors.length > 0 && <span><Fa icon='warning' className={cx(cmn.dangerColor, cmn.inlineBlock)} /></span>}
      {!synced && <ReevaluateActionButton type='accent' className={cmn.floatRight}><Fa fw icon='check'/></ReevaluateActionButton>}
    </Row>

    <div className={ls.workingArea}>

      {visibleTab === 'Script' && <Script reevaluateExpressions={reevaluateExpressions}/>}

      {visibleTab === 'Table' && <VarTable errors={errors}/>}
      {visibleTab === 'Parameters' && <PhysicalParameters />}

      {errors.length > 0 && <Folder title={<Fragment><Fa icon='warning' className={cx(cmn.dangerColor)} /> Script Errors</Fragment>}>
        <Stack>
          {errors.map(err => <div key={err.line}>
            line {err.line + 1}: {err.message}
          </div>)}
        </Stack>
      </Folder>}

    </div>

  </div>;

}

const ReevaluateActionButton = actionDecorator('expressionsUpdateTable')(ToolButton);

const Script = bind(ctx => ctx.expressionService.script$)(
  function Script({value, onChange, reevaluateExpressions}) {
    const ctx = useContext(ReactApplicationContext), craft:any=ctx.craftService;
    const applying=useRef(false);
    const [draft,setDraft]=useState(value), [baseRevision,setBaseRevision]=useState(()=>craft.inspectAuthoredEdits?.().revision), [busy,setBusy]=useState(false), [message,setMessage]=useState('');
    useEffect(()=>{setDraft(value);setBaseRevision(craft.inspectAuthoredEdits?.().revision);},[value]);
    if(!desktopFileMode)return <textarea readOnly={ctx.expressionService.isTyped} placeholder='for example: A = 50' className={ls.script} value={value} onChange={e=>onChange(e.target.value)} onBlur={()=>reevaluateExpressions()} />;
    async function apply(){
      if(applying.current||draft===value)return;
      applying.current=true;setBusy(true);setMessage('');
      try{await craft.applyLegacyExpressions({revision:baseRevision,source:draft});setMessage('Expressions applied.');}
      catch(error){setMessage(error?.message||'Expressions could not be applied.');}
      finally{applying.current=false;setBusy(false);}
    }
    return <div className={ls.numericScript}>
      <textarea aria-label="Numeric expression script" readOnly={busy||ctx.expressionService.isTyped} placeholder='for example: width = 50' className={ls.script} value={draft}
        onFocus={()=>{if(draft===value)setBaseRevision(craft.inspectAuthoredEdits?.().revision);}}
        onChange={e=>setDraft(e.target.value)} onBlur={event=>{if((event.relatedTarget as HTMLElement)?.getAttribute('data-expression-reload')==='true')return;apply();}} />
      <button type="button" disabled={busy||draft===value} onPointerDown={event=>event.preventDefault()} onClick={apply}>Apply expressions</button>
      <button type="button" data-expression-reload="true" disabled={busy} onPointerDown={event=>event.preventDefault()} onClick={()=>{setDraft(value);setBaseRevision(craft.inspectAuthoredEdits?.().revision);setMessage('');}}>Reload expressions</button>
      <p role="status">{message}</p>
    </div>;
  }
);

const VarTable = bind(ctx => ctx.expressionService.list$)(
  function VarTable({value}) {
    const units={length:'mm',area:'mm²',volume:'mm³',angle:'rad',count:'count',boolean:'boolean',scalar:'scalar'};
    return <table className={cx(cmn.fullWidth, 'striped', 'delineated')}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
          <th>Unit</th>
        </tr>
      </thead>
      <tbody>
        {value.map(({name, value, dimension}, i) => <tr key={i}>
          <td>{name}</td>
          <td>{String(value)}</td>
          <td>{dimension ? units[dimension] : ''}</td>
        </tr>)}
      </tbody>
    </table>
  }
);
// Draft rows stay local until the same guarded operation used by clients commits.
function PhysicalParameters() {
  const ctx = useContext(ReactApplicationContext),craft:any=ctx.craftService;
  const [draft,setDraft]=useState<any>(null),[target,setTarget]=useState(''),[parameter,setParameter]=useState(''),[bracketBindings,setBracketBindings]=useState<any>(null),[feature,setFeature]=useState(''),[featureField,setFeatureField]=useState(''),[featureParameter,setFeatureParameter]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  function refresh() {
    try {
      const info=craft.inspectPhysicalParameters(),rows=info.definitions.map(row=>({...row}));
      if(!rows.length)rows.push({name:'depth',dimension:'length',expression:'mm(20)'});
      const chosen=info.targets[0],name=typeof chosen?.binding==='string'&&rows.some(row=>row.name===chosen.binding&&row.dimension==='length')?chosen.binding:(rows.find(row=>row.dimension==='length')?.name||'');
      const bracket=info.brackets?.[0];setBracketBindings(bracket?Object.fromEntries(['width','height','offsetX','offsetY'].map(key=>[key,rows.some(row=>row.dimension==='length'&&row.name===bracket[key])?bracket[key]:''])):null);
      const firstFeature=info.features?.[0],firstField=firstFeature?Object.keys(firstFeature.bindings)[0]:'';setFeature(firstFeature?String(firstFeature.index):'');setFeatureField(firstField);setFeatureParameter(firstFeature&&typeof firstFeature.bindings[firstField]==='string'&&rows.some(row=>row.dimension==='length'&&row.name===firstFeature.bindings[firstField])?firstFeature.bindings[firstField]:'');
      setDraft({...info,rows,configurations:(info.configurations||[]).map(c=>({...c,overrides:c.overrides.map(o=>({...o}))}))});setTarget(chosen?String(chosen.index):'');setParameter(name);setMessage(info.reason||'');
    }catch(error){setMessage(error?.message||'Parameters are unavailable.');setDraft(null);}
  }
  React.useEffect(()=>{refresh()},[]);
  function rowChange(index,key,value){setDraft(current=>({...current,rows:current.rows.map((row,i)=>i===index?{...row,[key]:value}:row)}));}
  async function apply(){
    if(!draft||busy)return;const chosen=draft.targets.find(item=>String(item.index)===target);if(!chosen){setMessage('Choose an extrusion.');return;}
    setBusy(true);setMessage('');try{const result=await craft.applyPhysicalDepth({revision:draft.revision,index:chosen.index,featureId:chosen.featureId,parameter,definitions:draft.rows});refresh();setMessage(result.changed?'Parameters applied in the workspace. Review material assignments before saving if present.':'No parameter changes.');}catch(error){setMessage((error?.parameter ? error.parameter+': ' : '')+(error?.message||'Could not apply parameters.'));}finally{setBusy(false);}
  }
  async function applyBracket(){
    if(!draft||busy||!bracketBindings)return;const bracket=draft.brackets?.[0];if(!bracket)return;
    setBusy(true);setMessage('');try{const result=await craft.applyPhysicalBracket({revision:draft.revision,faceId:bracket.faceId,index:bracket.index,featureId:bracket.featureId,...bracketBindings,definitions:draft.rows});refresh();setMessage(result.changed?'Parameters applied in the workspace. Review material assignments before saving if present.':'No parameter changes.');}catch(error){setMessage((error?.parameter?error.parameter+': ':'')+(error?.message||'Could not apply parameters.'));}finally{setBusy(false);}
  }
  async function applyFeature(){
    if(!draft||busy)return;const chosen=draft.features?.find(item=>String(item.index)===feature);if(!chosen||!featureField||!featureParameter){setMessage('Choose a feature, field and length parameter.');return;}
    setBusy(true);setMessage('');try{const result=await craft.applyPhysicalBindings({revision:draft.revision,changes:[{index:chosen.index,featureId:chosen.featureId,type:chosen.type,field:featureField,parameter:featureParameter}],definitions:draft.rows});refresh();setMessage(result.changed?'Parameters applied in the workspace. Review material assignments before saving if present.':'No parameter changes.');}catch(error){setMessage((error?.parameter?error.parameter+': ':'')+(error?.message||'Could not apply parameters.'));}finally{setBusy(false);}
  }
  async function applyConfigurations(){
    if(!draft||busy)return;setBusy(true);setMessage('');try{const result=await craft.applyPhysicalConfigurations({revision:draft.revision,definitions:draft.rows,configurations:draft.configurations,activeId:draft.activeConfigurationId});refresh();setMessage(result.changed?'Configuration applied in the workspace. Review material assignments before saving if present.':'No configuration changes.');}catch(error){setMessage((error?.parameter?error.parameter+': ':'')+(error?.message||'Could not apply configuration.'));}finally{setBusy(false);}
  }
  if(!draft)return <div><p role="alert">{message}</p><button type="button" onClick={refresh}>Reload parameters</button></div>;
  return <div className={ls.parameters}>
    <p>Use mm(…), inch(…), rad(…) or deg(…) in formulas. Changes apply to the selected extrusion depth.</p>
    {!draft.ready&&<p role="alert">{draft.reason}</p>}
    <fieldset disabled={busy}><label>Extrusion <select aria-label="Extrusion" value={target} onChange={event=>{const id=event.target.value;setTarget(id);const chosen=draft.targets.find(item=>String(item.index)===id);if(typeof chosen?.binding==='string')setParameter(chosen.binding)}}><option value="">Choose an extrusion</option>{draft.targets.map(item=><option key={item.index} value={String(item.index)}>Extrusion {item.featureId} · depth {item.binding}</option>)}</select></label>
    {draft.rows.map((row,index)=><div key={index}>
      <label>Name <input aria-label={`Parameter ${index+1} name`} value={row.name} onChange={event=>{const value=event.target.value;if(parameter===row.name)setParameter(value);rowChange(index,'name',value)}} /></label>
      <label>Dimension <select aria-label={`Parameter ${index+1} dimension`} value={row.dimension} onChange={event=>rowChange(index,'dimension',event.target.value)}>{['scalar','length','area','volume','angle','count','boolean'].map(kind=><option key={kind} value={kind}>{kind}</option>)}</select></label>
      <label>Formula <input aria-label={`Parameter ${index+1} formula`} value={row.expression} onChange={event=>rowChange(index,'expression',event.target.value)} /></label>
      <button type="button" onClick={()=>setDraft(current=>({...current,rows:current.rows.filter((_,i)=>i!==index)}))}>Remove parameter {index+1}</button>
    </div>)}
    <button type="button" disabled={draft.rows.length>=256} onClick={()=>setDraft(current=>({...current,rows:[...current.rows,{name:'',dimension:'length',expression:'mm(1)'}]}))}>Add parameter</button>
    <label>Depth parameter <select aria-label="Depth parameter" value={parameter} onChange={event=>setParameter(event.target.value)}><option value="">Choose a length parameter</option>{draft.rows.filter(row=>row.dimension==='length').map((row,index)=><option key={index} value={row.name}>{row.name}</option>)}</select></label>
    <button type="button" disabled={!draft.ready||busy} onClick={apply}>Apply parameters</button><button type="button" disabled={busy} onClick={refresh}>Reload parameters</button>
    <section><h3>Configurations</h3><p>Each configuration overrides selected base formulas. The base formulas stay unchanged.</p>
      <label>Active configuration <select aria-label="Active configuration" value={draft.activeConfigurationId||''} onChange={event=>{const value=event.target.value;setDraft(current=>({...current,activeConfigurationId:value||null}));}}><option value="">Base</option>{draft.configurations.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {draft.configurations.map((config,index)=><div key={config.id}><label>Configuration name <input aria-label={`Configuration ${index+1} name`} value={config.name} onChange={event=>{const value=event.target.value;setDraft(current=>({...current,configurations:current.configurations.map((c,i)=>i===index?{...c,name:value}:c)}));}} /></label>
        {config.overrides.map((override,j)=><div key={j}><label>Parameter <select aria-label={`Configuration ${index+1} override ${j+1} parameter`} value={override.name} onChange={event=>{const value=event.target.value;setDraft(current=>({...current,configurations:current.configurations.map((c,i)=>i===index?{...c,overrides:c.overrides.map((o,k)=>k===j?{...o,name:value}:o)}:c)}));}}><option value="">Choose a parameter</option>{draft.rows.map((row,k)=><option key={k} value={row.name}>{row.name}</option>)}</select></label><label>Formula <input aria-label={`Configuration ${index+1} override ${j+1} formula`} value={override.expression} onChange={event=>{const value=event.target.value;setDraft(current=>({...current,configurations:current.configurations.map((c,i)=>i===index?{...c,overrides:c.overrides.map((o,k)=>k===j?{...o,expression:value}:o)}:c)}));}} /></label><button type="button" onClick={()=>setDraft(current=>({...current,configurations:current.configurations.map((c,i)=>i===index?{...c,overrides:c.overrides.filter((_,k)=>k!==j)}:c)}))}>Remove override</button></div>)}
        <button type="button" disabled={config.overrides.length>=64} onClick={()=>setDraft(current=>({...current,configurations:current.configurations.map((c,i)=>i===index?{...c,overrides:[...c.overrides,{name:'',expression:''}]}:c)}))}>Add override</button><button type="button" onClick={()=>setDraft(current=>({...current,activeConfigurationId:current.activeConfigurationId===config.id?null:current.activeConfigurationId,configurations:current.configurations.filter((_,i)=>i!==index)}))}>Remove configuration</button></div>)}
      <button type="button" disabled={draft.configurations.length>=32} onClick={()=>setDraft(current=>({...current,configurations:[...current.configurations,{id:crypto.randomUUID(),name:'',overrides:[]}]}))}>Add configuration</button><button type="button" disabled={!draft.ready||busy} onClick={applyConfigurations}>Apply configurations</button>
    </section>
    {draft.features?.length>0&&<section><p>Bind a supported feature dimension to a length parameter.</p><label>Feature <select aria-label="Parameter feature" value={feature} onChange={event=>{const value=event.target.value,chosen=draft.features.find(item=>String(item.index)===value),field=chosen?Object.keys(chosen.bindings)[0]:'';setFeature(value);setFeatureField(field);setFeatureParameter(chosen&&typeof chosen.bindings[field]==='string'&&draft.rows.some(row=>row.name===chosen.bindings[field]&&row.dimension==='length')?chosen.bindings[field]:'');}}><option value="">Choose a feature</option>{draft.features.map(item=><option key={item.index} value={String(item.index)}>{item.type.replace('WORKER_','').replace(/_V[12]$/,'').replaceAll('_',' ')} {item.featureId}</option>)}</select></label><label>Dimension <select aria-label="Feature dimension" value={featureField} onChange={event=>{const value=event.target.value,chosen=draft.features.find(item=>String(item.index)===feature);setFeatureField(value);setFeatureParameter(chosen&&typeof chosen.bindings[value]==='string'&&draft.rows.some(row=>row.name===chosen.bindings[value]&&row.dimension==='length')?chosen.bindings[value]:'');}}><option value="">Choose a dimension</option>{Object.keys(draft.features.find(item=>String(item.index)===feature)?.bindings||{}).map(field=><option key={field} value={field}>{field}</option>)}</select></label><label>Length parameter <select aria-label="Feature length parameter" value={featureParameter} onChange={event=>setFeatureParameter(event.target.value)}><option value="">Choose a length parameter</option>{draft.rows.filter(row=>row.dimension==='length').map((row,index)=><option key={index} value={row.name}>{row.name}</option>)}</select></label><button type="button" disabled={!draft.ready||busy||!feature||!featureField||!featureParameter} onClick={applyFeature}>Apply feature binding</button></section>}
    {bracketBindings&&<section><p>Bind the rectangle and corner-hole offsets to length parameters.</p><p>Current values: {['width','height','offsetX','offsetY'].map(key=>`${key}: ${draft.brackets[0][key]}`).join(', ')}. Numeric values remain literal until you bind them.</p>{[['width','Rectangle width'],['height','Rectangle height'],['offsetX','Horizontal hole offset'],['offsetY','Vertical hole offset']].map(([key,label])=><label key={key}>{label} <select aria-label={label} value={bracketBindings[key]} onChange={event=>{const value=event.target.value;setBracketBindings(current=>({...current,[key]:value}));}}><option value="">Choose a length parameter</option>{draft.rows.filter(row=>row.dimension==='length').map((row,index)=><option key={index} value={row.name}>{row.name}</option>)}</select></label>)}<button type="button" disabled={!draft.ready||busy||Object.values(bracketBindings).some(value=>!value)} onClick={applyBracket}>Apply bracket bindings</button></section>}
    </fieldset><p role="status">{message}</p>
  </div>;
}
