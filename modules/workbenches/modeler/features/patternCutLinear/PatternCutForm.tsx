import React, {useContext, useEffect, useRef} from 'react';
import {ReactApplicationContext} from 'cad/dom/ReactApplicationContext';
import {NumberField, ComboBoxField} from 'cad/craft/wizard/components/form/Fields';
import {ComboBoxOption} from 'ui/components/controls/ComboBoxControl';
import {useStream} from 'ui/effects';

// This is only a candidate picker. The replay operation separately validates
// the actual geometry, identity and supported through-cut semantics.
function precedingCircularCut(ctx: any, mods: any) {
  const cut=mods?.history?.[mods.pointer];
  if (cut?.type !== 'EXTRUDE' || cut.params?.boolean?.kind !== 'SUBTRACT' || typeof cut.params?.face !== 'string') return null;
  const feature=Number(cut.params.featureId);
  if (!Number.isSafeInteger(feature) || feature <= 0) return null;
  const text=ctx.sketchStorageService.getSketchData(cut.params.face);
  // Keep this UI inspection bounded; larger sketches remain editable but need
  // a future asynchronous selector rather than a main-thread parse here.
  if (typeof text !== 'string' || text.length > 262144) return null;
  try {
    const sketch=JSON.parse(text);
    if (!Array.isArray(sketch.objects) || sketch.objects.length > 1024) return null;
    const objects=sketch.objects.filter(o => o?.role !== 'construction' && o?.type === 'Circle');
    if (objects.length !== 1) return null;
    const raw=String(objects[0].id), circle=Number(raw);
    if (!/^(0|[1-9][0-9]*)$/.test(raw) || !Number.isSafeInteger(circle)) return null;
    return {feature,circle};
  } catch (_) { return null; }
}

// Wizard forms remount when history changes. Keep insertion ownership outside
// the component so a remount cannot silently adopt a different prior cut.
const insertionOwners = new WeakMap<object, {project:any,generation:number,key:any,history:any,attempted:boolean}>();

export function PatternCutForm() {
  const ctx=useContext(ReactApplicationContext);
  const request=useStream(c=>c.wizardService.workingRequest$);
  const mods=useStream(c=>c.craftService.modifications$);
  const candidate=precedingCircularCut(ctx,mods);
  const params=request?.params || {};
  const insertToken=ctx.streams.wizard.insertOperation.value;
  const sessionKey=insertToken || request?.requestKey;
  const owner=useRef<{project:any,generation:number,key:any,history:any,attempted:boolean}|null>(null);
  if (insertToken) {
    let insertion=insertionOwners.get(ctx);
    if (!insertion || insertion.key !== insertToken) {
      insertion={project:ctx.projectService,generation:ctx.projectService.documentGeneration,key:insertToken,history:mods,attempted:false};
      insertionOwners.set(ctx,insertion);
    }
    owner.current=insertion;
  } else if (owner.current?.key !== sessionKey) {
    owner.current = request ? {project:ctx.projectService,generation:ctx.projectService.documentGeneration,key:sessionKey,history:mods,attempted:false} : null;
  }
  const current = () => !!owner.current && ctx.projectService === owner.current.project &&
    owner.current.project.isDocumentCurrent(owner.current.generation) && (!insertToken || owner.current.history === ctx.craftService.modifications$.value);
  const selected=Number(params.seedFeatureId) === candidate?.feature && Number(params.seedObjectId) === candidate?.circle;
  const assign = () => {
    if (!candidate || !current() || (ctx.wizardService.workingRequest as any)?.requestKey !== request?.requestKey) return;
    ctx.wizardService.updateParams(p => {p.seedFeatureId=candidate.feature; p.seedObjectId=candidate.circle;});
  };
  useEffect(() => {
    const documentOwner=owner.current;
    if (!documentOwner) return;
    const onAbort=() => {
      if (ctx.streams.wizard.insertOperation.value === documentOwner.key) ctx.wizardService.cancel();
    };
    const signal=documentOwner.project.documentSignal;
    signal.addEventListener('abort',onAbort,{once:true});
    const detachHistory=insertToken ? ctx.craftService.modifications$.attach(next => {
      if (next !== documentOwner.history && ctx.streams.wizard.insertOperation.value === insertToken) ctx.wizardService.cancel();
    }) : null;
    if (!current()) onAbort();
    // Only initialize a new insertion once. History edits never auto-rebind.
    if (insertToken && !documentOwner.attempted && params.seedFeatureId == null && params.seedObjectId == null) {
      documentOwner.attempted=true;
      assign();
    }
    return () => {
      signal.removeEventListener('abort',onAbort);
      detachHistory?.();
      if (insertToken && ctx.streams.wizard.insertOperation.value !== insertToken && insertionOwners.get(ctx) === documentOwner) insertionOwners.delete(ctx);
    };
  }, [sessionKey]);
  useEffect(() => {
    if (insertToken && !current() && ctx.streams.wizard.insertOperation.value === insertToken) ctx.wizardService.cancel();
  }, [mods, sessionKey]);
  return <>
    <div aria-label='Pattern seed'>
      {selected ? `Previous circular cut` : 'Seed unavailable or changed. Choose an eligible preceding circular cut.'}
    </div>
    {!selected && candidate && <button type='button' onClick={assign}>Use preceding circular cut</button>}
    <NumberField name='count' label='Count' />
    <NumberField name='spacing' label='Signed spacing (mm)' />
    <ComboBoxField name='axis' label='World axis'><ComboBoxOption value='X'>X</ComboBoxOption><ComboBoxOption value='Y'>Y</ComboBoxOption></ComboBoxField>
  </>;
}
