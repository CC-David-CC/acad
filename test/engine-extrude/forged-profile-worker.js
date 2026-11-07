// Test double only: returns deliberately inconsistent provenance.
self.onmessage=e=>{const m=e.data;if(m.kind==='init'){self.postMessage({kind:'ready'});return;}
 self.postMessage({kind:'result',seq:m.seq,evidence:{faces:6,triangles:12,bounds:{min:[0,0,0],max:[1,1,1]},signedVolume:1,triangulatedClosed:true,triangleOrientationConsistent:true},provenance:{revision:'other'}});
};
