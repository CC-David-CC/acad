// Small current facts only. No Native indices, handles or source geometry.
import {captureLinkedPartBoreQuery,captureLinkedPartBoreReference} from '../../drawing/linkedPartDrawingDefinition.mjs';
import {drawingFields,captureDrawingObservationData} from './ownedDrawingReadProtocol.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const point=p=>Array.isArray(p)&&p.length===3&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=4e6);
export const BORE_DISCOVERY_LIMIT=16;
export function captureBoreReadRequest(value){
 const r=drawingFields(value,['op','version','unit','handle','sourceHandle','producerFeatureId','query']);
 if(r.op!=='solid.drawing.bores.read'||r.version!==1||r.unit!=='millimeter')fail('Unsupported bore read.');
 for(const name of ['handle','sourceHandle']){const h=drawingFields(r[name],['mountId','generation','representation','id']);if(typeof h.mountId!=='string'||!h.mountId||h.mountId.length>256||h.generation!==1||h.representation!=='occ-brep-worker-owned'||typeof h.id!=='string'||!h.id||h.id.length>256)fail('Expected an owned bore handle.');r[name]=Object.freeze(h);}
 r.query=captureLinkedPartBoreQuery(r.query);if(r.query.target.featureId!==r.producerFeatureId)fail('Bore target producer differs.');return Object.freeze(r);
}
export function captureBoreFact(value,datum){
 const r=captureDrawingObservationData(value);drawingFields(r,['reference','status','reason','quality','diameter','center','axis','ends','through']);
 const ref=captureLinkedPartBoreReference(r.reference,datum);if(!same(ref,r.reference)||!['available','unresolved'].includes(r.status))fail('Bore reference/status differs.');
 if(r.status==='unresolved'){if(typeof r.reason!=='string'||!r.reason||r.reason.length>256||r.quality!==null||r.diameter!==null||r.center!==null||r.axis!==null||!Array.isArray(r.ends)||r.ends.length!==0||r.through!==null)fail('Unresolved bore carries measured facts.');}
 else{
  if(r.reason!==null||r.quality!=='native-prism-cut-lineage'||typeof r.diameter!=='number'||!(r.diameter>0)||r.diameter>8e6||!point(r.center)||!point(r.axis)||Math.abs(Math.hypot(...r.axis)-1)>1e-8||!Array.isArray(r.ends)||r.ends.length!==2||!r.ends.every(point))fail('Invalid available bore facts.');
  drawingFields(r.through,['status','reason']);if(r.through.status==='available'?r.through.reason!==null:r.through.status!=='unqualified'||!['DRAWING_THROUGH_EXTENT_UNQUALIFIED','DRAWING_THROUGH_VOID_UNQUALIFIED'].includes(r.through.reason))fail('Invalid through-extent fact.');
 }
 return r;
}
export function captureBoreReadResult(value,query){
 const r=captureDrawingObservationData(value);drawingFields(r,['version','unit','scope','quality','featureId','datum','status','reason','bores']);
 if(r.version!==1||r.unit!=='millimeter'||r.scope!=='response-local'||r.quality!=='native-bound-bore-references'||r.featureId!==query.target.featureId||!same(r.datum,query.datum)||!['available','unresolved'].includes(r.status)||!Array.isArray(r.bores)||r.bores.length>BORE_DISCOVERY_LIMIT||!(r.reason===null||typeof r.reason==='string'&&r.reason.length<=256))fail('Bore observation binding differs.');
 const seen=new Set();for(const item of r.bores){const b=captureBoreFact(item,query.datum),key=b.reference.featureId+':'+b.reference.slot;if(seen.has(key))fail('Duplicate semantic bore observation.');seen.add(key);}
 if(r.status==='available'&&(r.reason!==null||r.bores.some(b=>b.status!=='available')))fail('Unresolved bore advertised available.');return r;
}
export function unresolvedBoreRead(query,reason){return captureBoreReadResult({version:1,unit:'millimeter',scope:'response-local',quality:'native-bound-bore-references',featureId:query.target.featureId,datum:query.datum,status:'unresolved',reason,bores:[]},query);}
