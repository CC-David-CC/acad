// One request per disposable Worker: module-global IDs never overlap the UI or
// another job. verb's UMD bundle exports directly to self, without a window shim.
(self as any).importScripts(new URL('../lib/verb.js', self.location.href).href);
const {solveSketch} = require('./solve');
const {makeRectangleDraft, RectangleInputError} = require('./rectangleDraft');
const {evaluatePhysicalSource} = require('cad/parameters/evaluatePhysicalSource.mjs');
const {decodePhysicalSource} = require('cad/parameters/physicalSource.mjs');
const {prepareTypedRectangle} = require('cad/parameters/typedRectangleBindings.mjs');
const {prepareTypedDependentSketch} = require('./typedDependentSketch.mjs');
const {assertVerifiedReplayGeometry} = require('./verifiedReplayGeometry');
let used = false;
self.onmessage = async event => {
  if (used) return;
  used = true;
  const request = event.data;
  const revision = typeof request?.revision === 'string' ? request.revision : '';
  try {
    if (request && Object.prototype.hasOwnProperty.call(request, 'task')) {
      if(request.task==='sketch-transition-constraint-group'||request.task==='sketch-transition-verify-constraint-group'){const {changeConstraintGroup,verifyConstraintGroup}=require('./constraintGroupTransition');const {task,...payload}=request;self.postMessage(task==='sketch-transition-constraint-group'?changeConstraintGroup(payload):verifyConstraintGroup(payload));return;}

      if(request.task==='sketch-source-plane-depth'||request.task==='sketch-source-plane-depth-verify') {
        const {reframeSourcePlaneDepth}=require('./sourcePlaneDepthTransition');const {task,...payload}=request;self.postMessage(reframeSourcePlaneDepth(payload));return;
      }
      if(request.task==='sketch-transition-empty') {
        try {
          if(Reflect.ownKeys(request).sort().join(',')!=='frame,revision,task,unit'||!revision||revision.length>256)throw Error('Invalid empty sketch request.');
          const {makeEmptySketch}=require('./emptySketch');
          const serializedSketch=JSON.stringify(makeEmptySketch(request.unit,request.frame));
          if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)throw Error('Empty sketch exceeds its limit.');
          self.postMessage({revision,ok:true,serializedSketch});
        } catch (_) {self.postMessage({revision,ok:false,error:{code:'INVALID',message:'Empty sketch could not be prepared.'}});}
        return;
      }
      if(request.task==='sketch-transition-inspection') {
        const {inspectClosedSketchTransition}=require('./closedSketchInspection');
        const {task,...payload}=request;self.postMessage(inspectClosedSketchTransition(payload));return;
      }
      if(['sketch-transition-driving-dimension','sketch-transition-verify-driving-dimension','sketch-transition-verify-dimension-travel'].includes(request.task)){
        const {changeDrivingDimension,verifyDrivingDimension}=require('./drivingDimensionTransition');
        const {task,...payload}=request;self.postMessage(task==='sketch-transition-driving-dimension'?changeDrivingDimension(payload):verifyDrivingDimension(payload,task==='sketch-transition-verify-dimension-travel'));return;
      }
      if (request.task === 'sketch-transition-projection') {
        const {prepareAcceptedSketchProjection}=require('./acceptedSketchProjectionWorker');
        const {task,...payload}=request,result=prepareAcceptedSketchProjection(payload);
        if(result.ok){
          const {projectRenderSketch}=require('./renderSketchProjection.mjs');
          const {source,...render}=projectRenderSketch(JSON.parse(result.serializedSketch));
          self.postMessage({...result,render});
        } else self.postMessage(result);
        return;
      }
      if (request.task === 'sketch-transition-concentric') {
        const {addConcentricTransition}=require('./concentricTransition');
        const {task,...payload}=request;self.postMessage(addConcentricTransition(payload));return;
      }
      if (request.task === 'sketch-export-dxf') {
        const {exportSketchDXF}=require('./dxfExport');
        const {task,...payload}=request;self.postMessage(exportSketchDXF(payload));return;
      }
      if (request.task === 'sketch-transition-point-coordinates') {
        const {editPointsCoordinatesTransition}=require('./coordinateTransition');
        const {task,...payload}=request;self.postMessage(editPointsCoordinatesTransition(payload));return;
      }
      if (request.task === 'sketch-transition-verify-point-coordinates') {
        const {verifyPointsCoordinatesCandidate}=require('./verifyCoordinateCandidate');
        const {task,...payload}=request;self.postMessage(verifyPointsCoordinatesCandidate(payload));return;
      }
      if (request.task === 'sketch-transition-point-coordinate') {
        const {editPointCoordinatesTransition}=require('./coordinateTransition');
        const {task,...payload}=request;self.postMessage(editPointCoordinatesTransition(payload));return;
      }
      if (request.task === 'sketch-transition-verify-signed-distance') {
        const {verifySignedDistanceCandidate}=require('./verifySignedDistanceCandidate');
        const {task,...payload}=request;self.postMessage(verifySignedDistanceCandidate(payload));return;
      }
      if(request.task==='sketch-transition-point-distance'||request.task==='sketch-transition-verify-point-distance'){
        const {addPointDistanceTransition,verifyPointDistanceCandidate}=require('./pointDistanceTransition');
        const {task,...payload}=request;self.postMessage(task==='sketch-transition-point-distance'?addPointDistanceTransition(payload):verifyPointDistanceCandidate(payload));return;
      }
      if (request.task === 'sketch-transition-verify-line-relation') {
        const {verifyTransitionCandidate}=require('./verifyTransitionCandidate');
        const {task,...payload}=request;self.postMessage(verifyTransitionCandidate('line-relation',payload));return;
      }
      if (request.task === 'sketch-transition-line-relation') {
        const {addLineRelationTransition}=require('./lineRelationTransition');
        const {task,...payload}=request;self.postMessage(addLineRelationTransition(payload));return;
      }
      if (request.task === 'sketch-transition-signed-distance') {
        const {addSignedDistanceTransition}=require('./signedDistanceTransition');
        const {task,...payload}=request;self.postMessage(addSignedDistanceTransition(payload));return;
      }
      if (request.task === 'sketch-transition-diameter') {
        const {addDiameterTransition}=require('./diameterTransition');
        const {task,...payload}=request;self.postMessage(addDiameterTransition(payload));return;
      }
      if(request.task==='sketch-transition-remove-primitive'||request.task==='sketch-transition-verify-remove-primitive'){
        const {removeSketchPrimitive,verifyPrimitiveRemovalCandidate}=require('./primitiveRemovalTransition');
        const {task,...payload}=request;self.postMessage(task==='sketch-transition-remove-primitive'?removeSketchPrimitive(payload):verifyPrimitiveRemovalCandidate(payload));return;
      }
      if (request.task === 'sketch-transition-primitive'||request.task === 'sketch-transition-verify-primitive') {
        const {appendSketchPrimitive,verifyPrimitiveAppendCandidate}=require('./primitiveTransition');
        const {task,...payload}=request;self.postMessage(task==='sketch-transition-primitive'?appendSketchPrimitive(payload):verifyPrimitiveAppendCandidate(payload));return;
      }
      if(request.task==='legacy-expression-transaction'){const {legacyExpressionTransaction}=require('./legacyExpressionTransaction');const {task,...payload}=request;self.postMessage(legacyExpressionTransaction(payload));return;}
      if (request.task === 'sketch-transition-replay' || request.task === 'sketch-transition-length-relation') {
        const {replaySketchTransition,addLengthRelationTransition}=require('./sketchTransition');
        const {task,...payload}=request;
        self.postMessage(task==='sketch-transition-replay'?replaySketchTransition(payload):addLengthRelationTransition(payload));return;
      }
      if (request.task === 'sketch-save-validation') {
        try {
          const fields=['externalParameters','frame','parameterSource','revision','sketchJSON','task'];
          if(Reflect.ownKeys(request).sort().join(',')!==fields.join(',')||typeof request.sketchJSON!=='string'||request.sketchJSON.length>1048576||new TextEncoder().encode(request.sketchJSON).byteLength>1048576||!revision||revision.length>256)throw Error('Invalid sketch save request.');
          const sketch=JSON.parse(request.sketchJSON),frame=sketch?.metadata?.boundaryFrame,expected=request.frame;
          const validFrame=f=>f&&typeof f==='object'&&Object.keys(f).sort().join(',')==='origin,x,y,z'&&['origin','x','y','z'].every(k=>Array.isArray(f[k])&&f[k].length===3&&f[k].every(Number.isFinite));
          if(!validFrame(frame)||!validFrame(expected)||!['origin','x','y','z'].every(k=>frame[k].every((n,i)=>Math.abs(n-expected[k][i])<=1e-9)))throw Error('Sketch frame changed.');
          let external=request.externalParameters;
          if(request.parameterSource!==null){if(typeof request.parameterSource!=='string'||request.parameterSource.length>65536||!external||Object.keys(external).length)throw Error('Invalid typed parameter source.');const definitions=decodePhysicalSource(request.parameterSource);if(!definitions)throw Error('Typed parameters are required.');const result=evaluatePhysicalSource(definitions),values=new Map(result.values.map(row=>[row.name,row]));external=prepareTypedDependentSketch(sketch,name=>{const row:any=values.get(name);if(!row||row.dimension!=='length')throw Error('A typed length parameter is required.');return row.value;});}
          const solved=solveSketch({revision,sketch,boundary:structuredClone(sketch.boundary),externalParameters:external});if(!solved.ok){self.postMessage(solved);return;}assertVerifiedReplayGeometry(sketch,solved.sketch,solved.evidence,external);self.postMessage({revision,ok:true,validated:true});return;
        }catch(_){self.postMessage({revision,ok:false,error:{code:'SKETCH_SAVE_INVALID',message:'The sketch could not be validated for saving.'}});return;}
      }
      if (request.task === 'typed-sketch-transaction') {
        try {
          const fields=['frame','parameterSource','revision','sketchJSON','task','verifyCurrent'];
          if(Reflect.ownKeys(request).sort().join(',')!==fields.join(',')||typeof request.sketchJSON!=='string'||request.sketchJSON.length>1048576||new TextEncoder().encode(request.sketchJSON).byteLength>1048576||typeof request.parameterSource!=='string'||request.parameterSource.length>65536||typeof request.verifyCurrent!=='boolean'||!revision||revision.length>256)throw Error('Invalid sketch transaction.');
          const sketch=JSON.parse(request.sketchJSON),frame=sketch?.metadata?.boundaryFrame,expected=request.frame;
          const validFrame=f=>f&&typeof f==='object'&&Object.keys(f).sort().join(',')==='origin,x,y,z'&&['origin','x','y','z'].every(k=>Array.isArray(f[k])&&f[k].length===3&&f[k].every(Number.isFinite));
          if(!validFrame(frame)||!validFrame(expected)||!['origin','x','y','z'].every(k=>frame[k].every((n,i)=>Math.abs(n-expected[k][i])<=1e-9)))throw Error('Sketch frame changed.');
          const boundary={lines:[],arcs:[],circles:[],nurbses:[]};if(!sketch.boundary||Object.keys(boundary).some(k=>!Array.isArray(sketch.boundary[k])||sketch.boundary[k].length))throw Error('Referenced sketch boundary is unsupported.');
          const definitions=request.parameterSource===''?{version:1,definitions:[]}:decodePhysicalSource(request.parameterSource);if(!definitions)throw Error('Typed parameters are required.');const result=evaluatePhysicalSource(definitions),values=new Map(result.values.map(row=>[row.name,row]));
          const external=prepareTypedDependentSketch(sketch,name=>{const row:any=values.get(name);if(!row||row.dimension!=='length')throw Error('A typed length parameter is required.');return row.value;});
          const solved=solveSketch({revision,sketch,boundary,externalParameters:external});if(!solved.ok){self.postMessage(solved);return;}if(request.verifyCurrent)assertVerifiedReplayGeometry(sketch,solved.sketch,solved.evidence,external);
          const serializedSketch=JSON.stringify(solved.sketch);if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)throw Error('Solved sketch exceeds limit.');self.postMessage({revision,ok:true,serializedSketch});return;
        }catch(_){self.postMessage({revision,ok:false,error:{code:'TYPED_SKETCH_INVALID',message:'The sketch could not be regenerated with these parameters.'}});return;}
      }
      if (request.task === 'typed-rectangle-bind') {
        const fields=['bindings','revision','sketchJSON','source','task'];
        if(typeof request!=='object'||Array.isArray(request)||Reflect.ownKeys(request).sort().join(',')!==fields.join(',')||typeof request.sketchJSON!=='string'||request.sketchJSON.length>65536||typeof request.source!=='string'||request.source.length>65536||!revision||revision.length>256)throw Error('Invalid typed rectangle request.');
        const definitions=decodePhysicalSource(request.source);if(!definitions)throw Error('Typed parameters are required.');
        const result=evaluatePhysicalSource(definitions),values=new Map(result.values.map(row=>[row.name,row]));
        const prepared=prepareTypedRectangle(request.sketchJSON,request.bindings,name=>{const row:any=values.get(name);if(!row||row.dimension!=='length')throw Error('A typed length parameter is required.');return row.value;});
        const sketch=JSON.parse(prepared.sketchJSON),solved=solveSketch({revision,sketch,boundary:JSON.parse(JSON.stringify(sketch.boundary)),externalParameters:prepared.externalParameters});
        if(!solved.ok){self.postMessage(solved);return;}
        const serializedSketch=JSON.stringify(solved.sketch);if(serializedSketch.length>65536)throw Error('Solved sketch exceeds the limit.');
        self.postMessage({...solved,serializedSketch,bindings:prepared.bindings});return;
      }
      if (request.task === 'typed-dependent-solve' || request.task === 'typed-dependent-diagnostics') {
        try {
        const fields=['boundary','parameterSource','revision','sketchJSON','task'];
        if(typeof request!=='object'||Array.isArray(request)||Reflect.ownKeys(request).sort().join(',')!==fields.join(',')||typeof request.sketchJSON!=='string'||request.sketchJSON.length>1024*1024||typeof request.parameterSource!=='string'||request.parameterSource.length>65536||!revision||revision.length>256)throw Error('Invalid typed dependent sketch request.');
        const definitions=decodePhysicalSource(request.parameterSource);if(!definitions)throw Error('Typed parameters are required.');
        const result=evaluatePhysicalSource(definitions),values=new Map(result.values.map(row=>[row.name,row]));
        let sketch;try{sketch=JSON.parse(request.sketchJSON)}catch{throw Error('Invalid sketch JSON.')}
        const external=prepareTypedDependentSketch(sketch,name=>{const row:any=values.get(name);if(!row||row.dimension!=='length')throw Error('A typed length parameter is required.');return row.value;});
        const solved=solveSketch({revision,sketch,boundary:request.boundary,externalParameters:external,...(request.task==='typed-dependent-diagnostics'?{localJacobian:{version:1,...(sketch.stages.length>1?{scope:'per-stage'}:{})}}:{})});
        if(solved.ok&&request.task==='typed-dependent-diagnostics')assertVerifiedReplayGeometry({...sketch,boundary:request.boundary},solved.sketch,solved.evidence,external);
        self.postMessage(solved);return;
        } catch (_) {self.postMessage({revision,ok:false,error:{code:'TYPED_SKETCH_INVALID',message:'Typed sketch fields or parameters are invalid or unsupported.'}});return;}
      }
      if(request.task==='typed-selected-profile-solve') {
        const fields=['boundary','parameterSource','revision','sketchJSON','task'];
        if(Reflect.ownKeys(request).sort().join(',')!==fields.join(',')||typeof request.sketchJSON!=='string'||request.sketchJSON.length>65536||typeof request.parameterSource!=='string'||request.parameterSource.length>65536||!revision||revision.length>256)throw Error('Invalid typed selected-profile source request.');
        const definitions=decodePhysicalSource(request.parameterSource);if(!definitions)throw Error('A typed parameter source is required.');
        const evaluated=evaluatePhysicalSource(definitions),values=new Map(evaluated.values.map(row=>[row.name,row]));
        const prepared=prepareTypedRectangle(request.sketchJSON,[],name=>{const q:any=values.get(name);if(!q||q.dimension!=='length')throw Error('A typed rectangle length is required.');return q.value;});
        const solved=solveSketch({revision,sketch:JSON.parse(prepared.sketchJSON),boundary:request.boundary,externalParameters:prepared.externalParameters});
        if(!solved.ok){self.postMessage(solved);return;}
        const serializedSketch=JSON.stringify(solved.sketch);if(serializedSketch.length>65536)throw Error('Typed selected source exceeds64KiB.');
        const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serializedSketch)),sketchDigest=Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
        self.postMessage({...solved,serializedSketch,sketchDigest});return;
      }
      if (request.task === 'rectangle-extrusion-solve') {
        const fields = ['boundary','externalParameters','revision','sketchJSON','task'];
        if (typeof request !== 'object' || Array.isArray(request) || Object.keys(request).sort().join(',') !== fields.join(',') || typeof request.sketchJSON !== 'string' || request.sketchJSON.length > 65536 || typeof revision !== 'string' || !revision || revision.length > 256) throw Error('Invalid extrusion solve request.');
        let sketch; try { sketch = JSON.parse(request.sketchJSON); } catch (_) { throw Error('Invalid sketch JSON.'); }
        const solved = solveSketch({revision, sketch, boundary:request.boundary, externalParameters:request.externalParameters});
        if (!solved.ok) { self.postMessage(solved); return; }
        const serializedSketch = JSON.stringify(solved.sketch);
        if (serializedSketch.length > 65536) throw Error('Solved sketch exceeds the prism limit.');
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serializedSketch));
        const sketchDigest = Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2,'0')).join('');
        self.postMessage({...solved, serializedSketch, sketchDigest});
        return;
      }
      if (request.task !== 'rectangle') {
        self.postMessage({revision,ok:false,error:{code:'UNSUPPORTED',message:'Unknown sketch worker task.'}});
        return;
      }
      const fields = ['frame','height','origin','revision','task','unit','width'];
      if (typeof request !== 'object' || Array.isArray(request) ||
          Object.keys(request).sort().join(',') !== fields.join(',') ||
          typeof request.revision !== 'string' || !request.revision || request.revision.length > 256) {
        self.postMessage({revision,ok:false,error:{code:'INVALID',message:'Invalid rectangle request.'}});
        return;
      }
      try {
        const {sketch,evidence} = makeRectangleDraft(request.unit,request.frame,request.origin,request.width,request.height);
        self.postMessage({revision,ok:true,sketch,evidence,serializedSketch:JSON.stringify(sketch)});
      } catch (error) {
        if (error instanceof RectangleInputError) self.postMessage({revision,ok:false,error:{code:error.code,message:error.message}});
        else self.postMessage({revision,ok:false,error:{code:'INVALID',message:'Rectangle request could not be prepared.'}});
      }
      return;
    }
    const solved=solveSketch(request);
    if(solved.ok&&request.localJacobian!==undefined)assertVerifiedReplayGeometry({...request.sketch,boundary:request.boundary},solved.sketch,solved.evidence,request.externalParameters);
    self.postMessage(solved);
  } catch (_) {
    self.postMessage({revision,ok:false,error:{code:'WORKER_ERROR',message:'Sketch worker failed.'}});
  }
};
