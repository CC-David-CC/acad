import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
const fail=(message:string):never=>{throw Object.assign(Error(message),{code:'INTENT_CHANGED'});};
const authored=(stage:any)=>stage.algNumSystem.allConstraints.filter(c=>!c.internal);
const stateOf=(stage:any,constraint:any)=>stage.algNumSystem.redundant.has(constraint)?'redundant':stage.algNumSystem.conflicting.has(constraint)?'rejected':'accepted';
const admitted=(row:any)=>row?.admission?.version===1&&['accepted','redundant'].includes(row.admission.state);
// Admission is verified against actual ownership/classification before being
// omitted from the authored-intent comparison. All other row fields stay exact.
const withoutAdmission=(sketch:any)=>({...sketch,stages:sketch.stages.map(s=>({...s,constraints:s.constraints.map(c=>{const row={...c};delete row.admission;return row;})}))});

export function captureSignedDistanceRows(stages:any[]){
 return stages.map(stage=>({stage,rows:authored(stage)}));
}

// Worker-only proof of one actual inserted constraint, never a public locator.
// Do not infer insertion from the first JSON difference: adding a relation can
// legitimately reclassify retained accepted/redundant rows during admission.
export function verifySignedDistanceInsertion({before,after,intent,constraint,stages,retained,status}:any){
 const stage=constraint.stage,indexOfStage=stages.indexOf(stage),typeId=constraint.schema.id;
 if(indexOfStage<0||stage.index!==indexOfStage||stages.length!==retained.length||before.stages.length!==stages.length||after.stages.length!==stages.length||before.objects.length!==after.objects.length)fail('Signed distance changed sketch structure or stage ownership.');
 const rows=authored(stage),at=rows.indexOf(constraint);
 if(at<0||rows.lastIndexOf(constraint)!==at||stateOf(stage,constraint)!==status||!['accepted','redundant'].includes(status))fail('The actual signed distance was not uniquely admitted.');
 let count=0;
 for(let si=0;si<stages.length;si++){
  const current=stages[si],kept=retained[si],live=authored(current),old=before.stages[si].constraints,next=after.stages[si].constraints;
  if(current!==kept.stage||kept.rows.length!==old.length||live.length!==next.length||live.length!==old.length+(current===stage?1:0))fail('Signed distance changed authored constraint membership.');
  const remaining=live.filter(c=>c!==constraint);
  if(remaining.length!==kept.rows.length||remaining.some((c,i)=>c!==kept.rows[i]))fail('Signed distance replaced or reordered a retained constraint.');
  for(let i=0;i<next.length;i++){
   if(++count>10000)fail('Signed distance constraint proof exceeds its bound.');
   if(!admitted(next[i])||next[i].admission.state!==stateOf(current,live[i]))fail('Serialized admission does not match actual constraint classification.');
  }
  if(old.some(c=>!admitted(c)))fail('A retained constraint was not previously admitted.');
 }
 const added=after.stages[indexOfStage].constraints[at];
 if(added?.typeId!==typeId||added.stage!==indexOfStage||JSON.stringify(added.objects)!==JSON.stringify(intent.ids)||!added.constants||Reflect.ownKeys(added.constants).length!==1||!Object.hasOwn(added.constants,'distance')||added.constants.distance!==intent.distance||added.admission.state!==status)fail('The actual inserted signed distance identity or exact value changed.');
 after.objects.forEach((object,i)=>{if(object.type!==before.objects[i]?.type)fail('Signed distance changed sketch object type.');assertAllowedSolverGeometry(object.type,before.objects[i].data,object.data);});
 const restored={...after,objects:after.objects.map((o,i)=>({...o,data:before.objects[i].data})),stages:after.stages.map(s=>({...s,constraints:[...s.constraints]}))};
 restored.stages[indexOfStage].constraints.splice(at,1);
 if(!sameRestoredSketch(JSON.stringify(withoutAdmission(before)),JSON.stringify(withoutAdmission(restored))))fail('Signed distance changed retained authored sketch intent.');
 return at;
}
