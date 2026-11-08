// Only these authored rectangle driving lengths are currently dimension-aware.
// This does not evaluate geometry or change any live project state.
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const name=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
// Only failures issued here carry a public contract diagnosis. Do not inspect
// arbitrary exceptions from quantity resolution or other downstream code.
const failures=new WeakMap();
function fail(code,message){const error=Object.assign(Error(message),{code});failures.set(error,Object.freeze({code,message}));throw error;}
export function captureTypedRectangleBindingFailure(error){return error!==null&&(typeof error==='object'||typeof error==='function')?failures.get(error)||null:null;}
function isolatedPointExtras(sketch){
 const extras=sketch.objects.slice(4);if(!extras.length)return;
 const stage=sketch.stages[0],seen=new Set(sketch.objects.slice(0,4).map(o=>o.id)),ids=new Set();
 if(!Array.isArray(stage.generators)||stage.generators.length)fail('UNSUPPORTED_TYPED_RECTANGLE','Typed rectangle Point extras cannot have generators.');
 for(const point of extras){
  if(!point||Reflect.ownKeys(point).sort().join(',')!=='data,id,role,stage,type'||point.type!=='Point'||point.role!==null||point.stage!==0||typeof point.id!=='string'||!point.id||seen.has(point.id)||!point.data||Reflect.ownKeys(point.data).sort().join(',')!=='x,y'||!['x','y'].every(axis=>typeof point.data[axis]==='number'&&Number.isFinite(point.data[axis])&&Math.abs(point.data[axis])<=1e9))fail('UNSUPPORTED_TYPED_RECTANGLE','Only isolated finite standalone Point extras are supported with a typed rectangle.');
  seen.add(point.id);ids.add(point.id);
 }
 for(const constraint of stage.constraints){
  if(!constraint||!Array.isArray(constraint.objects))fail('INVALID_INPUT','Invalid authored rectangle constraint.');
  if(constraint.objects.some(id=>ids.has(id)))fail('UNSUPPORTED_TYPED_RECTANGLE','A typed rectangle extra Point is consumed by a constraint.');
 }
 // This is source-shape/dependency admission only. The existing full Worker
 // decoder/solver independently proves registered Point ownership, all source
 // equations, IDs and dimensions before any geometry can be published.
}
export function prepareTypedRectangle(source,bindings,resolveLength){
 if(typeof source!=='string'||source.length>65536||!Array.isArray(bindings)||bindings.length>2||Reflect.ownKeys(bindings).length!==bindings.length+1||typeof resolveLength!=='function')fail('INVALID_INPUT','Invalid typed rectangle request.');
 let sketch;try{sketch=JSON.parse(source)}catch{fail('INVALID_INPUT','Invalid authored rectangle.');}
 // Local sketch constants take precedence over external parameters in the solver.
 // Refuse them until their dependency and dimensional semantics are supported.
 if(sketch?.constants!=null && sketch.constants!=='')fail('UNSUPPORTED_TYPED_RECTANGLE','Typed rectangle cannot use local sketch constants.');
 if(!sketch||sketch.version!==3||!Array.isArray(sketch.objects)||sketch.objects.length<4||!sketch.objects.slice(0,4).every((o,i)=>o?.id==='rect-'+i&&o.type==='Segment'&&o.stage===0)||!Array.isArray(sketch.stages)||sketch.stages.length!==1||!Array.isArray(sketch.stages[0]?.constraints))fail('UNSUPPORTED_TYPED_RECTANGLE','Only the supported authored rectangle with isolated Point extras is available.');
 isolatedPointExtras(sketch);
 const chosen=new Map();for(let i=0;i<bindings.length;i++){const slot=Object.getOwnPropertyDescriptor(bindings,String(i)),b=slot?.value;if(!slot?.enumerable||!own(slot,'value')||!b||typeof b!=='object'||Array.isArray(b)||Reflect.ownKeys(b).sort().join(',')!=='parameter,segmentId')fail('INVALID_INPUT','Invalid rectangle binding.');for(const key of ['parameter','segmentId']){const d=Object.getOwnPropertyDescriptor(b,key);if(!d?.enumerable||!own(d,'value'))fail('INVALID_INPUT','Invalid rectangle binding.');}if(!['rect-0','rect-1'].includes(b.segmentId)||typeof b.parameter!=='string'||!name.test(b.parameter)||chosen.has(b.segmentId))fail('INVALID_INPUT','Invalid or duplicate rectangle binding.');chosen.set(b.segmentId,b.parameter);}
 const targets=new Map();for(const c of sketch.stages[0].constraints){if(c?.typeId==='SegmentLength'&&Array.isArray(c.objects)&&c.objects.length===1&&['rect-0','rect-1'].includes(c.objects[0])){if(targets.has(c.objects[0])||!c.constants||typeof c.constants.length!=='string')fail('UNSUPPORTED_TYPED_RECTANGLE','Ambiguous rectangle driving length.');targets.set(c.objects[0],c);}}
 if(targets.size!==2)fail('UNSUPPORTED_TYPED_RECTANGLE','Missing rectangle driving length.');
 for(const [id,parameter] of chosen)targets.get(id).constants.length=parameter;
 const external=Object.create(null);for(const [id,c] of targets){const text=c.constants.length.trim();if(!numeric.test(text)){if(!name.test(text))fail('UNSUPPORTED_TYPED_RECTANGLE','Unsupported rectangle dimension expression.');const value=resolveLength(text);if(typeof value!=='number'||!Number.isFinite(value)||value<0.001||value>1e6)fail('NUMERIC_DOMAIN','Rectangle length must be positive and bounded.');external[text]=value;}}
 // A typed length name cannot leak into angle, lock or unrelated fields.
 // Non-literal expressions in those fields remain explicitly unsupported.
 for(const c of sketch.stages[0].constraints){for(const [key,value] of Object.entries(c.constants||{})){if(c.typeId==='SegmentLength'&&['rect-0','rect-1'].includes(c.objects?.[0])&&key==='length')continue;if(typeof value==='string'&&!numeric.test(value.trim()))fail('UNSUPPORTED_TYPED_RECTANGLE','Typed rectangle cannot use unsupported constraint expressions.');if(typeof value!=='string'&&typeof value!=='number'&&typeof value!=='boolean')fail('UNSUPPORTED_TYPED_RECTANGLE','Unsupported constraint constant.');}}
 return Object.freeze({sketchJSON:JSON.stringify(sketch),externalParameters:Object.freeze(external),bindings:Object.freeze([...targets].map(([segmentId,c])=>Object.freeze({segmentId,value:c.constants.length})))});
}
