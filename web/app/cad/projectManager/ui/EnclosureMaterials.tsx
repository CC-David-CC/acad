import React, {useContext, useEffect, useState} from 'react';
import {state} from 'lstream';
import {useStream} from 'ui/effects';
import {GenericWizard} from 'ui/components/GenericWizard';
import {ReactApplicationContext} from 'cad/dom/ReactApplicationContext';

const open$ = state(false);
export function openEnclosureMaterials() { open$.next(true); }
export function EnclosureMaterials() {
  const open = useStream(open$), ctx = useContext(ReactApplicationContext);
  const [body,setBody] = useState('PLA'), [lid,setLid] = useState('PETG');
  const [label,setLabel]=useState('PLA'),[labelColor,setLabelColor]=useState('#ffffff');
  const [bodyColor,setBodyColor] = useState('#d24b4b'), [lidColor,setLidColor] = useState('#4b78d2');
  const [feature,setFeature] = useState(''), [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const [controller,setController] = useState<AbortController>(null);
  const [inspection,setInspection] = useState<{revision:string,featureIds:number[],features?:{featureId:number,roles:string[]}[]}>(null);
  const [existing,setExisting] = useState<any>({});
  useEffect(() => { if (!open) return; try { setInspection(ctx.projectManager.inspectEnclosureMaterialRoles()); } catch (e) { setInspection(null); setError(e instanceof Error ? e.message : String(e)); } }, [open,ctx]);
  useEffect(() => {
    if (!open || !inspection) return;
    const selected = Number(feature || (inspection.featureIds.length === 1 ? inspection.featureIds[0] : 0));
    const metadata = ctx.projectManager.getManufacturingMetadata(), found:any = {};
    for (const role of ['BODY','LID','LABEL']) {
      const binding = metadata?.bindings.find(b => b.featureId === selected && ['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(b.operationType) && b.outputRole === role);
      const region = metadata?.objects.flatMap(o => o.regions).find(r => r.bodyId === binding?.id);
      if (region) found[role] = {material:metadata.materials.find(m => m.id === region.materialId),appearance:metadata.appearances.find(a => a.id === region.appearanceId) || null};
    }
    setExisting(found);
    setLabel(found.LABEL?.material?.name||'PLA');setLabelColor(found.LABEL?.appearance?.color||'#ffffff');
    setBody(found.BODY?.material?.name || 'PLA'); setLid(found.LID?.material?.name || 'PETG');
    setBodyColor(found.BODY?.appearance?.color || '#d24b4b'); setLidColor(found.LID?.appearance?.color || '#4b78d2');
  }, [open,inspection,feature,ctx]);
  useEffect(() => () => controller?.abort(), [controller]);
  if (!open) return null;
  const candidates = inspection?.featureIds || [];
  const selected=Number(feature||(candidates.length===1?candidates[0]:0)),labeled=inspection?.features?.find(f=>f.featureId===selected)?.roles.includes('LABEL')===true;
  const close = () => { controller?.abort(); setController(null); setError(''); open$.next(false); };
  const submit = async () => {
    if (busy) return;
    const id = Number(feature || (candidates.length === 1 ? candidates[0] : 0));
    const make = (role:string,name:string,color:string) => {
      const old = existing[role], clean = name.trim();
      return {material:old?.material?.name === clean ? old.material : {id:'material-'+crypto.randomUUID(),name:clean},
        appearance:old?.appearance?.color === color ? old.appearance : {id:'appearance-'+crypto.randomUUID(),name:clean+' color',color}};
    };
    const pending = new AbortController(); setController(pending); setBusy(true); setError('');
    try { await ctx.projectManager.assignEnclosureMaterialRoles(id,{BODY:make('BODY',body,bodyColor),LID:make('LID',lid,lidColor),...(labeled?{LABEL:make('LABEL',label,labelColor)}:{})},{revision:inspection?.revision,signal:pending.signal}); close(); }
    catch (e) { if (!pending.signal.aborted) setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); setController(null); }
  };
  return <GenericWizard title='Enclosure materials' documentationLink='men-at-work' onCancel={close} onClose={close} onOK={submit} infoText={error && <div role='alert'>{error}</div>}>
    <div className='bg-color-4' style={{padding:12,display:'grid',gap:8}}>
      <label>Enclosure <select aria-label='Enclosure' value={feature} onChange={e=>setFeature(e.target.value)}><option value=''>Select enclosure</option>{candidates.map(id=><option key={id} value={id}>{id}</option>)}</select></label>
      <label>Body material <input aria-label='Body material' value={body} onChange={e=>setBody(e.target.value)} maxLength={256}/></label>
      <label>Body color <input aria-label='Body color' type='color' value={bodyColor} onChange={e=>setBodyColor(e.target.value)}/></label>
      <label>Lid material <input aria-label='Lid material' value={lid} onChange={e=>setLid(e.target.value)} maxLength={256}/></label>
      <label>Lid color <input aria-label='Lid color' type='color' value={lidColor} onChange={e=>setLidColor(e.target.value)}/></label>
      {labeled&&<><label>Label material <input aria-label='Label material' value={label} onChange={e=>setLabel(e.target.value)} maxLength={256}/></label><label>Label color <input aria-label='Label color' type='color' value={labelColor} onChange={e=>setLabelColor(e.target.value)}/></label></>}
      <span>{busy ? 'Checking the model…' : (labeled?'Body and lid remain separate printable objects; the label is a region of the lid. Save to keep assignments.':'Body and lid remain separate printable objects. Save the project to keep assignments.')}</span>
    </div>
  </GenericWizard>;
}
