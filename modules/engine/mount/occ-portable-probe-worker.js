// One private job per worker. This research probe exposes no raw shape pointers.
// The controller must terminate the worker after its response or on cancellation.
self.onmessage = event => {
  const dims = event.data?.dimensions;
  if (!Array.isArray(dims) || dims.length !== 3 || dims.some(n => typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 1e6)) {
    self.postMessage({ok:false, error:'Invalid box dimensions'}); return;
  }
  self.Module = {locateFile: () => '/lib-assets/jsketcher-occ-engine/occt.wasm',
    onRuntimeInitialized: () => {
      try {
        Module._InitCommands();
        const strings = ['box', 'private_box', '-min', '0', '0', '0', '-size', ...dims.map(String), '-dir', '0', '0', '1', '-xdir', '1', '0', '0'];
        const pointers = [], alloc = text => {
          const n = lengthBytesUTF8(text) + 1, p = _malloc(n);
          if (!p) throw Error('out of WASM memory');
          pointers.push(p); stringToUTF8Array(text, HEAP8, p, n); return p;
        };
        let array = 0;
        try {
          const command = alloc('box'); const argv = strings.map(alloc);
          array = _malloc(argv.length * 4); if (!array) throw Error('out of WASM memory');
          argv.forEach((ptr, i) => Module.setValue(array + i * 4, ptr, 'i32'));
          const rc = Module._CallCommand(command, argv.length, array);
          if (rc !== 0) throw Error('OCC box command returned ' + rc);
          globalThis.__OCI_EXCHANGE_VAL = null;
          Module._Interogate(alloc('private_box'), false);
          const result = globalThis.__OCI_EXCHANGE_VAL;
          if (!result || typeof result !== 'object') throw Error('OCC interrogation failed');
          if (!Array.isArray(result.faces) || result.faces.length !== 6) throw Error('Unexpected box topology');
          const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity]; let triangles = 0;
          for (const face of result.faces) {
            if (!Array.isArray(face.tess)) throw Error('Missing face tessellation');
            for (const item of face.tess) {
              const triangle = item?.[0];
              if (!Array.isArray(triangle) || triangle.length !== 3 || ++triangles > 10000) throw Error('Invalid tessellation');
              for (const point of triangle) {
                if (!Array.isArray(point) || point.length !== 3 || point.some(n => !Number.isFinite(n))) throw Error('Invalid vertex');
                for (let axis=0; axis<3; axis++) { min[axis] = Math.min(min[axis], point[axis]); max[axis] = Math.max(max[axis], point[axis]); }
              }
            }
          }
          self.postMessage({ok:true, windowType:typeof window, faceCount:result.faces.length, triangles, bounds:{min,max}});
        } finally { if (array) _free(array); for (const ptr of pointers) _free(ptr); }
      } catch (error) { self.postMessage({ok:false, error:String(error)}); }
    }};
  try { importScripts('/static/occ-portable.js'); }
  catch (error) { self.postMessage({ok:false, error:String(error)}); }
};
