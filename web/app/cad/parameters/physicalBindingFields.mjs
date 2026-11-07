// Explicit allowlist of dimension-aware authored feature fields.
export const physicalBindingFields=Object.freeze({
 WORKER_RECTANGLE_EXTRUDE_V1:Object.freeze(['length']),
 WORKER_CENTERED_THROUGH_HOLE_V1:Object.freeze(['diameter']),
 WORKER_FOUR_CORNER_THROUGH_HOLES_V1:Object.freeze(['diameter','offsetX','offsetY']),
 WORKER_ENCLOSURE_V1:Object.freeze(['width','length','height','wall','clearance','lidThickness','lipDepth']),
 WORKER_ENCLOSURE_V2:Object.freeze(['width','length','height','wall','clearance','lidThickness','lipDepth','labelWidth','labelLength','labelDepth'])
});
