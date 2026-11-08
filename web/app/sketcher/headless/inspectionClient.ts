import {ELLIPSE_MIN_SEMIAXIS_MM} from '../shapes/ellipseRecord.mjs';
import {runSketchSolve, SketchSolveOptions} from './client';
import {dimensionLocator,drivingLengthField,pointDrivingDimension,drivingPointDimensionValue,drivingDimensionObjectCount,drivingDimensionValueValid} from './drivingDimensionTarget.mjs';

const invalid=():never=>{throw Error('Invalid closed sketch inspection data.');};
const cancelled=()=>new DOMException('Sketch inspection cancelled or superseded.','AbortError');
function record(value:any,keys?:string[]) {
  if(!value||typeof value!=='object'||Array.isArray(value))return invalid();
  const proto=Object.getPrototypeOf(value),names=Reflect.ownKeys(value);
  if(proto!==null&&proto!==Object.prototype||names.some(key=>typeof key!=='string')||
     keys&&(names.length!==keys.length||keys.some(key=>!names.includes(key))))return invalid();
  const out=Object.create(null);
  for(const key of names as string[]){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))return invalid();out[key]=d.value;}
  return out;
}
function array(value:any,limit:number) {
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>limit||Reflect.ownKeys(value).length!==value.length+1)return invalid();
  const out=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))return invalid();out.push(d.value);}return out;
}
const text=(value:any,max=256)=>{if(typeof value!=='string'||!value||value.length>max)return invalid();return value;};
const integer=(value:any,max=10000)=>{if(!Number.isSafeInteger(value)||value<0||value>max)return invalid();return value;};
let outstanding=0;

