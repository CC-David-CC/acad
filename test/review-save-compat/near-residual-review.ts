import assert from 'node:assert/strict';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace';
import {solveSketch} from '../../web/app/sketcher/headless/solve';
import {assertCurrentDiagnosticGeometry} from '../../web/app/sketcher/headless/diagnosticGeometry.mjs';
const boundary={lines:[],arcs:[],circles:[],nurbses:[]},rows=[];
const obj=(id,type,data)=>({id,type,role:null,stage:0,data});
const relation=(typeId,objects,constants)=>({typeId,objects,constants,stage:0,admission:{version:1,state:'accepted'}});
function delta(a,b){if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b);if(a&&b&&typeof a==='object'&&typeof b==='object')return Math.max(0,...Object.keys(a).map(k=>delta(a[k],b[k])));return 0;}
function run(schema,objects,constants,refs,tag){const row={schema,...tag};try{
 const input={version:3,objects,dimensions:[],labels:[],stages:[{constraints:[relation(schema,refs,constants)],generators:[]}],constants:'',metadata:{},boundary:structuredClone(boundary)};
 const ui=new HeadlessSketchWorkspace({});ui.io._loadSketch(input,{strict:true});ui.parametricManager.prepare();ui.parametricManager.solve(false);const system=ui.parametricManager.stages[0].algNumSystem;
 row.uiStatus={...system.solveStatus};row.uiRejected=system.conflicting.size-system.redundant.size;
 const current=JSON.parse(ui.io.serializeSketch({}, {strict:true}));current.boundary=structuredClone(boundary);const result=solveSketch({revision:'r',sketch:current,boundary:structuredClone(boundary),externalParameters:{}});row.workerOK=result.ok;
 if(result.ok){row.delta=delta(current.objects.map(o=>o.data),result.sketch.objects.map(o=>o.data));try{assertCurrentDiagnosticGeometry(current,result.sketch);row.geometryAccepted=true;}catch(e){row.geometryAccepted=false;row.error=e.message;}row.evidence=result.evidence;}else row.error=result.error;
 }catch(e){row.setupError=e.message;}rows.push(row);}
for(const offset of [0,1e6,1e8])for(const scale of [.01,1,1000,1e6])for(const epsilon of [0,1e-8]){
 const p=(x,y)=>({x,y}),a=33*Math.PI/180,s=obj('s','Segment',{a:p(offset,offset),b:p(offset+scale*Math.cos(a),offset+scale*Math.sin(a)+epsilon)}),tag={offset,scale,epsilon};
 run('Angle',[s],{angle:'33'},['s'],tag);run('SegmentLength',[s],{length:String(scale)},['s'],tag);
 run('TangentLC',[obj('s','Segment',{a:p(offset,offset),b:p(offset+scale,offset)}),obj('c','Circle',{c:p(offset+2*scale,offset+scale+epsilon),r:scale})],{inverted:'false'},['s','c'],tag);
 run('DistancePP',[obj('a','Point',p(offset,offset)),obj('b','Point',p(offset+3*scale,offset+4*scale+epsilon))],{distance:String(5*scale)},['a','b'],tag);
}
for(const distance of [-5,0,5])run('DistancePP',[obj('a','Point',{x:0,y:0}),obj('b','Point',{x:distance===0?0:3,y:distance===0?0:4})],{distance:String(distance)},['a','b'],{domain:distance});
const refusals=rows.filter(r=>r.uiStatus?.success&&r.uiRejected===0&&r.workerOK&&r.geometryAccepted===false);assert.equal(refusals.length,0,'No valid sampled UI state may be refused solely by the geometry guard');
console.log('NEAR_RESIDUAL_REVIEW',JSON.stringify(rows));console.log('CONCRETE_VALID_UI_REFUSALS',JSON.stringify(rows.filter(r=>r.uiStatus?.success&&r.uiRejected===0&&r.workerOK&&r.geometryAccepted===false)));process.exit(0);
