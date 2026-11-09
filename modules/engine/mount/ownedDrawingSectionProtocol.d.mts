export const DRAWING_SECTION_LIMITS:Readonly<{patches:16;uses:512;valueBytes:49152;tagBytes:2048;packedBytes:51200;transferBuffers:2}>;
export function captureDrawingSectionTransfer(value:unknown,frame:readonly number[]):any;
export function captureDrawingSectionPacket(value:unknown,frame:readonly number[]):any;
export function unpackDrawingSection(value:unknown,frame:readonly number[]):any;
