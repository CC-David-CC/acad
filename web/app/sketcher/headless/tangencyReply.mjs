import {tangentRecord as record,tangentLocator} from './tangencyEnvelope.mjs';
import {TANGENCY_SCHEMAS,tangencyConstantsValid} from '../constr/tangencyDomain.mjs';
const fail=()=>{throw Error('Invalid native tangency discovery.');};
function array(v,max){if(!Array.isArray(v)||v.length>max||Reflect.ownKeys(v).length!==v.length+1)fail();return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();return d.value;});}
const finite=v=>{if(typeof v!=='number'||!Number.isFinite(v))fail();return v;};
function pair(v){const a=array(v,2);if(a.length!==2)fail();return Object.freeze(a.map(finite));}
export function captureTangencyInspection(value,objects,constraints){
 const v=record(value,['targets','rows']),byId=new Map(objects.map(o=>[o.id,o])),declared=constraints.filter(c=>TANGENCY_SCHEMAS.includes(c.typeId)),rows=[],targets=[],rawRows=array(v.rows,10000),rawTargets=array(v.targets,10000),eligible=objects.filter(o=>['Segment','Circle','Arc'].includes(o.type));if(rawRows.length!==declared.length||rawTargets.length!==eligible.length)fail();
 for(let i=0;i<rawTargets.length;i++){const t=record(rawTargets[i],['id','type','stage','canCreate','reason']),o=eligible[i];if(t.id!==o.id||t.type!==o.type||t.stage!==o.stage||typeof t.canCreate!=='boolean'||(t.canCreate?t.reason!==null:t.reason!=='GENERATED_TARGET'))fail();targets.push(Object.freeze(t));}
 for(let i=0;i<rawRows.length;i++){
  const r=record(rawRows[i],['relationId','typeId','objects','constants','stage','index','status','canRemove','reason','geometry']),c=declared[i],refs=array(r.objects,2),constants=record(r.constants,[r.typeId==='TangentCC'?'branch':'inverted']);
  if(refs.length!==2||refs[0]===refs[1]||r.typeId!==c.typeId||r.stage!==c.stage||r.index!==c.index||r.status!==c.admission.state||refs.some((id,j)=>id!==c.objects[j])||!tangencyConstantsValid(r.typeId,constants)||Object.keys(c.constants).length!==1||Object.keys(constants).some(k=>constants[k]!==c.constants[k])||typeof r.canRemove!=='boolean')fail();
  if(r.canRemove){if(r.relationId!==tangentLocator(c.stage,c.index,c)||r.reason!==null||refs.some(id=>!byId.has(id)))fail();const types=refs.map(id=>byId.get(id).type);if(r.typeId==='TangentCC'?types.some(t=>t!=='Circle'):types[0]!=='Segment'||!['Circle','Arc'].includes(types[1]))fail();}
  else if(r.relationId!==null||typeof r.reason!=='string'||!r.reason||r.reason.length>256)fail();
  let g;if(r.typeId==='TangentCC'){g=record(r.geometry,['kind','distance','target','radialResidual','contact']);if(g.kind!=='circle-circle')fail();for(const k of ['distance','target','radialResidual'])finite(g[k]);if(g.distance<=1e-9||g.target<=0||Math.abs(g.radialResidual)>1e-6)fail();g.contact=pair(g.contact);}
  else{g=record(r.geometry,['kind','normal','angleRadians','polarLength','signedDistance','radius','residual','contact','segmentParameter','arcParameter']);if(g.kind!=='line-circular')fail();g.normal=pair(g.normal);g.contact=pair(g.contact);for(const k of ['angleRadians','polarLength','signedDistance','radius','residual','segmentParameter'])finite(g[k]);if(g.radius<=1e-9||Math.abs(g.residual)>1e-6||g.arcParameter!==null&&(typeof g.arcParameter!=='number'||!Number.isFinite(g.arcParameter)||g.arcParameter<0||g.arcParameter>1))fail();if(r.typeId==='FiniteTangentLC'&&(g.segmentParameter<0||g.segmentParameter>1))fail();}
  rows.push(Object.freeze({...r,objects:Object.freeze(refs),constants:Object.freeze(constants),geometry:Object.freeze(g)}));
 }
 return Object.freeze({targets:Object.freeze(targets),rows:Object.freeze(rows)});
}
