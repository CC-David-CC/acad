// Private component recipes use the real compiled catalog factory.
export function createRevolveProfileOccMount(){
 const api=globalThis.__revolveFactory,build=api.OCC_REVOLVE_PROFILE_BUILD;
 const mount=api.createCatalogMount('occ',build.revision);
 try{return api.validateEngineMount('occ',mount,build.revision);}catch(error){mount.close();throw error;}
}
export function createBooleanHistoryOccMount(){
 const api=globalThis.__revolveFactory,build=api.OCC_BOOLEAN_HISTORY_BUILD;
 const mount=api.createCatalogMount('occ',build.revision);
 try{return api.validateEngineMount('occ',mount,build.revision);}catch(error){mount.close();throw error;}
}
