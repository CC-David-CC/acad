// Strict authored comparison and bounded absolute numeric geometry comparison.
// This is only a pre-return guard, not an equivalence or topology proof.
export function assertCurrentDiagnosticGeometry(before,after){
 const fail=()=>{const e=new Error('The solved sketch differs from the current sketch.');e.code='CURRENT_GEOMETRY_MISMATCH';throw e};
 if(!before||!after||!Array.isArray(before.objects)||!Array.isArray(after.objects)||before.objects.length!==after.objects.length||before.objects.length>10000)fail();
 const intent=x=>JSON.stringify({version:x.version,stages:x.stages,dimensions:x.dimensions,labels:x.labels,constants:x.constants,metadata:x.metadata,boundary:x.boundary,objects:x.objects.map(o=>({id:o.id,type:o.type,role:o.role,stage:o.stage}))});
 if(intent(before)!==intent(after))fail();let visited=0;const todo=before.objects.map((o,i)=>[o.data,after.objects[i].data]);
 while(todo.length){const [a,b]=todo.pop();if(++visited>100000)fail();if(typeof a==='number'||typeof b==='number'){if(typeof a!=='number'||typeof b!=='number'||!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>1e-9)fail();continue}if(a===null||b===null||typeof a!=='object'||typeof b!=='object'){if(a!==b)fail();continue}if(Array.isArray(a)!==Array.isArray(b))fail();const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();if(ak.length!==bk.length||ak.some((k,i)=>k!==bk[i]))fail();for(const k of ak)todo.push([a[k],b[k]]);}
 return true;
}
