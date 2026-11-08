import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {fail} from './sketchValidation';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';

// Private, request-local source construction. The retained source is never
// reserialized from a solver model, and no optimizer output is copied over it.
export function prepareIndependentPrimitiveAppend(revision:string,before:any,external:any,added:any) {
  const suffixes=added.type==='Segment'?[':A',':B']:['Circle','Ellipse'].includes(added.type)?[':C']:added.type==='Arc'?[':A',':B',':C']:[];
  const names=new Set([added.id,...suffixes.map(s=>added.id+s)]),pending=[before];let work=0;
  // Strict whole-source schema/reference validation also runs below. This
  // conservative full data inventory excludes hidden dimensions/labels and
  // generator references as well as ordinary root/child ID collisions.
  while(pending.length){const value=pending.pop();if(++work>100000)fail('LIMIT','Primitive identity inventory exceeds its bound.');if(typeof value==='string'&&names.has(value))fail('IDENTITY_COLLISION','The new primitive identity is already referenced.');if(value&&typeof value==='object')for(const child of Object.values(value))pending.push(child);}
  if(added.stage!==before.stages.length-1)fail('UNSUPPORTED','Only the current last sketch stage is supported.');
  // Genuine isolated primitive solve, using the ordinary production decoder,
  // intrinsic constraints, solver and registered domains. No old geometry is
  // placed in this workspace or exposed to its optimizer.
  const component={...structuredClone(before),objects:[{...structuredClone(added),stage:0}],dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],boundary:{lines:[],arcs:[],circles:[],nurbses:[]}};
  const isolated=solveSketch({revision,sketch:component,boundary:structuredClone(component.boundary),externalParameters:external});
  if(!isolated.ok)return isolated;
  if(!sameRestoredSketch(JSON.stringify(component),JSON.stringify(isolated.sketch)))fail('INTENT_CHANGED','The isolated primitive solve changed requested geometry or intent.');
  evaluateCapturedSketch(component,external,isolated.evidence,added.id);
  const candidate=structuredClone(before);candidate.objects.push({...isolated.sketch.objects[0],stage:added.stage});
  const retained={...candidate,objects:candidate.objects.filter(o=>o.id!==added.id)};
  if(!sameRestoredSketch(JSON.stringify(before),JSON.stringify(retained)))fail('INTENT_CHANGED','Appending a primitive changed retained source.');
  // Fresh admission and a real whole-candidate solve are proof ONLY. Keep the
  // existing constrained displacement and branch bounds; no numerical failure
  // or rejected/changed classification becomes accepted through this path.
  let auxiliaryWitness:CapturedAuxiliaryWitnessBatch|undefined;
  const cold=solveSketch({revision,sketch:structuredClone(candidate),boundary:structuredClone(candidate.boundary),externalParameters:external},undefined,batch=>{auxiliaryWitness=batch;});
  if(!cold.ok)return cold;
  assertVerifiedReplayGeometry(candidate,cold.sketch,cold.evidence,external);
  const checked=evaluateCapturedSketch(candidate,external,cold.evidence,added.id,auxiliaryWitness);
  return {revision,ok:true as const,serializedSketch:JSON.stringify(candidate),evidence:checked.evidence};
}
