import {isBooleanSketchField,isBooleanSketchLiteral} from '../../sketcher/constr/booleanSketchFields.mjs';
// Capture only authored names. This inventory is derived, never a document format.
const id=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const encoder=new TextEncoder();
export function discoverTypedSketchConsumers(items,readSketch){
 if(!Array.isArray(items)||items.length>64||typeof readSketch!=='function')throw Error('Sketch inventory exceeds parameter editing limits.');
 const seen=new Set(),out=[];let aggregate=0;
 for(const item of items){const faceId=item?.id;if(typeof faceId!=='string'||!faceId||faceId.length>1024||seen.has(faceId))throw Error('Invalid sketch identity.');seen.add(faceId);
  const source=readSketch(faceId);if(typeof source!=='string'||source.length>1048576)throw Error('Sketch source exceeds parameter editing limits.');const size=encoder.encode(source).byteLength;aggregate+=size;if(size>1048576||aggregate>4194304)throw Error('Sketch source exceeds parameter editing limits.');
  let sketch;try{sketch=JSON.parse(source)}catch{throw Error('Invalid sketch source.')}
  if(!sketch||!Array.isArray(sketch.stages)||sketch.stages.length<1||sketch.stages.length>32)throw Error('Unsupported sketch constraint inventory.');let constraintCount=0;for(const stage of sketch.stages){if(!Array.isArray(stage?.constraints)||(constraintCount+=stage.constraints.length)>128)throw Error('Unsupported sketch constraint inventory.');}
  if(sketch.constants!=null&&sketch.constants!=='')throw Error('Typed sketches cannot use local sketch constants.');
  const names=new Set();for(const stage of sketch.stages)for(const c of stage.constraints){if(!c||typeof c!=='object'||Array.isArray(c)||(c.constants!=null&&(typeof c.constants!=='object'||Array.isArray(c.constants))))throw Error('Invalid sketch constraint.');const fields=Object.entries(c.constants||{});if(fields.length>32)throw Error('Sketch constraint exceeds parameter editing limits.');for(const [field,value] of fields){if(isBooleanSketchField(c.typeId,field)){if(!isBooleanSketchLiteral(value))throw Error('Invalid sketch boolean literal.');continue;}if(typeof value==='boolean')throw Error('Unregistered sketch boolean field.');if(typeof value==='number'&&Number.isFinite(value))continue;if(typeof value!=='string')throw Error('Invalid sketch constant.');const text=value.trim();if(numeric.test(text))continue;
   if(!id.test(text)||!(c.typeId==='SegmentLength'&&field==='length'||c.typeId==='DiameterLength'&&field==='diameter'))throw Error('Typed sketch field is not dimension-aware.');names.add(text);if(names.size>128)throw Error('Sketch parameter inventory exceeds limits.');
  }}
  if(names.size)out.push(Object.freeze({faceId,names:Object.freeze([...names].sort())}));
 }
 return Object.freeze(out);
}
