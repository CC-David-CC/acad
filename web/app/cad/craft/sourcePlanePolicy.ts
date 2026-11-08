import plane from 'workbenches/modeler/features/plane/simplePlaneOperation';
import custom from 'workbenches/modeler/features/sourceFrame/sourceFrame.operation';
import {captureSourceFrameParameters,SOURCE_FRAME_TYPE} from 'engine/source/sourceFrameIntent.mjs';
import {captureSourcePlaneParameters} from 'sketcher/headless/sourcePlaneDepthEnvelope.mjs';
const PLANE_RUN=plane.run,CUSTOM_RUN=custom.run,CUSTOM_ADMIT=custom.admitGeometry;
export const isSourcePlaneType=(type:string)=>type==='PLANE'||type===SOURCE_FRAME_TYPE;
export function isRegisteredSourcePlane(type:string,operation:any){return type==='PLANE'?operation?.run===PLANE_RUN&&!operation.admitGeometry:type===SOURCE_FRAME_TYPE&&operation?.run===CUSTOM_RUN&&operation.admitGeometry===CUSTOM_ADMIT;}
export function captureSourcePlaneDefinition(entry:any){return entry.type==='PLANE'?captureSourcePlaneParameters(entry.params):entry.type===SOURCE_FRAME_TYPE?captureSourceFrameParameters(entry.params):null;}
