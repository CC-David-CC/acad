// Protocol-only test double; it never represents kernel evidence.
self.onmessage=({data:m})=>{
 if(m.kind==='init')return setTimeout(()=>self.postMessage({kind:'ready'}),5);
 if(m.kind==='box')return setTimeout(()=>self.postMessage({kind:'result',seq:m.seq,token:m.token,evidence:{resultKind:'single-material',materialRegions:1,voidRegions:0,validLevel0:true,validLevel2:true,manifoldPredicate:true,volumeQuality:'native-relative-0.001',volume:1,bounds:{min:[0,0,0],max:[1,1,1]}}}),30);
 if(m.kind==='mesh')return setTimeout(()=>self.postMessage({kind:'mesh',seq:m.seq,token:m.token,triangleCount:1,buffer:new ArrayBuffer(72),evidence:{resultKind:'single-material',materialRegions:1,voidRegions:0,validLevel0:true,validLevel2:true,manifoldPredicate:true,volumeQuality:'native-relative-0.001',volume:2,bounds:{min:[0,0,0],max:[1,1,1]}}}),5);
};
