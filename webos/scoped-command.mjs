// Parent-owned settlement remains live when its iframe disappears. Cancellation
// never proves whether a submitted write committed: callers must reconcile.
const REMOVE_ABORT=typeof EventTarget==='function'?EventTarget.prototype.removeEventListener:null;
const ownFlag=(value,key)=>{try{const d=Object.getOwnPropertyDescriptor(value,key);return d&&Object.hasOwn(d,'value')&&d.value===true}catch{return false}};
export function settleScopedCommand(promise,{signal,valid}) {
 if(!signal||typeof valid!=='function')throw Error('Invalid command lifetime.');
 return new Promise((resolve,reject)=>{
  let done=false,timer,registrationAttempted=false;
  const current=()=>{try{return !signal.aborted&&valid()===true}catch{return false}};
  const abort=()=>finish('rejected',new DOMException('Modeling command was cancelled or its outcome is unavailable.','AbortError'));
  function finish(kind,value){
   if(done)return;done=true;let cleanup=null;
   if(timer!==undefined){const held=timer;timer=undefined;try{clearInterval(held)}catch(cause){cleanup={cause}}}
   if(registrationAttempted){registrationAttempted=false;try{signal.removeEventListener('abort',abort)}catch(cause){let removed=false;if(REMOVE_ABORT)try{REMOVE_ABORT.call(signal,'abort',abort);removed=true}catch{}if(!removed&&cleanup===null)cleanup={cause}}}
   if(cleanup!==null){
    const error=new Error('Modeling command listener cleanup could not be confirmed.',{cause:kind==='rejected'?value:cleanup.cause});
    Object.defineProperties(error,{cleanupUnconfirmed:{value:true,enumerable:true},cleanupCause:{value:cleanup.cause}});
    if(ownFlag(value,'committed'))error.committed=true;else if(ownFlag(value,'possiblyCommitted'))error.possiblyCommitted=true;
    reject(error);
   }else if(kind==='rejected')reject(value);else resolve(value);
  }
  // Observe even a rejected input before registration invokes caller code.
  Promise.resolve(promise).then(value=>current()?finish('fulfilled',value):abort(),value=>finish('rejected',value));
  if(!current()){abort();return}
  registrationAttempted=true;try{signal.addEventListener('abort',abort,{once:true})}catch(cause){finish('rejected',cause);return}
  // A custom registration hook can abort synchronously. Never start its timer
  // after settlement; done is also set before any cleanup hook can re-enter.
  if(done)return;
  try{timer=setInterval(()=>{if(!current())abort()},100)}catch(cause){finish('rejected',cause);return}
  if(!current())abort();
 });
}
