// Internal JSON-data comparison. Only the session-local expression clock may
// differ; every authored field, array order and other metadata remains exact.
function sameJSON(left,right) {
  const pending=[[left,right]];
  while(pending.length){
    const [a,b]=pending.pop();
    if(Object.is(a,b))continue;
    if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
    if(Array.isArray(a)&&a.length!==b.length)return false;
    const keys=Object.keys(a);
    if(keys.length!==Object.keys(b).length)return false;
    for(const key of keys){if(!Object.prototype.hasOwnProperty.call(b,key))return false;pending.push([a[key],b[key]]);}
  }
  return true;
}
const clock=value=>typeof value==='string'&&/^(?:0|[1-9]\d{0,15})$/.test(value)&&Number.isSafeInteger(Number(value));
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function unchangedSketchSave(savedText,candidate) {
  if(typeof savedText!=='string')return false;
  let previous;try{previous=JSON.parse(savedText);}catch{return false;}
  if(sameJSON(previous,candidate))return true;
  const oldMetadata=previous?.metadata,nextMetadata=candidate?.metadata;
  if(!record(oldMetadata)||!record(nextMetadata))return false;
  const ownsClock=metadata=>Object.prototype.hasOwnProperty.call(metadata,'expressionsSignature');
  if((ownsClock(oldMetadata)&&!clock(oldMetadata.expressionsSignature))||(ownsClock(nextMetadata)&&!clock(nextMetadata.expressionsSignature)))return false;
  // Only an own numeric clock may be added, removed or replaced. Metadata
  // objects and every other field still have to exist and match exactly.
  const oldAuthored={...oldMetadata},nextAuthored={...nextMetadata};
  delete oldAuthored.expressionsSignature;delete nextAuthored.expressionsSignature;
  return sameJSON({...previous,metadata:oldAuthored},{...candidate,metadata:nextAuthored});
}
