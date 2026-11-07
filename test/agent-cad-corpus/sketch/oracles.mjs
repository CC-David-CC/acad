import assert from 'node:assert/strict';
const near=(actual,expected)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-6,`${actual} differs from independent expected ${expected}`);
const xy=(actual,expected)=>{near(actual.x,expected[0]);near(actual.y,expected[1]);};
const object=(sketch,id)=>{const value=sketch.objects.find(o=>o.id===id);assert.ok(value,'Missing '+id);return value.data;};
export function assertGeometry(sketch,oracle){
 assert.ok(sketch&&Array.isArray(sketch.objects));
 switch(oracle.kind){
  case 'line':{const d=object(sketch,oracle.id);xy(d.a,oracle.a);xy(d.b,oracle.b);near(Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y),oracle.length);break;}
  case 'circle':{const d=object(sketch,oracle.id);xy(d.c,oracle.center);near(d.r,oracle.radius);near(2*d.r,2*oracle.radius);break;}
  case 'point':xy(object(sketch,oracle.id),oracle.at);break;
  case 'points':for(const [id,at]of Object.entries(oracle.points))xy(object(sketch,id),at);break;
  case 'concentric':{const a=object(sketch,oracle.a),b=object(sketch,oracle.b);xy(a.c,oracle.center);xy(b.c,oracle.center);near(a.r,oracle.radii[0]);near(b.r,oracle.radii[1]);break;}
  case 'length':{const d=object(sketch,oracle.id);near(Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y),oracle.length);assert.ok(sketch.stages[0].constraints.some(c=>c.constants?.length===oracle.authored),'Authored expression lost');break;}
  case 'rectangle':{
   const [x,y]=oracle.origin,w=oracle.width,h=oracle.height,expected=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
   for(let i=0;i<4;i++){const d=object(sketch,'rect-'+i);xy(d.a,expected[i]);xy(d.b,expected[(i+1)%4]);}
   const cs=sketch.stages[0].constraints;assert.equal(cs.filter(c=>c.typeId==='LockPoint').length,1);assert.equal(cs.filter(c=>c.typeId==='SegmentLength').length,2);break;
  }
  default:throw Error('No independent geometry oracle '+oracle.kind);
 }
}
export function authoredIntent(sketch){return {version:sketch.version,objects:sketch.objects.map(o=>[o.id,o.type,o.role,o.stage]),stages:sketch.stages,dimensions:sketch.dimensions,labels:sketch.labels,constants:sketch.constants,metadata:sketch.metadata,boundary:sketch.boundary};}
export function validateWorkerCase(entry,raw){
 assert.equal(raw.before,raw.after,'Worker/client mutated caller request');const result=raw.result;
 assert.notEqual(result.transportError,true,'Transport failure is not a successful domain refusal');
 if(entry.expected==='rejected'||entry.expected==='unsupported'){
  assert.equal(result.ok,false,'Rejected/unsupported request unexpectedly solved');assert.equal(typeof result.error?.code,'string');assert.equal(typeof result.error?.message,'string');
  assert.notEqual(result.error.code,'WORKER_ERROR','Worker crash is not an admitted domain refusal');
  if(entry.oracle.code)assert.equal(result.error.code,entry.oracle.code);assert.equal('sketch'in result,false,'Refusal exposed a solved candidate');
  return {status:entry.expected==='unsupported'?'unsupported':'pass',assertions:['typed refusal','exact caller-request bytes unchanged','no returned solved candidate'],error:result.error};
 }
 assert.equal(result.ok,true,JSON.stringify(result.error));
 if(entry.expected==='truthful-redundancy'){
  assert.ok(result.evidence.some(row=>row.state==='redundant'),'Known implied SignedDistanceY=0 was not labeled redundant; accepted labels retained');
  return {status:'pass',assertions:['independently implied relation reported redundant; no DOF inference']};
 }
 const solved=result.sketch||JSON.parse(result.serializedSketch);assertGeometry(solved,entry.oracle);
 const request=JSON.parse(raw.before),original=request.sketch||(request.sketchJSON?JSON.parse(request.sketchJSON):null);
 if(original)assert.deepEqual(authoredIntent(solved),authoredIntent(original),'Authored intent changed');
 assert.ok(raw.replay?.ok,JSON.stringify(raw.replay?.error));const reopened=raw.replay.sketch||JSON.parse(raw.replay.serializedSketch);
 assertGeometry(reopened,entry.oracle);assert.deepEqual(authoredIntent(reopened),authoredIntent(solved),'Serialized reload lost authored intent');
 for(const row of result.evidence||[])assert.ok(row.residuals.every((value,i)=>Number.isFinite(value)&&Math.abs(value)<=row.tolerances[i]),'Nonfinite/out-of-tolerance residual');
 return {status:'pass',assertions:['independent geometry math','exact caller-request bytes unchanged','authored intent preserved','serialized Worker reload and geometry','finite bounded residuals where supplied']};
}
