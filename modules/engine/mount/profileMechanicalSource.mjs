// A bounded DERIVED source descriptor. It is never saved or accepted as a
// caller flag. Derivation runs only in Workers from the actual prepared face;
// Main uses capture only, with the model/source/history/metrics binding.
const reasons=Object.freeze(['SOURCE_HOLES','NON_RECTANGULAR_SOURCE','NON_AXIS_RECTANGLE']);
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
function fields(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('Expected exact derived mechanical source fields.');const r={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Mechanical source descriptors must be own data.');r[key]=d.value;}return r;}
function array(value,length){if(!Array.isArray(value)||Object.getOwnPropertyDescriptor(value,'length')?.value!==length||Reflect.ownKeys(value).length!==length+1)fail('Expected bounded dense mechanical source data.');return Array.from({length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Mechanical source arrays must be own data.');return d.value;});}
export function captureProfileMechanicalSource(input){
 const kind=Object.getOwnPropertyDescriptor(input||{},'kind');if(!kind?.enumerable||!Object.hasOwn(kind,'value'))fail('Expected a derived mechanical source kind.');
 if(kind.value==='unsupported'){const r=fields(input,['version','kind','reason']);if(r.version!==1||!reasons.includes(r.reason))fail('Unknown mechanical source scope.');return freeze(r);}
 const r=fields(input,['version','kind','curveIds','vertices']);if(r.version!==1||r.kind!=='axis-rectangle')fail('Unknown mechanical source descriptor.');
 r.curveIds=array(r.curveIds,4);if(r.curveIds.some(id=>typeof id!=='string'||!id||id.length>256)||new Set(r.curveIds).size!==4)fail('Actual four distinct source curve identities are required.');
 r.vertices=array(r.vertices,4).map(point=>array(point,2).map(n=>{if(typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e6)fail('Mechanical source coordinates must be bounded finite original data.');return n;}));
 // Capturing is only small data admission. It intentionally does not infer
 // axis/rectangle geometry on Main or certify membership from caller data.
 return freeze(r);
}
export function deriveProfileMechanicalSource(preparedFace){
 const p=preparedFace.request,outer=preparedFace.loops[0],unsupported=reason=>captureProfileMechanicalSource({version:1,kind:'unsupported',reason});
 if(p.region.holes.length)return unsupported('SOURCE_HOLES');
 if(p.region.boundaryProvenance||outer.kind!=='polygon'||outer.vertices.length!==4||p.region.outer.length!==4||p.region.outer.some(c=>c.kind!=='segment'))return unsupported('NON_RECTANGULAR_SOURCE');
 const vs=outer.vertices,minX=Math.min(...vs.map(p=>p[0])),maxX=Math.max(...vs.map(p=>p[0])),minY=Math.min(...vs.map(p=>p[1])),maxY=Math.max(...vs.map(p=>p[1]));
 if(!(minX<maxX&&minY<maxY)||new Set(vs.map(p=>JSON.stringify(p))).size!==4||vs.some((p,i)=>{const q=vs[(i+1)%4];return ![minX,maxX].includes(p[0])||![minY,maxY].includes(p[1])||((p[0]===q[0])===(p[1]===q[1]));}))return unsupported('NON_AXIS_RECTANGLE');
 const same=(a,b)=>a[0]===b[0]&&a[1]===b[1],used=new Set(),curveIds=vs.map((a,i)=>{
  const b=vs[(i+1)%4],matches=p.region.outer.filter(c=>same(c.a,a)&&same(c.b,b)||same(c.a,b)&&same(c.b,a));
  if(matches.length!==1||used.has(matches[0].id))fail('Prepared rectangle lost its unique actual source-edge correspondence.','ENGINE_FAILURE');used.add(matches[0].id);return matches[0].id;
 });
 // Loop index i means the actual curve between represented vertices i and
 // (i+1)%4. Original curve direction is not rewritten or used as a new flag.
 return captureProfileMechanicalSource({version:1,kind:'axis-rectangle',curveIds,vertices:vs.map(p=>[...p])});
}
