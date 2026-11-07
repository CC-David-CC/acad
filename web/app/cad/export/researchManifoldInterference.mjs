// Experimental worker-suitable kernel probe. Not a contact/material-interface
// qualification and not wired to product: non-empty zero-volume means uncertain.
export function researchManifoldInterference(wasm) {
 if(!wasm?.Manifold) throw Error('Manifold kernel unavailable');
 return async function verify(a,b,{signal}={}) {
  if(signal?.aborted) throw new DOMException('Cancelled','AbortError');
  const shapes=[];
  try {
   for(const object of [a,b]) {
    const m=object?.transform;
    if(!Array.isArray(m)||m.length!==12||!m.every(Number.isFinite)||!Array.isArray(object.vertices)||!Array.isArray(object.triangles)||object.vertices.length>150000||object.triangles.length>250000)return 'uncertain';
    const det=m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);
    if(!Number.isFinite(det)||det<=1e-12)return 'uncertain';
    const vertices=new Float32Array(object.vertices.length*3),triangles=new Uint32Array(object.triangles.length*3);
    for(let i=0;i<object.vertices.length;i++){
      const p=object.vertices[i];if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))return 'uncertain';
      for(let k=0;k<3;k++) {const x=p[0]*m[k]+p[1]*m[3+k]+p[2]*m[6+k]+m[9+k];if(!Number.isFinite(x)||Math.fround(x)!==x)return 'uncertain';vertices[3*i+k]=x;}
    }
    for(let i=0;i<object.triangles.length;i++){
      const tri=object.triangles[i];if(!Array.isArray(tri)||tri.length!==3||!tri.every(x=>Number.isSafeInteger(x)&&x>=0&&x<object.vertices.length))return 'uncertain';triangles.set(tri,i*3);
    }
    const shape=new wasm.Manifold({numProp:3,vertProperties:vertices,triVerts:triangles});shapes.push(shape);
    if(shape.status()!=='NoError'||shape.isEmpty()||!Number.isFinite(shape.volume())||shape.volume()<=0)return 'uncertain';
   }
   if(signal?.aborted) throw new DOMException('Cancelled','AbortError');
   const intersection=shapes[0].intersect(shapes[1]);shapes.push(intersection);
   const volume=intersection.volume();
   if(intersection.status()!=='NoError'||!Number.isFinite(volume)||volume<0)return 'uncertain';
   if(volume>0)return 'overlap';
   // Kernel may report an empty result even when surfaces touch. Zero-volume
   // or ambiguous contact is never promoted to verified contact here.
   return 'uncertain';
  } finally {for(const shape of shapes)shape.delete();}
 };
}
