import {PROFILE_EXTENT_TYPE,profileExtentFields,profileExtentFromFields} from '../../../../modules/engine/solid/ownedProfileExtentFeature.mjs';
// One canonical dimension per actual authored field. This is metadata, not a
// feature/runtime capability declaration; variant/domain guards remain owned
// by each existing feature consumer. Compatibility name lists are derived.
export const centeredCountersinkBindingFieldRoles=Object.freeze({throughDiameter:'length',entryDiameter:'length',includedAngleRadians:'angle'});
export const physicalBindingFieldRoles=Object.freeze({
 WORKER_CENTERED_COUNTERSINK_V1:centeredCountersinkBindingFieldRoles,
 WORKER_CENTERED_COUNTERBORE_V1:Object.freeze({throughDiameter:'length',stepDiameter:'length',stepDepth:'length'}),
 [PROFILE_EXTENT_TYPE]:Object.freeze({distance:'length',length:'length',positive:'length',negative:'length'}),
 WORKER_CENTERED_BLIND_HOLE_V1:Object.freeze({diameter:'length',depth:'length'}),
 WORKER_SELECTED_PROFILE_EXTRUDE_V2:Object.freeze({depth:'length'}),
 WORKER_THROUGH_HOLES_V1:Object.freeze({diameter:'length',offsetX:'length',offsetY:'length'}),
 WORKER_RECTANGLE_EXTRUDE_V1:Object.freeze({length:'length'}),
 WORKER_CENTERED_THROUGH_HOLE_V1:Object.freeze({diameter:'length'}),
 WORKER_FOUR_CORNER_THROUGH_HOLES_V1:Object.freeze({diameter:'length',offsetX:'length',offsetY:'length'}),
 WORKER_ENCLOSURE_V1:Object.freeze({width:'length',length:'length',height:'length',wall:'length',clearance:'length',lidThickness:'length',lipDepth:'length'}),
 WORKER_ENCLOSURE_V2:Object.freeze({width:'length',length:'length',height:'length',wall:'length',clearance:'length',lidThickness:'length',lipDepth:'length',labelWidth:'length',labelLength:'length',labelDepth:'length'})
});
export const physicalBindingFields=Object.freeze(Object.fromEntries(Object.entries(physicalBindingFieldRoles).map(([type,roles])=>[type,Object.freeze(Object.keys(roles))])));
// For the new family this is the authoritative variant selector; old callers
// retain their existing field order and optional through-hole filtering.
export function activePhysicalBindingFields(type,params){return type===PROFILE_EXTENT_TYPE?profileExtentFields(params):Object.hasOwn(physicalBindingFields,type)?physicalBindingFields[type]:null;}
export function capturedPhysicalBindingFields(type,fields){return type===PROFILE_EXTENT_TYPE?profileExtentFields(profileExtentFromFields(fields)):Object.hasOwn(physicalBindingFields,type)?physicalBindingFields[type].filter(key=>type!=='WORKER_THROUGH_HOLES_V1'||Object.hasOwn(fields,key)):null;}
