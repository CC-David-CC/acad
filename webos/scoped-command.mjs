// Settle a parent-owned command even if its iframe realm is destroyed while
// the underlying promise is pending. Cancellation does not assert whether an
// already-submitted operation committed; callers must inspect current state.
export function settleScopedCommand(promise,{signal,valid}) {
 if(!signal||typeof valid!=='function')throw Error('Invalid command lifetime.');
 return new Promise((resolve,reject)=>{
  let done=false,timer;const current=()=>{try{return !signal.aborted&&valid()===true}catch{return false}};
  const abort=()=>finish(new DOMException('Modeling command was cancelled or its outcome is unavailable.','AbortError'));
  function finish(error,value){if(done)return;done=true;clearInterval(timer);signal.removeEventListener('abort',abort);if(error)reject(error);else resolve(value)}
  signal.addEventListener('abort',abort,{once:true});timer=setInterval(()=>{if(!current())abort()},100);
  Promise.resolve(promise).then(value=>current()?finish(null,value):abort(),error=>finish(error));if(!current())abort();
 });
}
