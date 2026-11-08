import {ARCHIVE_LIMITS,archiveError} from './nativeArchiveFormat.mjs';

// This is a guarded source traversal, not a JSON encoder. No complete model is
// cloned/stringified on the UI thread. A credit contains at most 16K UTF-16
// code units (<=64KiB UTF-8), or 512 small structural tokens. The Worker owns
// reconstruction, UTF-8, canonicalization, hashing and all sketch parsing.
export async function streamNativeArchiveSource(source:any,send:(part:any)=>Promise<any>,current:()=>boolean,maximumNodes=1000000,maximumDepth=128):Promise<void>{
  const check=()=>{if(!current())throw new DOMException('Project changed while capturing the archive.','AbortError');};
  let tokens:any[]=[],charge=0,nodes=0;const active=new Set();
  const flush=async()=>{if(!tokens.length)return;check();const part=tokens;tokens=[];charge=0;await send(part);check();await new Promise(resolve=>setTimeout(resolve,0));check();};
  const push=async(token:any,cost=16)=>{if(tokens.length>=512||charge+cost>65536)await flush();tokens.push(token);charge+=cost;};
  async function text(value:string){
    await push(['s']);
    for(let start=0;start<value.length;){let end=Math.min(start+16000,value.length);if(end<value.length&&value.charCodeAt(end-1)>=0xd800&&value.charCodeAt(end-1)<=0xdbff&&value.charCodeAt(end)>=0xdc00&&value.charCodeAt(end)<=0xdfff)end--;const part=value.slice(start,end);await push(['t',part],part.length*4+16);start=end;}
    await push(['e']);
  }
  async function walk(value:any,depth=0){
    check();if(++nodes>maximumNodes||depth>maximumDepth)throw archiveError('CAD_ARCHIVE_RESOURCE_LIMIT','Project exceeds the native source tree limits.');
    if(typeof value==='string'){await text(value);return;}
    if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)){await push(['v',value]);return;}
    if(!value||typeof value!=='object'||active.has(value))throw archiveError('CAD_ARCHIVE_INVALID','Project contains non-JSON data.');
    active.add(value);
    try{
      const array=Array.isArray(value),keys=Reflect.ownKeys(value);
      if(keys.some(key=>typeof key!=='string'))throw archiveError('CAD_ARCHIVE_INVALID','Project contains symbol properties.');
      if(array){
        if(keys.length!==value.length+1)throw archiveError('CAD_ARCHIVE_INVALID','Project lists must be dense.');
        await push(['a']);
        for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw archiveError('CAD_ARCHIVE_INVALID','Project lists must contain own data.');await walk(d.value,depth+1);}
      }else{
        const proto=Object.getPrototypeOf(value);
        if(proto!==null&&Object.getPrototypeOf(proto)!==null)throw archiveError('CAD_ARCHIVE_INVALID','Project must contain plain records.');
        await push(['o']);
        for(const key of keys as string[]){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw archiveError('CAD_ARCHIVE_INVALID','Project records must contain own data.');
          // Existing model/surfacing serializers use absent optional record
          // fields as own undefined values. Match their native JSON omission;
          // undefined array members and all accessors/functions still refuse.
          if(d.value===undefined)continue;await text(key);await walk(d.value,depth+1);}
      }
      await push(['z']);
    }finally{active.delete(value);}
  }
  await walk(source);await flush();check();
}

// Keys and raw text come from this document's namespace, never a file cache.
// The getter is invoked lazily so only one sketch string is staged at a time.
export async function streamNativeArchiveProject({model,surfacing,manufacturing,presentation,drawing,sketchIds,readSketch},send,current){
  await streamNativeArchiveSource({model,...(surfacing!==undefined?{surfacing}:{}),manufacturing:manufacturing||null,presentation:presentation||null,drawing:drawing||null},part=>send({kind:'root',tokens:part}),current);
  if(!Array.isArray(sketchIds)||sketchIds.length>ARCHIVE_LIMITS.sketches)throw archiveError('CAD_ARCHIVE_RESOURCE_LIMIT','Too many sketches.');
  for(const id of sketchIds){
    if(!current())throw new DOMException('Project changed','AbortError');
    const raw=readSketch(id);if(typeof raw!=='string')throw archiveError('CAD_ARCHIVE_INVALID','A source sketch is unavailable.');
    await streamNativeArchiveSource({id,raw},part=>send({kind:'sketch',tokens:part}),current);
    await send({kind:'sketch-end'});
  }
}
