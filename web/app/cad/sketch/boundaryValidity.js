// Validate reference identities before an isolated solve. Numeric differences
// below this scale are treated as projection noise, not design changes.
export function boundaryChangeForSketch(sketch, current) {
  const references = new Set(), pending = [{value:sketch?.stages || [],depth:0}];
  let visited=0;
  while(pending.length) {
    const {value,depth}=pending.pop();
    if (++visited>100000 || depth>32) throw new Error('Sketch boundary references exceed validation limits.');
    if (typeof value==='string' && value.startsWith('boundary/')) references.add(value.slice(9));
    else if(value && typeof value==='object') for(const child of Object.values(value)) pending.push({value:child,depth:depth+1});
  }
  if (!references.size) return {referenced: false, changed: false};
  const index = boundary => {
    if (!boundary || typeof boundary !== 'object') throw new Error('Referenced sketch boundary snapshot is missing.');
    const result = new Map();
    for (const category of ['lines','arcs','circles','nurbses']) {
      if (!Array.isArray(boundary[category]) || boundary[category].length > 10000) throw new Error('Referenced sketch boundary snapshot is invalid.');
      for (const entry of boundary[category]) {
        if (!entry || typeof entry.id !== 'string' || !entry.id || result.has(entry.id)) throw new Error('Referenced sketch boundary is ambiguous.');
        result.set(entry.id, {category, entry});
      }
    }
    return result;
  };
  const saved=index(sketch.boundary), actual=index(current), referencedIds=new Set();let changed=false;
  for (const ref of references) {
    const ids=[...saved.keys()].filter(id=>ref===id || ref.startsWith(id+':'));
    if (ids.length !== 1 || !actual.has(ids[0]) || saved.get(ids[0]).category!==actual.get(ids[0]).category) {
      throw new Error('A referenced sketch boundary changed identity or is unavailable. Reopen and resolve the sketch.');
    }
    referencedIds.add(ids[0]);
    if(!boundaryGeometryClose(saved.get(ids[0]).entry,actual.get(ids[0]).entry))changed=true;
  }
  return {referenced:true,changed,referencedIds:[...referencedIds].sort()};
}

export function boundaryGeometryClose(a,b) {
  const pending=[{a,b,depth:0}];let visited=0;
  while(pending.length){
    const item=pending.pop();a=item.a;b=item.b;
    if(++visited>100000 || item.depth>32)return false;
    if(typeof a==='number' && typeof b==='number'){
      if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>1e-9*Math.max(1,Math.abs(a),Math.abs(b)))return false;
    } else if(a===null||b===null||typeof a!=='object'||typeof b!=='object'){
      if(a!==b)return false;
    } else {
      if(Array.isArray(a)!==Array.isArray(b))return false;
      const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
      if(ak.length!==bk.length||!ak.every((k,i)=>k===bk[i]))return false;
      for(const k of ak)pending.push({a:a[k],b:b[k],depth:item.depth+1});
    }
  }
  return true;
}

// Keep only referenced entities in the solve request; an unrelated arc on a
// face should not disable the supported line-only solver. Nothing referenced
// is omitted: boundaryChangeForSketch must validate the IDs first.
export function selectReferencedBoundaries(boundary, referencedIds) {
  const selected = new Set(referencedIds);
  return Object.fromEntries(['lines','arcs','circles','nurbses'].map(kind => [kind, boundary[kind].filter(entry=>selected.has(entry.id))]));
}

// A matching local edge ID alone does not prove the supporting face retained
// its world-space coordinate frame. Until frame transformations have tracked
// provenance, refuse changed or absent frames instead of silently remapping.
export function sketchBoundaryFrame(face) {
  const frame=face?.csys;
  const result={};
  for(const key of ['origin','x','y','z']) {
    const point=frame?.[key];
    if(!point || ![point.x,point.y,point.z].every(Number.isFinite))throw new Error('Sketch face frame is unavailable.');
    result[key]=[point.x,point.y,point.z];
  }
  return result;
}
