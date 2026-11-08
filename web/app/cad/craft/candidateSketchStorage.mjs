// Evaluation-private read-only view. The live workspace remains untouched.
export function createCandidateSketchStorage(source, override, readSketch, removed = []) {
  if(!Array.isArray(removed)||removed.length>64||Reflect.ownKeys(removed).length!==removed.length+1)throw new Error('Invalid removed source inventory.');
  const missing=new Set();for(let i=0;i<removed.length;i++){const d=Object.getOwnPropertyDescriptor(removed,String(i)),id=d?.value;if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof id!=='string'||!id||id.length>1024||missing.has(id)||source.getSketchData(id)===null)throw new Error('Invalid removed source binding.');missing.add(id);}
  if (!missing.size&&(override === undefined || Array.isArray(override) && override.length === 0)) return source;
  if (!source || typeof readSketch !== 'function') throw new Error('Invalid candidate sketch source.');
  const entries=override||[];
  if (!Array.isArray(entries)||entries.length>64||Reflect.ownKeys(entries).length!==entries.length+1) throw new Error('Invalid candidate sketch source.');
  const captured=new Map();
  for(let i=0;i<entries.length;i++){
    const entry=Object.getOwnPropertyDescriptor(entries,String(i));
    if(!entry?.enumerable||!Object.hasOwn(entry,'value'))throw new Error('Invalid candidate sketch source.');
    const item=entry.value;
    if(!item||typeof item!=='object'||Array.isArray(item)||Reflect.ownKeys(item).sort().join(',')!=='data,id') throw new Error('Invalid candidate sketch source.');
    const idField=Object.getOwnPropertyDescriptor(item,'id'),dataField=Object.getOwnPropertyDescriptor(item,'data');
    if(!idField?.enumerable||!Object.hasOwn(idField,'value')||!dataField?.enumerable||!Object.hasOwn(dataField,'value'))throw new Error('Invalid candidate sketch source.');
    const id=idField.value,data=dataField.value;
    if(typeof id!=='string'||!id||id.length>1024||captured.has(id)||missing.has(id)||typeof data!=='string'||data.length>1048576||new TextEncoder().encode(data).byteLength>1048576)throw new Error('Invalid candidate sketch source.');
    captured.set(id,data);
  }
  return Object.freeze({
    getAllSketches: () => source.getAllSketches().filter(row=>!missing.has(row.id)),
    getSketchData: key => missing.has(key)?null:captured.has(key) ? captured.get(key) : source.getSketchData(key),
    hasSketch: key => missing.has(key)?false:captured.has(key) ? true : source.hasSketch(key),
    readSketch: key => missing.has(key)?null:captured.has(key) ? readSketch(JSON.parse(captured.get(key)), key, true) : source.readSketch(key),
    setSketchData: () => { throw new Error('Candidate sketch storage is read-only.'); },
    removeSketchData: () => { throw new Error('Candidate sketch storage is read-only.'); }
  });
}
