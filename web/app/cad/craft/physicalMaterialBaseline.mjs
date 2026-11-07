// This preflight is pure. The normal successful publication adopts the current
// material revision alongside its accepted model; refused work adopts nothing.
export function assertPhysicalMaterialBaseline(current,accepted,entries){
 if(!Array.isArray(entries))throw Error('Invalid authored journal.');
 if(current!==accepted&&entries.length!==0)throw new Error('Material or appearance assignments changed; review and reopen the project before editing parameters.');
}
