// Test transport, not a production mount, kernel, or document publisher.
import {prepareRectangleExtrusion} from '../../modules/workbenches/modeler/features/extrude/rectangleProfileRequest.mjs';

self.onmessage = async ({data}) => {
  try {
    const result = await prepareRectangleExtrusion(data);
    self.postMessage({ok:true, result, environment:{
      window:typeof window, document:typeof document,
      worker:typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
    }});
  } catch (error) {
    self.postMessage({ok:false, code:error.code || 'INVALID_REQUEST'});
  }
};
