// Exact small fact variants; a signed datum coordinate is not a distance.
const fail=()=>{throw Object.assign(Error('Invalid bore annotation facts.'),{code:'INVALID_REQUEST'});};
function fields(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))fail();}
const point=p=>Array.isArray(p)&&p.length===3&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<=4e6);
const pairs=a=>Array.isArray(a)&&a.length===4&&a.every(p=>Array.isArray(p)&&p.length===2&&p.every(point));
export function captureBoreAnnotations(rows,definition){
 if(!Array.isArray(rows)||rows.length!==definition.annotations.length)fail();
 rows.forEach((row,i)=>{const a=definition.annotations[i];fields(row,['annotationId','kind','status','reason','quality','facts']);
  if(row.annotationId!==a.annotationId||row.kind!==a.kind||!['available','unresolved'].includes(row.status))fail();
  if(row.status==='unresolved'){if(typeof row.reason!=='string'||!row.reason||row.reason.length>256||row.quality!==null||row.facts!==null)fail();return;}
  if(row.reason!==null||row.quality!=='native-prism-cut-lineage')fail();const f=row.facts;
  if(a.kind==='bore-center'){fields(f,['center','ends','diameter']);if(!point(f.center)||!Array.isArray(f.ends)||f.ends.length!==2||!f.ends.every(point)||!(f.diameter>0)||f.diameter>8e6)fail();}
  else if(a.kind==='hole-callout'){fields(f,['count','diameter','through','centers']);if(f.count!==4||f.through!==true||!(f.diameter>0)||f.diameter>8e6||!Array.isArray(f.centers)||f.centers.length!==4||!f.centers.every(point))fail();}
  else{const key=a.kind==='ordinate'?'coordinates':'values';fields(f,[key,'anchors']);if(!Array.isArray(f[key])||f[key].length!==4||f[key].some(n=>!Number.isFinite(n)||Math.abs(n)>8e6||key==='values'&&n<0)||!pairs(f.anchors))fail();}
 });return rows;
}
export function unresolvedBoreAnnotations(definition,reason){return definition.annotations.map(a=>({annotationId:a.annotationId,kind:a.kind,status:'unresolved',reason,quality:null,facts:null}));}
