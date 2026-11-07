// Research-only geometry plan; no document or feature publication.
export function enclosurePlan(input) {
  const keys = ["clearance","height","length","lidThickness","lipDepth","unit","wall","width"];
  if (!input || typeof input !== "object" || Reflect.ownKeys(input).sort().join() !== keys.join()) throw Error("INVALID_REQUEST");
  const d = Object.getOwnPropertyDescriptors(input);
  if (keys.some(k => !d[k].enumerable || !("value" in d[k]))) throw Error("INVALID_REQUEST");
  const {width:w,length:l,height:h,wall:t,clearance:c,lidThickness:s,lipDepth:p,unit} = input;
  if (unit !== "millimeter" || ![w,l,h,t,c,s,p].every(n => Number.isFinite(n) && n > 0 && n <= 100000) || 2*(t+c)>=Math.min(w,l) || t>=h || p>=h-t) throw Error("INVALID_DIMENSIONS");
  const overlap = Math.min(t,s,p)*0.01;
  const innerW=w-2*t, innerL=l-2*t, lipW=innerW-2*c, lipL=innerL-2*c;
  const box=(origin,dimensions)=>({op:"solid.box.create",version:1,unit,origin,dimensions});
  return {version:1,unit,body:{outer:box([0,0,0],[w,l,h]),cavity:box([t,t,t],[innerW,innerL,h]),volume:w*l*h-innerW*innerL*(h-t),bounds:{min:[0,0,0],max:[w,l,h]}},lid:{cover:box([0,0,h],[w,l,s]),lip:box([t+c,t+c,h-p],[lipW,lipL,p+overlap]),volume:w*l*s+lipW*lipL*p,bounds:{min:[0,0,h-p],max:[w,l,h+s]}},clearance:c,overlap};
}
// Manifold mesh coordinates are Float32: bound this first supported domain.
export function validateManifoldEnclosureInput(input) {
  const plan=enclosurePlan(input);
  const scale=Math.max(input.width,input.length,input.height+input.lidThickness),minimumFeature=8*Math.max(1e-6,scale*2**-21);
  if([input.width,input.length,input.height,input.wall,input.lidThickness,input.lipDepth].some(n=>n<0.1||n>10000)||input.clearance<0.01||input.clearance>1000||[input.wall,input.lidThickness,input.lipDepth,input.clearance].some(n=>n<minimumFeature))throw Error('UNSUPPORTED_MANIFOLD_PRECISION');
  return plan;
}

// Version 2 adds a centered flush label as an actual complementary solid.
// Version 1 remains an exact, unlabeled input and output contract.
export function enclosurePlanV2(input) {
  const keys=['clearance','height','label','length','lidThickness','lipDepth','unit','wall','width'];
  if(!input||typeof input!=='object'||Reflect.ownKeys(input).some(k=>typeof k!=='string')||Reflect.ownKeys(input).sort().join(',')!==keys.join(','))throw Error('INVALID_REQUEST');
  const fields=Object.getOwnPropertyDescriptors(input);if(keys.some(k=>!fields[k].enumerable||!('value' in fields[k])))throw Error('INVALID_REQUEST');
  const label=fields.label.value, labelKeys=['depth','length','width'];
  if(!label||typeof label!=='object'||Array.isArray(label)||Reflect.ownKeys(label).some(k=>typeof k!=='string')||Reflect.ownKeys(label).sort().join(',')!==labelKeys.join(','))throw Error('INVALID_REQUEST');
  const descriptors=Object.getOwnPropertyDescriptors(label);if(labelKeys.some(k=>!descriptors[k].enumerable||!('value' in descriptors[k])))throw Error('INVALID_REQUEST');
  const l=Object.fromEntries(labelKeys.map(k=>[k,descriptors[k].value]));
  const base=Object.fromEntries(keys.filter(k=>k!=='label').map(k=>[k,fields[k].value])),plan=enclosurePlan(base);
  if(![l.width,l.length,l.depth].every(n=>Number.isFinite(n)&&n>0&&n<=100000)||l.width>=base.width||l.length>=base.length||l.depth>=base.lidThickness)throw Error('INVALID_LABEL_DIMENSIONS');
  const x=(base.width-l.width)/2,y=(base.length-l.length)/2,z=base.height+base.lidThickness-l.depth;
  const box={op:'solid.box.create',version:1,unit:'millimeter',origin:[x,y,z],dimensions:[l.width,l.length,l.depth]};
  return {...plan,version:2,lid:{...plan.lid,volume:plan.lid.volume-l.width*l.length*l.depth},label:{box,volume:l.width*l.length*l.depth,bounds:{min:[x,y,z],max:[x+l.width,y+l.length,z+l.depth]}}};
}
export function validateManifoldEnclosureInputV2(input) {
  const plan=enclosurePlanV2(input),base={};for(const k of ['unit','width','length','height','wall','clearance','lidThickness','lipDepth'])base[k]=input[k];validateManifoldEnclosureInput(base);
  const scale=Math.max(input.width,input.length,input.height+input.lidThickness),minimum=8*Math.max(1e-6,scale*2**-21),label=input.label;
  if([label.width,label.length,label.depth,input.lidThickness-label.depth,(input.width-label.width)/2,(input.length-label.length)/2].some(n=>n<minimum))throw Error('UNSUPPORTED_MANIFOLD_PRECISION');
  return plan;
}
