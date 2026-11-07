// Narrow research adapter: only one exact axis-aligned rectangular OCC box.
// Triangle soup has no topology identity, so never proximity-weld it.
export function indexOccAxisBox(soup, {minimumSeparation} = {}) {
  if (!Number.isFinite(minimumSeparation) || minimumSeparation<=0 || minimumSeparation>1) throw Error('Explicit minimum vertex separation required');
  if (!soup || !Array.isArray(soup.triangles) || soup.triangles.length!==12) throw Error('Only a 12-triangle box is supported');
  const vertices=[],indices=[],byCoordinate=new Map();
  for(const tri of soup.triangles){
    if(!Array.isArray(tri) || tri.length!==3) throw Error('Invalid triangle soup');
    const out=[];
    for(const point of tri){
      if(!Array.isArray(point) || point.length!==3 || !point.every(x=>Number.isFinite(x)&&Math.abs(x)<=1e9)) throw Error('Invalid soup coordinate');
      const v=point.map(x=>Object.is(x,-0)?0:x),key=v.join(',');
      let index=byCoordinate.get(key);
      if(index===undefined){
        if(vertices.length>=8) throw Error('Soup is not an exact box');
        // Close but unequal positions are ambiguous, not candidates to merge.
        for(const other of vertices) if(Math.hypot(...v.map((x,i)=>x-other[i]))<minimumSeparation) throw Error('Nearby distinct coordinates cannot be welded safely');
        index=vertices.length;vertices.push(v);byCoordinate.set(key,index);
      }
      out.push(index);
    }
    if(new Set(out).size!==3) throw Error('Degenerate triangle');
    indices.push(out);
  }
  if(vertices.length!==8) throw Error('Soup is not an eight-corner box');
  const min=[0,1,2].map(i=>Math.min(...vertices.map(v=>v[i]))),max=[0,1,2].map(i=>Math.max(...vertices.map(v=>v[i])));
  if(min.some((x,i)=>max[i]-x<minimumSeparation) || vertices.some(v=>v.some((x,i)=>x!==min[i]&&x!==max[i]))) throw Error('Soup is not an exact axis-aligned box');
  const faces=Array.from({length:6},()=>[]);
  for(const tri of indices){
    const match=[];for(let axis=0;axis<3;axis++)for(let side=0;side<2;side++)if(tri.every(i=>vertices[i][axis]===(side?max[axis]:min[axis])))match.push(axis*2+side);
    if(match.length!==1) throw Error('Triangle is not on one box face');
    faces[match[0]].push(tri);
  }
  for(let face=0;face<6;face++){
    const ts=faces[face];if(ts.length!==2 || new Set(ts.flat()).size!==4)throw Error('Invalid box face');
    const shared=ts[0].filter(i=>ts[1].includes(i)),axis=Math.floor(face/2),other=[0,1,2].filter(x=>x!==axis);
    if(shared.length!==2 || !other.every(i=>vertices[shared[0]][i]!==vertices[shared[1]][i]))throw Error('Invalid box face diagonal');
  }
  return {vertices,triangles:indices};
}
