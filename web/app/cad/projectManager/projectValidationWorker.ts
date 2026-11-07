// Worker-only environment: the existing geometry library exposes its API as
// `verb` and expects a window alias. No host-window globals are changed.
(self as any).window = self;
(self as any).importScripts(new URL('../lib/verb.js', self.location.href).href);
const {preflight} = require('./projectValidationCore');
const MAX_BYTES = 128 * 1024 * 1024;
self.onmessage = async event => {
  try {
    const blob=event.data && event.data.blob;
    if (!(blob instanceof Blob) || blob.size > MAX_BYTES) throw new Error('Project exceeds 128 MiB or is not a file');
    self.postMessage({progress:'started'});
    const parameterState: {source?: string, result?: any}={};
    const value=preflight(JSON.parse(await blob.text()),parameterState);
    // Prepare the storage representation here so the UI does not stringify
    // large model/sketch payloads after validation.
    const storage={model:JSON.stringify(value.project.model),sketches:value.project.sketches.map(sketch=>({id:sketch.id,data:JSON.stringify(sketch.data)}))};
    self.postMessage({ok:true,value,storage,parameterState:parameterState.source===undefined?null:parameterState});
  } catch (error) {
    const code=error?.code;
    self.postMessage({ok:false,error: error instanceof Error ? error.message : 'Project validation failed',
      ...(['INVALID_FEATURE_ID','DUPLICATE_FEATURE_ID'].includes(code)?{code}:{})});
  }
};
