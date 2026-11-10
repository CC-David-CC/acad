import {HeadlessSketchWorkspace} from './workspace';
import {Segment} from '../shapes/segment';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {solveSketch} from './solve';
import {inspectTree} from './sketchValidation';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {captureSketchFailure,failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';

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
  for(let i=0;i<4;i++){const matches=axes.filter(c=>c.objects.length===1&&c.objects[0]===ordered[i]);if(matches.length!==1||matches[0].schema!==ConstraintDefinitions[directions[i][0]])return null;const constants=exactConstants(matches[0],['angle']),degrees=literal(constants.angle);if(((degrees%360)+360)%360!==directions[i][1])return null;}
  const widthRows=lengths.filter(c=>c.objects.length===1&&c.objects[0]===ordered[0]),heightRows=lengths.filter(c=>c.objects.length===1&&c.objects[0]===ordered[1]);if(widthRows.length!==1||heightRows.length!==1)return null;
  const anchor=exactConstants(lock,['x','y']),x=literal(anchor.x),y=literal(anchor.y);exactConstants(widthRows[0],['length']);exactConstants(heightRows[0],['length']);
  const width=widthRows[0].resolvedConstants.length,height=heightRows[0].resolvedConstants.length;
  if(![width,height].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0))fail('TYPED_RECTANGLE_DOMAIN','Declared lengths violate the actual positive finite SegmentLength domain.');
  // These are this helper's qualified envelope, not the generic source domain.
  // In particular positive literal sides below0.001 remain generically eligible.
  if(![width,height].every(n=>n>=0.001&&n<=1e6)||![x,y].every(n=>Math.abs(n)<=1e8)){ownership.unchanged();return null;}
  // Exact prior branch is ELIGIBILITY for this finite reconstruction, not
  // a new rejection of sources the pre-existing generic solver could admit.
  // No proximity matching, coordinate snap or vertex weld opts a source in.
  const prior=ordered.map(s=>({id:s.id,a:{x:s.a.x,y:s.a.y},b:{x:s.b.x,y:s.b.y}})),x1=prior[0].b.x,y1=prior[1].b.y,oldCorners=[[x,y],[x1,y],[x1,y1],[x,y1]];
  const badEdge=prior.findIndex((s,i)=>['x','y'].some((axis,j)=>s.a[axis]!==oldCorners[i][j]||s.b[axis]!==oldCorners[(i+1)%4][j]));
  if(!(x1>x&&y1>y)||badEdge>=0){ownership.unchanged();return null;}
  const right=x+width,top=y+height;if(![right,top].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e8)||!(right>x&&top>y)){ownership.unchanged();return null;}
  const sourceRows=sketch.stages[0].constraints;
  const rowBinding=(c:any)=>{
   const matches=sourceRows.map((row:any,index:number)=>({row,index})).filter(({row}:any)=>row.typeId===c.schema.id&&Array.isArray(row.objects)&&row.objects.length===1&&row.objects[0]===c.objects[0].id&&row.constants&&Object.keys(row.constants).length===1&&Object.is(row.constants.length,c.constants.length));
   if(matches.length!==1)fail('RECTANGLE_DECLARATION_BINDING','The actual rectangle driving row has no unique captured source binding.');
   return Object.freeze({stage:0,index:matches[0].index});
  };
  const widthRow=rowBinding(widthRows[0]),heightRow=rowBinding(heightRows[0]);
  ownership.unchanged();return{ids:ordered.map(s=>s.id),corners:[[x,y],[right,y],[right,top],[x,top]],widthRow,heightRow};
 });
}
// Private edit-only source bindings. These are response-local authored-row
// locators, not public identity grammar or permission to rewrite arbitrary rows.
// Noncanonical current coordinates remain on the pre-existing generic path;
// this does not change the typed helper's existing current-mismatch semantics.
export function captureRectangleDimensionBindings(request:any){
 inspectTree(request);const declared=declaration(request.sketch,request.externalParameters);
 if(!declared)return null;
 for(let i=0;i<4;i++){
  const object=request.sketch.objects.find(o=>o.id===declared.ids[i]);
  if(!object||['x','y'].some((axis,j)=>object.data.a[axis]!==declared.corners[i][j]||object.data.b[axis]!==declared.corners[(i+1)%4][j]))return null;
 }
 return Object.freeze({widthRow:declared.widthRow,heightRow:declared.heightRow});
}
function cold(revision:string,sketch:any,boundary:any,external:any){let auxiliary:any;const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(boundary),externalParameters:external},undefined,batch=>{auxiliary=batch;});if(!result.ok)throw withAdmissionCause(Object.assign(Error(result.error.message),{code:result.error.code}),result.error.cause);return{result,auxiliary};}
function replayProof(candidate:any,observation:any,external:any){try{assertVerifiedReplayGeometry(candidate,observation.result.sketch,observation.result.evidence,external);}catch(error){throw withAdmissionCause(Object.assign(Error(((error?.message||'Rectangle replay differs.')+' First actual endpoint difference: '+firstGeometryDifference(candidate,observation.result.sketch)).slice(0,512)),{code:typeof error?.code==='string'?error.code:'TYPED_RECTANGLE_REPLAY_MISMATCH'}),failureCause(error));}}

