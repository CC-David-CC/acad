// Closed schema roles, not parameter spelling. These fields are literal enums,
// versions or authored identity/reference data; none is a numeric expression.
// Existing family parsers still validate their values and exact field sets.
const common=['featureId'];
const generic=['version','unit','engine','engineRevision','featureId'];
const fields=Object.freeze({
 PLANE:Object.freeze([...common,'orientation','datum']),
 WORKER_SELECTED_PROFILE_EXTRUDE_V2:Object.freeze([...generic,'faceId','regionId','bodyPolicy']),
 WORKER_THROUGH_HOLES_V1:Object.freeze([...generic,'target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','kind']),
 WORKER_RECTANGLE_EXTRUDE_V1:Object.freeze([...common,'face','regions']),
 WORKER_CENTERED_THROUGH_HOLE_V1:Object.freeze([...common,'target']),
 WORKER_FOUR_CORNER_THROUGH_HOLES_V1:Object.freeze([...common,'target']),
 WORKER_ENCLOSURE_V1:Object.freeze(common),
 WORKER_ENCLOSURE_V2:Object.freeze(common),
});
export function assertNoUnsupportedPhysicalNames(type,params,bindingFields,names){
 const literals=Object.hasOwn(fields,type)?fields[type]:[],pending=[];
 for(const key of Object.keys(params))if(!bindingFields.includes(key)&&!literals.includes(key))pending.push(params[key]);
 // Captured history has already bounded depth/size and excluded aliases/cycles.
 // Do not skip unknown fields: genuine unsupported numeric/expression names
 // still refuse, while engine:'occ' remains literal even if 'occ' is a name.
 while(pending.length){const value=pending.pop();if(typeof value==='string'&&names.has(value.trim()))throw Error('An unsupported numeric/expression field references a typed parameter.');if(Array.isArray(value))for(const child of value)pending.push(child);else if(value&&typeof value==='object')for(const key of Object.keys(value))pending.push(value[key]);}
}
