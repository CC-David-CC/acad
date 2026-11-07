// Compare identity captured directly from the live Worker solver to its final
// native serialization. It does not authorize live-Viewer installation.
export function buildProjectionWitness(serializedSketch,rows,expectedFrame){
  const fail=()=>{throw Error('Invalid sketch projection witness.')};
  if(typeof serializedSketch!=='string'||serializedSketch.length>1048576||!Array.isArray(rows)||rows.length>10000)fail();
  const sketch=JSON.parse(serializedSketch),frame=sketch?.metadata?.boundaryFrame,axes=['origin','x','y','z'];
  const isFrame=f=>f&&typeof f==='object'&&!Array.isArray(f)&&Object.keys(f).sort().join(',')==='origin,x,y,z'&&axes.every(k=>Array.isArray(f[k])&&f[k].length===3&&f[k].every(Number.isFinite));
  if(!isFrame(frame)||!isFrame(expectedFrame)||!axes.every(k=>frame[k].every((n,i)=>Object.is(n,expectedFrame[k][i]))))fail();
  if(!Array.isArray(sketch.stages)||!sketch.stages.length||sketch.stages.length>32)fail();
  let offset=0,totalRefs=0,totalChars=0;const stages=[];
  for(let stage=0;stage<sketch.stages.length;stage++){
    const src=sketch.stages[stage];if(!Array.isArray(src.constraints)||!Array.isArray(src.generators))fail();const constraints=[];
    for(let index=0;index<src.constraints.length;index++){
      const c=src.constraints[index],row=rows[offset++],constants=c?.constants??{},actual=row?.constants??{};
      if(!c||!row||row.stage!==stage||row.index!==index||typeof c.typeId!=='string'||!c.typeId||c.typeId.length>256||c.typeId!==row.typeId||!['accepted','redundant'].includes(row.admission)||c.admission?.version!==1||c.admission.state!==row.admission||!Array.isArray(c.objects)||!Array.isArray(row.objects)||c.objects.length>1024||c.objects.length!==row.objects.length||!c.objects.every((x,i)=>typeof x==='string'&&x.length>0&&x.length<=1024&&x===row.objects[i]))fail();
      totalRefs+=c.objects.length;totalChars+=c.typeId.length+c.objects.reduce((n,x)=>n+x.length,0);if(totalRefs>100000||totalChars>1048576)fail();
      if(!constants||typeof constants!=='object'||Array.isArray(constants)||!actual||typeof actual!=='object'||Array.isArray(actual)||Object.keys(constants).length>64||Object.keys(constants).length!==Object.keys(actual).length)fail();
      for(const [key,value] of Object.entries(constants)){if(!key||key.length>256||!Object.hasOwn(actual,key)||!Object.is(actual[key],value)||!['string','boolean','number'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value))fail();totalChars+=key.length+(typeof value==='string'?value.length:0);if(totalChars>1048576)fail();}
      constraints.push({stage,index,typeId:c.typeId,objects:[...c.objects],constants:{...constants},admission:row.admission});
    }
    stages.push({index:stage,generatorCount:src.generators.length,constraints});
  }
  if(offset!==rows.length)fail();
  return {frame:{origin:[...frame.origin],x:[...frame.x],y:[...frame.y],z:[...frame.z]},stages};
}
