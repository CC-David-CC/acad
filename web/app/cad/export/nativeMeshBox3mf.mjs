// Research adapter, not registered in the app. Call only with a live resolved
// NATIVE_MESH_BOX shell from the exact project revision, before any edits.
// It reads authoritative native meshData, not display BufferGeometry.
export function nativeBoxFor3mf(shell, {featureId, operationType, id, name, materialId} = {}) {
  if (operationType !== 'NATIVE_MESH_BOX' || !Number.isSafeInteger(featureId) || featureId<=0 || shell?.id!==`native:${featureId}`) throw new Error('A uniquely resolved native box is required');
  const data=shell.brepShell?.data?.__meshWithOrigins?.meshData;
  if (!data || !Array.isArray(data.verts) || data.verts.length!==24 || !Array.isArray(data.tris) || data.tris.length!==36 || !Array.isArray(data.mergeFrom) || !Array.isArray(data.mergeTo) || data.mergeFrom.length || data.mergeTo.length) throw new Error('Unsupported native box mesh');
  const location=shell.location;
  if (!location) throw new Error('Missing model-space placement');
  const {mxx,mxy,mxz,myx,myy,myz,mzx,mzy,mzz,tx,ty,tz}=location;
  const transform=[mxx,myx,mzx,mxy,myy,mzy,mxz,myz,mzz,tx,ty,tz];
  if (!transform.every(Number.isFinite)) throw new Error('Invalid model-space placement');
  return {id,name,materialId,transform,
    vertices:Array.from({length:8},(_,i)=>data.verts.slice(i*3,i*3+3)),
    triangles:Array.from({length:12},(_,i)=>data.tris.slice(i*3,i*3+3))};
}
