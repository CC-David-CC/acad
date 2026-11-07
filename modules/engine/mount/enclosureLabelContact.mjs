// Runs in the verified engine worker after both actual meshes passed the
// bounded enclosure manufacturing validator. This is not a printer-fit test.
export function qualifyEnclosureLabelContact(plan, lid, label, tolerance) {
  const fail=()=>{throw Object.assign(new Error('Inset label interface is not qualified.'),{code:'INVALID_ENCLOSURE_INTERFACE'});};
  if(!plan?.label || !Number.isFinite(tolerance) || tolerance<=0 || tolerance>0.01) fail();
  for(const [mesh,role] of [[lid,'LID'],[label,'LABEL']]) {
    if(!(mesh?.vertices instanceof Float64Array) || !(mesh?.triangles instanceof Uint32Array) || mesh.evidence?.role!==role || mesh.evidence?.maxDeviationMm!==tolerance || mesh.triangles.length<12 || mesh.triangles.length>384 || mesh.triangles.length%3 || mesh.vertices.length<12 || mesh.vertices.length>1152 || mesh.vertices.length%3) fail();
  }
  const {width:w,length:l,height:h,lidThickness:s,label:{width:lw,length:ll,depth:d}}=plan;
  const x=(w-lw)/2,y=(l-ll)/2,z=h+s-d,top=h+s;
  const faces=[{axis:0,p:x,a:[y,y+ll],b:[z,top]}, {axis:0,p:x+lw,a:[y,y+ll],b:[z,top]}, {axis:1,p:y,a:[z,top],b:[x,x+lw]}, {axis:1,p:y+ll,a:[z,top],b:[x,x+lw]}, {axis:2,p:z,a:[x,x+lw],b:[y,y+ll]}];
  let maxSeparation=0,minSharedArea=Infinity;
  for(const face of faces) {
    const ai=(face.axis+1)%3,bi=(face.axis+2)%3;
    function measured(mesh) {
      let area=0,lo=Infinity,hi=-Infinity,count=0;
      for(let i=0;i<mesh.triangles.length;i+=3) {
        const points=[];
        for(let j=0;j<3;j++){const index=mesh.triangles[i+j];if(index*3+2>=mesh.vertices.length)fail();const v=Array.from(mesh.vertices.subarray(index*3,index*3+3));if(v.some(n=>!Number.isFinite(n)))fail();points.push(v);}
        if(points.some(v=>Math.abs(v[face.axis]-face.p)>tolerance || v[ai]<face.a[0]-tolerance || v[ai]>face.a[1]+tolerance || v[bi]<face.b[0]-tolerance || v[bi]>face.b[1]+tolerance))continue;
        const [a,b,c]=points,triangle=Math.abs((b[ai]-a[ai])*(c[bi]-a[bi])-(b[bi]-a[bi])*(c[ai]-a[ai]))/2;
        if(!(triangle>0))fail(); area+=triangle;count++;
        for(const v of points){lo=Math.min(lo,v[face.axis]);hi=Math.max(hi,v[face.axis]);}
      }
      if(!count)fail();return {area,lo,hi};
    }
    const a=measured(lid),b=measured(label),separation=Math.max(a.hi,b.hi)-Math.min(a.lo,b.lo);
    const allowed=(face.a[1]-face.a[0]+2*tolerance)*(face.b[1]-face.b[0]+2*tolerance);
    const shared=a.area+b.area-allowed;
    if(!Number.isFinite(separation)||separation>tolerance||!Number.isFinite(shared)||shared<=0)fail();
    maxSeparation=Math.max(maxSeparation,separation);minSharedArea=Math.min(minSharedArea,shared);
  }
  return {maxSeparationMm:maxSeparation,minSharedAreaMm2:minSharedArea,surfaceCount:faces.length};
}
