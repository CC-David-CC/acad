// Genuine recorded binary admission only; no Native reply/geometry generation.
import {parentPort} from 'node:worker_threads';import {decodeManufacturingMesh} from '../../modules/engine/mount/manufacturingMeshRecord.mjs';
parentPort.on('message',({buffer,begin,controls})=>{try{const result=decodeManufacturingMesh(buffer,begin,controls);parentPort.postMessage({kind:'decoded',...result},[result.buffer]);parentPort.postMessage({kind:'detached',bytes:buffer.byteLength});}catch(e){parentPort.postMessage({kind:'refused',code:e.code,message:e.message});}});
