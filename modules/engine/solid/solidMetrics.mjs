// Detached mount-verified inspection data, never authored geometry/save data.
export function captureSolidMetrics(engine,evidence,triangleCount,runtime) {
 const fail=()=>{throw Object.assign(new Error('Invalid solid measurement evidence.'),{code:'ENGINE_FAILURE'});};
 if(!['occ','manifold','smlib'].includes(engine)||!evidence||typeof evidence!=='object'||!Number.isSafeInteger(triangleCount)||triangleCount<0||!runtime||!Object.isFrozen(runtime))fail();
 const legacy=evidence.resultKind===undefined;
 const resultKind=legacy?(engine==='manifold'&&evidence.empty===true?'empty':'unclassified-nonempty'):evidence.resultKind;
 if(!['empty','single-material','multi-material','single-solid','multi-solid','mesh-container','unclassified-nonempty'].includes(resultKind))fail();
 const count=name=>{const value=evidence[name]===undefined?null:evidence[name];if(value!==null&&(!Number.isSafeInteger(value)||value<0))fail();return value;};
 const materialRegions=count('materialRegions'),voidRegions=count('voidRegions'),solidCount=count('solidCount');
 const meshComponents=evidence.meshComponents===undefined?(engine==='manifold'&&evidence.components!==undefined?count('components'):null):count('meshComponents');
 const validLevel0=evidence.validLevel0===undefined?null:evidence.validLevel0,validLevel2=evidence.validLevel2===undefined?null:evidence.validLevel2,manifoldPredicate=evidence.manifoldPredicate===undefined?null:evidence.manifoldPredicate;
 if(![true,null].includes(validLevel0)||![true,null].includes(validLevel2)||![true,false,null].includes(manifoldPredicate)||(engine!=='smlib'&&(validLevel0!==null||validLevel2!==null||manifoldPredicate!==null)))fail();
 let nativeValidity=null;
 if(evidence.nativeValidity!=null){const value=evidence.nativeValidity;if(engine!=='occ'||!value||Object.keys(value).sort().join(',')!=='method,valid'||!['occ-inspect-analytic-v1','occ-owned-solid-v2'].includes(value.method)||typeof value.valid!=='boolean')fail();nativeValidity=Object.freeze({method:value.method,valid:value.valid});}
 let nativeTopology=null;
 if(evidence.nativeTopology!=null){const value=evidence.nativeTopology,keys=['compounds','compsolids','solids','shells','faces','wires','edges','vertices'];if(engine!=='occ'||value.version!==1||value.method!=='occ-topology-census-v1'||!Number.isSafeInteger(value.shapeType)||value.shapeType<0||value.shapeType>8||!Number.isSafeInteger(value.directChildren)||value.directChildren<0||!value.counts||Object.keys(value.counts).sort().join(',')!==keys.slice().sort().join(',')||keys.some(k=>!Number.isSafeInteger(value.counts[k])||value.counts[k]<0)||value.counts.solids!==solidCount)fail();nativeTopology=Object.freeze({...value,counts:Object.freeze({...value.counts})});}
 const nativeStatus=evidence.nativeStatus===undefined?null:evidence.nativeStatus;if(nativeStatus!==null&&typeof nativeStatus!=='string')fail();
 if((resultKind==='single-material'&&(engine!=='smlib'||materialRegions!==1))||(resultKind==='multi-material'&&(engine!=='smlib'||materialRegions===null||materialRegions<2))||(resultKind==='single-solid'&&(engine!=='occ'||solidCount!==1||nativeValidity?.valid!==true))||(resultKind==='multi-solid'&&(engine!=='occ'||solidCount===null||solidCount<2||nativeValidity?.valid!==true))||(resultKind==='mesh-container'&&(engine!=='manifold'||meshComponents===null||meshComponents<1||nativeStatus!=='NoError')))fail();
 if(engine!=='smlib'&&(materialRegions!==null||voidRegions!==null))fail();
 if(['single-material','multi-material'].includes(resultKind)&&(validLevel0!==true||validLevel2!==true||typeof manifoldPredicate!=='boolean'))fail();
 const volumeQuality=evidence.volumeQuality===undefined?(resultKind==='empty'?'empty':'legacy-provider-volume'):evidence.volumeQuality;
 const qualities={occ:['empty','legacy-provider-volume','tessellation-signed-integral'],manifold:['empty','legacy-provider-volume','mesh-kernel-volume'],smlib:['empty','legacy-provider-volume','native-relative-0.001','native-undefined-nonmanifold']};
 if(!qualities[engine].includes(volumeQuality))fail();
 if(['single-material','multi-material'].includes(resultKind)&&volumeQuality!==(manifoldPredicate?'native-relative-0.001':'native-undefined-nonmanifold'))fail();
 const undefinedVolume=manifoldPredicate===false||volumeQuality==='native-undefined-nonmanifold';
 let volume=engine==='occ'?evidence.signedVolume:evidence.volume;
 // A number from undefined native nonmanifold volume is not a measurement.
 // Publish null explicitly; never coerce unavailable volume to zero.
 if(undefinedVolume)volume=null;
 else if(typeof volume!=='number'||!Number.isFinite(volume)||(legacy&&resultKind!=='empty'&&(volume===0||engine!=='occ'&&volume<0)))fail();
 const bounds=evidence.bounds;
 if(resultKind==='empty'){
  if(triangleCount!==0||bounds!==null||volume!==0||undefinedVolume||[materialRegions,voidRegions,solidCount,meshComponents].some(n=>n!==null&&n!==0)||(engine==='smlib'&&volumeQuality!=='empty'))fail();
 }else if(triangleCount<1||!bounds||![bounds.min,bounds.max].every(v=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)))||bounds.min.some((v,i)=>v>bounds.max[i]))fail();
 if(engine==='manifold'&&evidence.empty!==undefined&&evidence.empty!==(resultKind==='empty'))fail();
 if(['occ','manifold'].includes(engine)&&evidence.triangles!==triangleCount)fail();
 // Native observations remain distinct from display-mesh integrals/bounds.
 // Missing old-provider observations stay unavailable; no inferred substitute.
 let nativeVolume=null,nativeBounds=null;
 const nativeFields=['nativeVolume','nativeBounds'].map(key=>Object.getOwnPropertyDescriptor(evidence,key));
 if(nativeFields.some(Boolean)){
  if(engine!=='occ'||nativeFields.some(d=>!d?.enumerable||!Object.hasOwn(d,'value')))fail();
  nativeVolume=nativeFields[0].value;const b=nativeFields[1].value;
  if(typeof nativeVolume!=='number'||!Number.isFinite(nativeVolume)||nativeVolume<0)fail();
  if(resultKind==='empty'){if(nativeVolume!==0||b!==null)fail();}
  else{
   if(nativeVolume<=0||!b||typeof b!=='object'||Array.isArray(b)||Reflect.ownKeys(b).length!==2||Reflect.ownKeys(b).some(k=>k!=='min'&&k!=='max'))fail();
   const vectors=['min','max'].map(key=>{const d=Object.getOwnPropertyDescriptor(b,key),v=d?.value;if(!d?.enumerable||!Object.hasOwn(d,'value')||!Array.isArray(v)||v.length!==3||Reflect.ownKeys(v).length!==4)fail();return [0,1,2].map(i=>{const n=Object.getOwnPropertyDescriptor(v,String(i));if(!n?.enumerable||!Object.hasOwn(n,'value')||typeof n.value!=='number'||!Number.isFinite(n.value))fail();return n.value;});});
   if(vectors[0].some((n,i)=>n>vectors[1][i]))fail();nativeBounds=Object.freeze({min:Object.freeze(vectors[0]),max:Object.freeze(vectors[1])});
  }
 }
 return Object.freeze({version:1,unit:'millimeter',space:'model-local',resultKind,materialRegions,voidRegions,solidCount,meshComponents,validLevel0,validLevel2,manifoldPredicate,nativeValidity,nativeTopology,nativeStatus,volumeUnit:'cubic-millimeter',reportedVolume:volume,volumeMagnitude:volume===null?null:Math.abs(volume),volumeAvailable:volume!==null,volumeQuality,volumeKind:volume===null?'unavailable':engine==='occ'?'occ-tessellation-signed-volume':engine==='manifold'?'manifold-mesh':'smlib-brep',boundsKind:engine==='occ'?'tessellation':engine==='manifold'?'mesh':'kernel',nativeVolume,nativeBounds,nativeMeasurementQuality:nativeFields.some(Boolean)?'provider-native-unqualified':null,triangleCount,bounds:bounds===null?null:Object.freeze({min:Object.freeze(bounds.min.slice()),max:Object.freeze(bounds.max.slice())}),precision:engine==='smlib'?Object.freeze({kind:undefinedVolume?'unavailable':'kernel-compute-tolerance',value:undefinedVolume?null:0.001,note:undefinedVolume?'Native nonmanifold volume is unavailable.':'Kernel computation tolerance; not an accuracy guarantee.'}):Object.freeze({kind:'engine-defaults-unqualified'}),runtime});
}
