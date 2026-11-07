// Evaluation-private read-only view. The live workspace remains untouched.
export function createCandidateSketchStorage(source, override, readSketch) {
  if (override === undefined || Array.isArray(override) && override.length === 0) return source;
  if (!source || typeof readSketch !== 'function') throw new Error('Invalid candidate sketch source.');
  const entries=override;
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
    if(typeof id!=='string'||!id||id.length>1024||captured.has(id)||typeof data!=='string'||data.length>1048576||new TextEncoder().encode(data).byteLength>1048576)throw new Error('Invalid candidate sketch source.');
    captured.set(id,data);
  }
  return Object.freeze({
    getAllSketches: () => source.getAllSketches(),
    getSketchData: key => captured.has(key) ? captured.get(key) : source.getSketchData(key),
    hasSketch: key => captured.has(key) ? true : source.hasSketch(key),
    readSketch: key => captured.has(key) ? readSketch(JSON.parse(captured.get(key)), key, true) : source.readSketch(key),
    setSketchData: () => { throw new Error('Candidate sketch storage is read-only.'); },
    removeSketchData: () => { throw new Error('Candidate sketch storage is read-only.'); }
  });
}
