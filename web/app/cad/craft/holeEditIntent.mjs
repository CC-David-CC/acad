// Pure capture/validation for the supported authored hole edits. This module
// does not modify history or confer permission to publish a candidate.
const TYPE = Object.freeze({centered:'WORKER_CENTERED_THROUGH_HOLE_V1', corners:'WORKER_FOUR_CORNER_THROUGH_HOLES_V1'});
const error = message => { throw new Error(message); };
const aborted = () => new DOMException('The inspected document revision is stale.', 'AbortError');
function record(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) error('Invalid hole edit.');
  const proto=Object.getPrototypeOf(value);
  if ((proto!==null && Object.getPrototypeOf(proto)!==null) || Reflect.ownKeys(value).length!==keys.length ||
      Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k))) error('Invalid hole edit.');
  const out={};
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))error('Hole edit fields must be data.');out[key]=d.value;}
  return out;
}
const number = n => typeof n==='number' && Number.isFinite(n) && n>0 && n<=1e6;
const data = (obj,key) => {const d=obj&&Object.getOwnPropertyDescriptor(obj,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))error('Invalid authored hole.');return d.value;};

// snapshot is supplied by the coordinator after its own host, document,
// busy, geometry and publication guards. Captured values contain no model,
// native pointer, face reference, or mutable history object.
export function captureHoleEdit(kind, input, snapshot) {
  if(!Object.hasOwn(TYPE,kind))error('Unsupported hole edit.');
  const dimensions=kind==='centered'?['diameter']:['diameter','offsetX','offsetY'];
  const args=record(input,['revision','index','featureId',...dimensions]);
  if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||!Number.isSafeInteger(args.index)||args.index<0||args.index>255||!Number.isSafeInteger(args.featureId)||args.featureId<1||dimensions.some(k=>!number(args[k])))error('Invalid hole edit.');
  if(!snapshot||typeof snapshot.revision!=='string'||args.revision!==snapshot.revision)throw aborted();
  const history=snapshot.history;
  if(!Array.isArray(history)||history.length>256||snapshot.pointer!==history.length-1||args.index>=history.length)error('The complete current history is required.');
  const entry=history[args.index],type=data(entry,'type'),params=data(entry,'params'),rawId=data(params,'featureId');
  const featureId=typeof rawId==='number'?rawId:typeof rawId==='string'&&/^[1-9][0-9]*$/.test(rawId)?Number(rawId):NaN;
  if(type!==TYPE[kind]||!Number.isSafeInteger(featureId)||featureId!==args.featureId)error('The inspected hole target is unavailable.');
  const before={},after={};
  for(const key of dimensions){const value=data(params,key);if(!number(value))error('The authored dimension is unsupported.');before[key]=value;after[key]=args[key];}
  if(dimensions.every(key=>Object.is(before[key],after[key])))error('The hole parameters are unchanged.');
  return Object.freeze({kind,type,index:args.index,featureId,revision:args.revision,before:Object.freeze(before),after:Object.freeze(after)});
}
