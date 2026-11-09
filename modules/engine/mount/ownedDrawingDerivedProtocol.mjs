// Small, private owned observation routing only; no public Native handle API.
import {drawingFields,captureDrawingReadRequest} from './ownedDrawingReadProtocol.mjs';
import {captureOrthographicFrame} from './ownedOrthographicReadProtocol.mjs';
export const DRAWING_DERIVED_REFUSALS=Object.freeze(['DRAWING_SECTION_UNQUALIFIED','DRAWING_DETAIL_UNQUALIFIED','RESOURCE_LIMIT','ENGINE_CAPABILITY_UNAVAILABLE']);
export function captureDrawingDerivedRequest(value){
 const r=drawingFields(value,['op','version','unit','handle','sourceHandle','producerFeatureId','definition','viewId','frame','parentFrame']);
 if(r.op!=='solid.drawing.derived.read'||typeof r.viewId!=='string')throw Object.assign(Error('Invalid derived drawing request'),{code:'INVALID_REQUEST'});
 const b=captureDrawingReadRequest({op:'solid.drawing.references.read',version:r.version,unit:r.unit,handle:r.handle,sourceHandle:r.sourceHandle,producerFeatureId:r.producerFeatureId,definition:r.definition}),view=b.definition.views.find(v=>v.viewId===r.viewId);
 if(![3,4].includes(b.definition.version)||!view||!['bore-center-section','detail'].includes(view.basis)||view.basis==='detail'&&r.parentFrame===null||view.basis==='bore-center-section'&&r.parentFrame!==null)throw Object.assign(Error('Invalid derived drawing role'),{code:'INVALID_REQUEST'});
 return Object.freeze({...b,op:r.op,viewId:r.viewId,frame:captureOrthographicFrame(r.frame),parentFrame:r.parentFrame===null?null:captureOrthographicFrame(r.parentFrame)});
}
