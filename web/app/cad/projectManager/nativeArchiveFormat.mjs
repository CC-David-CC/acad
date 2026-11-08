// Worker-only container policy. These addresses are not authored feature IDs.
export const ARCHIVE_LIMITS=Object.freeze({bytes:128*1024*1024,entries:10032,sketches:10000,derived:16,metadata:8*1024*1024,credit:256*1024});
export const ARCHIVE_PROFILE='zip32-zipjs224-json6-binary-store-v1';
export const ARCHIVE_FORMAT='codi-cad-project';
export function archiveError(code,message,cause){return Object.assign(new Error(message),{code,cause});}
export function exactRecord(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value))throw archiveError('CAD_ARCHIVE_INVALID','Expected archive data.');
  const actual=Reflect.ownKeys(value);
  if(actual.length!==keys.length||actual.some(key=>typeof key!=='string'||!keys.includes(key)))throw archiveError('CAD_ARCHIVE_INVALID','Unexpected archive fields.');
  for(const key of actual){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw archiveError('CAD_ARCHIVE_INVALID','Archive fields must be own data.');}
  return value;
}
export function dense(value,maximum){
  if(!Array.isArray(value)||value.length>maximum||Reflect.ownKeys(value).length!==value.length+1)throw archiveError('CAD_ARCHIVE_INVALID','Invalid archive list.');
  for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw archiveError('CAD_ARCHIVE_INVALID','Archive lists must be dense data.');}
  return value;
}
export const hexDigest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const fixed=new Map([['model','authored/model.json'],['surfacing','authored/surfacing.json'],['manufacturing','authored/manufacturing.json'],['presentation','authored/presentation.json'],['drawings','authored/drawings.json']]);
export function validateManifest(value){
  exactRecord(value,['format','version','unit','envelopeVersion','designRevision','writerProfile','entries']);
  if(value.format!==ARCHIVE_FORMAT||value.version!==1||value.unit!=='millimeter'||![2,3].includes(value.envelopeVersion)||value.writerProfile!==ARCHIVE_PROFILE)throw archiveError('CAD_ARCHIVE_UNSUPPORTED','Unsupported native archive version or writer profile.');
  if(!hexDigest(value.designRevision))throw archiveError('CAD_ARCHIVE_INVALID','Invalid authored archive revision.');
  dense(value.entries,ARCHIVE_LIMITS.entries-1);
  let bytes=0,sketches=0,derived=0;const paths=new Set(),ids=new Set(),roles=new Set();
  for(const entry of value.entries){
    exactRecord(entry,['path','role','logicalId','bytes','sha256','required','encoding','attribution']);
    if(typeof entry.path!=='string'||entry.path.length>128||paths.has(entry.path)||!Number.isSafeInteger(entry.bytes)||entry.bytes<0||!hexDigest(entry.sha256))throw archiveError('CAD_ARCHIVE_INVALID','Invalid archive entry descriptor.');
    paths.add(entry.path);bytes+=entry.bytes;
    if(bytes>ARCHIVE_LIMITS.bytes)throw archiveError('CAD_ARCHIVE_RESOURCE_LIMIT','Native archive content exceeds 128 MiB.');
    if(entry.role==='derived'){
      if(++derived>ARCHIVE_LIMITS.derived||entry.path!==`derived/${entry.sha256}.bin`||entry.required!==false||entry.encoding!=='binary-store')throw archiveError('CAD_ARCHIVE_INVALID','Invalid derived entry.');
      exactRecord(entry.attribution,['sourceRevision','engine','engineRevision','producerFeatureId','format','quality']);
      const a=entry.attribution;
      if(!hexDigest(a.sourceRevision)||typeof entry.logicalId!=='string'||!entry.logicalId||entry.logicalId.length>1024||a.engine!=='occ'||typeof a.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(a.engineRevision)||!Number.isSafeInteger(a.producerFeatureId)||a.producerFeatureId<=0||!['format','quality'].every(k=>typeof a[k]==='string'&&a[k].length>0&&a[k].length<=128))throw archiveError('CAD_ARCHIVE_INVALID','Invalid derived attribution.');
    }else{
      if(entry.required!==true||entry.encoding!=='json-deflate6'||entry.attribution!==null)throw archiveError('CAD_ARCHIVE_INVALID','Invalid authored entry.');
      if(entry.role==='sketch'){
        if(++sketches>ARCHIVE_LIMITS.sketches||typeof entry.logicalId!=='string'||!entry.logicalId||entry.logicalId.length>1024||/[\u0000-\u001f\u007f]/.test(entry.logicalId)||ids.has(entry.logicalId)||!/^authored\/sketches\/[a-f0-9]{64}\.json$/.test(entry.path))throw archiveError('CAD_ARCHIVE_INVALID','Invalid sketch entry.');
        ids.add(entry.logicalId);
      }else{
        if(!fixed.has(entry.role)||entry.path!==fixed.get(entry.role)||entry.logicalId!==entry.role||roles.has(entry.role))throw archiveError('CAD_ARCHIVE_INVALID','Invalid authored role.');
        roles.add(entry.role);
      }
    }
  }
  if(!roles.has('model')||(value.envelopeVersion===3)!==roles.has('drawings'))throw archiveError('CAD_ARCHIVE_INVALID','Native archive is missing an authored role.');
  // One canonical roster order, also the root-hash input order. No dead entries.
  const order=[...value.entries].sort((a,b)=>(a.role==='derived'?0:1)-(b.role==='derived'?0:1)||(a.path<b.path?-1:a.path>b.path?1:0));
  if(order.some((entry,i)=>entry!==value.entries[i]))throw archiveError('CAD_ARCHIVE_INVALID','Archive roster order is not canonical.');
  return value;
}
export function authoredRootRecord(manifest){return {format:ARCHIVE_FORMAT,version:1,unit:'millimeter',envelopeVersion:manifest.envelopeVersion,entries:manifest.entries.filter(entry=>entry.required)};}