// Capture input before lock waiting; the output is discovery data only. The
// coordinator must still fence source versions and lifetime at publication.
export function runClosedSketchInspection(workerUrl:string,input:any,options:SketchSolveOptions={}) {
  if(outstanding>=2)throw Error('Too many pending sketch inspections in this window.');
  outstanding++;
  return inspect(workerUrl,input,options).finally(()=>{outstanding--;});
}
async function inspect(workerUrl:string,input:any,options:SketchSolveOptions) {
  const args=record(input,['revision','sketchJSON','externalParameters']),opts=record(options);
  if(Object.keys(opts).some(key=>!['signal','valid','timeoutMs'].includes(key))||opts.valid!==undefined&&typeof opts.valid!=='function')return invalid();
  if(opts.signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(opts.signal)}catch{return invalid()}
  const timeout=opts.timeoutMs===undefined?30000:opts.timeoutMs;
  if(!Number.isSafeInteger(timeout)||timeout<1||timeout>30000)return invalid();
  const deadline=performance.now()+timeout;
  const current=(checkDeadline=true)=>{let okay=false;try{okay=!opts.signal?.aborted&&(!opts.valid||opts.valid()===true)&&!opts.signal?.aborted}catch{}if(!okay)throw cancelled();if(checkDeadline&&performance.now()>=deadline)throw Error('Sketch inspection timed out.');};
  const revision=text(args.revision),source=args.sketchJSON,params=record(args.externalParameters);
  if(typeof source!=='string'||source.length>1048576||Object.keys(params).length>1024)return invalid();
  for(const key of Object.keys(params))if(!key||key.length>256||typeof params[key]!=='number'||!Number.isFinite(params[key]))return invalid();
  current();
  // The shared client owns its deadline. A lifetime guard must not turn a
  // deadline into a false currentness result (reported as cancellation).
  const result=await runSketchSolve(workerUrl,Object.freeze({task:'sketch-transition-inspection',revision,sketchJSON:source,externalParameters:Object.freeze(params)}),{signal:opts.signal,valid:()=>{try{current(false);return true}catch{return false}},timeoutMs:timeout});
  current();
  if(!result.ok){
    const failed=record(result,['revision','ok','error']),error=record(failed.error,['code','message']);
    text(error.code,64);if(typeof error.message!=='string'||error.message.length>512)return invalid();
    const output=Object.freeze({revision,ok:false,error:Object.freeze(error)});current();return output;
  }
  const data=record(result,['revision','ok','objects','points','constraints','curves','ellipses','dimensionTargets','stageCount','boundaryFrame','emptyBoundary']);
  if(data.revision!==revision||data.ok!==true||typeof data.emptyBoundary!=='boolean'||!Number.isSafeInteger(data.stageCount)||data.stageCount<1||data.stageCount>32)return invalid();
  const rawObjects=array(data.objects,10000),rawConstraints=array(data.constraints,10000),objects=[],constraints=[],ids=new Set();
  let characters=0,referenceCount=0;
  for(let i=0;i<rawObjects.length;i++){
    const row=record(rawObjects[i],['id','type','role','stage']);text(row.id);text(row.type);integer(row.stage);if(row.stage>=data.stageCount)return invalid();
    if(ids.has(row.id)||row.role!==null&&(typeof row.role!=='string'||row.role.length>256))return invalid();
    characters+=row.id.length+row.type.length+(row.role?.length||0);if(characters>1048576)return invalid();ids.add(row.id);objects.push(Object.freeze(row));
    if(i%128===127){await new Promise(resolve=>setTimeout(resolve,0));current();}
  }
  const rawPoints=array(data.points,30000),points=[],pointIds=new Set();
  for(let i=0;i<rawPoints.length;i++){
    const point=record(rawPoints[i],['id','parentId','x','y']);text(point.id,1024);text(point.parentId);if(!ids.has(point.parentId)||pointIds.has(point.id)||![point.x,point.y].every(n=>typeof n==='number'&&Number.isFinite(n)))return invalid();
    characters+=point.id.length+point.parentId.length;if(characters>1048576)return invalid();pointIds.add(point.id);points.push(Object.freeze(point));
    if(i%128===127){await new Promise(resolve=>setTimeout(resolve,0));current();}
  }
  const rawCurves=array(data.curves,10000),curves=[],curveRoots=objects.filter(o=>['BezierCurve','BSpline'].includes(o.type)),curvePointIds=new Set();
  if(rawCurves.length!==curveRoots.length)return invalid();
  for(let i=0;i<rawCurves.length;i++){
    const c=record(rawCurves[i],['id','type','stage','role','representation','controls','derived','spline','canEdit','canEvaluate','reason']),root=curveRoots[i];
    if(c.id!==root.id||c.type!==root.type||c.stage!==root.stage||c.role!==root.role||typeof c.canEdit!=='boolean'||c.canEvaluate!==c.canEdit)return invalid();
    const rawControls=array(c.controls,64),rawDerived=array(c.derived,64),controls=[],derived=[];
    if(c.canEdit){
      if(c.reason!==null||c.representation!==(c.type==='BezierCurve'?'canonical-cubic-bezier':'cubic-clamped-cv-quasi-uniform')||rawControls.length<(c.type==='BezierCurve'?4:4)||c.type==='BezierCurve'&&rawControls.length!==4)return invalid();
    }else if(c.representation!=='unsupported-source-mode'||typeof c.reason!=='string'||!c.reason||c.reason.length>256||rawControls.length||rawDerived.length||c.spline!==null)return invalid();
    for(const p of rawControls){const v=record(p,['pointId','x','y']);text(v.pointId,1024);if(ids.has(v.pointId)||pointIds.has(v.pointId)||curvePointIds.has(v.pointId)||![v.x,v.y].every(n=>typeof n==='number'&&Number.isFinite(n)))return invalid();curvePointIds.add(v.pointId);characters+=v.pointId.length;controls.push(Object.freeze(v));}
    for(const p of rawDerived){const v=record(p,['pointId','x','y','role','editable']);text(v.pointId,1024);if(ids.has(v.pointId)||pointIds.has(v.pointId)||curvePointIds.has(v.pointId)||v.role!=='derived-fit'||v.editable!==false||![v.x,v.y].every(n=>typeof n==='number'&&Number.isFinite(n)))return invalid();curvePointIds.add(v.pointId);characters+=v.pointId.length;derived.push(Object.freeze(v));}
    let spline=null;
    if(c.canEdit&&c.type==='BSpline'){const s=record(c.spline,['degree','type','method','interpolation','CVModel','kValues']),knots=array(s.kValues,70);if(s.degree!==3||s.type!=='Clamped'||s.method!==0||s.interpolation!==false||s.CVModel!==true||derived.length!==controls.length-2||knots.length!==controls.length+4||knots.some((k,j)=>typeof k!=='number'||!Number.isFinite(k)||j>0&&k<knots[j-1])||knots[3]!==0||knots[controls.length]!==1)return invalid();spline=Object.freeze({...s,kValues:Object.freeze(knots)});}else if(c.spline!==null||derived.length)return invalid();
    characters+=c.id.length+(c.reason?.length||0);if(characters>1048576)return invalid();curves.push(Object.freeze({...c,controls:Object.freeze(controls),derived:Object.freeze(derived),spline}));
    if(i%64===63){await new Promise(resolve=>setTimeout(resolve,0));current();}
  }
  const rawEllipses=array(data.ellipses,10000),ellipses=[],ellipseIds=new Set(),centerIds=new Set(),byId=new Map(objects.map(o=>[o.id,o]));
  if(rawEllipses.length!==objects.filter(o=>o.type==='Ellipse').length)return invalid();
  for(let i=0;i<rawEllipses.length;i++){
    const e=record(rawEllipses[i],['id','centerId','stage','role','c','rx','ry','rotationRadians','encoding','canEdit','reason']),root=byId.get(e.id),c=record(e.c,['x','y']);
    text(e.id);text(e.centerId,1024);
    if(!root||root.type!=='Ellipse'||root.role!==e.role||root.stage!==e.stage||ellipseIds.has(e.id)||centerIds.has(e.centerId)||ids.has(e.centerId)||pointIds.has(e.centerId)||![c.x,c.y,e.rx,e.ry,e.rotationRadians].every(n=>typeof n==='number'&&Number.isFinite(n))||e.rx<=ELLIPSE_MIN_SEMIAXIS_MM||e.ry<=ELLIPSE_MIN_SEMIAXIS_MM||!['canonical-center-axes','legacy-endpoint-axis'].includes(e.encoding)||typeof e.canEdit!=='boolean'||(e.canEdit?(e.reason!==null||e.encoding!=='canonical-center-axes'):(typeof e.reason!=='string'||!e.reason||e.reason.length>256)))return invalid();
    characters+=e.id.length+e.centerId.length+(e.reason?.length||0);if(characters>1048576)return invalid();ellipseIds.add(e.id);centerIds.add(e.centerId);ellipses.push(Object.freeze({...e,c:Object.freeze(c)}));
    if(i%128===127){await new Promise(resolve=>setTimeout(resolve,0));current();}
  }
  const seen=new Set();
  for(let i=0;i<rawConstraints.length;i++){
    const row=record(rawConstraints[i],['stage','index','typeId','objects','constants','admission']);integer(row.stage);if(row.stage>=data.stageCount)return invalid();integer(row.index);text(row.typeId);
    const key=row.stage+':'+row.index;if(seen.has(key))return invalid();seen.add(key);
    const refs=array(row.objects,1024).map(id=>{text(id);characters+=id.length;if(++referenceCount>100000||characters>1048576)return invalid();return id;});
    const constants=record(row.constants),keys=Object.keys(constants);if(keys.length>64)return invalid();
    for(const k of keys){characters+=k.length;const value=constants[k];if(!k||k.length>256||typeof value==='number'&&!Number.isFinite(value)||!['string','number','boolean'].includes(typeof value))return invalid();if(typeof value==='string')characters+=value.length;}
    if(characters>1048576)return invalid();
    const admission=record(row.admission,['version','state']);if(admission.version!==1||!['accepted','redundant'].includes(admission.state))return invalid();
    constraints.push(Object.freeze({...row,objects:Object.freeze(refs),constants:Object.freeze(constants),admission:Object.freeze(admission)}));
    if(i%128===127){await new Promise(resolve=>setTimeout(resolve,0));current();}
  }
  const targetRows=array(data.dimensionTargets,10000),dimensionTargets=[],pointsById=new Map(points.map(p=>[p.id,p]));
  if(targetRows.length!==constraints.length)return invalid();
  for(let i=0;i<targetRows.length;i++){
    const row=record(targetRows[i],['constraintId','stage','index','typeId','objects','unit','rawValue','resolvedValue','canEdit','canRemove','reason']),c=constraints[i],refs=array(row.objects,1024),field=drivingLengthField(c.typeId);
    if(row.stage!==c.stage||row.index!==c.index||row.typeId!==c.typeId||refs.length!==c.objects.length||refs.some((id,j)=>id!==c.objects[j])||typeof row.canEdit!=='boolean'||row.canRemove!==row.canEdit||row.unit!==(field?'millimeter':null)||row.rawValue!==(field&&Object.prototype.hasOwnProperty.call(c.constants,field)?c.constants[field]:null))return invalid();
    if(row.canEdit){
      if(row.constraintId!==dimensionLocator(c.stage,c.index,c)||row.constraintId.length>4096||refs.length!==drivingDimensionObjectCount(c.typeId)||!drivingDimensionValueValid(c.typeId,row.resolvedValue)||row.reason!==null)return invalid();
      if(pointDrivingDimension(c.typeId)){
        if(refs[0]===refs[1]||refs.some(id=>typeof id!=='string'||id.length>256||!pointsById.has(id)))return invalid();
        const a=pointsById.get(refs[0]),b=pointsById.get(refs[1]),actual=drivingPointDimensionValue(c.typeId,a,b);
        if(!Object.is(row.resolvedValue,actual))return invalid();
      }else if(!ids.has(refs[0]))return invalid();
    }
    else if(row.constraintId!==null||row.resolvedValue!==null||typeof row.reason!=='string'||row.reason.length>256)return invalid();
    characters+=(row.constraintId?.length||0)+(row.reason?.length||0);if(characters>2097152)return invalid();
    dimensionTargets.push(Object.freeze({...row,objects:Object.freeze(refs)}));
    if(i%128===127){await new Promise(resolve=>setTimeout(resolve,0));current();}
  }
  const frame=record(data.boundaryFrame,['origin','x','y','z']);
  for(const key of Object.keys(frame)){const values=array(frame[key],3);if(values.length!==3||values.some(value=>typeof value!=='number'||!Number.isFinite(value)))return invalid();frame[key]=Object.freeze(values);}
  const output=Object.freeze({revision,ok:true,objects:Object.freeze(objects),points:Object.freeze(points),constraints:Object.freeze(constraints),curves:Object.freeze(curves),ellipses:Object.freeze(ellipses),dimensionTargets:Object.freeze(dimensionTargets),stageCount:data.stageCount,boundaryFrame:Object.freeze(frame),emptyBoundary:data.emptyBoundary});current();return output;
}
