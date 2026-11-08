// Shared positive policy only. Actual owner/J/currentness and publication remain
// private to Craft; a caller cannot turn this predicate into a navigation lease.
const TYPES=Object.freeze(['PLANE','BOX','CONE','CYLINDER','SPHERE','TORUS','EXTRUDE','REVOLVE','BOOLEAN','LOFT','SWEEP',
 'HOLE_TOOL','FILLET_TOOL','SHELL_TOOL','SCALE_BODY','SCALE_BODY_PIVOT','MIRROR_BODY','PATTERN_LINEAR','PATTERN_CUT_LINEAR','PATTERN_RADIAL',
 'IMPORT_MODEL','DELETE_BODY','DEFEATURE_REMOVE_FACE','WIRE_LINE','MOVE_BODY','MOVE_BODY_XYZ','ROTATE_BODY_AXIS',
 'NATIVE_MESH_BOX','NATIVE_MESH_BOOLEAN','SUBD_BOX','SUBD_SPHERE','SUBD_CYLINDER',
 'WORKER_RECTANGLE_EXTRUDE_V1','WORKER_CENTERED_THROUGH_HOLE_V1','WORKER_FOUR_CORNER_THROUGH_HOLES_V1']);
export function isUnjournaledLegacyHistory(history,journal,operations){
 return journal.cursor===0&&journal.entries.length===0&&history.length<=10000&&history.every(entry=>{
  const operation=operations.get(entry.type);
  return TYPES.includes(entry.type)&&!entry.suppressed&&operation?.id===entry.type&&typeof operation.run==='function';
 });
}
