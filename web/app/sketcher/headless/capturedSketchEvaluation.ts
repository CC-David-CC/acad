import {HeadlessSketchWorkspace} from './workspace';
import {validateProjectSketch} from '../io';
import {inspectStageGenerators} from './stageGeneratorPolicy.mjs';
import {validateSplineDerivedGeometry} from './splineDerivedValidation';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {assertSemantics,assertFixedBoundary,inspectTree,typeIndex,validateConstraintGeometry,fail} from './sketchValidation';
import {capturedParameterOwnership,installCapturedAuxiliaryWitnesses} from './capturedParameterOwnership';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';

// These are observations of original equations AT the captured coordinates,
// paired with independent cold-admission evidence. This is not solve success.
export function evaluateCapturedSketch(sketch:any,external:any,coldEvidence:any[],newPrimitiveId?:string,auxiliaryWitness?:CapturedAuxiliaryWitnessBatch) {
  inspectTree(sketch);assertSemantics(sketch,sketch.boundary,sketch.boundary);
  validateProjectSketch(sketch);typeIndex(sketch,sketch.boundary);inspectStageGenerators(sketch);
  for(const o of sketch.objects)if(o.type==='BSpline')validateSplineDerivedGeometry(o.id,o.data);
  const workspace=new HeadlessSketchWorkspace(external);
  return workspace.io.evaluateCapturedSketch(structuredClone(sketch),()=>{
    const pm=workspace.parametricManager,index=workspace.createIndex(),stages=pm.stages;
    const restored=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));restored.boundary=structuredClone(sketch.boundary);
    if(!sameRestoredSketch(JSON.stringify(sketch),JSON.stringify(restored)))fail('CURRENT_GEOMETRY_MISMATCH','Decoding changed captured sketch geometry or intent.');
    const roots=new Set<any>();
    for(const row of sketch.objects){
      const object=index[row.id];if(!object||object.id!==row.id||object.TYPE!==row.type||object.role!==row.role||object.stage!==stages[row.stage]||!object.stage.objects.has(object))fail('INVALID','Captured object ownership differs from its actual source.');
      roots.add(object);object.visitParams(p=>{if(!Number.isFinite(p.get()))fail('INVALID','Captured parameters must be finite.');});
    }
    const ownership=capturedParameterOwnership(workspace);
    installCapturedAuxiliaryWitnesses(workspace,ownership,auxiliaryWitness);
    let fresh=0;const evidence=[];
    for(const [si,stage] of stages.entries()){
      let authored=0;
      for(const c of stage.solverSystem.allConstraints){
        if(c.stage!==stage||c.objects.some(o=>index[o.id]!==o||!o.stage||(!stages.includes(o.stage)&&o.stage!==pm.groundStage)||o.stage!==pm.groundStage&&stages.indexOf(o.stage)>si))fail('INVALID','Constraint source ownership is invalid.');
        ownership.constraint(c,stage);
        c.resolveConstants(pm.constantResolver);
        const profile=validateConstraintGeometry(c);
        if(!c.internal){
          const saved=sketch.stages[si].constraints[authored++],actual=coldEvidence[fresh++];
          // Saved hints supply priority only. The classification here MUST come
          // from a fresh successful whole-candidate cold admission/solve.
          if(!saved||!actual||actual.typeId!==c.schema.id||saved.typeId!==c.schema.id||!['accepted','redundant'].includes(actual.state)||saved.admission?.version!==1||saved.admission.state!==actual.state)fail('ADMISSION_CHANGED','Fresh admission differs from retained authored classification.');
          evidence.push({typeId:c.schema.id,state:actual.state,...profile});
        }
      }
      if(authored!==sketch.stages[si].constraints.length)fail('INTENT_CHANGED','Captured constraint membership changed.');
    }
    if(fresh!==coldEvidence.length)fail('ADMISSION_CHANGED','Fresh admission evidence membership differs.');
    ownership.unchanged();
    assertFixedBoundary(index,sketch.boundary);
    if(newPrimitiveId){
      const root=index[newPrimitiveId];if(!root||!roots.has(root)||root.parent||root.isGenerated||root.generators.size)fail('INVALID_TARGET','The appended primitive must be independently owned.');
      const members=new Set<any>();root.traverse(o=>{if(index[o.id]!==o||members.has(o)||o.isGenerated||o.generators.size)fail('INVALID_TARGET','The appended primitive child graph is ambiguous.');members.add(o);});
      const expected=root.TYPE==='Segment'?3:root.TYPE==='Arc'?4:['Circle','Ellipse'].includes(root.TYPE)?2:1;
      if(members.size!==expected)fail('INVALID_TARGET','The appended primitive has unexpected children.');
      const internal=new Set<any>();
      for(const member of members)for(const c of member.constraints){
        if(!c.internal||c.stage!==root.stage||c.objects.some(o=>!members.has(o)))fail('REFERENCED_PRIMITIVE','The new primitive is not an independent component.');
        internal.add(c);
      }
      const kind=root.TYPE==='Segment'?'Polar':root.TYPE==='Arc'?'ArcConsistency':null;
      if(internal.size!==(kind?1:0)||[...internal].some(c=>c.schema.id!==kind))fail('INVALID_TARGET','Unexpected intrinsic primitive equations.');
      // Check actual generator object dependencies, not a saved permission flag.
      for(const stage of [pm.groundStage,...stages])for(const generator of stage.generators){
        generator.sourceObjects(o=>{if(members.has(o))fail('GENERATOR_REFERENCE','A generator depends on the new primitive.');});
        if(generator.generatedObjects?.some(o=>members.has(o)))fail('GENERATOR_REFERENCE','The new primitive is generator-owned.');
      }
    }
    const after=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));after.boundary=structuredClone(sketch.boundary);
    if(!sameRestoredSketch(JSON.stringify(sketch),JSON.stringify(after)))fail('CURRENT_GEOMETRY_MISMATCH','Captured-coordinate evaluation mutated source.');
    return {quality:'validated-captured-equations' as const,evidence};
  });
}
