import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {Param} from '../shapes/param';
import {SolverParam} from '../constr/solverParam';
import {fail,validateConstraintGeometry} from './sketchValidation';

const MAX_WORK=1000000,MAX_ROWS=10000,MAX_BYTES=8*1024*1024;
type AuxiliaryValue=Readonly<{role:string,value:number}>;
type AuxiliaryRow=Readonly<{stage:number,index:number,typeId:string,objects:ReadonlyArray<string>,auxiliaries:ReadonlyArray<AuxiliaryValue>}>;
export type CapturedAuxiliaryWitnessBatch=ReadonlyArray<AuxiliaryRow>;
// Successful request-local observations, never wire/persisted authority.
const issued=new WeakSet<object>();
const bezierRoles=new Map([[8,'bezier-parameter']]),tangentRoles=new Map([[8,'bezier-parameter'],[9,'tangent-point-x'],[10,'tangent-point-y'],[11,'bezier-derivative-x'],[12,'bezier-derivative-y']]),ellipseRoles=new Map([[7,'ellipse-parameter']]);
function auxiliaryRoles(schema:any):ReadonlyMap<number,string>|undefined{
  if(schema===ConstraintDefinitions.PointOnBezier)return bezierRoles;
  if(schema===ConstraintDefinitions.TangentLineBezier)return tangentRoles;
  if(schema===ConstraintDefinitions.PointOnEllipse)return ellipseRoles;
}
const physicalParam=(value:any):value is Param=>value instanceof Param&&value.solverParam instanceof SolverParam&&value.solverParam.objectParam===value&&Number.isFinite(value.get());

export function capturedParameterOwnership(workspace:any){
  const index=workspace.createIndex(),stages=workspace.parametricManager.stages,ground=workspace.parametricManager.groundStage;
  const registered=new Set<any>(Object.values(ConstraintDefinitions));
  const geometry=new Set<Param>(),objects=new Set<any>(),snapshot=new Map<Param,number>(),auxOwners=new Map<Param,AlgNumConstraint>();let work=0;
  const count=()=>{if(++work>MAX_WORK)fail('LIMIT','Captured parameter ownership exceeds its bounded work.');};
  // Bezier roots expose control coordinates, while their actual child
  // Segments also own ang/t Params used by intrinsic Polar constraints.
  for(const layer of workspace.layers)for(const root of layer.objects)root.traverse(object=>{
    count();if(objects.has(object)||index[object.id]!==object||!object.stage||object.stage!==ground&&!stages.includes(object.stage))fail('INVALID','Captured descendant object ownership is ambiguous.');
    objects.add(object);
    object.visitParams((parameter:Param)=>{count();if(!physicalParam(parameter))fail('INVALID','Captured geometry parameters must have real finite backing.');geometry.add(parameter);snapshot.set(parameter,parameter.get());});
  });
  function unchanged(){for(const [parameter,value]of snapshot){count();if(!Object.is(parameter.get(),value))fail('CURRENT_GEOMETRY_MISMATCH','Captured auxiliary evaluation changed geometry parameters.');}}
  function constraint(c:any,stage:any){
    count();
    if(!(c instanceof AlgNumConstraint)||!registered.has(c.schema)||c.stage!==stage||!Array.isArray(c.objects)||!Array.isArray(c.params)||c.objects.some(object=>!objects.has(object)||index[object.id]!==object||object.stage!==ground&&stages.indexOf(object.stage)>stages.indexOf(stage)))fail('INVALID','Constraint source ownership is invalid.');
    // Replay the actual registered factory on these SAME objects. Every
    // geometric slot must be its exact Param identity. Only explicitly named
    // factory-created slots may be auxiliary; listing a c.params is not proof.
    const scope:Param[]=[];
    c.schema.defineParamsScope(c.objects,(parameter:Param)=>{count();if(!physicalParam(parameter))fail('INVALID','Registered parameter scope has invalid backing.');scope.push(parameter);});
    if(scope.length!==c.params.length)fail('INVALID','Constraint parameter scope membership changed.');
    const policy=auxiliaryRoles(c.schema),auxiliary:{role:string,parameter:Param}[]=[];let recognized=0;
    for(let i=0;i<scope.length;i++){
      count();const expected=scope[i],actual=c.params[i],role=policy?.get(i);
      if(!physicalParam(actual))fail('INVALID','Constraint parameters must have real finite backing.');
      if(geometry.has(expected)){
        if(role!==undefined||actual!==expected)fail('INVALID','Constraint geometric ownership differs from its registered factory.');
      }else{
        if(role===undefined)fail('UNSUPPORTED_CAPTURED_AUXILIARY','The registered constraint has no qualified auxiliary ownership policy.');
        if(geometry.has(actual)||actual===expected||actual.normalizer!==expected.normalizer||actual.enforceVisualLimit!==expected.enforceVisualLimit||
          (actual.constraints?.length||0)!==(expected.constraints?.length||0)||auxOwners.has(actual)&&auxOwners.get(actual)!==c||auxiliary.some(row=>row.parameter===actual))fail('INVALID','Constraint auxiliary aliases geometry or another owner.');
        auxOwners.set(actual,c);auxiliary.push({role,parameter:actual});recognized++;
      }
    }
    if(recognized!==(policy?.size||0))fail('INVALID','Registered auxiliary role membership changed.');
    return auxiliary;
  }
  return {geometry,unchanged,constraint};
}

