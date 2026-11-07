import type {LinkedPartDrawingDefinition} from './linkedPartDrawingDefinition.mjs';
export const LINKED_DRAWING_REQUEST_MAX_BYTES:65536;
export const LINKED_DRAWING_JOURNAL_MAX_CHARGE:262144;
type Binding = Readonly<{revision:string;geometryRevision:string}>;
type RequestBase = Binding & Readonly<{version:1;unit:'millimeter'}>;
export type LinkedPartDrawingRequest = RequestBase & (
  Readonly<{op:'drawing.create';definition:LinkedPartDrawingDefinition}> |
  Readonly<{op:'drawing.replace';drawingId:string;definition:LinkedPartDrawingDefinition}> |
  Readonly<{op:'drawing.remove';drawingId:string}>);
/** Proposed entry for the EXISTING shared authored journal, not a journal owner. */
export type LinkedPartDrawingOperationRecord = Readonly<{
  kind:'document-metadata';version:1;domain:'linked-part-drawing';key:string;
  before:LinkedPartDrawingDefinition|null;after:LinkedPartDrawingDefinition|null;byteSize:number;
}>;
export type LinkedPartDrawingPreparation = Readonly<{
  changed:boolean;binding:Binding;before:LinkedPartDrawingDefinition|null;after:LinkedPartDrawingDefinition|null;
  journalRecord:LinkedPartDrawingOperationRecord|null;
}>;
export function captureLinkedPartDrawingRequest(value:unknown):LinkedPartDrawingRequest;
export function captureLinkedPartDrawingOperationRecord(value:unknown):LinkedPartDrawingOperationRecord;
/** Synchronous proposal only. The actual document owner must recheck lifetime/currentness. */
export function prepareLinkedPartDrawingOperation(value:{request:unknown;current:unknown}):LinkedPartDrawingPreparation;
