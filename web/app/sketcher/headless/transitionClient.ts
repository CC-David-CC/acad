import {captureMirrorIntent,captureMirrorReceipt} from './mirrorIntent.mjs';
import {captureSlotIntent,captureSlotReceipt} from '../constr/straightSlotRecord.mjs';
import {captureCubicCreation,captureSplineIdentities,privateCurvePrimitiveKeys,captureCurveControlIntent,captureCurveSampleIntent} from '../shapes/cubicCurveRecord.mjs';
import {captureCurveControlReceipt,captureCurvePointsReply} from './cubicCurveReply.mjs';
import {captureConstraintGroupIntent,captureConstraintGroupReply} from './constraintGroupIntent.mjs';
import {captureSketchFailure} from '../constr/admissionCause.mjs';
import {runSketchSolve, SketchSolveOptions} from './client';
import {captureDrivingDimensionIntent,captureDrivingDimensionReply} from './drivingDimensionTarget.mjs';
import {captureEllipseParameters,captureEllipseEditIntent} from '../shapes/ellipseRecord.mjs';
import {capturePointDistanceIntent} from './pointDistanceEnvelope.mjs';

let transitionOutstanding=0;
const MAX_TRANSITIONS=2;

type TransitionTask = 'sketch-transition-mirror' | 'sketch-transition-slot' | 'sketch-transition-control-points' | 'sketch-transition-ellipse-parameters' | 'sketch-transition-constraint-group' | 'sketch-transition-remove-primitive' | 'sketch-transition-driving-dimension' | 'sketch-transition-replay' | 'sketch-transition-length-relation' | 'sketch-transition-primitive' | 'sketch-transition-point-coordinate' | 'sketch-transition-point-coordinates' | 'sketch-transition-radius' | 'sketch-transition-diameter' | 'sketch-transition-point-distance' | 'sketch-transition-signed-distance' | 'sketch-transition-line-relation';
const own = (o: any, key: string) => Object.getOwnPropertyDescriptor(o,key);
function plain(value: any) {
  if(!value || typeof value!=='object' || Array.isArray(value))return false;
  const proto=Object.getPrototypeOf(value);return proto===Object.prototype||proto===null;
}
function captureRecord(value: any, keys: string[]) {
  if(!plain(value)||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid sketch transition request.');
  const out=Object.create(null);
  for(const key of keys){const d=own(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid sketch transition request.');out[key]=d.value;}
  return out;
}
function captureArray(value:any,limit:number) {
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>limit||Reflect.ownKeys(value).length!==value.length+1)throw Error('Invalid sketch transition result.');
  const out=[];for(let i=0;i<value.length;i++){const d=own(value,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid sketch transition result.');out.push(d.value);}return out;
}
function captureOptions(options: SketchSolveOptions) {
  if(!plain(options)||Reflect.ownKeys(options).some(k=>typeof k!=='string'||!['signal','valid','timeoutMs'].includes(k)))throw Error('Invalid sketch transition options.');
  const result:any={};for(const k of Reflect.ownKeys(options) as string[]){const d=own(options,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid sketch transition options.');result[k]=d.value;}
  if(result.valid!==undefined&&typeof result.valid!=='function')throw Error('Invalid sketch transition guard.');
  if(result.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(result.signal)}catch{throw Error('Invalid cancellation signal.');}
  if(result.valid){const valid=result.valid;result.valid=()=>valid()===true;}
  return Object.freeze(result);
}
// Capture only bounded immutable plain data before runSketchSolve can yield or
// queue on its shared lock. This function is internal and does not publish.
export function runSketchTransition(workerUrl: string, task: TransitionTask, request: any, options: SketchSolveOptions = {}) {
  if(typeof workerUrl!=='string')throw Error('Invalid sketch worker URL.');
  if(!['sketch-transition-mirror','sketch-transition-slot','sketch-transition-control-points','sketch-transition-ellipse-parameters','sketch-transition-constraint-group','sketch-transition-remove-primitive','sketch-transition-driving-dimension','sketch-transition-replay','sketch-transition-length-relation','sketch-transition-primitive','sketch-transition-point-coordinate','sketch-transition-point-coordinates','sketch-transition-radius','sketch-transition-diameter','sketch-transition-point-distance','sketch-transition-signed-distance','sketch-transition-line-relation'].includes(task))throw Error('Invalid sketch transition task.');
  const input=captureRecord(request,task==='sketch-transition-driving-dimension'?['revision','sketchJSON','externalParameters','action','intent']:task==='sketch-transition-replay'?['revision','sketchJSON','externalParameters']:task==='sketch-transition-primitive'?['revision','sketchJSON','externalParameters','primitive']:['revision','sketchJSON','externalParameters','intent']);
  if(typeof input.revision!=='string'||!input.revision||input.revision.length>256||typeof input.sketchJSON!=='string'||input.sketchJSON.length>1048576)throw Error('Invalid sketch transition request.');
  if(!plain(input.externalParameters)||Reflect.ownKeys(input.externalParameters).length>1024)throw Error('Invalid sketch transition parameters.');
  const external=Object.create(null);for(const key of Reflect.ownKeys(input.externalParameters)){
    if(typeof key!=='string'||!key||key.length>256)throw Error('Invalid sketch transition parameters.');
    const d=own(input.externalParameters,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))throw Error('Invalid sketch transition parameters.');external[key]=d.value;
  }
  const payload:any={task,revision:input.revision,sketchJSON:input.sketchJSON,externalParameters:Object.freeze(external)};
  if(task==='sketch-transition-mirror')payload.intent=captureMirrorIntent(input.intent);
  if(task==='sketch-transition-radius'){const intent=captureRecord(input.intent,['id','radius']);if(typeof intent.id!=='string'||!intent.id||intent.id.length>256||typeof intent.radius!=='number'||!Number.isFinite(intent.radius)||intent.radius<=0||intent.radius>1e6)throw Error('Invalid radius intent.');payload.intent=Object.freeze(intent);}
  if(task==='sketch-transition-slot')payload.intent=captureSlotIntent(input.intent);
  if(task==='sketch-transition-control-points')payload.intent=captureCurveControlIntent(input.intent);
  if(task==='sketch-transition-ellipse-parameters')payload.intent=captureEllipseEditIntent(input.intent);
  if(task==='sketch-transition-constraint-group')payload.intent=captureConstraintGroupIntent(input.intent);
  if(task==='sketch-transition-remove-primitive'){const intent=captureRecord(input.intent,['id']);if(typeof intent.id!=='string'||!intent.id||intent.id.length>256)throw Error('Choose an inspected primitive identity.');payload.intent=Object.freeze({id:intent.id});}
  if(task==='sketch-transition-driving-dimension'){payload.action=input.action;payload.intent=captureDrivingDimensionIntent(input.intent,input.action);}
  if(task==='sketch-transition-point-distance')payload.intent=capturePointDistanceIntent(input.intent);
  if(task==='sketch-transition-length-relation'){
    const intent=captureRecord(input.intent,['ids','factor','offset']);
    if(!Array.isArray(intent.ids)||Object.getPrototypeOf(intent.ids)!==Array.prototype||intent.ids.length!==2||Reflect.ownKeys(intent.ids).length!==3)throw Error('Invalid length relation intent.');
    const ids=[0,1].map(i=>{const d=own(intent.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Invalid length relation intent.');return d.value;});
    if(ids[0]===ids[1]||typeof intent.factor!=='number'||!Number.isFinite(intent.factor)||intent.factor<0||typeof intent.offset!=='number'||!Number.isFinite(intent.offset))throw Error('Invalid length relation intent.');
    payload.intent=Object.freeze({ids:Object.freeze(ids),factor:intent.factor,offset:intent.offset});
  }
  if(task==='sketch-transition-signed-distance'){
    const intent=captureRecord(input.intent,['axis','ids','distance']),ids=captureArray(intent.ids,3);
    if(!['x','y','projected'].includes(intent.axis)||ids.length!==(intent.axis==='projected'?3:2)||ids.some(id=>typeof id!=='string'||!id||id.length>256)||ids[0]===ids[1]||typeof intent.distance!=='number'||!Number.isFinite(intent.distance)||Math.abs(intent.distance)>1e6)throw Error('Invalid signed distance.');
    payload.intent=Object.freeze({axis:intent.axis,ids:Object.freeze(ids),distance:intent.distance});
  }
  if(task==='sketch-transition-line-relation'){
    const intent=captureRecord(input.intent,['kind','ids']),ids=captureArray(intent.ids,3);
    if(!['collinear','axis-symmetry'].includes(intent.kind)||ids.length!==(intent.kind==='collinear'?2:3)||ids.some(id=>typeof id!=='string'||!id||id.length>256)||ids[0]===ids[1])throw Error('Choose distinct primary relation targets and a current live axis when required.');
    payload.intent=Object.freeze({kind:intent.kind,ids:Object.freeze(ids)});
  }
  if(task==='sketch-transition-point-coordinates'){
    const batch=captureRecord(input.intent,['points']),raw=captureArray(batch.points,32);if(!raw.length)throw Error('Choose at least one coordinate target.');
    const points=raw.map(value=>{const p=captureRecord(value,['id','x','y']);if(typeof p.id!=='string'||!p.id||p.id.length>256||![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Invalid sketch coordinate target.');return Object.freeze({id:p.id,x:p.x,y:p.y});});
    if(new Set(points.map(p=>p.id)).size!==points.length)throw Error('Choose distinct coordinate target IDs.');payload.intent=Object.freeze({points:Object.freeze(points)});
  }
  if(task==='sketch-transition-point-coordinate'||task==='sketch-transition-diameter'){
    const intent=captureRecord(input.intent,task==='sketch-transition-point-coordinate'?['id','x','y']:['id','diameter']);
    if(typeof intent.id!=='string'||!intent.id||intent.id.length>256)throw Error('Invalid mechanical edit identity.');
    if(task==='sketch-transition-point-coordinate'){
      if(![intent.x,intent.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Invalid sketch coordinate.');
      payload.intent=Object.freeze({id:intent.id,x:intent.x,y:intent.y});
    }else{
      if(typeof intent.diameter!=='number'||!Number.isFinite(intent.diameter)||intent.diameter<=0||intent.diameter>1e6)throw Error('Invalid sketch diameter.');
      payload.intent=Object.freeze({id:intent.id,diameter:intent.diameter});
    }
  }
  if(task==='sketch-transition-primitive'){
    const p=captureRecord(input.primitive,privateCurvePrimitiveKeys(input.primitive));
    if(typeof p.id!=='string'||!/^agent-primitive-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.id)||!['Point','Segment','Circle','Arc','Ellipse','BezierCurve','BSpline'].includes(p.kind)||![null,'construction'].includes(p.role)||!Number.isSafeInteger(p.stage)||p.stage<0||p.stage>31)throw Error('Invalid primitive intent.');
    const point=(value:any)=>{const q=captureRecord(value,['x','y']);if(![q.x,q.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Invalid primitive coordinate.');return Object.freeze({x:q.x,y:q.y});};
    let data:any;if(['BezierCurve','BSpline'].includes(p.kind))data=captureCubicCreation(p.kind,p.data);else if(p.kind==='Ellipse'){const d=captureEllipseParameters(p.data);data=Object.freeze({...d,c:point(d.c)});}else if(p.kind==='Point')data=point(p.data);else if(p.kind==='Circle'){const d=captureRecord(p.data,['c','r']);if(typeof d.r!=='number'||!Number.isFinite(d.r)||d.r<=1e-9||d.r>1e8)throw Error('Invalid circle radius.');data=Object.freeze({c:point(d.c),r:d.r});}else {const d=captureRecord(p.data,p.kind==='Arc'?['a','b','c']:['a','b']);data=Object.freeze(p.kind==='Arc'?{a:point(d.a),b:point(d.b),c:point(d.c)}:{a:point(d.a),b:point(d.b)});}
    payload.primitive=Object.freeze({id:p.id,kind:p.kind,role:p.role,stage:p.stage,data,...(p.kind==='BSpline'?{identities:captureSplineIdentities(p.identities,data.controlPoints.length)}:{})});
  }
  const capturedOptions=captureOptions(options),captured=Object.freeze(payload);
  const timeout=capturedOptions.timeoutMs===undefined?30000:capturedOptions.timeoutMs;
  if(!Number.isSafeInteger(timeout)||timeout<1||timeout>30000)throw Error('Invalid solve timeout.');
  const deadlineAt=performance.now()+timeout;
  const requireCurrent=()=>{try{if(!capturedOptions.signal?.aborted&&(!capturedOptions.valid||capturedOptions.valid()===true)&&!capturedOptions.signal?.aborted)return}catch{}throw new DOMException('Sketch transition cancelled','AbortError');};
  if(transitionOutstanding>=MAX_TRANSITIONS)throw Error('Too many pending sketch transitions in this window.');
  transitionOutstanding++;
  const requireDeadline=()=>{if(performance.now()>=deadlineAt)throw Error('Sketch transition timed out.');};
  return runSketchSolve(workerUrl,captured,capturedOptions).then(async result=>{
    requireCurrent();
    if(!result.ok){
      const envelope=captureRecord(result,['revision','ok','error']);const error=captureSketchFailure(envelope.error);
      if(error.code.length<1||error.code.length>64||error.message.length>512)throw Error('Invalid sketch transition result.');
      const output=Object.freeze({revision:captured.revision,ok:false,error});requireCurrent();requireDeadline();return output;
    }
    const text=result.serializedSketch,encoder=new TextEncoder();let bytes=0;
    for(let start=0;start<text.length;){
      let end=Math.min(start+32768,text.length);
      if(end<text.length&&text.charCodeAt(end-1)>=0xd800&&text.charCodeAt(end-1)<=0xdbff&&text.charCodeAt(end)>=0xdc00&&text.charCodeAt(end)<=0xdfff)end--;
      bytes+=encoder.encode(text.slice(start,end)).byteLength;if(bytes>1048576)throw Error('Invalid sketch transition result.');start=end;
      if(start<text.length){await new Promise(resolve=>setTimeout(resolve,0));requireCurrent();requireDeadline();}
    }
    const envelope=captureRecord(result,task==='sketch-transition-mirror'?['revision','ok','serializedSketch','evidence','mirror']:task==='sketch-transition-slot'?['revision','ok','changed','serializedSketch','evidence','slot']:task==='sketch-transition-control-points'?['revision','ok','changed','serializedSketch','evidence','curve']:task==='sketch-transition-ellipse-parameters'?['revision','ok','changed','serializedSketch','evidence','ellipse']:task==='sketch-transition-constraint-group'?['revision','ok','changed','serializedSketch','evidence','group']:task==='sketch-transition-remove-primitive'?['revision','ok','serializedSketch','evidence','removed']:(task==='sketch-transition-driving-dimension'||task==='sketch-transition-point-distance')?['revision','ok','changed','serializedSketch','evidence','dimension']:task==='sketch-transition-replay'?['revision','ok','serializedSketch','evidence']:task==='sketch-transition-primitive'?['revision','ok','serializedSketch','evidence','primitive']:task==='sketch-transition-point-coordinate'?['revision','ok','serializedSketch','evidence','point']:task==='sketch-transition-point-coordinates'?['revision','ok','serializedSketch','evidence','points']:(task==='sketch-transition-radius'||task==='sketch-transition-diameter'||task==='sketch-transition-signed-distance')?['revision','ok','serializedSketch','evidence','dimension']:['revision','ok','serializedSketch','evidence','relation']);
    let total=0;
    const rows=captureArray(envelope.evidence,10000),evidence=[];
    for(let index=0;index<rows.length;index++){const row=rows[index];
      const data=captureRecord(row,['typeId','state','residuals','tolerances','units','tolerance','unit']);
      if(typeof data.typeId!=='string'||!data.typeId||data.typeId.length>256||!['accepted','redundant'].includes(data.state)||
         !Array.isArray(data.residuals)||!Array.isArray(data.tolerances)||!Array.isArray(data.units)||
         data.residuals.length!==data.tolerances.length||data.residuals.length!==data.units.length||
         data.residuals.length>1024||(total+=data.residuals.length)>100000)throw Error('Invalid sketch transition evidence.');
      const residuals=captureArray(data.residuals,1024),tolerances=captureArray(data.tolerances,1024),units=captureArray(data.units,1024);
      if(residuals.some((v,i)=>typeof v!=='number'||!Number.isFinite(v)||typeof tolerances[i]!=='number'||!Number.isFinite(tolerances[i])||tolerances[i]<=0||Math.abs(v)>tolerances[i]||!['millimeter','radian'].includes(units[i])))throw Error('Invalid sketch transition evidence.');
      const mixed=new Set(units).size>1,expectedUnit=mixed?'mixed':(units[0]||'millimeter');
      if(data.unit!==expectedUnit||(mixed?data.tolerance!==null:(typeof data.tolerance!=='number'||!Number.isFinite(data.tolerance)||data.tolerance<=0||(tolerances.length>0&&data.tolerance!==tolerances[0]))))throw Error('Invalid sketch transition evidence.');
      evidence.push(Object.freeze({typeId:data.typeId,state:data.state,residuals:Object.freeze(residuals),tolerances:Object.freeze(tolerances),units:Object.freeze(units),tolerance:data.tolerance,unit:data.unit}));
      if(index%128===127&&index+1<rows.length){await new Promise(resolve=>setTimeout(resolve,0));requireCurrent();requireDeadline();}
    }
    const output:any={revision:captured.revision,ok:true,serializedSketch:envelope.serializedSketch,evidence:Object.freeze(evidence)};
    if(task==='sketch-transition-mirror')output.mirror=captureMirrorReceipt(envelope.mirror);
    if(task==='sketch-transition-slot'){output.slot=captureSlotReceipt(envelope.slot);output.changed=envelope.changed;}
    if(task==='sketch-transition-control-points'){if(typeof envelope.changed!=='boolean')throw Error('Invalid curve change outcome.');output.curve=captureCurveControlReceipt(envelope.curve,payload.intent);output.changed=envelope.changed;}
    if(task==='sketch-transition-ellipse-parameters'){const e=captureEllipseEditIntent(envelope.ellipse);if(typeof envelope.changed!=='boolean'||JSON.stringify(e)!==JSON.stringify(payload.intent))throw Error('Ellipse parameter result differs from captured intent.');output.changed=envelope.changed;output.ellipse=e;}
    if(task==='sketch-transition-constraint-group'){if(typeof envelope.changed!=='boolean')throw Error('Invalid group change classification.');output.group=captureConstraintGroupReply(envelope.group,payload.intent);output.changed=envelope.changed;if(output.group.existing===output.changed)throw Error('Invalid group no-op classification.');}
    if(task==='sketch-transition-length-relation'){
      const r=captureRecord(envelope.relation,['objects','status']),ids=payload.intent.ids;
      const relationObjects=captureArray(r.objects,2);
      if(relationObjects.length!==2||relationObjects[0]!==ids[0]||relationObjects[1]!==ids[1]||!['accepted','redundant'].includes(r.status))throw Error('Invalid sketch transition result.');
      output.relation=Object.freeze({objects:Object.freeze(relationObjects),status:r.status});
    }
    if(task==='sketch-transition-remove-primitive'){const r=captureRecord(envelope.removed,['id','kind','role','stage']);if(r.id!==payload.intent.id||r.kind!=='Segment'||![null,'construction'].includes(r.role)||!Number.isSafeInteger(r.stage)||r.stage<0||r.stage>31)throw Error('Invalid removed primitive identity.');output.removed=Object.freeze({id:r.id,kind:r.kind,role:r.role,stage:r.stage});}
    if(task==='sketch-transition-primitive'){
      const p=captureRecord(envelope.primitive,['id','kind','role','stage']),expected=payload.primitive;
      if(p.id!==expected.id||p.kind!==expected.kind||p.role!==expected.role||p.stage!==expected.stage)throw Error('Invalid primitive transition identity.');
      output.primitive=Object.freeze({id:p.id,kind:p.kind,role:p.role,stage:p.stage});
    }
    if(task==='sketch-transition-point-coordinate'){
      const p=captureRecord(envelope.point,['id','x','y']),expected=payload.intent;
      if(p.id!==expected.id||p.x!==expected.x||p.y!==expected.y)throw Error('Invalid coordinate transition identity.');
      output.point=Object.freeze({id:p.id,x:p.x,y:p.y});
    }
    if(task==='sketch-transition-point-coordinates'){
      const raw=captureArray(envelope.points,32),expected=payload.intent.points;if(raw.length!==expected.length)throw Error('Invalid coordinate batch identity.');
      output.points=Object.freeze(raw.map((value,i)=>{const p=captureRecord(value,['id','x','y']),e=expected[i];if(p.id!==e.id||p.x!==e.x||p.y!==e.y)throw Error('Invalid coordinate batch identity.');return Object.freeze({id:p.id,x:p.x,y:p.y});}));
    }
    if(task==='sketch-transition-signed-distance'){
      const d=captureRecord(envelope.dimension,['axis','typeId','objects','distance','status']),expected=payload.intent,ids=captureArray(d.objects,3),typeId=expected.axis==='x'?'SignedDistanceX':expected.axis==='y'?'SignedDistanceY':'ProjectedDistance';
      if(d.axis!==expected.axis||d.typeId!==typeId||ids.length!==expected.ids.length||ids.some((id,i)=>id!==expected.ids[i])||d.distance!==expected.distance||!['accepted','redundant'].includes(d.status)||!evidence.some(row=>row.typeId===typeId&&row.state===d.status))throw Error('Invalid signed distance identity or evidence.');
      output.dimension=Object.freeze({axis:d.axis,typeId:d.typeId,objects:Object.freeze(ids),distance:d.distance,status:d.status});
    }
    if(task==='sketch-transition-point-distance'){
      const d=captureRecord(envelope.dimension,['typeId','objects','distance','status','stage','index']),intent=capturePointDistanceIntent({ids:d.objects,distance:d.distance}),expected=payload.intent;
      if(typeof envelope.changed!=='boolean'||d.typeId!=='DistancePP'||intent.ids.some((id,i)=>id!==expected.ids[i])||d.distance!==expected.distance||d.stage!==0||!Number.isSafeInteger(d.index)||d.index<0||d.index>=evidence.length||!['accepted','redundant'].includes(d.status)||evidence[d.index].typeId!=='DistancePP'||evidence[d.index].state!==d.status)throw Error('Invalid Euclidean point distance identity or final evidence.');
      output.changed=envelope.changed;output.dimension=Object.freeze({...d,objects:intent.ids});
    }
    if(task==='sketch-transition-line-relation'){
      const r=captureRecord(envelope.relation,['kind','typeId','objects','stage','index','status','existing']),expected=payload.intent,ids=captureArray(r.objects,3),typeId=expected.kind==='collinear'?'Collinear':'AxisSymmetry';
      if(r.kind!==expected.kind||r.typeId!==typeId||ids.length!==expected.ids.length||ids.some((id,i)=>id!==expected.ids[i])||!Number.isSafeInteger(r.stage)||r.stage<0||r.stage>31||!Number.isSafeInteger(r.index)||r.index<0||r.index>=10000||!['accepted','redundant'].includes(r.status)||typeof r.existing!=='boolean'||(r.existing&&r.status!=='redundant')||(!r.existing&&!evidence.some(row=>row.typeId===r.typeId&&row.state===r.status)))throw Error('Invalid line relation identity or evidence.');
      output.relation=Object.freeze({kind:r.kind,typeId:r.typeId,objects:Object.freeze(ids),stage:r.stage,index:r.index,status:r.status,existing:r.existing});
    }
    if(task==='sketch-transition-radius'){const d=captureRecord(envelope.dimension,['id','typeId','radius','status']);if(d.id!==payload.intent.id||d.typeId!=='RadiusLength'||d.radius!==payload.intent.radius||!['accepted','redundant'].includes(d.status)||!evidence.some(row=>row.typeId==='RadiusLength'&&row.state===d.status))throw Error('Invalid radius receipt.');output.dimension=Object.freeze(d);}
    if(task==='sketch-transition-diameter'){
      const d=captureRecord(envelope.dimension,['id','typeId','diameter','status']),expected=payload.intent;
      if(d.id!==expected.id||d.typeId!=='DiameterLength'||d.diameter!==expected.diameter||!['accepted','redundant'].includes(d.status)||!evidence.some(row=>row.typeId==='DiameterLength'&&row.state===d.status))throw Error('Invalid diameter transition identity or evidence.');
      output.dimension=Object.freeze({id:d.id,typeId:d.typeId,diameter:d.diameter,status:d.status});
    }
    if(task==='sketch-transition-driving-dimension'){const captured=captureDrivingDimensionReply(envelope,input.revision),d=captured.dimension;if(d.constraintId!==payload.intent.constraintId||d.action!==payload.action||d.action==='edit'&&String(d.rawValue)!==String(payload.intent.value))throw Error('Dimension response intent changed.');output.changed=captured.changed;output.dimension=d;}
    Object.freeze(output);requireCurrent();requireDeadline();return output;
  }).finally(()=>{transitionOutstanding--;});
}

// Internal coordinator only; candidates do not gain authority by being valid JSON.
export function verifySignedDistanceCandidate(workerUrl:string,request:any,options:SketchSolveOptions={}){
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-signed-distance',...request}),options);
}
export function verifyPointDistanceCandidate(workerUrl:string,request:any,options:SketchSolveOptions={}){
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-point-distance',...request}),options);
}
export function verifyLineRelationCandidate(workerUrl:string,request:any,options:SketchSolveOptions={}){
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-line-relation',...request}),options);
}

function verifyCoordinates(workerUrl:string,input:any,options:SketchSolveOptions,batch:boolean){
 const key=batch?'points':'point',a=captureRecord(input,['revision','sketchJSON','externalParameters','intent','candidateJSON',key]);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576))throw Error('Invalid coordinate verification source.');
 const capturePoint=value=>{const p=captureRecord(value,['id','x','y']);if(typeof p.id!=='string'||!p.id||p.id.length>256||![p.x,p.y].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e8))throw Error('Invalid coordinate verification target.');return Object.freeze({id:p.id,x:p.x,y:p.y});};
 const intent:any=batch?Object.freeze({points:Object.freeze(captureArray(captureRecord(a.intent,['points']).points,32).map(capturePoint))}):capturePoint(a.intent);
 const receipt:any=batch?Object.freeze(captureArray(a.points,32).map(capturePoint)):capturePoint(a.point),requested=batch?intent.points:[intent],returned=batch?receipt:[receipt];
 if(!requested.length||new Set(requested.map(p=>p.id)).size!==requested.length||JSON.stringify(requested)!==JSON.stringify(returned))throw Error('Coordinate verification receipt differs from exact requested targets.');
 if(!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid coordinate verification parameters.');const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters)as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])||Math.abs(external[k])>1e9))throw Error('Invalid coordinate verification parameters.');
 return runSketchSolve(workerUrl,Object.freeze({task:batch?'sketch-transition-verify-point-coordinates':'sketch-transition-verify-point-coordinate',revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:Object.freeze(external),intent,candidateJSON:a.candidateJSON,[key]:receipt}),captureOptions(options));
}
export function verifyPointsCoordinatesCandidate(workerUrl:string,request:any,options:SketchSolveOptions={}){return verifyCoordinates(workerUrl,request,options,true);}
export function verifyPointCoordinatesCandidate(workerUrl:string,request:any,options:SketchSolveOptions={}){return verifyCoordinates(workerUrl,request,options,false);}

// Captured before the common client can queue or yield.
export function verifyDrivingDimensionCandidate(workerUrl:string,input:any,options:SketchSolveOptions={},travel=false){
 const a=captureRecord(input,travel?['revision','sketchJSON','externalParameters','candidateJSON']:['revision','sketchJSON','externalParameters','candidateJSON','action','intent']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576))throw Error('Invalid dimension verification source.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).length>1024||Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid dimension verification bindings.');
 const request:any={task:travel?'sketch-transition-verify-dimension-travel':'sketch-transition-verify-driving-dimension',revision:a.revision,sketchJSON:a.sketchJSON,candidateJSON:a.candidateJSON,externalParameters:Object.freeze(external)};
 if(!travel){request.action=a.action;request.intent=captureDrivingDimensionIntent(a.intent,a.action);}
 return runSketchSolve(workerUrl,Object.freeze(request),captureOptions(options));
}

// Capture metadata before queueing; parsing/reconstruction stays in the Worker.
export function verifyPrimitiveRemovalCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){
 const a=captureRecord(input,['revision','sketchJSON','externalParameters','intent','candidateJSON','removed']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576))throw Error('Invalid removal verification source.');
 const intent=captureRecord(a.intent,['id']),removed=captureRecord(a.removed,['id','kind','role','stage']);
 if(typeof intent.id!=='string'||!intent.id||intent.id.length>256||removed.id!==intent.id||removed.kind!=='Segment'||![null,'construction'].includes(removed.role)||!Number.isSafeInteger(removed.stage)||removed.stage<0||removed.stage>31)throw Error('Invalid removal verification identity.');
 if(!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid removal bindings.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid removal bindings.');
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-remove-primitive',revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:Object.freeze(external),intent:Object.freeze(intent),candidateJSON:a.candidateJSON,removed:Object.freeze(removed)}),captureOptions(options));
}

export function verifyConstraintGroupCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){
 const a=captureRecord(input,['revision','sketchJSON','externalParameters','intent','candidateJSON']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576))throw Error('Invalid constraint group verification source.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).length>1024||Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid group verification bindings.');
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-constraint-group',revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:Object.freeze(external),intent:captureConstraintGroupIntent(a.intent),candidateJSON:a.candidateJSON}),captureOptions(options));
}


// Internal append verifier: bounded own-data capture BEFORE queueing. The
// public caller never supplies IDs or candidate bytes to this route.
export function verifyPrimitiveAppendCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){
 const a=captureRecord(input,['revision','sketchJSON','externalParameters','primitive','candidateJSON']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576))throw Error('Invalid append verification source.');
 if(!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid append bindings.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid append bindings.');
 const primitive=captureRecord(a.primitive,privateCurvePrimitiveKeys(a.primitive));
 if(typeof primitive.id!=='string'||!/^agent-primitive-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(primitive.id)||!['Point','Segment','Circle','Arc','Ellipse','BezierCurve','BSpline'].includes(primitive.kind)||![null,'construction'].includes(primitive.role)||!Number.isSafeInteger(primitive.stage)||primitive.stage<0||primitive.stage>31)throw Error('Invalid append verification identity.');
 const point=(value:any)=>{const q=captureRecord(value,['x','y']);if(![q.x,q.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Invalid primitive coordinate.');return Object.freeze(q);};
 let data:any;
 if(['BezierCurve','BSpline'].includes(primitive.kind))data=captureCubicCreation(primitive.kind,primitive.data);
 else if(primitive.kind==='Point')data=point(primitive.data);
 else if(primitive.kind==='Ellipse'){const d=captureEllipseParameters(primitive.data);data=Object.freeze({...d,c:point(d.c)});}
 else if(primitive.kind==='Circle'){const d=captureRecord(primitive.data,['c','r']);if(typeof d.r!=='number'||!Number.isFinite(d.r)||d.r<=1e-9||d.r>1e8)throw Error('Invalid circle radius.');data=Object.freeze({c:point(d.c),r:d.r});}
 else{const d=captureRecord(primitive.data,primitive.kind==='Arc'?['a','b','c']:['a','b']);data=Object.freeze(primitive.kind==='Arc'?{a:point(d.a),b:point(d.b),c:point(d.c)}:{a:point(d.a),b:point(d.b)});}
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-primitive',revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:Object.freeze(external),primitive:Object.freeze({...primitive,data,...(primitive.kind==='BSpline'?{identities:captureSplineIdentities(primitive.identities,data.controlPoints.length)}:{})}),candidateJSON:a.candidateJSON}),captureOptions(options));
}


// Original request captured before queueing; no caller-provided scope/geometry
// permission or solved status can replace the independent Worker reconstruction.
export function verifyLengthRelationCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){
 const a=captureRecord(input,['revision','sketchJSON','externalParameters','intent','candidateJSON','relation']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576))throw Error('Invalid length relation verification source.');
 const intent=captureRecord(a.intent,['ids','factor','offset']),ids=captureArray(intent.ids,2);if(ids.length!==2||ids.some(id=>typeof id!=='string'||!id||id.length>256)||ids[0]===ids[1]||typeof intent.factor!=='number'||!Number.isFinite(intent.factor)||intent.factor<0||typeof intent.offset!=='number'||!Number.isFinite(intent.offset))throw Error('Invalid length relation verification intent.');
 const relation=captureRecord(a.relation,['objects','status']),objects=captureArray(relation.objects,2);if(objects.length!==2||objects.some((id,i)=>id!==ids[i])||!['accepted','redundant'].includes(relation.status))throw Error('Invalid length relation verification receipt.');
 if(!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid length relation verification bindings.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid length relation bindings.');
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-length-relation',revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:Object.freeze(external),intent:Object.freeze({...intent,ids:Object.freeze(ids)}),candidateJSON:a.candidateJSON,relation:Object.freeze({...relation,objects:Object.freeze(objects)})}),captureOptions(options));
}

// Bounded before-queue capture; original source/intent, not candidate evidence,
// independently reconstructs this one parameter transition in a genuine Worker.
export function verifyEllipseParametersCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){
 const a=captureRecord(input,['revision','sketchJSON','externalParameters','intent','candidateJSON','ellipse','changed']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576)||typeof a.changed!=='boolean')throw Error('Invalid ellipse verification source.');
 if(!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid ellipse bindings.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid ellipse bindings.');
 const intent=captureEllipseEditIntent(a.intent),ellipse=captureEllipseEditIntent(a.ellipse);if(JSON.stringify(intent)!==JSON.stringify(ellipse))throw Error('Ellipse verification receipt changed.');
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-ellipse-parameters',revision:a.revision,sketchJSON:a.sketchJSON,candidateJSON:a.candidateJSON,externalParameters:Object.freeze(external),intent,ellipse,changed:a.changed}),captureOptions(options)).then(result=>{
  if(!result?.ok){const e=captureRecord(result,['revision','ok','error']);if(e.revision!==a.revision||e.ok!==false)throw Error('Invalid ellipse verification failure.');return Object.freeze({revision:a.revision,ok:false,error:captureSketchFailure(e.error)});}
  const r=captureRecord(result,['revision','ok','verified']);if(r.revision!==a.revision||r.ok!==true||r.verified!==true)throw Error('Invalid ellipse verification.');return Object.freeze({revision:r.revision,ok:true,verified:true});
 });
}

function captureCubicRequest(input:any,verify:boolean,read:boolean){
 const a=captureRecord(input,verify?['revision','sketchJSON','externalParameters','intent','candidateJSON','curve','changed']:['revision','sketchJSON','externalParameters','intent']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||typeof a.sketchJSON!=='string'||a.sketchJSON.length>1048576||verify&&(typeof a.candidateJSON!=='string'||a.candidateJSON.length>1048576||typeof a.changed!=='boolean'))throw Error('Invalid curve source request.');
 if(!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid curve parameter bindings.');const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid curve binding value.');
 return Object.freeze({...a,externalParameters:Object.freeze(external),intent:read?captureCurveSampleIntent(a.intent):captureCurveControlIntent(a.intent),...(verify?{curve:captureCurveControlReceipt(a.curve,a.intent)}:{})});
}
export function verifyCubicControlPointsCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){const a=captureCubicRequest(input,true,false);return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-control-points',...a}),captureOptions(options));}
export function runCubicCurvePoints(workerUrl:string,input:any,options:SketchSolveOptions={}){const a=captureCubicRequest(input,false,true);return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-curve-points',...a}),captureOptions(options)).then(result=>captureCurvePointsReply(result,a.revision,a.intent));}

export function verifyStraightSlotCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){
 const a=captureRecord(input,['revision','sketchJSON','externalParameters','intent','candidateJSON','slot','changed']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576)||typeof a.changed!=='boolean')throw Error('Invalid Slot verification source.');
 if(!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid Slot bindings.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid Slot bindings.');
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-slot',revision:a.revision,sketchJSON:a.sketchJSON,candidateJSON:a.candidateJSON,externalParameters:Object.freeze(external),intent:captureSlotIntent(a.intent),slot:captureSlotReceipt(a.slot),changed:a.changed}),captureOptions(options));
}

export function verifySketchMirrorCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){
 const a=captureRecord(input,['revision','sketchJSON','externalParameters','intent','candidateJSON','mirror']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576)||!plain(a.externalParameters)||Reflect.ownKeys(a.externalParameters).length>1024)throw Error('Invalid Mirror verification source.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])))throw Error('Invalid Mirror parameter bindings.');
 return runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-verify-mirror',revision:a.revision,sketchJSON:a.sketchJSON,candidateJSON:a.candidateJSON,externalParameters:Object.freeze(external),intent:captureMirrorIntent(a.intent),mirror:captureMirrorReceipt(a.mirror)}),captureOptions(options));
}

// Exact original request and first receipt are captured before queueing. The
// independent Worker reconstructs both, not only a self-consistent candidate.
export function verifyRadiusCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){return verifyRadius(workerUrl,input,options,false);}
export function verifyRadiusDimensionCandidate(workerUrl:string,input:any,options:SketchSolveOptions={}){return verifyRadius(workerUrl,input,options,true);}
function verifyRadius(workerUrl:string,input:any,options:SketchSolveOptions,existing:boolean){
 const a=captureRecord(input,existing?['revision','sketchJSON','externalParameters','action','intent','candidateJSON','dimension']:['revision','sketchJSON','externalParameters','intent','candidateJSON','dimension']);
 if(typeof a.revision!=='string'||!a.revision||a.revision.length>256||[a.sketchJSON,a.candidateJSON].some(v=>typeof v!=='string'||v.length>1048576))throw Error('Invalid radius verification source.');
 const external=captureRecord(a.externalParameters,Reflect.ownKeys(a.externalParameters) as string[]);if(Object.keys(external).length>1024||Object.keys(external).some(k=>!k||k.length>256||typeof external[k]!=='number'||!Number.isFinite(external[k])||Math.abs(external[k])>1e9))throw Error('Invalid radius bindings.');
 let intent:any,dimension:any;
 if(existing){intent=captureDrivingDimensionIntent(a.intent,a.action);dimension=captureRecord(a.dimension,['constraintId','action','typeId','objects','rawValue','resolvedValue','status']);dimension.objects=Object.freeze(captureArray(dimension.objects,1));if(dimension.objects.length!==1||dimension.objects.some(id=>typeof id!=='string'||!id||id.length>256)||dimension.constraintId!==intent.constraintId||dimension.action!==a.action||dimension.typeId!=='RadiusLength'||!['accepted','redundant','removed'].includes(dimension.status))throw Error('Invalid radius dimension receipt.');}
 else{intent=captureRecord(a.intent,['id','radius']);dimension=captureRecord(a.dimension,['id','typeId','radius','status']);if(typeof intent.id!=='string'||!intent.id||intent.id.length>256||typeof intent.radius!=='number'||!Number.isFinite(intent.radius)||intent.radius<=0||intent.radius>1e6||dimension.id!==intent.id||dimension.typeId!=='RadiusLength'||dimension.radius!==intent.radius||!['accepted','redundant'].includes(dimension.status))throw Error('Invalid original radius intent/receipt.');}
 return runSketchSolve(workerUrl,Object.freeze({task:existing?'sketch-transition-verify-radius-dimension':'sketch-transition-verify-radius',revision:a.revision,sketchJSON:a.sketchJSON,externalParameters:Object.freeze(external),intent:Object.freeze(intent),candidateJSON:a.candidateJSON,dimension:Object.freeze(dimension),...(existing?{action:a.action}:{})}),captureOptions(options));
}
