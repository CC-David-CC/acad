// Worker-only exact authored-envelope comparison. Retain one baseline plus one
// pending preparation; no digest can certify equality. Preserve JSON key order
// and omission/number/string semantics of the historical Host comparator.
import {ARCHIVE_LIMITS,archiveError} from './nativeArchiveFormat.mjs';
export function exactSavedContent(value){
  const encoder=new TextEncoder(),parts=[];let pending='',bytes=0,nodes=0;const active=new Set();
  function put(text){
    bytes+=encoder.encode(text).length;if(bytes>ARCHIVE_LIMITS.bytes)throw archiveError('CAD_ARCHIVE_RESOURCE_LIMIT','Saved-content comparison exceeds 128 MiB.');
    for(let i=0;i<text.length;){const n=Math.min(16384-pending.length,text.length-i);pending+=text.slice(i,i+n);i+=n;
      if(pending.length===16384){const last=pending.charCodeAt(pending.length-1),next=text.charCodeAt(i);if(last>=0xd800&&last<=0xdbff&&next>=0xdc00&&next<=0xdfff){parts.push(pending.slice(0,-1));pending=pending.slice(-1);}else{parts.push(pending);pending='';}}}
  }
  function string(text){put('"');for(let i=0;i<text.length;){let end=Math.min(i+4096,text.length);if(end<text.length&&text.charCodeAt(end-1)>=0xd800&&text.charCodeAt(end-1)<=0xdbff&&text.charCodeAt(end)>=0xdc00&&text.charCodeAt(end)<=0xdfff)end--;put(JSON.stringify(text.slice(i,end)).slice(1,-1));i=end;}put('"');}
  function walk(item,depth){
    if(++nodes>3000000||depth>132)throw archiveError('CAD_ARCHIVE_RESOURCE_LIMIT','Saved-content tree exceeds comparison limits.');
    if(typeof item==='string'){string(item);return;}
    if(item===null||typeof item==='boolean'||typeof item==='number'&&Number.isFinite(item)){put(JSON.stringify(item));return;}
    if(!item||typeof item!=='object'||active.has(item))throw archiveError('CAD_ARCHIVE_INVALID','Unsupported saved-content value.');
    const array=Array.isArray(item),proto=Object.getPrototypeOf(item);
    if(!array&&proto!==null&&proto!==Object.prototype)throw archiveError('CAD_ARCHIVE_INVALID','Saved content must contain plain records.');
    const keys=Reflect.ownKeys(item);if(keys.some(k=>typeof k!=='string'))throw archiveError('CAD_ARCHIVE_INVALID','Saved content contains symbol fields.');active.add(item);
    try{
      put(array?'[':'{');let first=true;
      if(array){if(keys.length!==item.length+1)throw archiveError('CAD_ARCHIVE_INVALID','Saved-content lists must be dense.');for(let i=0;i<item.length;i++){const d=Object.getOwnPropertyDescriptor(item,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw archiveError('CAD_ARCHIVE_INVALID','Saved content contains a non-data element.');if(!first)put(',');first=false;walk(d.value,depth+1);}}
      else for(const key of keys){const d=Object.getOwnPropertyDescriptor(item,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw archiveError('CAD_ARCHIVE_INVALID','Saved content contains a non-data field.');if(d.value===undefined)continue;if(!first)put(',');first=false;string(key);put(':');walk(d.value,depth+1);}
      put(array?']':'}');
    }finally{active.delete(item);}
  }
  walk(value,0);if(pending)parts.push(pending);
  return Object.freeze({parts:Object.freeze(parts),bytes});
}
export function savedContentEqual(left,right){return left!==null&&left.bytes===right.bytes&&left.parts.length===right.parts.length&&left.parts.every((part,index)=>part===right.parts[index]);}
