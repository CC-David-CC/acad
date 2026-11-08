export interface AttachmentFrame {readonly origin:readonly number[];readonly x:readonly number[];readonly y:readonly number[];readonly z:readonly number[];}
export interface PlanarAttachmentObservation {readonly version:1;readonly unit:'millimeter';readonly scope:'response-local';readonly quality:'native-owned-planar-attachment';readonly framePolicy:'extrusion-cap-source-datum-v1';readonly role:'last-cap';readonly frame:AttachmentFrame;readonly plane:Readonly<{origin:readonly number[];normal:readonly number[];orientation:'FORWARD'|'REVERSED'}>;}
export const PLANAR_ATTACHMENT_POLICY:'extrusion-cap-source-datum-v1';
export const PLANAR_ATTACHMENT_REFUSALS:readonly string[];
export const PLANAR_ATTACHMENT_REASONS:readonly string[];
export function attachmentFields(value:any,keys:readonly string[]):any;
export function attachmentId(value:any):boolean;
export function capturePlanarAttachmentRequest(value:any):import('../solid/SolidKernel').ReadPlanarAttachment;
export function capturePlanarAttachmentObservation(value:any):PlanarAttachmentObservation;
