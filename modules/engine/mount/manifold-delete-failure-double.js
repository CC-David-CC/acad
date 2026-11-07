// Controller test double only; it does not load an engine.
self.onmessage = event => {
  const m=event.data;
  if(m?.kind==='init') self.postMessage({kind:'ready'});
  else if(m?.kind==='box') self.postMessage({kind:'result',seq:m.seq,evidence:{empty:false,triangles:12,vertices:8,volume:1,components:1,bounds:{min:[0,0,0],max:[1,1,1]}}});
  else if(m?.kind==='dispose') self.postMessage({kind:'disposed',seq:m.seq,released:false});
};
