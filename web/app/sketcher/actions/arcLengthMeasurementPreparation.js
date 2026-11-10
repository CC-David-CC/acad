import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {ArcLengthDimension} from '../shapes/arcLengthDimension';
import {arcLengthFromObject} from '../constr/arcLengthDomain.mjs';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from './matchUtils';
import {dimensionLocator} from '../headless/drivingDimensionTarget.mjs';
const sameLengthPair=(r,s)=>r.arc===s;
import {withAdmissionCause} from '../constr/admissionCause.mjs';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const literal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
export const literalLength=value=>(typeof value==='number'&&Number.isFinite(value))||(typeof value==='string'&&literal.test(value.trim())&&Number.isFinite(Number(value)));
export function arcLengthMeasurementArcs(viewer){
 const out=[],seen=new Set();for(const layer of viewer.layers||[])layer.traverseSketchObjects(o=>{if(isInstanceOf(o,Arc)&&!seen.has(o)){seen.add(o);out.push(o);}});
 if(out.length>1024)fail('RESOURCE_LIMIT','Length measurement discovery exceeds 1024 arcs.');
 if(out.some(s=>typeof s.id!=='string'||!s.id||s.id.length>256)||new Set(out.map(s=>s.id)).size!==out.length)fail('INVALID_TARGET','Ambiguous Arc identity.');return out;
}
function drivers(pm,s){const out=[];for(const [si,stage] of pm.stages.entries()){let index=0;for(const c of stage.algNumSystem.allConstraints){if(c.internal)continue;if(c.schema.id==='ArcLength'&&c.objects.length===1&&c.objects[0]===s)out.push({c,stage:si,index,locator:dimensionLocator(si,index,c.write())});index++;}}return out;}
function refs(viewer,s){return viewer.dimLayer.objects.filter(d=>d.TYPE==='ArcLengthDimension'&&!d.isAnnotation&&sameLengthPair(d,s));}
function independent(viewer,s){
 const pm=viewer.parametricManager;if(!s.stage||!pm.stages.includes(s.stage)||!s.stage.objects.has(s)||s.parent||s.isGenerated||s.generators.size||s.generator)return false;
 const members=new Set();s.traverse(o=>members.add(o));
 for(const stage of [pm.groundStage,...pm.stages])for(const g of stage.generators){let dependent=false;g.sourceObjects(o=>{if(members.has(o))dependent=true;});if(dependent||g.generatedObjects?.some(o=>members.has(o)))return false;}return true;
}
function ownedRuler(viewer,ruler,s){return ruler?.TYPE==='ArcLengthDimension'&&!ruler.isAnnotation&&ruler.layer===viewer.dimLayer&&viewer.dimLayer.objects.includes(ruler)&&viewer.parametricManager.stages.includes(ruler.stage)&&ruler.stage.objects.has(ruler)&&sameLengthPair(ruler,s);}
function rulerIds(viewer){const refs=viewer.dimLayer.objects;if(refs.length>1024)fail('RESOURCE_LIMIT','Length measurement discovery exceeds 1024 rulers.');if(refs.some(d=>typeof d.id!=='string'||!d.id||d.id.length>256)||new Set(refs.map(d=>d.id)).size!==refs.length)fail('INVALID_TARGET','Ambiguous ruler identity.');}
function describe(viewer,s){const found=drivers(viewer.parametricManager,s),rulers=refs(viewer,s),d=found.length===1?found[0]:null,value=arcLengthFromObject(s).length,role=found.length===0?'reference':found.length===1?'driving':'unresolved';
 let reason=!independent(viewer,s)?'GENERATED_OR_UNOWNED_TARGET':rulers.length>1||found.length>1?'AMBIGUOUS_TARGET':!Number.isFinite(value)||value<=0||value>1e6?'UNSUPPORTED_LENGTH':d&&d.c.stage.algNumSystem.isConflicting(d.c)?'UNADMITTED_DRIVER':d&&(!d.c.constants||Object.keys(d.c.constants).length!==1||!literalLength(d.c.constants.length))?'BOUND_DIMENSION':rulers.some(r=>!Number.isFinite(r.offset))?'INVALID_RULER':null;
 return {s,d,rulers,row:{arcId:s.id,measurementId:rulers.length===1?rulers[0].id:null,constraintId:d?d.locator:null,role,canonicalValue:Number.isFinite(value)?value:null,unit:'millimeter',canCreate:!reason&&rulers.length===0,canConvert:!reason&&rulers.length===1,reason}};
}
export function inspectArcLengthMeasurementModel(viewer){
 rulerIds(viewer);const rows=arcLengthMeasurementArcs(viewer).map(s=>describe(viewer,s).row),represented=new Set(rows.map(r=>r.measurementId).filter(Boolean));
 for(const d of viewer.dimLayer.objects)if(!represented.has(d.id))rows.push({arcId:null,measurementId:d.id,constraintId:null,role:'reference',canonicalValue:d.TYPE==='ArcLengthDimension'?arcLengthFromObject(d.arc).length:null,unit:d.TYPE==='ArcLengthDimension'?'millimeter':null,canCreate:false,canConvert:false,reason:'UNSUPPORTED_MEASUREMENT_SCHEMA_OR_PAIR'});
 if(rows.length>1024)fail('RESOURCE_LIMIT','Length measurement discovery exceeds 1024 rows.');return rows;
}
// Used by the ordinary editor action and the closed-source Worker. The Worker
// publishes original captured geometry, not this mutable warm workspace.
export function prepareArcLengthMeasurement(viewer,intent,allocatedId){
 const pm=viewer.parametricManager;if(!pm||pm.inTransaction)fail('NOT_READY','The sketch is not ready.');rulerIds(viewer);
 const candidates=arcLengthMeasurementArcs(viewer).map(s=>describe(viewer,s));let selected;
 if(intent.action==='create')selected=candidates.find(x=>x.s.id===intent.arcId);
 else if(intent.action==='remove')selected=candidates.find(x=>x.rulers.some(r=>r.id===intent.measurementId));
 else if(Object.hasOwn(intent.target,'measurementId')){const found=candidates.filter(x=>x.rulers.some(d=>d.id===intent.target.measurementId));if(found.length===1)selected=found[0];}
 else selected=candidates.find(x=>x.d?.locator===intent.target.constraintId);
 if(!selected)fail('INVALID_TARGET','Choose a currently discovered Arc length or ruler.');
 const {s,d,rulers,row}=selected;if(row.reason)fail(row.reason,'This length measurement cannot be converted: '+row.reason+'.');

 const desired=intent.action==='remove'?'reference':intent.action==='create'?row.role:intent.role;let ruler=rulers[0],addedRuler=false,added=null,removed=null,removedRuler=false;
 if(intent.action==='remove'){if(!ruler||d||row.role!=='reference'||!ownedRuler(viewer,ruler,s))fail('REFERENCE_MEASUREMENT_REQUIRED','Remove only a current native reference ruler, never a driving equation.');removedRuler=true;}
 if(!ruler){
  if(intent.action==='convert'&&d)fail('RULER_REQUIRED','Create the Arc length ruler before changing its existing driving role.');
  if(typeof allocatedId!=='string'||!allocatedId||allocatedId.length>256||viewer.createIndex()[allocatedId]||viewer.dimLayers.some(l=>l.objects.some(o=>o.id===allocatedId)))fail('INVALID_ID','A fresh native ruler identity is required.');
  ruler=new ArcLengthDimension(s,allocatedId);addedRuler=true;
 }
 if(intent.action==='convert'&&desired==='driving'){
  if(typeof intent.value!=='number'||!Number.isFinite(intent.value)||intent.value<=0||intent.value>1e6)fail('INVALID_LENGTH','Choose explicit positive canonical millimeters up to 1000000.');
  if(d){if(Number(d.c.constants.length)!==intent.value)fail('ROLE_ALREADY_DRIVING','Use the normal driving-dimension edit to change its value.');}
  else{added=new AlgNumConstraint(ConstraintDefinitions.ArcLength,[s],{length:String(intent.value)});added.validateCandidateConstants(added.constants,v=>pm.constantResolver(v));}
 }else if(intent.action==='convert'&&desired==='reference'&&d)removed=d.c;
 const changed=addedRuler||removedRuler||!!added||!!removed;const originalRulerStage=ruler.stage,originalRulerIndex=viewer.dimLayer.objects.indexOf(ruler);let rulerRemoved=false;
 const validateAdmission=stages=>{
  for(const stage of stages){const sys=stage.algNumSystem,before=sys.transactionBefore;if(!before)fail('INVALID_TRANSACTION','Missing source transaction.');
   for(const c of sys.allConstraints){const was=before.conflicting.has(c)&&!before.redundant.has(c),now=sys.conflicting.has(c)&&!sys.redundant.has(c);if((c===added||!was)&&now)throw withAdmissionCause(Object.assign(Error('The length conversion was not admitted.'),{code:'MEASUREMENT_REJECTED'}),sys.getAdmissionCause(c));}
   if(added&&sys.allConstraints.includes(added)&&sys.redundant.has(added))fail('ALREADY_DETERMINED','The length is already determined by other constraints.');
  }
 };
 return {arc:s,ruler,added,removed,addedRuler,removedRuler,changed,role:desired,sourceDriver:d,
  mutate(){if(added)pm._add(added);if(removed)pm._removeConstraint(removed);},
  validateAdmission,
  validate(stages){validateAdmission(stages);for(const stage of stages)for(const [p,value]of stage.algNumSystem.transactionBefore.values)if(!Object.is(p.get(),value))fail('CURRENT_GEOMETRY_MISMATCH','Role conversion would change captured geometry.');},
  addRuler(){if(addedRuler)viewer.dimLayer.add(ruler);if(removedRuler){if(!ownedRuler(viewer,ruler,s)||viewer.dimLayer.objects.indexOf(ruler)!==originalRulerIndex)fail('INVALID_TARGET','Reference ruler changed before removal.');if(!viewer.dimLayer.remove(ruler))fail('INVALID_TARGET','Reference ruler removal did not occur.');rulerRemoved=true;}},
  rollbackExtra(){if(addedRuler&&viewer.dimLayer.objects.includes(ruler))viewer.dimLayer.remove(ruler);if(rulerRemoved){ruler.layer=null;originalRulerStage.assignObject(ruler);viewer.dimLayer.add(ruler);const at=viewer.dimLayer.objects.indexOf(ruler);viewer.dimLayer.objects.splice(at,1);viewer.dimLayer.objects.splice(originalRulerIndex,0,ruler);rulerRemoved=false;}}
 };
}
