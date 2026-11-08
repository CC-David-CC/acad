import {AUTHORED_SOLID_KINDS} from '../solid/authoredSolidKinds.mjs';
import {requireCadEngineBuild,OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD,OCC_BOOLEAN_HISTORY_BUILD,OCC_REVOLVE_PROFILE_BUILD,OCC_SWEEP_PROFILE_BUILD,OCC_LOFT_PROFILE_BUILD,OCC_ADAPTIVE_METROLOGY_BUILD,OCC_STEP_EXPORT_BUILD,OCC_MANUFACTURING_MESH_BUILD,OCC_SHELL_BUILD,OCC_CIRCULAR_BUILD} from './engineCatalog.mjs';

const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const genericTypes=new Set(AUTHORED_SOLID_KINDS);
const data=(value,key)=>{const d=value&&typeof value==='object'&&!Array.isArray(value)?Object.getOwnPropertyDescriptor(value,key):null;if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Authored backend identity must be data.');return d.value;};

// The registered build, rather than caller geometry or a missing version field,
// determines the semantic/native profile contract. Saved V2 intent stays V2.
export function selectedProfileVersion(build){
 // Capability flags belong to an actual catalog singleton, never caller JSON.
 let known;try{const id=Object.getOwnPropertyDescriptor(build??{},'id'),revision=Object.getOwnPropertyDescriptor(build??{},'revision');if(!id?.enumerable||!Object.hasOwn(id,'value')||!revision?.enumerable||!Object.hasOwn(revision,'value'))return null;known=requireCadEngineBuild(id.value,revision.value);}catch{return null;}
 if(known!==build)return null;
 if(build===OCC_SELECTED_PROFILE_BUILD)return 2;
 if(build?.selectedProfileVersion===3)return 3;
 return null;
}
export function requireSelectedProfileBuild(engine,revision){
 const build=requireCadEngineBuild(engine,revision);
 if(selectedProfileVersion(build)===null)fail('UNSUPPORTED_PROFILE_BUILD','The authored part backend does not support selected-profile extrusion.');
 return build;
}

// History includes consumed and empty results. Neither loses ownership of the
// part's backend merely because a visible body is absent after evaluation.
export function genericHistoryBuild(history){
 if(!Array.isArray(history)||history.length>256||Reflect.ownKeys(history).length!==history.length+1)fail('INVALID_REQUEST','Expected bounded dense authored history.');
 let build=null;
 for(let i=0;i<history.length;i++){
  const d=Object.getOwnPropertyDescriptor(history,String(i));
  if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_REQUEST','Authored history must be dense data.');
  const type=data(d.value,'type');if(typeof type!=='string'||!type||type.length>128)fail('INVALID_REQUEST','Invalid authored operation identity.');
  if(!genericTypes.has(type))continue;
  const params=data(d.value,'params'),engine=data(params,'engine'),revision=data(params,'engineRevision');
  if(typeof engine!=='string'||typeof revision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(revision))fail('INVALID_REQUEST','A saved explicit backend revision is required.');
  const next=requireCadEngineBuild(engine,revision);
  if(build&&build!==next)fail('ENGINE_REVISION_MISMATCH','The authored generic part must use one backend build.');
  build=next;
 }
 return build;
}
export function selectSelectedProfileHistoryBuild(history){
 const build=genericHistoryBuild(history)||OCC_BOOLEAN_HISTORY_BUILD;
 return requireSelectedProfileBuild(build.id,build.revision);
}

// Explicit experimental capability; never change preferred/default part builds.
export function requireRevolveBuild(engine,revision){
 const build=requireCadEngineBuild(engine,revision);
 if(build.revolveVersion!==1)fail('UNSUPPORTED_REVOLVE_BUILD','Select a registered revolve-capable backend explicitly.');
 return build;
}
export function listRevolveBuilds(){return Object.freeze([OCC_REVOLVE_PROFILE_BUILD,OCC_SWEEP_PROFILE_BUILD]);}

export function requireSweepBuild(engine,revision){
 const build=requireCadEngineBuild(engine,revision);
 if(build.sweepVersion!==1)fail('UNSUPPORTED_SWEEP_BUILD','Select a registered sweep-capable backend explicitly.');
 return build;
}
export function listSweepBuilds(){return Object.freeze([OCC_SWEEP_PROFILE_BUILD]);}

export function requireLoftBuild(engine,revision){
 const build=requireCadEngineBuild(engine,revision);
 if(build.loftVersion!==1)fail('UNSUPPORTED_LOFT_BUILD','Select a registered loft-capable backend explicitly.');
 return build;
}
export function listLoftBuilds(){return Object.freeze([OCC_LOFT_PROFILE_BUILD,OCC_ADAPTIVE_METROLOGY_BUILD,OCC_STEP_EXPORT_BUILD,OCC_MANUFACTURING_MESH_BUILD,OCC_SHELL_BUILD,OCC_CIRCULAR_BUILD]);}

export function requireStepExportBuild(engine,revision){const build=requireCadEngineBuild(engine,revision);if(build.stepExportVersion!==1)fail('UNSUPPORTED_STEP_BUILD','Select a registered owned STEP export build explicitly.');return build;}
export function listStepExportBuilds(){return Object.freeze([OCC_STEP_EXPORT_BUILD,OCC_MANUFACTURING_MESH_BUILD,OCC_SHELL_BUILD,OCC_CIRCULAR_BUILD]);}

export function requireManufacturingMeshBuild(engine,revision){const build=requireCadEngineBuild(engine,revision);if(build.manufacturingMeshVersion!==1)fail('UNSUPPORTED_MANUFACTURING_MESH_BUILD','Select the controlled manufacturing mesh build explicitly.');return build;}
export function listManufacturingMeshBuilds(){return Object.freeze([OCC_MANUFACTURING_MESH_BUILD,OCC_SHELL_BUILD,OCC_CIRCULAR_BUILD]);}

export function requireShellBuild(engine,revision){const build=requireCadEngineBuild(engine,revision);if(build.shellVersion!==1||build.boxConstructionVersion!==1)fail('UNSUPPORTED_SHELL_BUILD','Select the explicit owned-shell build.');return build;}
export function listShellBuilds(){return Object.freeze([OCC_SHELL_BUILD,OCC_CIRCULAR_BUILD]);}
