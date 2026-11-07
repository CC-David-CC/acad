// Sketch fields must opt in to a physical dimension before a typed name may
// be resolved. Literal values keep the units defined by their field schema.
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const identifier=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
export function resolveSketchConstant(expressions,value,field) {
  if(!expressions.isTyped)return expressions.evaluateExpression(value);
  if(!expressions.hasCurrentPhysicalResult())throw Error('Typed parameters are unavailable.');
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('A finite field value is required.');return value;}
  if(typeof value!=='string')throw Error('A finite field value is required.');
  const text=value.trim();
  if(numeric.test(text)){const n=Number(text);if(!Number.isFinite(n))throw Error('A finite field value is required.');return n;}
  if(!field?.dimension||!identifier.test(text))throw Error('A typed parameter requires a dimension-aware sketch field.');
  return expressions.resolveQuantity(text,field.dimension);
}
export function checkSketchLocalConstants(expressions,text) {
  if(expressions.isTyped && (typeof text!=='string'||text!==''))throw Error('Typed sketches cannot use local sketch constants.');
}
export function bindSketchConstants(viewer,expressions) {
  viewer.parametricManager.externalConstantResolver=(value,field)=>resolveSketchConstant(expressions,value,field);
  viewer.parametricManager.externalConstantDefinitionCheck=text=>checkSketchLocalConstants(expressions,text);
}
