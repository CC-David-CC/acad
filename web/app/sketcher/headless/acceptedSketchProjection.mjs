// Research-only ownership prototype. This module installs nothing in a viewer.
// The caller must provide the private pinned replay transport and a guard that
// covers source bytes, face/frame, document/editor epoch and account lifetime.
const LIMIT=1024*1024;
const stopped=()=>new DOMException('Sketch projection was cancelled or superseded.','AbortError');
function record(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid sketch projection input.');
  const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Invalid sketch projection input.');out[key]=d.value;}return out;
}
function array(value,max){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max||Reflect.ownKeys(value).length!==value.length+1)throw Error('Invalid projection array.');const out=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Invalid projection array.');out.push(d.value)}return out;}
async function captureRender(raw,check){
  // Read only bounded data descriptors; never parse native JSON on the UI.
  let nodes=0,characters=0;const seen=new Set();
  async function clone(v,depth){
    if(++nodes>100000||depth>16)throw Error('Render projection exceeds its limit.');
    if(nodes%128===0){await new Promise(resolve=>setTimeout(resolve,0));check();}
    if(typeof v==='string'){characters+=v.length;if(characters>LIMIT)throw Error('Render projection exceeds its limit.');return v;}
    if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return v;
    if(!v||typeof v!=='object'||seen.has(v))throw Error('Invalid render data.');
    const isArray=Array.isArray(v),proto=Object.getPrototypeOf(v),keys=Reflect.ownKeys(v);
    if(isArray?(proto!==Array.prototype||keys.length!==v.length+1||v.length>10000):(proto!==Object.prototype&&proto!==null)||keys.length>64)throw Error('Invalid render data.');
    const out=isArray?[]:Object.create(null);seen.add(v);
    try{for(let i=0;i<keys.length;i++){const key=keys[i];if(typeof key!=='string')throw Error('Invalid render data.');if(isArray&&key==='length')continue;if(isArray&&key!==String(i))throw Error('Invalid render data.');const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value')||key==='__proto__')throw Error('Invalid render data.');characters+=key.length;if(characters>LIMIT)throw Error('Render projection exceeds its limit.');Object.defineProperty(out,key,{value:await clone(d.value,depth+1),enumerable:true});}}finally{seen.delete(v)}return Object.freeze(out);
  }
  const data=await clone(raw,0);check();
  const top=record(data,['version','objects','unsupported','bounds','capabilities','unrendered']);
  if(top.version!==1||!Array.isArray(top.objects)||!Array.isArray(top.unsupported)||!Array.isArray(top.unrendered))throw Error('Invalid render projection.');
  const num=n=>{if(typeof n!=='number'||!Number.isFinite(n))throw Error('Invalid render coordinate.');return n;};
  const point=p=>{const v=record(p,['x','y']);num(v.x);num(v.y);};
  let splinePoints=0;
  async function shape(g,kind){
    let x;if(kind==='point'){x=record(g,['kind','x','y']);num(x.x);num(x.y);}
    else if(kind==='segment'){x=record(g,['kind','a','b']);point(x.a);point(x.b);}
    else if(kind==='circle'){x=record(g,['kind','c','r']);point(x.c);if(num(x.r)<=0)throw Error('Invalid circle.');}
    else if(kind==='arc'){x=record(g,['kind','c','r','start','end','fullCircle','endPoint','endRadius']);point(x.c);point(x.endPoint);if(num(x.r)<=0||num(x.endRadius)<=0||typeof x.fullCircle!=='boolean')throw Error('Invalid arc.');num(x.start);num(x.end);}
    else if(kind==='ellipse'||kind==='ellipticalArc'){x=record(g,['kind','c','rx','ry','rotation',...(kind==='ellipticalArc'?['start','end','fullCircle']:[])]);point(x.c);if(num(x.rx)<=0||num(x.ry)<=0)throw Error('Invalid ellipse.');num(x.rotation);if(kind==='ellipticalArc'){num(x.start);num(x.end);if(typeof x.fullCircle!=='boolean')throw Error('Invalid arc.');}}
    else if(kind==='polyline'){x=record(g,['kind','points','approximation','tolerance']);if(x.approximation!=='bounded-bezier-chord-v1'||x.tolerance!==0.01||!Array.isArray(x.points)||x.points.length<2||x.points.length>4096||(splinePoints+=x.points.length)>8192)throw Error('Invalid spline projection.');for(let i=0;i<x.points.length;i++){point(x.points[i]);if(i%128===127){await new Promise(resolve=>setTimeout(resolve,0));check();}}}
    else if(kind==='cubic'){x=record(g,['kind','p0','p1','p2','p3']);for(const k of ['p0','p1','p2','p3'])point(x[k]);}else throw Error('Invalid render geometry.');
  }
  const kinds={Point:'point',Segment:'segment',Circle:'circle',Arc:'arc',Ellipse:'ellipse',EllipticalArc:'ellipticalArc',BezierCurve:'cubic',BSpline:'polyline'},ids=new Set(),missing=new Map();
  let rendered=0;for(const obj of top.objects){const o=record(obj,['id','type','role','stage','geometry','handles']);if(typeof o.id!=='string'||!o.id||o.id.length>1024||ids.has(o.id)||typeof o.type!=='string'||!o.type||o.type.length>256||!(o.role===null||typeof o.role==='string'&&o.role.length<=256)||!Number.isSafeInteger(o.stage)||o.stage<0||o.stage>31||!Array.isArray(o.handles)||o.handles.length>32)throw Error('Invalid render object.');ids.add(o.id);if(o.geometry===null){if(o.handles.length)throw Error('Invalid unsupported geometry.');missing.set(o.id,o.type);}else if(!o.geometry||typeof o.geometry!=='object'||kinds[o.type]!==o.geometry.kind)throw Error('Invalid render geometry.');else await shape(o.geometry,o.geometry.kind);for(const h of o.handles){const p=record(h,['id','x','y']);if(typeof p.id!=='string'||!p.id||p.id.length>1024||typeof p.x!=='number'||typeof p.y!=='number')throw Error('Invalid render handle.');}if(++rendered%128===0){await new Promise(resolve=>setTimeout(resolve,0));check();}}
  for(const item of top.unsupported){const u=record(item,['id','type','reason']);if(!missing.has(u.id)||missing.get(u.id)!==u.type||!(u.reason==='geometry-not-projected'||u.type==='BSpline'&&['spline-data-unsupported','spline-knot-spacing-unsupported','spline-conversion-failed','spline-tessellation-limit'].includes(u.reason)))throw Error('Invalid unsupported geometry.');missing.delete(u.id);}if(missing.size)throw Error('Missing unsupported geometry.');
  for(const item of top.unrendered){if(item?.kind==='generator'){const u=record(item,['kind','stage','index']);if(!Number.isSafeInteger(u.stage)||u.stage<0||u.stage>31||!Number.isSafeInteger(u.index)||u.index<0)throw Error('Invalid generator record.');}else if(item?.kind==='constraint-annotations'){const u=record(item,['kind','stage','count']);if(!Number.isSafeInteger(u.stage)||u.stage<0||u.stage>31||!Number.isSafeInteger(u.count)||u.count<1)throw Error('Invalid annotation record.');}else{const u=record(item,['kind','count']);if(!['boundary','dimensions','labels'].includes(u.kind)||!Number.isSafeInteger(u.count)||u.count<1)throw Error('Invalid unrendered record.');}}
  const c=record(top.capabilities,['geometry','selection','constraints','generators','dimensions','labels','boundary','solver']);if(c.geometry!=='partial'||c.selection!=='geometry-and-declared-handles'||['constraints','generators','dimensions','labels','boundary'].some(k=>c[k]!=='source-only')||c.solver!=='unavailable')throw Error('Invalid render capabilities.');
  if(top.bounds!==null){const b=record(top.bounds,['minX','minY','maxX','maxY','kind','complete']);if(![b.minX,b.minY,b.maxX,b.maxY].every(n=>typeof n==='number'&&Number.isFinite(n))||b.minX>b.maxX||b.minY>b.maxY||b.kind!=='conservative-projected-geometry'||typeof b.complete!=='boolean'||b.complete&&(top.unsupported.length||top.unrendered.some(u=>u.kind==='generator'||u.kind==='boundary')))throw Error('Invalid render bounds.');}else if(top.objects.some(o=>o.geometry!==null))throw Error('Missing render bounds.');
  return data;
}
export function createAcceptedSketchProjectionOwner(runReplay,requireCurrent){
  if(typeof runReplay!=='function'||typeof requireCurrent!=='function')throw Error('Invalid projection owner.');
  const tickets=new WeakMap();let generation=0,closed=false,active=null;
  function check(epoch,signal){if(closed||generation!==epoch||signal?.aborted)throw stopped();requireCurrent();if(closed||generation!==epoch||signal?.aborted)throw stopped();}
  async function prepare(input,options={}){
    if(!options||typeof options!=='object'||Array.isArray(options)||![null,Object.prototype].includes(Object.getPrototypeOf(options))||Reflect.ownKeys(options).some(key=>key!=='signal'))throw Error('Invalid projection options.');
    let signal;if(Object.hasOwn(options,'signal')){const d=Object.getOwnPropertyDescriptor(options,'signal');if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Invalid projection options.');signal=d.value;}
    const args=record(input,['revision','sketchJSON','externalParameters','frame']);
    if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||typeof args.sketchJSON!=='string'||args.sketchJSON.length>LIMIT)throw Error('Invalid sketch projection source.');
    const external=args.externalParameters,proto=external&&typeof external==='object'?Object.getPrototypeOf(external):undefined;
    if(!external||typeof external!=='object'||Array.isArray(external)||(proto!==Object.prototype&&proto!==null)||Reflect.ownKeys(external).length>1024)throw Error('Invalid sketch projection parameters.');
    const captured=Object.create(null);for(const key of Reflect.ownKeys(external)){const d=Object.getOwnPropertyDescriptor(external,key);if(typeof key!=='string'||!key||key.length>256||!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))throw Error('Invalid sketch projection parameters.');captured[key]=d.value;}
    if(signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(signal)}catch{throw Error('Invalid cancellation signal.')}
    const frame=record(args.frame,['origin','x','y','z']);for(const key of ['origin','x','y','z']){const v=frame[key];if(!Array.isArray(v)||v.length!==3||Reflect.ownKeys(v).length!==4)throw Error('Invalid sketch projection frame.');frame[key]=Object.freeze([0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))throw Error('Invalid sketch projection frame.');return d.value;}));}Object.freeze(frame);
    active?.abort();const controller=new AbortController(),epoch=++generation;active=controller;
    const stop=()=>controller.abort();signal?.addEventListener('abort',stop,{once:true});if(signal?.aborted)stop();
    try {
    check(epoch,controller.signal);
    const request=Object.freeze({revision:args.revision,sketchJSON:args.sketchJSON,externalParameters:Object.freeze(captured),frame});
    const raw=await runReplay(request,{signal:controller.signal,valid:()=>{try{check(epoch,controller.signal);return true}catch{return false}}});check(epoch,controller.signal);
    const result=record(raw,['revision','source','ok','serializedSketch','witness','render']);
    if(result.revision!==request.revision||result.source!==request.sketchJSON||result.ok!==true||typeof result.serializedSketch!=='string'||result.serializedSketch.length>LIMIT)throw Error('Worker replay did not produce a projection.');
    const encoder=new TextEncoder();let bytes=0;for(let start=0;start<result.serializedSketch.length;){let end=Math.min(start+32768,result.serializedSketch.length);if(end<result.serializedSketch.length&&result.serializedSketch.charCodeAt(end-1)>=0xd800&&result.serializedSketch.charCodeAt(end-1)<=0xdbff&&result.serializedSketch.charCodeAt(end)>=0xdc00&&result.serializedSketch.charCodeAt(end)<=0xdfff)end--;bytes+=encoder.encode(result.serializedSketch.slice(start,end)).byteLength;if(bytes>LIMIT)throw Error('Sketch projection exceeds its limit.');start=end;if(start<result.serializedSketch.length){await new Promise(resolve=>setTimeout(resolve,0));check(epoch,controller.signal);}}
    const witness=record(result.witness,['frame','stages']),returnedFrame=record(witness.frame,['origin','x','y','z']);
    for(const key of ['origin','x','y','z'])if(array(returnedFrame[key],3).length!==3||returnedFrame[key].some((n,i)=>!Object.is(n,frame[key][i])))throw Error('Sketch projection frame changed.');
    const capturedStages=array(witness.stages,32);if(capturedStages.length<1)throw Error('Invalid sketch projection stages.');
    let total=0,characters=0;const stages=[];
    for(let stage=0;stage<capturedStages.length;stage++){
      const item=record(capturedStages[stage],['index','generatorCount','constraints']);if(item.index!==stage||!Number.isSafeInteger(item.generatorCount)||item.generatorCount<0||item.generatorCount>10000)throw Error('Invalid sketch projection stage.');
      const constraints=[],capturedConstraints=array(item.constraints,10000);for(let index=0;index<capturedConstraints.length;index++){
        const row=record(capturedConstraints[index],['stage','index','typeId','objects','constants','admission']);
        if(++total>10000||row.stage!==stage||row.index!==index||typeof row.typeId!=='string'||!row.typeId||row.typeId.length>256||!['accepted','redundant'].includes(row.admission))throw Error('Invalid sketch projection constraint.');
        const objects=array(row.objects,1024).map(v=>{if(typeof v!=='string'||!v||v.length>1024)throw Error('Invalid sketch projection reference.');characters+=v.length;return v;});
        const constants=row.constants;if(!constants||typeof constants!=='object'||Array.isArray(constants)||![Object.prototype,null].includes(Object.getPrototypeOf(constants))||Reflect.ownKeys(constants).length>64)throw Error('Invalid sketch projection constants.');
        const copy=Object.create(null);for(const key of Reflect.ownKeys(constants)){const d=Object.getOwnPropertyDescriptor(constants,key),value=d?.value;if(typeof key!=='string'||!key||key.length>256||!d?.enumerable||!Object.hasOwn(d,'value')||!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value))throw Error('Invalid sketch projection constants.');characters+=key.length+(typeof value==='string'?value.length:0);copy[key]=value;}
        characters+=row.typeId.length;if(characters>LIMIT)throw Error('Sketch projection evidence exceeds its limit.');
        constraints.push(Object.freeze({stage,index,typeId:row.typeId,objects:Object.freeze(objects),constants:Object.freeze(copy),admission:row.admission}));
        if(total%128===0){await new Promise(resolve=>setTimeout(resolve,0));check(epoch,controller.signal);}
      }
      stages.push(Object.freeze({index:stage,generatorCount:item.generatorCount,constraints:Object.freeze(constraints)}));
    }
    check(epoch,controller.signal);
    const render=await captureRender(result.render,()=>check(epoch,controller.signal));check(epoch,controller.signal);
    // Source and frame bind the witness; no live polynomial/DOF cache is implied.
    const projection=Object.freeze({render,revision:request.revision,source:request.sketchJSON,serializedSketch:result.serializedSketch,frame,externalParameters:request.externalParameters,stages:Object.freeze(stages),cacheState:'unprepared',dof:null});
    const ticket=Object.freeze({});tickets.set(ticket,{epoch,signal,projection});return ticket;
    } finally {signal?.removeEventListener('abort',stop);if(active===controller)active=null;}
  }
  function inspect(ticket){const item=tickets.get(ticket);if(!item)throw Error('Projection does not belong to this owner.');check(item.epoch,item.signal);return item.projection;}
  function retire(ticket){if(!tickets.has(ticket))throw Error('Projection does not belong to this owner.');tickets.delete(ticket);}
  function close(){closed=true;generation++;active?.abort();active=null;}
  return Object.freeze({prepare,inspect,retire,close});
}