// Null means this is NOT the finite canonical rectangle: generic dependent
// sketches keep their existing solver path. No coordinate-only heuristic can
// opt a source into this reconstruction. All publication remains outside Worker.
export function reconstructTypedRectangle(request:any,{update=false}:{update?:boolean}={}){
 const revision=request.revision;try{
  inspectTree(request);
  const sketch=request.sketch,external=request.externalParameters,declared=declaration(sketch,external);
  if(!declared)return null;
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


// Edit-only construction of an independently authenticated rectangle component.
// The strict whole-source functions above retain their existing eligibility.
type RectangleSubsetTarget={stage:number,index:number};
function rectangleSubset(request:any,target:RectangleSubsetTarget){
 inspectTree(request);
 const sketch=request.sketch;
 if(!target||target.stage!==0||!Number.isSafeInteger(target.index)||target.index<0||
    !Array.isArray(sketch?.objects)||sketch.objects.length<=4||sketch.objects.length>1024||
    sketch.objects.some(o=>!['Point','Segment','Circle','Arc'].includes(o?.type)||o.stage!==0||![null,'construction'].includes(o.role))||
    !Array.isArray(sketch.stages)||sketch.stages.length!==1||
    !Array.isArray(sketch.stages[0]?.constraints)||sketch.stages[0].constraints.length>4096||
    !Array.isArray(sketch.stages[0].generators)||sketch.stages[0].generators.length||
    !Array.isArray(sketch.dimensions)||sketch.dimensions.length||
    !Array.isArray(sketch.labels)||sketch.labels.length||
    !sketch.boundary||['lines','arcs','circles','nurbses'].some(k=>!Array.isArray(sketch.boundary[k])||sketch.boundary[k].length))return null;
 const workspace=new HeadlessSketchWorkspace(request.externalParameters);
 return workspace.io.evaluateCapturedSketch(structuredClone(sketch),()=>{
  const pm=workspace.parametricManager,stage=pm.stages[0],index=workspace.createIndex(),ownership=capturedParameterOwnership(workspace);
  const restored=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));restored.boundary=structuredClone(sketch.boundary);
  if(!sameRestoredSketch(JSON.stringify(sketch),JSON.stringify(restored)))fail('RECTANGLE_DECLARATION_BINDING','Rectangle component decoding changed original source.');
  const roots=new Set<any>(),objectOwner=new Map<any,any>(),parameterOwner=new Map<any,any>();let work=0;
  const charge=()=>{if(++work>100000)fail('LIMIT','Rectangle component ownership exceeds its Worker work bound.');};
  for(const row of sketch.objects){
   charge();const root=index[row.id];
   if(!root||root.parent||root.TYPE!==row.type||root.role!==row.role||root.stage!==stage||!stage.objects.has(root)||root.isGenerated||root.generator||root.generators.size)return null;
   roots.add(root);
   root.traverse(object=>{
    charge();if(index[object.id]!==object||object.stage!==stage||objectOwner.has(object)&&objectOwner.get(object)!==root)fail('RECTANGLE_DECLARATION_BINDING','Rectangle component descendant ownership is ambiguous.');
    objectOwner.set(object,root);
    object.visitParams(parameter=>{charge();if(!ownership.geometry.has(parameter)||parameterOwner.has(parameter)&&parameterOwner.get(parameter)!==root)fail('RECTANGLE_DECLARATION_BINDING','Rectangle component geometry Params alias another source root.');parameterOwner.set(parameter,root);});
   });
  }
  const all=stage.solverSystem.allConstraints,rows=all.filter(c=>!c.internal),neighbors=new Map<any,Set<any>>();
  if(rows.length!==sketch.stages[0].constraints.length||target.index>=rows.length)return null;
  const chosen=rows[target.index];
  if(!(chosen instanceof AlgNumConstraint)||chosen.schema!==ConstraintDefinitions.SegmentLength||chosen.objects.length!==1||!(chosen.objects[0] instanceof Segment)||!roots.has(chosen.objects[0]))return null;
  // Graph edges come from the original registered factory's actual owned
  // objects AND Params. A shared equation cannot disappear when projecting a
  // four-root component; no caller grouping or opaque-ID grammar is consulted.
  const memberships=new Map<any,Set<any>>();
  for(const c of all){
   charge();ownership.constraint(c,stage);const members=new Set<any>();
   for(const object of c.objects){charge();const owner=objectOwner.get(object);if(!owner)return null;members.add(owner);}
   for(const parameter of c.params){charge();const owner=parameterOwner.get(parameter);if(!owner)return null;members.add(owner);}
   memberships.set(c,members);
   for(const member of members){let peers=neighbors.get(member);if(!peers){peers=new Set<any>();neighbors.set(member,peers);}for(const other of members){charge();peers.add(other);}}
  }
  const selected=new Set<any>([chosen.objects[0]]),pending=[chosen.objects[0]];
  for(let at=0;at<pending.length;at++)for(const other of neighbors.get(pending[at])||[]){charge();if(!selected.has(other)){selected.add(other);if(selected.size>4)return null;pending.push(other);}}
  if(selected.size!==4||[...selected].some(root=>!(root instanceof Segment)||root.role!==null))return null;
  const rowIndices:number[]=[];
  for(let i=0;i<rows.length;i++){charge();const members=memberships.get(rows[i]),touches=[...members].some(root=>selected.has(root));if(!touches)continue;if([...members].some(root=>!selected.has(root)))fail('RECTANGLE_DECLARATION_BINDING','Rectangle component has a cross-source constraint.');rowIndices.push(i);}
  if(rowIndices.length!==11)return null;
  const selectedIds=new Set([...selected].map(root=>root.id)),subset=structuredClone(sketch);
  subset.objects=subset.objects.filter(o=>selectedIds.has(o.id));
  subset.stages[0].constraints=rowIndices.map(i=>structuredClone(sketch.stages[0].constraints[i]));
  ownership.unchanged();return{subset,rowIndices,selectedIds};
 });
}
export function captureRectangleSubsetDimensionBindings(request:any,target:RectangleSubsetTarget){
 const component=rectangleSubset(request,target);if(!component)return null;
 const captured=captureRectangleDimensionBindings({...request,sketch:component.subset});if(!captured)return null;
 const row=(value:any)=>Object.freeze({stage:0,index:component.rowIndices[value.index]});
 return Object.freeze({widthRow:row(captured.widthRow),heightRow:row(captured.heightRow)});
}
export function reconstructRectangleSubset(request:any,{update=false,target}:{update?:boolean,target:RectangleSubsetTarget}){
 const revision=request.revision;try{
  const component=rectangleSubset(request,target);if(!component)return null;
  const declared=declaration(component.subset,request.externalParameters);if(!declared)return null;
  const candidate=structuredClone(request.sketch);
  for(let i=0;i<4;i++){
   const object=candidate.objects.find(o=>o.id===declared.ids[i]);
   object.data.a.x=declared.corners[i][0];object.data.a.y=declared.corners[i][1];
   object.data.b.x=declared.corners[(i+1)%4][0];object.data.b.y=declared.corners[(i+1)%4][1];
  }
  if(!update&&JSON.stringify(candidate.objects)!==JSON.stringify(request.sketch.objects))fail('TYPED_RECTANGLE_CURRENT_MISMATCH','The captured rectangle component differs from its declared dimensions.');
  // An exact whole-source relation: only this component's coordinate data may
  // have been constructed. Every other authored field remains original.
  const expected=structuredClone(request.sketch);
  for(const object of expected.objects)if(component.selectedIds.has(object.id))object.data=structuredClone(candidate.objects.find(o=>o.id===object.id).data);
  if(JSON.stringify(expected)!==JSON.stringify(candidate))fail('INTENT_CHANGED','Rectangle component construction changed unrelated source.');
  // ORIGINAL full equations and every spectator retain authority. Cold output
  // only supplies independently checked evidence, never publication geometry.
  const first=cold(revision,candidate,request.boundary,request.externalParameters);replayProof(candidate,first,request.externalParameters);
  const second=cold(revision,candidate,request.boundary,request.externalParameters);replayProof(candidate,second,request.externalParameters);
  const checked=evaluateCapturedSketch(candidate,request.externalParameters,second.result.evidence,undefined,second.auxiliary);
  if(first.result.evidence.length!==checked.evidence.length||first.result.evidence.some((e,i)=>e.typeId!==checked.evidence[i].typeId||e.state!==checked.evidence[i].state))fail('ADMISSION_CHANGED','Independent whole-source rectangle classifications differ.');
  const serializedSketch=JSON.stringify(candidate);if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)fail('LIMIT','The rectangle component source exceeds its existing Worker bound.');
  return{revision,ok:true as const,sketch:candidate,evidence:checked.evidence,serializedSketch};
 }catch(error){return failure(revision,error);}
}
