// Only these registered schema fields have literal boolean semantics.
const fields=Object.freeze({DistancePL:Object.freeze(['inverted']),TangentLC:Object.freeze(['inverted']),FiniteTangentLC:Object.freeze(['inverted']),Fillet:Object.freeze(['inverted1','inverted2'])});
export const isBooleanSketchField=(schema,field)=>Object.hasOwn(fields,schema)&&fields[schema].includes(field);
export const isBooleanSketchLiteral=value=>typeof value==='boolean'||typeof value==='string'&&['true','false'].includes(value);

// Only the new registered Circle-Circle branch has literal enum semantics.
export const isEnumSketchField=(schema,field)=>schema==='TangentCC'&&field==='branch';
export const isEnumSketchLiteral=value=>typeof value==='string'&&['external','first-contains-second','second-contains-first'].includes(value);
