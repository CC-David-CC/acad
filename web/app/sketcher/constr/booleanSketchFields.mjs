// Only these registered schema fields have literal boolean semantics.
const fields=Object.freeze({DistancePL:Object.freeze(['inverted']),TangentLC:Object.freeze(['inverted']),Fillet:Object.freeze(['inverted1','inverted2'])});
export const isBooleanSketchField=(schema,field)=>Object.hasOwn(fields,schema)&&fields[schema].includes(field);
export const isBooleanSketchLiteral=value=>typeof value==='boolean'||typeof value==='string'&&['true','false'].includes(value);
