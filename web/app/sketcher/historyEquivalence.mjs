// Compare complete serialized native state without two more canonical strings.
function equalJson(a,b){
 if(a===b)return true;
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)!==Array.isArray(b))return false;
 if(Array.isArray(a))return a.length===b.length&&a.every((v,i)=>equalJson(v,b[i]));
 const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
 return ak.length===bk.length&&ak.every((k,i)=>k===bk[i]&&equalJson(a[k],b[k]));
}
export function sameRestoredSketch(expectedText,actualText){
 const expected=JSON.parse(expectedText),actual=JSON.parse(actualText);
 // Existing narrow legacy rule: replay may add previously absent hints.
 // Saved hints, array ordering and every other authored value stay strict.
 if(Array.isArray(expected?.stages)&&Array.isArray(actual?.stages))expected.stages.forEach((stage,i)=>{
  const current=actual.stages[i];
  if(!Array.isArray(stage?.constraints)||!Array.isArray(current?.constraints))return;
  stage.constraints.forEach((c,j)=>{if(c&&current.constraints[j]&&!Object.prototype.hasOwnProperty.call(c,'admission'))delete current.constraints[j].admission;});
 });
 return equalJson(expected,actual);
}
