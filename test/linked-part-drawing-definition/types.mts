import {captureLinkedPartDrawingDefinition,type LinkedPartDrawingDefinition,type LinkedPartDrawingDimension} from '../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {prepareLinkedPartDrawingOperation,type LinkedPartDrawingOperationRecord,type LinkedPartDrawingPreparation} from '../../modules/drawing/linkedPartDrawingOperation.mjs';
const drawing:LinkedPartDrawingDefinition=captureLinkedPartDrawingDefinition(null as unknown);
const preparation:LinkedPartDrawingPreparation=prepareLinkedPartDrawingOperation({request:null,current:null});
const record:LinkedPartDrawingOperationRecord|null=preparation.journalRecord;
const dimension:LinkedPartDrawingDimension=drawing.dimensions[0];
if(dimension.kind==='source-distance'){
  const axis:'datum-x'|'datum-y'=dimension.axis;
  // @ts-expect-error datum components are not view u/v.
  const viewAxis:'u'|'v'=axis;
}
// @ts-expect-error all nested captured arrays are readonly.
drawing.views.push(drawing.views[0]);
// @ts-expect-error captured dimensions are immutable.
dimension.viewId='replacement';
// @ts-expect-error drawing records do not contain native handles.
drawing.nativeHandle;
if(record){const domain:'linked-part-drawing'=record.domain;const kind:'document-metadata'=record.kind;void domain;void kind;}
