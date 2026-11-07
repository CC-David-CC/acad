// Research adapter. It is deliberately restricted to authored native boxes.
import {resolveManufacturingAssignments,validateManufacturingMetadata,geometryRevision} from '../projectManager/manufacturingMetadata.mjs';
import {nativeBoxFor3mf} from './nativeMeshBox3mf.mjs';
import {nativeEnclosureFor3mf} from './nativeEnclosure3mf.mjs';
import {writeCore3mf} from './core3mf.mjs';

// 3MF's row-vector affine transforms: local shape, then authored region placement.
function compose(a,b) {
  const result=[];
  for(let r=0;r<3;r++) for(let c=0;c<3;c++) result.push(a[r*3]*b[c]+a[r*3+1]*b[3+c]+a[r*3+2]*b[6+c]);
  for(let c=0;c<3;c++) result.push(a[9]*b[c]+a[10]*b[3+c]+a[11]*b[6+c]+b[9+c]);
  return result;
}
function bounds(obj) {
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],m=obj.transform;
 for(const v of obj.vertices) for(let k=0;k<3;k++) {
   const x=v[0]*m[k]+v[1]*m[3+k]+v[2]*m[6+k]+m[9+k];
   if(!Number.isFinite(x)) throw Error('Invalid transformed region bounds');
   min[k]=Math.min(min[k],x);max[k]=Math.max(max[k],x);
 }
 return {min,max};
}
export async function manufacturingTo3mf({metadata, project, history, bodies, revision}, options={}) {
 if(options.signal?.aborted) throw new DOMException('Export cancelled','AbortError');
 if (!metadata || !Array.isArray(metadata.objects) || metadata.objects.length>32 || metadata.objects.reduce((n,o)=>n+(Array.isArray(o?.regions)?o.regions.length:33),0)>32) throw Error('Too many printable regions');
 const data=validateManufacturingMetadata(metadata);
 // These authored model adapters produce millimeter coordinates, including
 // placement translations. Changing the XML unit alone changes physical size.
 // A future conversion must transform both geometry and placement explicitly.
 if(data.unit!=='millimeter')throw Error('Manufacturing unit must match the millimeter model');
 const capturedProject=structuredClone(project), capturedHistory=structuredClone(history);
 if (JSON.stringify(capturedProject?.model?.history)!==JSON.stringify(capturedHistory)) throw Error('History does not match project snapshot');
 // Capture resolved geometry synchronously before the first asynchronous hash.
 const assigned=resolveManufacturingAssignments(data,capturedHistory,bodies,revision);
 const byMaterial=new Map(data.materials.map(m=>[m.id,m]));
 const byAppearance=new Map(data.appearances.map(a=>[a.id,a]));
 const byBinding=new Map(data.bindings.map(b=>[b.id,b]));
 const pairs=new Map(),materials=[],objects=[],builds=[],ambiguousPairs=[];
 for(const group of assigned) {
   const groupObjects=[],groupBounds=[];
   for(const region of group.regions) {
     const material=byMaterial.get(region.materialId),appearance=byAppearance.get(region.appearanceId),binding=byBinding.get(region.bodyId);
     if (!material || !appearance) throw Error('Choose a material and appearance for each region');
     const pair=JSON.stringify([material.id,appearance.id]);
     if (!pairs.has(pair)) {const id=`material-${pairs.size}`;pairs.set(pair,id);materials.push({id,name:material.name,color:appearance.color});}
     const id=`region-${objects.length}`;
     const opts={featureId:binding.featureId,operationType:binding.operationType,id,name:region.id,materialId:pairs.get(pair),history:capturedHistory};
     const obj=binding.operationType==='NATIVE_MESH_BOOLEAN' ? nativeEnclosureFor3mf(region.body,opts) : nativeBoxFor3mf(region.body,opts);
     obj.transform=compose(obj.transform,region.transform);
     const b=bounds(obj);
     // Overlapping AABBs are rejected conservatively: no priority or boolean
     // subtraction is inferred. Touching boundaries are permitted.
     for(const old of groupBounds) if(b.min.every((x,i)=>x<old.bounds.max[i] && old.bounds.min[i]<b.max[i])) ambiguousPairs.push([old.object,obj]);
     groupBounds.push({bounds:b,object:obj});groupObjects.push(id);objects.push(obj);
   }
   builds.push({id:group.id,name:group.name,objects:groupObjects});
 }
 const actualRevision=await geometryRevision(capturedProject);
 if (revision!==actualRevision || data.revision!==actualRevision) throw Error('Project revision changed; review body assignments');
 for(const [a,b] of ambiguousPairs) {
   if(typeof options.verifyInterference!=='function') throw Error('Material regions overlap or have ambiguous bounds; verified interference check required');
   if(options.signal?.aborted) throw new DOMException('Export cancelled','AbortError');
   const result=await options.verifyInterference(a,b,{signal:options.signal});
   if(result!=='disjoint' && result!=='contact') throw Error('Material regions overlap or interference is uncertain');
 }
 return writeCore3mf({unit:data.unit,revision:data.revision,materials,objects,builds},options);
}
