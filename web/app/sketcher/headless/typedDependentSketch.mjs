import {isBooleanSketchField,isBooleanSketchLiteral} from '../constr/booleanSketchFields.mjs';
// A typed dependent sketch may currently bind names only in explicitly
// length-valued SegmentLength and DiameterLength fields. No length is exported as a scalar to
// an unannotated consumer. The numerical solve remains in the sketch Worker.
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const identifier=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
export function prepareTypedDependentSketch(sketch,resolveLength) {
 if(!sketch||typeof sketch!=='object'||Array.isArray(sketch)||typeof resolveLength!=='function'||!Array.isArray(sketch.stages))throw Error('Invalid typed sketch.');
 if(sketch.constants!=null&&sketch.constants!=='')throw Error('Typed sketches cannot use local sketch constants.');
 const external=Object.create(null);
 for(const stage of sketch.stages){if(!stage||!Array.isArray(stage.constraints))throw Error('Invalid typed sketch stage.');
  for(const constraint of stage.constraints){if(!constraint||typeof constraint!=='object'||Array.isArray(constraint))throw Error('Invalid typed constraint.');
   for(const [name,value] of Object.entries(constraint.constants||{})){
    if(isBooleanSketchField(constraint.typeId,name)){if(!isBooleanSketchLiteral(value))throw Error('Invalid sketch boolean literal.');continue;}
    if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Nonfinite sketch constant.');continue;}
    if(typeof value==='boolean')throw Error('Unregistered sketch boolean field.');
    if(typeof value!=='string')throw Error('Invalid sketch constant.');const text=value.trim();
    if(numeric.test(text))continue;
    const lengthField=constraint.typeId==='SegmentLength'&&name==='length'||constraint.typeId==='DiameterLength'&&name==='diameter';
    if(!lengthField||!identifier.test(text))throw Error('Typed sketch field is not dimension-aware.');
    const n=resolveLength(text);if(typeof n!=='number'||!Number.isFinite(n)||n<=0||n>1e6)throw Error('Typed sketch length is invalid.');external[text]=n;
   }
  }
 }
 return Object.freeze(external);
}
