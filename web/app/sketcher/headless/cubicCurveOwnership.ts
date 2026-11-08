import {BezierCurve} from '../shapes/bezier-curve';
import {BSpline,GeneralKnotsCalculator} from '../shapes/b-spline';
import {Segment} from '../shapes/segment';
import {EndPoint} from '../shapes/point';
import {capturedParameterOwnership} from './capturedParameterOwnership';
const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
export function cubicCurveOwnership(workspace:any,id:string,captured?:any){
 const index=captured?.index||workspace.createIndex(),root:any=index[id],pm=workspace.parametricManager;
 if(!root||root.id!==id||root.parent||root.isGenerated||root.readOnly||root.generators.size||!pm.stages.includes(root.stage)||!root.stage.objects.has(root)||![null,'construction'].includes(root.role))fail('UNSUPPORTED_TARGET','Choose a current independent native cubic curve.');
 let controls:EndPoint[],representation:string,derived:any[]=[];
 if(root instanceof BezierCurve&&root.TYPE==='BezierCurve'){
  controls=[root.a,root.cp1,root.cp2,root.b];const children=[...root.children] as Segment[];
  if(children.length!==2||children.some(c=>!(c instanceof Segment)||c.parent!==root)||!children.some(c=>c.a===root.a&&c.b===root.cp1)||!children.some(c=>c.a===root.b&&c.b===root.cp2))fail('INVALID_TARGET','Bezier construction graph differs from its actual factory.');representation='canonical-cubic-bezier';
 }else if(root instanceof BSpline&&root.TYPE==='BSpline'){
  if(root.degree!==3||root.type!=='Clamped'||root.method!==0||root.bSplineInterpolation.interpolation||!root.bSplineControlVertices.CVModel||root.closedBasePoints.length)fail('UNSUPPORTED_CURVE_MODE','Only cubic Clamped quasi-uniform CV spline control edits/evaluation are currently supported.');
  controls=[...root.cPoints];if(controls.length<4||controls.length>64)fail('LIMIT','Spline control membership exceeds its supported bound.');
  const actualKnots=new GeneralKnotsCalculator().calculate(controls.slice(1,-1),3,'Clamped',0);if(actualKnots.length!==root.kValues.length||actualKnots.some((k,i)=>k!==root.kValues[i]))fail('UNSUPPORTED_CURVE_MODE','Source knots are not the exact declared native quasi-uniform construction.');
  if(new Set(root.fPoints.map(p=>p.id)).size!==root.fPoints.length)fail('UNSUPPORTED_CURVE_ALIAS','Derived spline point layout aliases identities.');
  if(root.fPoints.length!==controls.length-2)fail('INVALID_TARGET','Native derived spline membership is inconsistent.');derived=root.fPoints.map(p=>({pointId:p.id,x:p.x,y:p.y,role:'derived-fit',editable:false}));representation='cubic-clamped-cv-quasi-uniform';
 }else fail('UNSUPPORTED_TARGET','Choose a native BezierCurve or supported BSpline.');
 if(new Set(controls).size!==controls.length||new Set(controls.map(p=>p.id)).size!==controls.length)fail('UNSUPPORTED_CURVE_ALIAS','This curve control layout has aliased native control ownership.');
 const ownership=captured?.ownership||capturedParameterOwnership(workspace),members=new Set<any>();root.traverse(object=>{if(members.size>256||members.has(object)||index[object.id]!==object||object.isGenerated||object.generators.size||object.stage!==root.stage)fail('INVALID_TARGET','Curve descendant custody is invalid.');members.add(object);});
 for(const p of controls)if(!(p instanceof EndPoint)||index[p.id]!==p||!members.has(p)||!ownership.geometry.has(p.params.x)||!ownership.geometry.has(p.params.y))fail('INVALID_TARGET','Control points require actual native EndPoint/Param ownership.');
 if(!captured)ownership.unchanged();return{root,index,controls,representation,derived,ownership};
}
export function inspectNativeCubicRows(workspace:any,source:any){
 const rows=source.objects.filter(o=>['BezierCurve','BSpline'].includes(o.type)),index=workspace.createIndex(),captured={index,ownership:capturedParameterOwnership(workspace)};const result=rows.map(row=>{
  let description:any;try{description=cubicCurveOwnership(workspace,row.id,captured);}catch(error){if(!['UNSUPPORTED_CURVE_MODE','UNSUPPORTED_CURVE_ALIAS','UNSUPPORTED_TARGET'].includes(error?.code))throw error;return{id:row.id,type:row.type,stage:row.stage,role:row.role,representation:'unsupported-source-mode',controls:[],derived:[],spline:null,canEdit:false,canEvaluate:false,reason:error?.code||'UNSUPPORTED_TARGET'};}
  const {root,controls,representation,derived}=description;if(index[row.id]!==root)fail('CURRENT_GEOMETRY_MISMATCH','Curve ownership changed during inspection.');
  return{id:row.id,type:row.type,stage:row.stage,role:row.role,representation,controls:controls.map(p=>({pointId:p.id,x:p.x,y:p.y})),derived,spline:root.TYPE==='BSpline'?{degree:root.degree,type:root.type,method:root.method,interpolation:false,CVModel:true,kValues:[...root.kValues]}:null,canEdit:true,canEvaluate:true,reason:null};
 });captured.ownership.unchanged();return result;
}
