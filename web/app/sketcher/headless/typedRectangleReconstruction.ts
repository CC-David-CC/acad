import {HeadlessSketchWorkspace} from './workspace';
import {Segment} from '../shapes/segment';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {solveSketch} from './solve';
import {inspectTree} from './sketchValidation';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureSketchFailure,failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';

const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const own=(value:any,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
function literal(value:any){const result=typeof value==='number'?value:typeof value==='string'&&numeric.test(value.trim())?Number(value):NaN;if(!Number.isFinite(result))fail('UNSUPPORTED_TYPED_RECTANGLE','An authored axis/anchor needs an actual numeric literal.');return result;}
function exactConstants(c:any,keys:string[]){const values=c.constants;if(!values||Object.keys(values).length!==keys.length||keys.some(k=>!own(values,k)))fail('UNSUPPORTED_TYPED_RECTANGLE','The rectangle declaration has unsupported constant fields.');return values;}
function firstGeometryDifference(before:any,after:any){for(let i=0;i<before.objects.length;i++)for(const end of['a','b'])for(const axis of['x','y']){const a=before.objects[i]?.data?.[end]?.[axis],b=after.objects[i]?.data?.[end]?.[axis];if(!Object.is(a,b))return before.objects[i].id.slice(0,48)+'.'+end+'.'+axis+' (declared='+a+', cold='+b+')';}return 'no endpoint difference';}
function failure(revision:string,error:any){const cause=failureCause(error),code=typeof error?.code==='string'?error.code.slice(0,64):'TYPED_RECTANGLE_INVALID',message=typeof error?.message==='string'?error.message.slice(0,512):'The authored rectangle could not be reconstructed.';return{revision,ok:false as const,error:captureSketchFailure({code,message,...(cause?{cause}:{})})};}

// Recognize only an actual finite registered model. Endpoint identities come
// from the decoder's Segment objects, never by parsing a public/opaque ID or
// trusting a saved schema name/admission flag as a geometric permission.
function declaration(sketch:any,external:any){
 if(!Array.isArray(sketch?.objects)||sketch.objects.length!==4||sketch.objects.some(o=>o?.type!=='Segment'||o.stage!==0||o.role!==null)||!Array.isArray(sketch.stages)||sketch.stages.length!==1||!Array.isArray(sketch.stages[0]?.constraints)||sketch.stages[0].constraints.length!==11||sketch.stages[0].generators?.length!==0||!sketch.boundary||['lines','arcs','circles','nurbses'].some(k=>!Array.isArray(sketch.boundary[k])||sketch.boundary[k].length))return null;
 const workspace=new HeadlessSketchWorkspace(external);
 return workspace.io.evaluateCapturedSketch(structuredClone(sketch),()=>{
  const pm=workspace.parametricManager,stage=pm.stages[0],index=workspace.createIndex(),roots=sketch.objects.map(o=>index[o.id]),rootSet=new Set<any>(roots),ownership=capturedParameterOwnership(workspace);
  if(roots.some(s=>!(s instanceof Segment)||s.parent||s.stage!==stage||!stage.objects.has(s)||s.isGenerated||s.generators.size||s.generator||index[s.a.id]!==s.a||index[s.b.id]!==s.b||s.a.parent!==s||s.b.parent!==s||!s.children.has(s.a)||!s.children.has(s.b)))fail('UNSUPPORTED_TYPED_RECTANGLE','Rectangle object ownership differs from its actual source.');
  const all=stage.solverSystem.allConstraints,rows=all.filter(c=>!c.internal),locks=rows.filter(c=>c.schema===ConstraintDefinitions.LockPoint),coincident=rows.filter(c=>c.schema===ConstraintDefinitions.PCoincident),axes=rows.filter(c=>c.schema===ConstraintDefinitions.Horizontal||c.schema===ConstraintDefinitions.Vertical),lengths=rows.filter(c=>c.schema===ConstraintDefinitions.SegmentLength);
  if(rows.length!==11||locks.length!==1||coincident.length!==4||axes.length!==4||lengths.length!==2)return null;
  for(const c of all){if(!(c instanceof AlgNumConstraint))fail('UNSUPPORTED_TYPED_RECTANGLE','A registered rectangle equation is required.');ownership.constraint(c,stage);c.resolveConstants(pm.constantResolver);}
  const lock=locks[0],start=lock.objects[0]?.parent;
  if(lock.objects.length!==1||!rootSet.has(start)||lock.objects[0]!==start.a)return null;
  const ordered=[start],used=new Set<any>();
  for(let i=0;i<4;i++){
   const s=ordered[i],matches=coincident.filter(c=>c.objects.length===2&&c.objects.includes(s.b)&&c.objects.some(p=>rootSet.has(p.parent)&&p===p.parent.a&&p.parent!==s));
   if(matches.length!==1||used.has(matches[0]))return null;
   const c=matches[0],next=c.objects.find(p=>p!==s.b)?.parent;used.add(c);
   if(i===3){if(next!==start)return null;}else{if(ordered.includes(next))return null;ordered.push(next);}
  }
  if(new Set(ordered).size!==4||used.size!==4)return null;
  const directions:Array<[string,number]>=[['Horizontal',0],['Vertical',90],['Horizontal',180],['Vertical',270]];
  for(let i=0;i<4;i++){const matches=axes.filter(c=>c.objects.length===1&&c.objects[0]===ordered[i]);if(matches.length!==1||matches[0].schema!==ConstraintDefinitions[directions[i][0]])return null;const constants=exactConstants(matches[0],['angle']);if(literal(constants.angle)!==directions[i][1])return null;}
  const widthRows=lengths.filter(c=>c.objects.length===1&&c.objects[0]===ordered[0]),heightRows=lengths.filter(c=>c.objects.length===1&&c.objects[0]===ordered[1]);if(widthRows.length!==1||heightRows.length!==1)return null;
  const anchor=exactConstants(lock,['x','y']),x=literal(anchor.x),y=literal(anchor.y);exactConstants(widthRows[0],['length']);exactConstants(heightRows[0],['length']);
  const width=widthRows[0].resolvedConstants.length,height=heightRows[0].resolvedConstants.length;if(![width,height].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0.001&&n<=1e6)||![x,y].every(n=>Math.abs(n)<=1e8))fail('TYPED_RECTANGLE_DOMAIN','Declared rectangle dimensions or anchor exceed the supported domain.');
  // The prior source must genuinely occupy this declared directed branch.
  // This uses exact equalities, not a proximity test, repair or vertex weld.
  const prior=ordered.map(s=>({id:s.id,a:{x:s.a.x,y:s.a.y},b:{x:s.b.x,y:s.b.y}})),x1=prior[0].b.x,y1=prior[1].b.y,oldCorners=[[x,y],[x1,y],[x1,y1],[x,y1]];
  const badEdge=prior.findIndex((s,i)=>['x','y'].some((axis,j)=>s.a[axis]!==oldCorners[i][j]||s.b[axis]!==oldCorners[(i+1)%4][j]));
  if(!(x1>x&&y1>y)||badEdge>=0){const at=badEdge<0?0:badEdge,s=prior[at];fail('TYPED_RECTANGLE_SOURCE_BRANCH','The actual prior rectangle is not exactly on its declared anchored axis branch: '+JSON.stringify({edge:at,id:s.id.slice(0,64),a:s.a,b:s.b,expectedA:oldCorners[at],expectedB:oldCorners[(at+1)%4]}).slice(0,384));}
  const right=x+width,top=y+height;if(![right,top].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e8)||!(right>x&&top>y))fail('TYPED_RECTANGLE_DOMAIN','The declared extent cannot be represented at this anchor.');
  ownership.unchanged();return{ids:ordered.map(s=>s.id),corners:[[x,y],[right,y],[right,top],[x,top]]};
 });
}
function cold(revision:string,sketch:any,boundary:any,external:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(boundary),externalParameters:external},undefined,batch=>{auxiliary=batch;});if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);return{result,auxiliary};}
function replayProof(candidate:any,observation:any,external:any){try{assertVerifiedReplayGeometry(candidate,observation.result.sketch,observation.result.evidence,external);}catch(error){throw withAdmissionCause(Object.assign(Error(((error?.message||'Rectangle replay differs.')+' First actual endpoint difference: '+firstGeometryDifference(candidate,observation.result.sketch)).slice(0,512)),{code:typeof error?.code==='string'?error.code:'TYPED_RECTANGLE_REPLAY_MISMATCH'}),failureCause(error));}}

