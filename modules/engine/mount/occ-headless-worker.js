// Research negative control: execute the unmodified interpreter in a dedicated
// worker; do not define window, document, canvas, or other UI shims.
self.onmessage = () => {
  self.Module = {locateFile: () => '/lib-assets/jsketcher-occ-engine/occt.wasm',
    onRuntimeInitialized: () => self.postMessage({initialized:true, windowType:typeof window})};
  try {
    importScripts('/lib-assets/jsketcher-occ-engine/occt.js');
    self.postMessage({importReturned:true, windowType:typeof window});
  } catch (error) {
    self.postMessage({initialized:false, windowType:typeof window, error:String(error)});
  }
};
