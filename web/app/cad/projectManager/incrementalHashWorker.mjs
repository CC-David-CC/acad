// Research worker. The integrating app must bundle pinned @noble/hashes 1.8.0.
import {sha256} from '@noble/hashes/sha256';
let hash = null;
self.addEventListener('message', event => {
  const {type, bytes} = event.data || {};
  try {
    if (type === 'start' && !hash) { hash = sha256.create(); self.postMessage({type:'ready'}); }
    else if (type === 'chunk' && hash && bytes instanceof ArrayBuffer && bytes.byteLength <= 262144) {
      hash.update(new Uint8Array(bytes)); self.postMessage({type:'ack'});
    } else if (type === 'finish' && hash) {
      const result = hash.digest(); hash = null;
      self.postMessage({type:'result', bytes:result.buffer}, [result.buffer]);
    } else if (type === 'cancel') { hash = null; self.close(); }
    else throw new Error('Invalid incremental hash message');
  } catch (error) { hash = null; self.postMessage({type:'error', message:String(error.message || error)}); }
});
