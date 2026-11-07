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
