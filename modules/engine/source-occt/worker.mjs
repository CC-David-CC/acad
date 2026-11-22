import {sourceEngine} from './pins.mjs';
import {extrudeRectangle} from './rectangle.mjs';
import {prepareRectangleExtrusion} from '../../workbenches/modeler/features/extrude/rectangleProfileRequest.mjs';

let oc, phase = 'new', busy = false;
const shapes = new Map();
const keys = (o, names) => o && !Array.isArray(o) && typeof o === 'object' &&
  Object.keys(o).sort().join(',') === names.slice().sort().join(',');
const fail = message => { throw Error(message); };

async function checkedAsset(entry, hash, name) {
  if (!keys(entry,['path','sha256']) || entry.sha256 !== hash) fail('Unexpected engine manifest');
  const href = new URL('../runtime/' + name, self.location.href);
  if (entry.path !== href.pathname) fail('Unexpected engine asset path');
  const response = await fetch(href,{mode:'same-origin',redirect:'error'});
  if (!response.ok) fail('Engine asset unavailable');
  const bytes = await response.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  if (Array.from(digest, n=>n.toString(16).padStart(2,'0')).join('') !== hash) fail('Engine asset integrity mismatch');
  return {href, bytes};
}

async function handle(message) {
  if (message?.kind === 'init') {
    if (phase!=='new' || !keys(message,['kind','manifest']) || !keys(message.manifest,['js','wasm','version']) || message.manifest.version!==1)
      fail('Invalid engine initialization');
    phase='loading';
    const [js,wasm] = await Promise.all([
      checkedAsset(message.manifest.js, sourceEngine.glue, sourceEngine.glue+'.mjs'),
      checkedAsset(message.manifest.wasm, sourceEngine.wasm, sourceEngine.wasm+'.wasm'),
    ]);
    // The build serves content-addressed, same-origin ES modules. Passing verified WASM bytes avoids a second WASM fetch.
    const {default:create} = await import(js.href.href);
    const compiled = await WebAssembly.compile(wasm.bytes);
    oc = await create({
      instantiateWasm(imports, ready) {
        const instance = new WebAssembly.Instance(compiled, imports);
        ready(instance, compiled);
        return instance.exports;
      },
      print:()=>{},printErr:()=>{},
    });
    phase='ready';
    self.postMessage({kind:'ready'});
    return;
  }
  if (phase !== 'ready' || !Number.isSafeInteger(message?.seq) || message.seq<1 ||
      typeof message.token !== 'string' || !message.token.length || message.token.length>128) fail('Invalid operation envelope');
  if (message.kind==='dispose') {
    if (!keys(message,['kind','seq','token']) || !shapes.has(message.token)) fail('Unknown native solid');
    shapes.get(message.token).delete();
    shapes.delete(message.token);
    self.postMessage({kind:'disposed',seq:message.seq,released:true});
    return;
  }
  const topology = Object.hasOwn(message,'researchTopology');
  if (message.kind!=='profile-extrude' ||
      !keys(message,topology?['kind','seq','token','profile','researchTopology']:['kind','seq','token','profile']) ||
      topology && (!keys(message.researchTopology,['version']) || message.researchTopology.version!==1) ||
      shapes.has(message.token) || shapes.size>=8) fail('Invalid rectangle request');
  let prepared;
  try { prepared=await prepareRectangleExtrusion(message.profile); }
  catch (error) {
    self.postMessage({kind:'refused',seq:message.seq,code:error.code || 'INVALID_REQUEST',error:error.message});
    return;
  }
  const {shape,result} = extrudeRectangle(oc,prepared);
  shapes.set(message.token,shape);
  const {portableTopology,...values} = result;
  self.postMessage({kind:'result',seq:message.seq,...values,...(topology?{portableTopology}:{})});
}

self.onmessage = async ({data}) => {
  try {
    if (busy) fail('Concurrent engine request');
    busy = true;
    await handle(data);
  } catch (error) {
    phase='failed';
    self.postMessage({kind:'error',seq:data?.seq,error:String(error.message || error).slice(0,512)});
    self.close();
  } finally { busy=false; }
};
