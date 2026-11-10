// Source-only fragment for the complete pattern whole workflow. The outer
// runner supplies the real current Craft service and records full source/J,
// Native/ownership, Undo/Redo and normal .cad persistence observations.
const check=(ok,message)=>{if(!ok)throw Error(message);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export async function runPatternRequestCapture({craft,request,editStep,options,record}){
  check(typeof craft?.createSketchPattern===function&&typeof craft?.editSketchPattern===function&&typeof craft?.inspectSketchPatterns===function,Actual registered Core pattern methods are required.);
  const original=structuredClone(request),create=structuredClone(request);
  const pending=craft.createSketchPattern(create,options);
  // These are caller-owned objects only; never mutate accepted model data.
  create.sourceIds.length=0;create.step.x=0;create.step.y=0;
  const made=await pending;record({label:Direct Core create captured request,original,result:made});
  const sources=[...original.sourceIds].sort();
  check(made.changed===true&&equal(made.pattern.sourceIds,sources)&&equal(made.pattern.step,original.step)&&made.pattern.count===original.count,Direct Core create changed call-time nested intent.);
  const created=await craft.inspectSketchPatterns({revision:made.revision,faceId:original.faceId},options);
  const row=created.patterns.find(p=>p.outputId===made.pattern.outputId);
  check(row&&equal(row.sourceIds,sources)&&equal(row.step,original.step)&&row.count===original.count,Discovered generator differs from original direct create.);
  const edit={revision:made.revision,faceId:original.faceId,outputId:row.outputId,count:original.count,step:structuredClone(editStep)},expected=structuredClone(edit);
  check(!equal(expected.step,original.step),The genuine direct edit must change the step.);
  const changing=craft.editSketchPattern(edit,options);edit.step.x=0;edit.step.y=0;
  const changed=await changing;record({label:Direct Core edit captured request,original:expected,result:changed});
  check(changed.changed===true&&equal(changed.pattern.sourceIds,sources)&&equal(changed.pattern.generatedIds,row.generatedIds)&&equal(changed.pattern.step,expected.step)&&changed.pattern.count===expected.count,Direct Core edit changed call-time nested intent or existing identities.);
  const inspected=await craft.inspectSketchPatterns({revision:changed.revision,faceId:original.faceId},options),after=inspected.patterns.find(p=>p.outputId===row.outputId);
  check(after&&equal(after.sourceIds,sources)&&equal(after.generatedIds,row.generatedIds)&&equal(after.step,expected.step),Discovered generator differs from original direct edit.);
  return {created:made,edited:changed,discovery:inspected,originalCreate:original,originalEdit:expected};
}