// Only after ordinary full solve success/original residual and source checks.
// Live stage success and registered ownership are checked here too. No model
// references or caller flags escape in the detached frozen observation batch.
export function captureSolvedAuxiliaryWitnesses(workspace:any):CapturedAuxiliaryWitnessBatch{
  const ownership=capturedParameterOwnership(workspace),rows:AuxiliaryRow[]=[];let bytes=0;
  for(const [si,stage]of workspace.parametricManager.stages.entries()){
    const system=stage.solverSystem;
    if(system.solveStatus?.success!==true||!Number.isFinite(system.solveStatus.error))fail('AUXILIARY_WITNESS_UNAVAILABLE','Auxiliary witnesses require an actual successful cold solve.');
    for(const [index,c]of system.allConstraints.entries()){
      const auxiliary=ownership.constraint(c,stage);
      if(!auxiliary.length)continue;
      if(system.conflicting.has(c)&&!system.redundant.has(c))fail('ADMISSION_CHANGED','A rejected constraint cannot issue an auxiliary witness.');
      validateConstraintGeometry(c);
      const row=Object.freeze({stage:si,index,typeId:c.schema.id,objects:Object.freeze(c.objects.map(object=>object.id)),auxiliaries:Object.freeze(auxiliary.map(({role,parameter})=>Object.freeze({role,value:parameter.get()})))});
      bytes+=new TextEncoder().encode(JSON.stringify(row)).byteLength;
      if(rows.length>=MAX_ROWS||bytes>MAX_BYTES)fail('LIMIT','Private auxiliary witness data exceeds its Worker bound.');
      rows.push(row);
    }
  }
  ownership.unchanged();const batch=Object.freeze(rows);issued.add(batch);return batch;
}

// A request-local immutable batch can serve multiple NEW private readers.
// Each reader binds actual row identity and must independently check original
// equations/domain afterward. No extra solve or serializable permission.
export function installCapturedAuxiliaryWitnesses(workspace:any,ownership:ReturnType<typeof capturedParameterOwnership>,batch?:CapturedAuxiliaryWitnessBatch){
  if(batch!==undefined&&!issued.has(batch))fail('AUXILIARY_WITNESS_UNAVAILABLE','Auxiliary observations must come from this actual private cold solve.');
  const rows=new Map<string,AuxiliaryRow>();
  const assignments:{parameter:Param,value:number}[]=[];
  for(const row of batch||[]){const key=row.stage+':'+row.index;if(rows.has(key))fail('INVALID','Duplicate private auxiliary observation.');rows.set(key,row);}
  for(const [si,stage]of workspace.parametricManager.stages.entries())for(const [index,c]of stage.solverSystem.allConstraints.entries()){
    const auxiliary=ownership.constraint(c,stage),key=si+':'+index,row=rows.get(key);
    if(!auxiliary.length){if(row)fail('INVALID','An auxiliary observation targets a geometric-only constraint.');continue;}
    if(!row||row.typeId!==c.schema.id||row.objects.length!==c.objects.length||row.objects.some((id,i)=>id!==c.objects[i].id)||row.auxiliaries.length!==auxiliary.length)fail('AUXILIARY_WITNESS_UNAVAILABLE','The captured auxiliary relation has no matching cold observation.');
    for(let i=0;i<auxiliary.length;i++){
      const target=auxiliary[i],observation=row.auxiliaries[i];
      if(observation.role!==target.role||!Number.isFinite(observation.value)||ownership.geometry.has(target.parameter))fail('INVALID','Auxiliary observation role or ownership changed.');
      assignments.push({parameter:target.parameter,value:observation.value});
    }
    rows.delete(key);
  }
  if(rows.size)fail('INVALID','Unclaimed private auxiliary observations.');
  ownership.unchanged();
  // All rows/owners/aliases are established before the first auxiliary write.
  for(const {parameter,value}of assignments){parameter.set(value);parameter.solverParam.reset(value);}
  ownership.unchanged();
}
