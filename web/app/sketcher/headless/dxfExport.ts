import {HeadlessSketchWorkspace} from './workspace';
import {makeEmptySketch} from './emptySketch';
import {replaySketchTransition} from './sketchTransition';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {DxfWriterAdapter} from '../dxf';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {Ellipse} from '../shapes/ellipse';
import {decodePhysicalSource} from 'cad/parameters/physicalSource.mjs';
import {evaluatePhysicalSource} from 'cad/parameters/evaluatePhysicalSource.mjs';
import {prepareTypedDependentSketch} from './typedDependentSketch.mjs';
import {boundaryGeometryClose} from 'cad/sketch/boundaryValidity';

const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
const encoder=new TextEncoder();
function record(value:any,keys:string[]) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw fail('INVALID','Invalid export request.');
  const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Invalid export request.');out[key]=d.value;}return out;
}
function captureFrame(value:any) {
  const input=record(value,['origin','x','y','z']),out:any={};
  for(const key of ['origin','x','y','z']){const a=input[key];if(!Array.isArray(a)||a.length!==3||Reflect.ownKeys(a).length!==4)throw fail('INVALID','Invalid sketch frame.');out[key]=[0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value))throw fail('INVALID','Invalid sketch frame.');return d.value;});}
  const dot=(a:number[],b:number[])=>a.reduce((sum,n,i)=>sum+n*b[i],0),cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],tol=1e-9;
  if(['x','y','z'].some(k=>Math.abs(dot(out[k],out[k])-1)>tol)||Math.abs(dot(out.x,out.y))>tol||Math.abs(dot(out.x,out.z))>tol||Math.abs(dot(out.y,out.z))>tol||cross(out.x,out.y).some((n,i)=>Math.abs(n-out.z[i])>tol))throw fail('INVALID','The sketch frame must be orthonormal and right-handed.');
  return out;
}
function externalMap(value:any) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))throw fail('INVALID','Invalid external parameters.');
  const keys=Reflect.ownKeys(value),out=Object.create(null);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');
  for(const k of keys){if(typeof k!=='string'||!k||k.length>256)throw fail('INVALID','Invalid parameter name.');const d=Object.getOwnPropertyDescriptor(value,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid parameter value.');out[k]=d.value;}return out;
}
// Runs only in a disposable Worker. The caller owns currentness and download.
export function exportSketchDXF(request:any) {
  let revision='';
  try {
    const d=Object.getOwnPropertyDescriptor(request||{},'revision');if(d&&'value'in d&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
    const input=record(request,['revision','unit','sketchJSON','frame','currentBoundary','externalParameters','parameterSource']);
    if(typeof input.revision!=='string'||!input.revision||input.revision.length>256||input.unit!=='millimeter'||input.sketchJSON!==null&&(typeof input.sketchJSON!=='string'||input.sketchJSON.length>1048576||encoder.encode(input.sketchJSON).byteLength>1048576))throw fail('INVALID','Invalid export request.');
    revision=input.revision;const frame=captureFrame(input.frame),sketch=input.sketchJSON===null?makeEmptySketch('millimeter',frame):JSON.parse(input.sketchJSON);if(input.sketchJSON===null)sketch.boundary=input.currentBoundary;const sketchJSON=input.sketchJSON===null?JSON.stringify(sketch):input.sketchJSON,saved=captureFrame(sketch?.metadata?.boundaryFrame);
    if(['origin','x','y','z'].some(k=>frame[k].some((n,i)=>!Object.is(n,saved[k][i]))))throw fail('FRAME_MISMATCH','The saved sketch frame has changed.');
    if(!sketch.boundary||!['lines','arcs','circles','nurbses'].every(k=>Array.isArray(sketch.boundary[k])))throw fail('INVALID','A complete sketch boundary is required.');
    if(!boundaryGeometryClose(sketch.boundary,input.currentBoundary))throw fail('BOUNDARY_MISMATCH','The saved sketch boundary differs from the current face.');
    if(sketch.boundary.nurbses.length)throw fail('UNSUPPORTED','NURBS face boundaries are not supported by DXF export.');
    if((sketch.labels?.length||0)||(sketch.dimensions?.length||0))throw fail('UNSUPPORTED','DXF export of sketch annotations is not yet supported.');
    let external=externalMap(input.externalParameters);
    if(input.parameterSource!==null){if(typeof input.parameterSource!=='string'||input.parameterSource.length>65536||Object.keys(external).length)throw fail('INVALID','Invalid typed parameter source.');const definitions=decodePhysicalSource(input.parameterSource);if(!definitions)throw fail('INVALID','Typed parameters are required.');const values=new Map(evaluatePhysicalSource(definitions).values.map((row:any)=>[row.name,row]));external=prepareTypedDependentSketch(sketch,(name:string)=>{const row:any=values.get(name);if(!row||row.dimension!=='length')throw fail('UNSUPPORTED','A typed length parameter is required.');return row.value;});}
    const verified=replaySketchTransition({revision,sketchJSON,externalParameters:external});if(!verified.ok||!('serializedSketch'in verified))return verified;
    const native=JSON.parse(verified.serializedSketch);
    const workspace=new HeadlessSketchWorkspace(external);workspace.io._loadSketch(native,{strict:true});
    const restored=JSON.parse(workspace.io.serializeSketch(native.metadata,{strict:true}));restored.boundary=native.boundary;
    if(!sameRestoredSketch(verified.serializedSketch,JSON.stringify(restored)))throw fail('CURRENT_GEOMETRY_MISMATCH','Export reconstruction changed the saved sketch.');
    const layer=workspace.findLayerByName('sketch');if(!layer)throw fail('INVALID','Sketch layer is unavailable.');
    const authored=[];for(const object of layer.objects){
      if(object.id==='ground/ORIGIN'){if(!(object instanceof EndPoint)||object.x!==0||object.y!==0)throw fail('INVALID','Invalid reserved ground origin.');continue;}
      authored.push(object);
      if(object instanceof EndPoint||object instanceof Segment||object instanceof Circle)continue;
      if(object instanceof Arc)continue;
      if(object instanceof Ellipse&&object.constructor===Ellipse)continue;
      throw fail('UNSUPPORTED','This sketch contains a geometry type not supported by DXF export.');
    }
    const writer=new DxfWriterAdapter();writer.export([{name:layer.name,objects:authored} as any]);const dxf=writer.stringify();
    if(typeof dxf!=='string'||dxf.length>8*1024*1024||encoder.encode(dxf).byteLength>8*1024*1024)throw fail('LIMIT','DXF output exceeds the export limit.');
    if(!/\$INSUNITS\s*\r?\n\s*70\s*\r?\n\s*4\s*(?:\r?\n|$)/.test(dxf))throw fail('INVALID_DXF','The DXF writer did not emit millimeter units.');
    return {revision,ok:true as const,blob:new Blob([dxf],{type:'application/dxf'}),unit:'millimeter',coordinates:'sketch-local',frame};
  }catch(error){return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'DXF export failed.'}};}
}
