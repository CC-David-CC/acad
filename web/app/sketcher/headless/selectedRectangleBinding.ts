import {HeadlessSketchWorkspace} from './workspace';
import {Segment} from '../shapes/segment';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {inspectTree} from './sketchValidation';
import {prepareTypedSelectedProfileSource} from '../../cad/parameters/typedSelectedProfileBindings.mjs';
import {inspectSolvedSelectedRegions} from '../../../../modules/engine/extrusion/selectedSketchProfile.mjs';
import {requireSelectedProfileBuild,selectedProfileVersion} from '../../../../modules/engine/mount/selectedProfileBuildSelection.mjs';

const fail=(message:string):never=>{throw Object.assign(Error(message),{code:'UNSUPPORTED_TYPED_RECTANGLE'});};
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const literal=(v:any)=>typeof v==='number'&&Number.isFinite(v)?v:typeof v==='string'&&numeric.test(v.trim())?Number(v):NaN;
function constants(c:any,keys:string[]){if(!c.constants||Object.keys(c.constants).sort().join(',')!==keys.slice().sort().join(','))fail('Rectangle defining fields changed.');return c.constants;}

// Worker-only. The semantic provider binds the selected region and exact build;
// no opaque ID parsing or rect-* spelling supplies geometry authority.
export async function prepareSelectedRectangleBindings(request:any,resolveLength:(name:string)=>number){
 inspectTree(request);
 if(Object.keys(request).sort().join(',')!=='bindings,depth,engineRevision,faceId,featureId,frame,regionId,revision,sketchJSON,source'||!Number.isSafeInteger(request.featureId)||request.featureId<1||!Number.isFinite(request.depth)||request.depth<=0||request.depth>1e6||!Array.isArray(request.bindings)||request.bindings.length!==2)fail('Expected exact selected rectangle binding data.');
 const build=requireSelectedProfileBuild('occ',request.engineRevision);if(selectedProfileVersion(build)!==3)fail('Rectangle bindings require the exact recorded version3 build.');
 const prepared=prepareTypedSelectedProfileSource(request.sketchJSON,resolveLength),sketch=prepared.sketch;
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(request.sketchJSON))),n=>n.toString(16).padStart(2,'0')).join('');
 const inspection=await inspectSolvedSelectedRegions({unit:'millimeter',engine:'occ',profileVersion:3,revision:request.revision,sketchDigest:digest,faceId:request.faceId,frame:request.frame,depth:request.depth,sketchJSON:request.sketchJSON});
 const regions=inspection.regions.filter(r=>r.regionId===request.regionId&&r.support==='supported');
 if(regions.length!==1)fail('The actual selected region is unavailable.');
 const descriptor=regions[0].descriptor;
 if(!Array.isArray(descriptor.outerCurveIds)||descriptor.outerCurveIds.length!==4||!Array.isArray(descriptor.holeCurveIds)||descriptor.holeCurveIds.length)fail('Width and height require the actual four-Segment rectangle region.');
 const requested=new Map<string,string>();for(const row of request.bindings){if(!row||Object.keys(row).sort().join(',')!=='dimension,parameter'||!['width','height'].includes(row.dimension)||typeof row.parameter!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(row.parameter)||requested.has(row.dimension))fail('Expected the two distinct rectangle length bindings.');requested.set(row.dimension,row.parameter);}
 const workspace=new HeadlessSketchWorkspace(prepared.externalParameters);
 const bindings=workspace.io.evaluateCapturedSketch(structuredClone(sketch),()=>{
  const pm=workspace.parametricManager,stage=pm.stages[0],index=workspace.createIndex(),ownership=capturedParameterOwnership(workspace),roots=descriptor.outerCurveIds.map(id=>index[id]),rootSet=new Set<any>(roots);
  if(rootSet.size!==4||roots.some(s=>!(s instanceof Segment)||s.parent||s.stage!==stage||!stage.objects.has(s)||s.role!==null||s.isGenerated||s.generator||s.generators.size||index[s.a.id]!==s.a||index[s.b.id]!==s.b||s.a.parent!==s||s.b.parent!==s||!s.children.has(s.a)||!s.children.has(s.b)))fail('Selected rectangle source ownership changed.');
  const all=stage.solverSystem.allConstraints;for(const c of all){if(!(c instanceof AlgNumConstraint))fail('Actual registered constraints are required.');ownership.constraint(c,stage);c.resolveConstants(pm.constantResolver);}
  const rows=all.filter(c=>!c.internal),locks=rows.filter(c=>c.schema===ConstraintDefinitions.LockPoint&&c.objects.length===1&&rootSet.has(c.objects[0]?.parent)&&c.objects[0]===c.objects[0].parent.a);
  if(locks.length!==1)fail('A unique authored rectangle anchor is required.');
  const lock=locks[0],anchor=constants(lock,['x','y']);if(![literal(anchor.x),literal(anchor.y)].every(Number.isFinite))fail('Rectangle anchor coordinates must remain literal.');
  const coincident=rows.filter(c=>c.schema===ConstraintDefinitions.PCoincident),ordered=[lock.objects[0].parent],used=new Set<any>();
  for(let i=0;i<4;i++){const s=ordered[i],matches=coincident.filter(c=>c.objects.length===2&&c.objects.includes(s.b)&&c.objects.some(p=>rootSet.has(p.parent)&&p===p.parent.a&&p.parent!==s));if(matches.length!==1||used.has(matches[0]))fail('The selected rectangle has ambiguous endpoint constraints.');const c=matches[0],next=c.objects.find(p=>p!==s.b).parent;used.add(c);if(i===3){if(next!==ordered[0])fail('The selected rectangle is not one authored cycle.');}else{if(ordered.includes(next))fail('The selected rectangle cycle repeats.');ordered.push(next);}}
  const directions:Array<[any,number]>=[[ConstraintDefinitions.Horizontal,0],[ConstraintDefinitions.Vertical,90],[ConstraintDefinitions.Horizontal,180],[ConstraintDefinitions.Vertical,270]];
  for(let i=0;i<4;i++){const matches=rows.filter(c=>(c.schema===ConstraintDefinitions.Horizontal||c.schema===ConstraintDefinitions.Vertical)&&c.objects.length===1&&c.objects[0]===ordered[i]);if(matches.length!==1||matches[0].schema!==directions[i][0])fail('The selected rectangle needs its actual directed axis rows.');const angle=literal(constants(matches[0],['angle']).angle);if(!Number.isFinite(angle)||((angle%360)+360)%360!==directions[i][1])fail('The selected rectangle axis direction changed.');}
  const out=[];
  for(const [i,dimension]of ['width','height'].entries()){
   const root=ordered[i],matches=rows.filter(c=>c.schema===ConstraintDefinitions.SegmentLength&&c.objects.length===1&&c.objects[0]===root);if(matches.length!==1)fail('The selected rectangle driving row is ambiguous.');
   const c=matches[0];constants(c,['length']);const sourceRows=sketch.stages[0].constraints,mapped=sourceRows.map((row,j)=>({row,j})).filter(({row})=>row.typeId==='SegmentLength'&&Array.isArray(row.objects)&&row.objects.length===1&&row.objects[0]===root.id&&Object.keys(row.constants||{}).join(',')==='length'&&Object.is(row.constants.length,c.constants.length));
   if(mapped.length!==1)fail('The actual rectangle driving row lost its captured source identity.');
   const value=requested.get(dimension),resolved=resolveLength(value);if(!Number.isFinite(resolved)||resolved<0.001||resolved>1e6)fail('Selected rectangle lengths must remain within their existing domain.');
   out.push({dimension,segmentId:root.id,index:mapped[0].j,before:mapped[0].row.constants.length,value});
  }
  ownership.unchanged();return out;
 });
 for(const row of bindings)sketch.stages[0].constraints[row.index].constants.length=row.value;
 // Every named relation resolves through the same registered policy, including
 // unrelated DistancePL rows. No decoder geometry Param has been set.
 const after=prepareTypedSelectedProfileSource(JSON.stringify(sketch),resolveLength);
 return {...after,bindings:bindings.map(({index,...row})=>row)};
}
