// Only these authored rectangle driving lengths are currently dimension-aware.
// This does not evaluate geometry or change any live project state.
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const name=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
export function prepareTypedRectangle(source,bindings,resolveLength){
 if(typeof source!=='string'||source.length>65536||!Array.isArray(bindings)||bindings.length>2||Reflect.ownKeys(bindings).length!==bindings.length+1||typeof resolveLength!=='function')throw Error('Invalid typed rectangle request.');
 let sketch;try{sketch=JSON.parse(source)}catch{throw Error('Invalid authored rectangle.');}
 // Local sketch constants take precedence over external parameters in the solver.
 // Refuse them until their dependency and dimensional semantics are supported.
 if(sketch?.constants!=null && sketch.constants!=='')throw Error('Typed rectangle cannot use local sketch constants.');
 if(!sketch||sketch.version!==3||!Array.isArray(sketch.objects)||sketch.objects.length!==4||!sketch.objects.every((o,i)=>o?.id==='rect-'+i&&o.type==='Segment'&&o.stage===0)||!Array.isArray(sketch.stages)||sketch.stages.length!==1||!Array.isArray(sketch.stages[0].constraints))throw Error('Only the supported authored rectangle is available.');
 const chosen=new Map();for(let i=0;i<bindings.length;i++){const slot=Object.getOwnPropertyDescriptor(bindings,String(i)),b=slot?.value;if(!slot?.enumerable||!own(slot,'value')||!b||typeof b!=='object'||Array.isArray(b)||Reflect.ownKeys(b).sort().join(',')!=='parameter,segmentId')throw Error('Invalid rectangle binding.');for(const key of ['parameter','segmentId']){const d=Object.getOwnPropertyDescriptor(b,key);if(!d?.enumerable||!own(d,'value'))throw Error('Invalid rectangle binding.');}if(!['rect-0','rect-1'].includes(b.segmentId)||typeof b.parameter!=='string'||!name.test(b.parameter)||chosen.has(b.segmentId))throw Error('Invalid or duplicate rectangle binding.');chosen.set(b.segmentId,b.parameter);}
 const targets=new Map();for(const c of sketch.stages[0].constraints){if(c?.typeId==='SegmentLength'&&Array.isArray(c.objects)&&c.objects.length===1&&['rect-0','rect-1'].includes(c.objects[0])){if(targets.has(c.objects[0])||!c.constants||typeof c.constants.length!=='string')throw Error('Ambiguous rectangle driving length.');targets.set(c.objects[0],c);}}
 if(targets.size!==2)throw Error('Missing rectangle driving length.');
 for(const [id,parameter] of chosen)targets.get(id).constants.length=parameter;
 const external=Object.create(null);for(const [id,c] of targets){const text=c.constants.length.trim();if(!numeric.test(text)){if(!name.test(text))throw Error('Unsupported rectangle dimension expression.');const value=resolveLength(text);if(typeof value!=='number'||!Number.isFinite(value)||value<0.001||value>1e6)throw Error('Rectangle length must be positive and bounded.');external[text]=value;}}
 // A typed length name cannot leak into angle, lock or unrelated fields.
 // Non-literal expressions in those fields remain explicitly unsupported.
 for(const c of sketch.stages[0].constraints){for(const [key,value] of Object.entries(c.constants||{})){if(c.typeId==='SegmentLength'&&['rect-0','rect-1'].includes(c.objects?.[0])&&key==='length')continue;if(typeof value==='string'&&!numeric.test(value.trim()))throw Error('Typed rectangle cannot use unsupported constraint expressions.');if(typeof value!=='string'&&typeof value!=='number'&&typeof value!=='boolean')throw Error('Unsupported constraint constant.');}}
 return Object.freeze({sketchJSON:JSON.stringify(sketch),externalParameters:Object.freeze(external),bindings:Object.freeze([...targets].map(([segmentId,c])=>Object.freeze({segmentId,value:c.constants.length})))});
}
