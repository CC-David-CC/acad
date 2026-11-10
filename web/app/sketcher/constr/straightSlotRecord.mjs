import {arcBranchFacts,arcDataFromObject} from '../shapes/arcBranch.mjs';
// Data capture is not native ownership authority.
export const slotFail=(code,message)=>{throw Object.assign(Error(message),{code});};
export function slotRecord(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).length!==keys.length)slotFail('INVALID_REQUEST','Invalid straight Slot record.');const out=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))slotFail('INVALID_REQUEST','Slot fields must be own data.');out[k]=d.value;}return out;}
export function slotPoint(v){const p=slotRecord(v,['x','y']);if(![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))slotFail('INVALID_REQUEST','Slot coordinates must be finite within the existing sketch envelope.');return Object.freeze(p);}
export function slotId(v){if(typeof v!=='string'||!v||v.length>256)slotFail('INVALID_REQUEST','Invalid Slot identity.');return v;}
export function slotMembers(v){if(!Array.isArray(v)||v.length!==5||Reflect.ownKeys(v).length!==6)slotFail('INVALID_REQUEST','Slot requires five actual ordered members.');const out=[];for(let i=0;i<5;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))slotFail('INVALID_REQUEST','Slot members must be dense own data.');out.push(slotId(d.value));}if(new Set(out).size!==5)slotFail('INVALID_REQUEST','Slot members must be distinct.');return Object.freeze(out);}
export function captureSlotDimensions(v){const a=slotRecord(v,['a','b','radius']);a.a=slotPoint(a.a);a.b=slotPoint(a.b);if(typeof a.radius!=='number'||!Number.isFinite(a.radius)||a.radius<=0)slotFail('INVALID_REQUEST','Slot radius must be a positive finite millimeter value.');return Object.freeze(a);}
export function captureSlotIntent(v){const a=slotRecord(v,['action','slotId','a','b','radius','members','stage']),d=captureSlotDimensions({a:a.a,b:a.b,radius:a.radius});slotId(a.slotId);if(a.action==='create'){a.members=slotMembers(a.members);if(a.members[0]!==a.slotId||!Number.isSafeInteger(a.stage)||a.stage<0||a.stage>31)slotFail('INVALID_REQUEST','Invalid private Slot creation identity/stage.');}else if(a.action==='edit'){if(a.members!==null||a.stage!==null)slotFail('INVALID_REQUEST','Edits resolve member ownership from the actual source.');}else slotFail('INVALID_REQUEST','Invalid Slot action.');return Object.freeze({...a,...d});}
export function captureSlotReceipt(v){const a=slotRecord(v,['slotId','stage','members','a','b','radius']);slotId(a.slotId);a.members=slotMembers(a.members);if(a.members[0]!==a.slotId||!Number.isSafeInteger(a.stage)||a.stage<0||a.stage>31)slotFail('INVALID_RESPONSE','Invalid Slot receipt identity.');return Object.freeze({...a,...captureSlotDimensions({a:a.a,b:a.b,radius:a.radius})});}
export function slotLiteral(v){if(typeof v!=='string'||!/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(v)||!Number.isFinite(Number(v))||Number(v)<=0)slotFail('UNSUPPORTED_SLOT_RADIUS','StraightSlot currently requires a full-roundtrip positive radius literal.');return Number(v);}
export function straightSlotGeometry(a,b,r){
 const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);if(!Number.isFinite(L)||L<=1e-9||r<=1e-9||r>1e8)slotFail('UNSUPPORTED_SLOT_SCALE','Slot exceeds the existing Segment/Arc numerical envelope.');
 const nx=-dy/L,ny=dx/L,offset=(p,s)=>({x:p.x+s*r*nx,y:p.y+s*r*ny}),ap=offset(a,1),am=offset(a,-1),bp=offset(b,1),bm=offset(b,-1);
 if([a,b,ap,am,bp,bm].some(p=>![p.x,p.y].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e8)))slotFail('UNSUPPORTED_SLOT_SCALE','Slot boundary exceeds existing coordinate limits.');
 return [{a,b},{a:bp,b:ap},{a:ap,b:am,c:a,branch:'proper-ccw'},{a:am,b:bm},{a:bm,b:bp,c:b,branch:'proper-ccw'}];
}
export function assertSlotBranch(objects,r){
 const types=['Segment','Segment','Arc','Segment','Arc'];if(objects.length!==5||new Set(objects).size!==5||objects.some((o,i)=>!o||o.TYPE!==types[i]||o.parent))slotFail('INVALID_SLOT_SOURCE','Invalid declared Slot member types/root ownership.');
 const [axis,,start,,end]=objects;if([start,end].some(arc=>arcBranchFacts(arcDataFromObject(arc)).branch!=='proper-ccw'))slotFail('INVALID_SLOT_BRANCH','Slot caps must retain their actual proper Arc declaration.');if(axis.role!=='construction'||objects.slice(1).some(o=>o.role!==null&&o.role!==undefined))slotFail('INVALID_SLOT_SOURCE','Slot axis must be construction and its boundary ordinary.');
 straightSlotGeometry(axis.a,axis.b,r);
 const angle=axis.params.ang.get(),t=axis.params.t.get();if(!Number.isFinite(angle)||!Number.isFinite(t)||Math.abs(t)<=1e-9)slotFail('INVALID_SLOT_SOURCE','Slot axis has no regular physical direction.');
 const nx=-Math.sin(angle)*Math.sign(t),ny=Math.cos(angle)*Math.sign(t);
 for(const [arc,sign] of [[start,1],[end,-1]])for(const [point,side] of [[arc.a,sign],[arc.b,-sign]])if(![point.x,point.y,arc.c.x,arc.c.y].every(Number.isFinite)||side*((point.x-arc.c.x)*nx+(point.y-arc.c.y)*ny)<=0)slotFail('INVALID_SLOT_BRANCH','Slot cap has the wrong directed semicircle branch.');
}
export function assertSlotNative(objects,r){
 assertSlotBranch(objects,r);const expected=straightSlotGeometry(objects[0].a,objects[0].b,r),near=(p,q)=>Math.abs(p.x-q.x)<=5e-8&&Math.abs(p.y-q.y)<=5e-8;
 for(let i=0;i<5;i++){const o=objects[i],e=expected[i];if(!near(o.a,e.a)||!near(o.b,e.b)||e.c&&(!near(o.c,e.c)||!Number.isFinite(o.r.get())||Math.abs(o.r.get()-r)>1e-9))slotFail('SLOT_GEOMETRY_MISMATCH','Actual native members do not represent the declared directed Slot.');}
 return expected;
}
