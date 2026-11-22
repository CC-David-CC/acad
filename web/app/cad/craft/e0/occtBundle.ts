import {GenericWASMEngine_V1} from "engine/impl/wasm/GenericWASMEngine_V1";
import {CraftEngine} from "./craftEngine";
import {createOCCService, OCCService} from "cad/craft/e0/occService";

export interface OCCBundleContext {

  craftEngine: CraftEngine; // to be removed

  occService: OCCService;
}

export function activate(ctx) {

  // This build creates its source-verified OpenCascade instance inside the modeling Worker.
  if (typeof __ACAD_SOURCE_OCCT__ === 'undefined' || !__ACAD_SOURCE_OCCT__) loadWasm(ctx);

  const wasmEngine = new GenericWASMEngine_V1();

  ctx.services.craftEngine = new CraftEngine(wasmEngine, ctx);
  ctx.craftEngine = ctx.services.craftEngine;

  // ctx.modellingEngine = OCCModellingEngine(OCI.EngineCommand);
  ctx.occService = createOCCService(ctx);
}

function instantiateEngine(importObject, callback) {
  const url = './lib-assets/jsketcher-occ-engine/occt.wasm';

  return WebAssembly.instantiateStreaming(fetch(url).then(response => {
    if (!response.ok) throw new Error(`Geometry engine request failed (${response.status}).`);
    return response;
  }), importObject).then(results => {
    callback(results.instance);
  });
}

function loadWasm(ctx) {
  ctx.services.lifecycle.startAsyncInitializingJob('e0:loader');
  const failed = error => {
    console.error('Geometry engine initialization failed:', error);
    ctx.services.lifecycle.failAsyncInitializingJob('e0:loader', error);
  };

  // @ts-ignore
  window.Module = {
    // locateFile: function(file) {
    //   return SERVER_PATH + file;
    // },
    onRuntimeInitialized: function() {
      try {
        Module._InitCommands();
        ctx.services.lifecycle.finishAsyncInitializingJob('e0:loader');
      } catch (error) { failed(error); }
    },
    onAbort: failed,
    instantiateWasm: function (importObject, fncReceiveInstance) {
      instantiateEngine(importObject, fncReceiveInstance).catch(failed);
      return {};
    }
  } as any;

  const mainScript = document.createElement('script');
  mainScript.onerror = () => failed(new Error('Geometry engine script could not load.'));
  mainScript.setAttribute('src', './lib-assets/jsketcher-occ-engine/occt.js');
  mainScript.setAttribute('async', 'async');
  document.head.appendChild(mainScript);
}

export const BundleName = "@OCCT";






