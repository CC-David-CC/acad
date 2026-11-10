import {arcBranchFacts,arcDataFromObject} from '../shapes/arcBranch.mjs';
import {HeadlessSketchWorkspace} from './workspace';
import {Segment} from '../shapes/segment';
import {Arc} from '../shapes/arc';
import {Circle} from '../shapes/circle';
import {EndPoint} from '../shapes/point';
import {MirrorGeneratorSchema} from '../generators/mirrorGenerator';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {mirrorFail as fail,mirrorLocator} from './mirrorIntent.mjs';
import {PHYSICAL_COORDINATE_RECONSTRUCTION_BUDGET_MM as COORD} from './physicalCoordinateReconstruction.mjs';
const WORK=100000;
const root=(o:any)=>{let n=0;while(o?.parent){if(++n>64)fail('MIRROR_RESOURCE_LIMIT','Mirror parent depth exceeds its bound.');o=o.parent;}return o;};
export function mirrorNativePrimitive(o:any){return o instanceof EndPoint&&o.TYPE==='Point'||o instanceof Segment&&o.TYPE==='Segment'||o instanceof Circle&&o.TYPE==='Circle'||o instanceof Arc&&o.TYPE==='Arc';}
export function assertMirrorAxis(o:any){if(!(o instanceof Segment)||o.TYPE!=='Segment')fail('UNSUPPORTED_MIRROR_AXIS','Choose an actual Segment reflection axis.');const dx=o.b.x-o.a.x,dy=o.b.y-o.a.y,den=dx*dx+dy*dy;if(![o.a.x,o.a.y,o.b.x,o.b.y,den].every(Number.isFinite)||den<=1e-18)fail('UNSUPPORTED_MIRROR_AXIS','Reflection requires a regular finite nonzero axis.');}
export function assertMirrorArc(o:any){if(!(o instanceof Arc))return;const a=o.a,b=o.b,c=o.c,r=o.r.get(),rb=Math.hypot(b.x-c.x,b.y-c.y);if(![a.x,a.y,b.x,b.y,c.x,c.y,r,rb].every(Number.isFinite)||r<=1e-9||Math.abs(r-rb)>1e-9)fail('UNSUPPORTED_MIRROR_ARC','Mirror Arc must have two endpoints on its actual positive-radius circle.');arcBranchFacts(arcDataFromObject(o));}
export function mirrorSemanticMembers(source:any){return new Set(source.stages.flatMap(s=>s.constraints.filter(c=>c.typeId==='StraightSlot'||c.typeId==='RigidGroup').flatMap(c=>c.objects)));}
export function assertMirrorRoot(o:any,index:any,stage:any,ownership:any){
 if(!o||o.parent||index[o.id]!==o||o.stage!==stage||!stage?.objects.has(o)||!mirrorNativePrimitive(o))fail('INVALID_MIRROR_SOURCE','Mirror references must resolve actual native primitive roots.');
 let members=0;o.traverse(child=>{if(++members>4||index[child.id]!==child||child.stage!==stage)fail('INVALID_MIRROR_SOURCE','Mirror native descendant membership changed.');child.visitParams(p=>{if(!ownership.geometry.has(p)||!Number.isFinite(p.get()))fail('INVALID_MIRROR_SOURCE','Mirror parameters require actual finite native custody.');});});
 if(members!==(o.TYPE==='Point'?1:o.TYPE==='Segment'?3:o.TYPE==='Circle'?2:4))fail('INVALID_MIRROR_SOURCE','Mirror primitive differs from its native factory.');
 assertMirrorArc(o);
}
function geometry(o:any){const point=p=>({pointId:p.id,x:p.x,y:p.y});return{id:o.id,type:o.TYPE,role:o.role??null,stage:o.stage.index,points:o.TYPE==='Point'?[point(o)]:o.TYPE==='Circle'?[point(o.c)]:[point(o.a),point(o.b),...(o.TYPE==='Arc'?[point(o.c)]:[])],radius:['Circle','Arc'].includes(o.TYPE)?o.r.get():null,angles:o.TYPE==='Arc'?[o.ang1.get(),o.ang2.get()]:null};}
function compareData(before:any,after:any){const todo:any[]=[[before,after,[]]];let work=0;while(todo.length){if(++work>WORK)fail('MIRROR_RESOURCE_LIMIT','Mirror cache comparison exceeds its work bound.');const[a,b,path]=todo.pop();if(Object.is(a,b))continue;if(typeof a==='number'||typeof b==='number'){const budget=path.length===1&&path[0]==='r'?1e-9:COORD;if(typeof a!=='number'||typeof b!=='number'||!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>budget)fail('MIRROR_DERIVED_MISMATCH','Stored Mirror geometry disagrees with actual native regeneration.');continue;}if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))fail('MIRROR_DERIVED_MISMATCH','Stored Mirror data differs from its actual native producer.');const x=Object.keys(a).sort(),y=Object.keys(b).sort();if(x.length!==y.length||x.some((k,i)=>k!==y[i]))fail('MIRROR_DERIVED_MISMATCH','Mirror cache field membership changed.');for(const k of x)todo.push([a[k],b[k],[...path,k]]);}}
export function mirrorSourceReason(o:any,semantic:Set<any>){return !mirrorNativePrimitive(o)?'UNSUPPORTED_MIRROR_TYPE':o.parent||o.readOnly||o.isGenerated?'GENERATED_OR_READONLY_TARGET':semantic.has(o.id)?'UNSUPPORTED_SEMANTIC_GROUP':null;}
export function inspectMirrorSource(source:any,external:any={}){
 const hasMirror=source.stages?.some(s=>s.generators?.some(g=>g.typeId==='Mirror'));const workspace=new HeadlessSketchWorkspace(external);
 // Geometry-only projection: original project/constraint preflight is separate.
 // No solve or publication; original references below remain authoritative.
 const projection={...structuredClone(source),dimensions:[],labels:[],stages:source.stages.map(s=>({...structuredClone(s),constraints:[]}))};
 return workspace.io.evaluateCapturedSketch(projection,()=>{
  const pm=workspace.parametricManager,index=workspace.createIndex(),ownership=capturedParameterOwnership(workspace),semantic=mirrorSemanticMembers(source),saved=new Map<string,any>(source.objects.map(o=>[o.id,o] as [string,any])),roster:any[]=[],order=new Map<any,any>(),qualified=new Set<any>(),generated=new Set<any>(),before=new Map<any,string>();let work=0;
  const charge=()=>{if(++work>WORK)fail('MIRROR_RESOURCE_LIMIT','Mirror ownership validation exceeds its work bound.');};
  for(const stage of pm.stages)for(const [at,g]of [...stage.generators].entries()){charge();const entry={g,stage:stage.index,index:at};order.set(g,entry);roster.push(entry);}
  // Capture actual current primitive observations BEFORE native regeneration.
  // Unsupported existing domains remain native carry, with derived reason only.
  const sources=source.objects.map(row=>{charge();const o=index[row.id];let reason=mirrorSourceReason(o,semantic);if(!reason)try{assertMirrorArc(o);}catch(error){reason=error?.code||'UNSUPPORTED_MIRROR_ARC';}return{id:row.id,type:row.type,stage:o.stage.index,role:o.role??null,canMirror:reason===null,reason};});
  const axes=sources.filter(s=>s.type==='Segment').map(s=>{let reason=s.reason;if(!reason)try{assertMirrorAxis(index[s.id]);}catch(error){reason=error?.code||'UNSUPPORTED_MIRROR_AXIS';}return{...s,canMirror:reason===null,reason,geometry:geometry(index[s.id])};});
  const descriptions=roster.filter(entry=>entry.g.schema===MirrorGeneratorSchema).map(entry=>{
   const {g,stage,index:at}=entry;if(g.schema!==MirrorGeneratorSchema)return{stage,index:at,supported:false,reason:'UNSUPPORTED_GENERATOR',record:structuredClone(g.write()),sources:[],outputs:[]};
   const inputs=g.params.objects,axis=g.params.reflectionLine?.[0],outputs=g.generatedObjects;
   const supported=Array.isArray(inputs)&&Array.isArray(outputs)&&g.params.reflectionLine?.length===1&&axis instanceof Segment&&saved.has(axis.id)&&inputs.every(o=>saved.has(o?.id)&&mirrorNativePrimitive(o))&&outputs.every(mirrorNativePrimitive)&&![axis,...inputs].some(o=>semantic.has(o?.id));
   if(!supported)return{stage,index:at,supported:false,reason:'UNSUPPORTED_MIRROR_DOMAIN',record:structuredClone(g.write()),sources:[],outputs:[]};
   const raw=source.stages[stage]?.generators[at],native=g.write();
   if(!raw||raw.typeId!=='Mirror'||raw.stage!==undefined&&raw.stage!==stage||JSON.stringify(raw.params?.reflectionLine)!==JSON.stringify(native.params.reflectionLine)||JSON.stringify(raw.params?.objects)!==JSON.stringify(native.params.objects)||JSON.stringify(raw.generatedObjects)!==JSON.stringify(native.generatedObjects))fail('INVALID_MIRROR_SOURCE','Original Mirror record does not bind the actual restored stage and ordered references.');
   if(inputs.length>256||roster.length>256)fail('MIRROR_RESOURCE_LIMIT','Mirror correspondence exceeds its admitted work envelope.');
   if(!inputs.length||outputs.length!==inputs.length||new Set(inputs).size!==inputs.length||new Set(outputs).size!==outputs.length||inputs.includes(axis)||outputs.includes(axis)||outputs.some(o=>inputs.includes(o)))fail('INVALID_MIRROR_SOURCE','Mirror source/output correspondence is invalid.');
   let domainReason=null;try{assertMirrorAxis(axis);for(const o of [...inputs,...outputs])assertMirrorArc(o);}catch(error){if(typeof error?.code==='string'&&error.code.startsWith('UNSUPPORTED_'))domainReason=error.code;else throw error;}
   if(domainReason)return{stage,index:at,supported:false,reason:domainReason,record:structuredClone(g.write()),sources:[],outputs:[]};
   for(const o of [axis,...inputs]){charge();assertMirrorRoot(o,index,o.stage,ownership);if(!saved.has(o.id)||o.stage.index>stage||!o.generators.has(g))fail('INVALID_MIRROR_SOURCE','Mirror source has no actual current native dependency.');if(o.generator){const producer=order.get(o.generator);if(!producer||producer.stage>stage||producer.stage===stage&&producer.index>=at)fail('INVALID_MIRROR_SOURCE','Mirror dependency order is cyclic or forward.');if(!qualified.has(o.generator))return{stage,index:at,supported:false,reason:'UNSUPPORTED_MIRROR_DEPENDENCY',record:structuredClone(g.write()),sources:[],outputs:[]};}}
   for(let i=0;i<outputs.length;i++){const o=outputs[i];charge();assertMirrorRoot(o,index,pm.stages[stage],ownership);if(!saved.has(o.id)||o.TYPE!==inputs[i].TYPE||o.generator!==g||generated.has(o))fail('INVALID_MIRROR_SOURCE','Mirror output producer/type/ownership mismatch.');generated.add(o);before.set(o,JSON.stringify(o.write()));}
   qualified.add(g);return{stage,index:at,supported:true,reason:null,record:structuredClone(g.write()),sources:inputs.map(geometry),outputs:outputs.map(geometry)};
  });
  ownership.unchanged();
  for(let si=0;si<source.stages.length;si++)for(const c of source.stages[si].constraints)for(const id of c.objects){charge();const r=root(index[id]);if(generated.has(r)&&r.stage.index>=si)fail('INVALID_MIRROR_SOURCE','An authored constraint consumes an output before its generator runs.');}
  const stable=new Map<any,string>();for(const row of source.objects){const o=index[row.id];if(!generated.has(o))stable.set(o,JSON.stringify(o.write()));}
  // The actual generator regenerates only its own detached outputs. Nothing is
  // written back to the original source or adopted from this verification copy.
  for(const entry of roster)if(qualified.has(entry.g)){entry.g.regenerate(workspace);for(const output of entry.g.generatedObjects){charge();if(index[output.id]!==output||output.generator!==entry.g)fail('INVALID_MIRROR_SOURCE','Regeneration replaced an actual output owner.');assertMirrorArc(output);compareData(JSON.parse(before.get(output)),output.write());}}
  for(const [o,data]of stable)if(JSON.stringify(o.write())!==data)fail('MIRROR_INPUT_CHANGED','Native Mirror regeneration changed an authored or unsupported input.');
  const after=capturedParameterOwnership(workspace);if(after.geometry.size!==ownership.geometry.size||[...after.geometry].some(p=>!ownership.geometry.has(p)))fail('INVALID_MIRROR_SOURCE','Regeneration changed actual parameter identities.');after.unchanged();
  return{sources,axes,generators:descriptions,quality:hasMirror?'native-source-domain-inventory':'native-primitive-custody',qualification:'Point-Segment-Circle-Arc-only',maxSources:256};
 });
}
export function validateMirrorSourceGeometry(source:any,external:any={}){if(!source.stages?.some(s=>s.generators?.some(g=>g.typeId==='Mirror')))return;return inspectMirrorSource(source,external);}
export function mirrorReceipt(stage:number,index:number,g:any){const reflectionLineId=g.params.reflectionLine[0].id,sourceIds=g.params.objects.map(o=>o.id),generatedIds=g.generatedObjects.map(o=>o.id);return{stage,index,locator:mirrorLocator(stage,index,reflectionLineId,sourceIds,generatedIds),reflectionLineId,sourceIds,generatedIds};}
