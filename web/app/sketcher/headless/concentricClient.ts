import {runSketchSolve, SketchSolveOptions} from './client';
import workerUrl from 'codi-headless-sketch-worker';

let transitionOutstanding=0;
const MAX_TRANSITIONS=2;

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
export function runConcentricTransition(request: any, options: SketchSolveOptions = {}) {
  const task = 'sketch-transition-concentric';
  const input=captureRecord(request,['revision','sketchJSON','externalParameters','intent']);
  if(typeof input.revision!=='string'||!input.revision||input.revision.length>256||typeof input.sketchJSON!=='string'||input.sketchJSON.length>1048576)throw Error('Invalid sketch transition request.');
  if(!plain(input.externalParameters)||Reflect.ownKeys(input.externalParameters).length>1024)throw Error('Invalid sketch transition parameters.');
  const external=Object.create(null);for(const key of Reflect.ownKeys(input.externalParameters)){
    if(typeof key!=='string'||!key||key.length>256)throw Error('Invalid sketch transition parameters.');
    const d=own(input.externalParameters,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))throw Error('Invalid sketch transition parameters.');external[key]=d.value;
  }
  const payload:any={task,revision:input.revision,sketchJSON:input.sketchJSON,externalParameters:Object.freeze(external)};
  const intent=captureRecord(input.intent,['ids']);
  if(!Array.isArray(intent.ids)||Object.getPrototypeOf(intent.ids)!==Array.prototype||intent.ids.length!==2||Reflect.ownKeys(intent.ids).length!==3)throw Error('Invalid concentric intent.');
  const ids=[0,1].map(i=>{const d=own(intent.ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw Error('Invalid concentric intent.');return d.value;});
  if(ids[0]===ids[1])throw Error('Invalid concentric intent.');payload.intent=Object.freeze({ids:Object.freeze(ids)});
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
      const envelope=captureRecord(result,['revision','ok','error']);const error=captureRecord(envelope.error,['code','message']);
      if(error.code.length<1||error.code.length>64||error.message.length>512)throw Error('Invalid sketch transition result.');
      const output=Object.freeze({revision:captured.revision,ok:false,error:Object.freeze({code:error.code,message:error.message})});requireCurrent();requireDeadline();return output;
    }
    const text=result.serializedSketch,encoder=new TextEncoder();let bytes=0;
    for(let start=0;start<text.length;){
      let end=Math.min(start+32768,text.length);
      if(end<text.length&&text.charCodeAt(end-1)>=0xd800&&text.charCodeAt(end-1)<=0xdbff&&text.charCodeAt(end)>=0xdc00&&text.charCodeAt(end)<=0xdfff)end--;
      bytes+=encoder.encode(text.slice(start,end)).byteLength;if(bytes>1048576)throw Error('Invalid sketch transition result.');start=end;
      if(start<text.length){await new Promise(resolve=>setTimeout(resolve,0));requireCurrent();requireDeadline();}
    }
    const envelope=captureRecord(result,['revision','ok','serializedSketch','evidence','relation']);
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
    const r=captureRecord(envelope.relation,['typeId','objects','stage','index','status']);
    const relationObjects=captureArray(r.objects,2);
    if(r.typeId!=='Concentric'||relationObjects.length!==2||relationObjects[0]!==ids[0]||relationObjects[1]!==ids[1]||!Number.isSafeInteger(r.stage)||r.stage<0||r.stage>31||!Number.isSafeInteger(r.index)||r.index<0||r.index>9999||!['accepted','redundant'].includes(r.status))throw Error('Invalid concentric transition result.');
    output.relation=Object.freeze({typeId:r.typeId,objects:Object.freeze(relationObjects),stage:r.stage,index:r.index,status:r.status});
    Object.freeze(output);requireCurrent();requireDeadline();return output;
  }).finally(()=>{transitionOutstanding--;});
}