// Credit-sized JSON-data hydration. No parser, evaluation, setters or prototype
// assignment runs in the consumer realm. Large strings arrive in small pieces.
export class ArchiveDataReceiver {
  constructor(){this.frames=[];this.root=undefined;this.hasRoot=false;this.text=null;this.nodes=0;}
  append(value){
    // Includes object keys and the existing decoded/storage return pair. The
    // authoritative project tree still uses preflight's unchanged 1M bound.
    if(++this.nodes>3000000)throw archiveError('CAD_ARCHIVE_RESOURCE_LIMIT','Native transport has too many values.');
    const frame=this.frames[this.frames.length-1];
    if(!frame){if(this.hasRoot)throw archiveError('CAD_ARCHIVE_PROTOCOL','Duplicate source root.');this.root=value;this.hasRoot=true;return;}
    if(frame.array){frame.value.push(value);return;}
    if(frame.key===null){if(typeof value!=='string'||Object.hasOwn(frame.value,value))throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid or duplicate source key.');frame.key=value;}
    else {Object.defineProperty(frame.value,frame.key,{value,enumerable:true,writable:true,configurable:true});frame.key=null;}
  }
  part(tokens){
    dense(tokens,512);let charge=0;
    for(const token of tokens){
      dense(token,2);charge+=16;
      const [op,value]=token;
      if(op==='t'){if(token.length!==2||this.text===null||typeof value!=='string'||value.length>16384)throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid string credit.');this.text+=value;charge+=value.length*4;}
      else if(op==='s'){if(token.length!==1||this.text!==null)throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid string start.');this.text='';}
      else if(op==='e'){if(token.length!==1||this.text===null)throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid string end.');const result=this.text;this.text=null;this.append(result);}
      else if(this.text!==null)throw archiveError('CAD_ARCHIVE_PROTOCOL','Incomplete string.');
      else if(op==='v'){if(token.length!==2||!(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)))throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid source scalar.');this.append(value);}
      else if(op==='o'||op==='a'){if(token.length!==1||this.frames.length>=132)throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid source structure.');const output=op==='a'?[]:{};this.append(output);this.frames.push({value:output,array:op==='a',key:null});}
      else if(op==='z'){if(token.length!==1||!this.frames.length||this.frames[this.frames.length-1].key!==null)throw archiveError('CAD_ARCHIVE_PROTOCOL','Invalid source end.');this.frames.pop();}
      else throw archiveError('CAD_ARCHIVE_PROTOCOL','Unknown source credit.');
      if(charge>65536)throw archiveError('CAD_ARCHIVE_PROTOCOL','Source credit exceeds its byte allowance.');
    }
  }
  finish(){if(!this.hasRoot||this.frames.length||this.text!==null)throw archiveError('CAD_ARCHIVE_PROTOCOL','Incomplete source data.');return this.root;}
}