// Null means this is NOT the finite canonical rectangle: generic dependent
// sketches keep their existing solver path. No coordinate-only heuristic can
// opt a source into this reconstruction. All publication remains outside Worker.
export function reconstructTypedRectangle(request:any,{update=false,required=false}:{update?:boolean,required?:boolean}={}){
 const revision=request.revision;try{
  inspectTree(request);
  const sketch=request.sketch,external=request.externalParameters,declared=declaration(sketch,external);
  if(!declared){if(required)fail('UNSUPPORTED_TYPED_RECTANGLE','A complete anchored four-line directed rectangle declaration is required.');return null;}
  const candidate=structuredClone(sketch);for(let i=0;i<4;i++){const object=candidate.objects.find(o=>o.id===declared.ids[i]);object.data.a.x=declared.corners[i][0];object.data.a.y=declared.corners[i][1];object.data.b.x=declared.corners[(i+1)%4][0];object.data.b.y=declared.corners[(i+1)%4][1];}
  if(!update&&JSON.stringify(candidate.objects)!==JSON.stringify(sketch.objects))fail('TYPED_RECTANGLE_CURRENT_MISMATCH','The current source does not represent its actual declared typed dimensions: '+firstGeometryDifference(candidate,sketch));
  // Exact declared coordinate construction precedes optimization. Nothing is
  // copied over a failed solve. Every ORIGINAL authored equation/ownership is
  // validated at these captured coordinates after two fresh cold proofs.
  const first=cold(revision,candidate,request.boundary,external);replayProof(candidate,first,external);
  const second=cold(revision,candidate,request.boundary,external);replayProof(candidate,second,external);
  const checked=evaluateCapturedSketch(candidate,external,second.result.evidence,undefined,second.auxiliary);
  if(first.result.evidence.length!==checked.evidence.length||first.result.evidence.some((e,i)=>e.typeId!==checked.evidence[i].typeId||e.state!==checked.evidence[i].state))fail('ADMISSION_CHANGED','Independent rectangle classifications differ.');
  const serializedSketch=JSON.stringify(candidate);if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)fail('LIMIT','The rectangle source exceeds its existing Worker bound.');
  return{revision,ok:true as const,sketch:candidate,evidence:checked.evidence,serializedSketch};
 }catch(error){return failure(revision,error);}
}
