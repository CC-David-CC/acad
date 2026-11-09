// One canonical dimension per actual authored field. This is metadata, not a
// feature/runtime capability declaration; variant/domain guards remain owned
// by each existing feature consumer. Compatibility name lists are derived.
export const physicalBindingFieldRoles=Object.freeze({
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
// Frozen prerequisite ONLY: deliberately absent from the active map above.
// Future coherent countersink product composition can insert this SAME record;
// until then unknown-target/history and actual Native availability stay intact.
export const centeredCountersinkBindingFieldRoles=Object.freeze({throughDiameter:'length',entryDiameter:'length',includedAngleRadians:'angle'});
