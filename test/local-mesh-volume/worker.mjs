import {parentPort} from 'node:worker_threads';
import {measureSignedMeshVolume} from '../../modules/engine/mount/localMeshVolume.mjs';
parentPort.on('message',message=>{try{parentPort.postMessage({id:message.id,result:measureSignedMeshVolume(message.positions,message.options)})}catch(error){parentPort.postMessage({id:message.id,error:{code:error.code??null,message:error.message}})}});
