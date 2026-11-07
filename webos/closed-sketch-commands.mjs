import {settleScopedCommand} from './scoped-command.mjs';
// Closed-sketch commands use the craft coordinator; no source bytes or handles cross this boundary.
export function registerClosedSketchCommands(host,getTarget){
 const stops=[];
 const id=maxLength=>({type:'string',minLength:1,maxLength});
 function copy(input,keys){
  if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==keys.length||Reflect.ownKeys(input).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Invalid closed-sketch command arguments.');
  const result={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Invalid closed-sketch command arguments.');result[key]=d.value;}return result;
 }
 const validId=(x,max)=>typeof x==='string'&&x.length>0&&x.length<=max;
 function target(method){
  const captured=getTarget(),session=host.session();
  const valid=()=>{try{return !!session&&!host.signal.aborted&&host.session()===session&&captured.valid()===true}catch{return false}};
  if(!valid()||typeof captured.craft?.[method]!=='function')throw Error('This closed-sketch command is unavailable in this modeling window.');
  return {craft:captured.craft,valid};
 }
 const spec=(keys,properties)=>({type:'object',additionalProperties:false,required:keys,properties});
 try{
  stops.push(host.commands.register({id:'inspect-closed-sketches',description:'Discover supported closed sketch targets and a current revision.',parameters:{type:'object',additionalProperties:false}},args=>{
   copy(args,[]);const t=target('inspectSketchTransitions'),result=t.craft.inspectSketchTransitions();if(!t.valid())throw Error('The window or account changed.');return result;
  }));
  const inspect=['revision','faceId'];
  stops.push(host.commands.register({id:'inspect-closed-sketch',description:'Inspect bounded authored objects and constraints in a current closed sketch.',parameters:spec(inspect,{revision:id(256),faceId:id(1024)})},async args=>{
   const v=copy(args,inspect);if(!validId(v.revision,256)||!validId(v.faceId,1024))throw Error('Provide a current closed-sketch target.');const t=target('inspectClosedSketch');return settleScopedCommand(t.craft.inspectClosedSketch(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  const apply=['revision','faceId','ids','factor','offset'];
  stops.push(host.commands.register({id:'apply-closed-sketch-length-relation',description:'Apply a driving length relation to two inspected segments in a closed sketch. Save separately.',parameters:spec(apply,{revision:id(256),faceId:id(1024),ids:{type:'array',minItems:2,maxItems:2,uniqueItems:true,items:id(256)},factor:{type:'number',minimum:0},offset:{type:'number'}})},async args=>{
   const v=copy(args,apply);if(!validId(v.revision,256)||!validId(v.faceId,1024)||!Array.isArray(v.ids)||v.ids.length!==2||Reflect.ownKeys(v.ids).length!==3||typeof v.factor!=='number'||!Number.isFinite(v.factor)||v.factor<0||typeof v.offset!=='number'||!Number.isFinite(v.offset))throw Error('Provide current segment IDs and finite relation values.');
   const ids=[0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(v.ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!validId(d.value,256))throw Error('Provide current segment IDs and finite relation values.');return d.value;});if(ids[0]===ids[1])throw Error('Provide two distinct segment IDs.');v.ids=Object.freeze(ids);
   const t=target('applySketchLengthRelation');return settleScopedCommand(t.craft.applySketchLengthRelation(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  const lineRelation=['revision','faceId','kind','ids'];
  stops.push(host.commands.register({id:'apply-closed-sketch-line-relation',description:'Apply collinear to two inspected segments, or axis-symmetry to two inspected points followed by their live nondegenerate axis segment. Both use infinite supporting lines through the validated Worker operation. Exact existing relations are no-ops; save new relations separately.',parameters:spec(lineRelation,{revision:id(256),faceId:id(1024),kind:{enum:['collinear','axis-symmetry']},ids:{type:'array',minItems:2,maxItems:3,uniqueItems:true,items:id(256)}})},async args=>{
   const v=copy(args,lineRelation),count=v.kind==='axis-symmetry'?3:2;if(!validId(v.revision,256)||!validId(v.faceId,1024)||!['collinear','axis-symmetry'].includes(v.kind)||!Array.isArray(v.ids)||v.ids.length!==count||Reflect.ownKeys(v.ids).length!==count+1)throw Error('Provide two current segment IDs for collinear, or two point IDs and a live axis segment for axis-symmetry.');
   v.ids=Object.freeze(Array.from({length:count},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v.ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!validId(d.value,256))throw Error('Provide current relation target IDs.');return d.value;}));if(new Set(v.ids).size!==count)throw Error('Provide distinct relation target IDs.');
   const t=target('applySketchLineRelation');return settleScopedCommand(t.craft.applySketchLineRelation(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  const signedDistance=['revision','faceId','axis','ids','distance'];
  stops.push(host.commands.register({id:'apply-closed-sketch-signed-distance',description:'Drive first-to-second point displacement in sketch millimeters through the validated Worker operation. X/Y use sketch coordinates; projected uses a third, live direction segment oriented start to end. Save separately.',parameters:spec(signedDistance,{revision:id(256),faceId:id(1024),axis:{enum:['x','y','projected']},ids:{type:'array',minItems:2,maxItems:3,items:id(256)},distance:{type:'number',minimum:-1000000,maximum:1000000}})},async args=>{
   const v=copy(args,signedDistance),count=v.axis==='projected'?3:2;
   if(!validId(v.revision,256)||!validId(v.faceId,1024)||!['x','y','projected'].includes(v.axis)||!Array.isArray(v.ids)||v.ids.length!==count||Reflect.ownKeys(v.ids).length!==count+1||typeof v.distance!=='number'||!Number.isFinite(v.distance)||Math.abs(v.distance)>1e6)throw Error('Provide current point IDs, a signed millimeter distance and a live direction segment for projection.');
   v.ids=Object.freeze(Array.from({length:count},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v.ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!validId(d.value,256))throw Error('Provide current signed-distance IDs.');return d.value;}));
   if(v.ids[0]===v.ids[1])throw Error('Provide two distinct point IDs.');
   const t=target('applySketchSignedDistance');return settleScopedCommand(t.craft.applySketchSignedDistance(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  const concentric=['revision','faceId','ids'];
  stops.push(host.commands.register({id:'apply-closed-sketch-concentric',description:'Make two inspected circles or arcs share a center using the validated CAD operation. Save separately.',parameters:spec(concentric,{revision:id(256),faceId:id(1024),ids:{type:'array',minItems:2,maxItems:2,uniqueItems:true,items:id(256)}})},async args=>{
   const v=copy(args,concentric);if(!validId(v.revision,256)||!validId(v.faceId,1024)||!Array.isArray(v.ids)||v.ids.length!==2||Reflect.ownKeys(v.ids).length!==3)throw Error('Provide current circle or arc IDs.');
   v.ids=Object.freeze([0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(v.ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!validId(d.value,256))throw Error('Provide current circle or arc IDs.');return d.value;}));
   if(v.ids[0]===v.ids[1])throw Error('Provide two distinct circle or arc IDs.');const t=target('applySketchConcentric');return settleScopedCommand(t.craft.applySketchConcentric(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  const pointEdit=['revision','faceId','id','x','y'];
  stops.push(host.commands.register({id:'edit-closed-sketch-point',description:'Set an inspected native point coordinate using the validated sketch operation. Save separately.',parameters:spec(pointEdit,{revision:id(256),faceId:id(1024),id:id(256),x:{type:'number',minimum:-100000000,maximum:100000000},y:{type:'number',minimum:-100000000,maximum:100000000}})},async args=>{const v=copy(args,pointEdit);if(!validId(v.revision,256)||!validId(v.faceId,1024)||!validId(v.id,256)||![v.x,v.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Provide current point identity and finite sketch coordinates.');const t=target('editClosedSketchPoint');return settleScopedCommand(t.craft.editClosedSketchPoint(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});}));
  const pointBatch=['revision','faceId','points'];
  stops.push(host.commands.register({id:'edit-closed-sketch-points',description:'Move one bounded batch of inspected native points atomically through the shared Worker solve and authored journal. Existing driving constraints are retained; save separately.',parameters:spec(pointBatch,{revision:id(256),faceId:id(1024),points:{type:'array',minItems:1,maxItems:32,items:{type:'object',additionalProperties:false,required:['id','x','y'],properties:{id:id(256),x:{type:'number',minimum:-100000000,maximum:100000000},y:{type:'number',minimum:-100000000,maximum:100000000}}}}})},async args=>{
   const v=copy(args,pointBatch);if(!validId(v.revision,256)||!validId(v.faceId,1024)||!Array.isArray(v.points)||Object.getPrototypeOf(v.points)!==Array.prototype||v.points.length<1||v.points.length>32||Reflect.ownKeys(v.points).length!==v.points.length+1)throw Error('Provide one bounded batch of inspected point coordinates.');
   const points=Array.from({length:v.points.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v.points,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Coordinate points must be dense data.');const p=copy(d.value,['id','x','y']);if(!validId(p.id,256)||![p.x,p.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw Error('Provide current point IDs and finite sketch coordinates.');return Object.freeze({id:p.id,x:p.x,y:p.y});});
   if(new Set(points.map(p=>p.id)).size!==points.length)throw Error('Provide distinct inspected point IDs.');v.points=Object.freeze(points);const t=target('editClosedSketchPoints');return settleScopedCommand(t.craft.editClosedSketchPoints(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
  }));
  // Existing driving dimensions are addressed only by discovered opaque locators.
  // Canonical millimeters and typed length names share the same core operation.
  for(const [command,method,action] of [
   ['edit-closed-sketch-dimension','editClosedSketchDimension','edit'],
   ['remove-closed-sketch-dimension','removeClosedSketchDimension','remove']
  ]){
   const keys=action==='edit'?['revision','faceId','constraintId','value']:['revision','faceId','constraintId'];
   const properties={revision:id(256),faceId:id(1024),constraintId:id(4096),...(action==='edit'?{value:{oneOf:[{type:'number',exclusiveMinimum:0,maximum:1000000},{type:'string',minLength:1,maxLength:128,pattern:'^[A-Za-z_$][A-Za-z0-9_$]{0,127}$'}]}}:{})};
   stops.push(host.commands.register({id:command,description:action==='edit'?'Edit one inspected driving length or diameter using canonical millimeters or a typed length name. Rediscover after editing; save separately.':'Remove one inspected driving length or diameter. Other relationships remain and may become active. Save separately.',parameters:spec(keys,properties)},async args=>{
    const v=copy(args,keys);
    if(!validId(v.revision,256)||!validId(v.faceId,1024)||!validId(v.constraintId,4096)||action==='edit'&&!(typeof v.value==='number'&&Number.isFinite(v.value)&&v.value>0&&v.value<=1e6||typeof v.value==='string'&&/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(v.value)))throw Error('Provide a current inspected dimension and a positive millimeter value or typed length name.');
    const t=target(method);return settleScopedCommand(t.craft[method](Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});
   }));
  }
  const diameterEdit=['revision','faceId','id','diameter'];
  stops.push(host.commands.register({id:'apply-closed-sketch-diameter',description:'Add a driving circle or arc diameter in millimeters. Save separately.',parameters:spec(diameterEdit,{revision:id(256),faceId:id(1024),id:id(256),diameter:{type:'number',exclusiveMinimum:0,maximum:1000000}})},async args=>{const v=copy(args,diameterEdit);if(!validId(v.revision,256)||!validId(v.faceId,1024)||!validId(v.id,256)||typeof v.diameter!=='number'||!Number.isFinite(v.diameter)||v.diameter<=0||v.diameter>1e6)throw Error('Provide current curve identity and positive diameter.');const t=target('applySketchDiameter');return settleScopedCommand(t.craft.applySketchDiameter(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});}));
  stops.push(host.commands.register({id:'open-worker-sketch-view',description:'Open a partial geometry and selection view computed by the sketch Worker. Legacy drawing tools are not attached.',parameters:spec(inspect,{revision:id(256),faceId:id(1024)})},async args=>{const v=copy(args,inspect);if(!validId(v.revision,256)||!validId(v.faceId,1024))throw Error('Provide a current sketch target.');const t=target('openWorkerSketchView');return settleScopedCommand(t.craft.openWorkerSketchView(Object.freeze(v),{signal:host.signal,valid:t.valid}),{signal:host.signal,valid:t.valid});}));
  for(const [command,method,description] of [['inspect-worker-sketch-view','inspectWorkerSketchView','Inspect projected geometry IDs, selection and unavailable capabilities.'],['close-worker-sketch-view','closeWorkerSketchView','Close this window’s Worker sketch view.']])stops.push(host.commands.register({id:command,description,parameters:{type:'object',additionalProperties:false}},args=>{copy(args,[]);const t=target(method),result=t.craft[method]();if(!t.valid())throw Error('The window or account changed.');return result;}));
  const selection=['revision','ids'];
  stops.push(host.commands.register({id:'select-worker-sketch-view',description:'Select projected geometry by inspected stable IDs.',parameters:spec(selection,{revision:id(256),ids:{type:'array',maxItems:64,uniqueItems:true,items:id(256)}})},async args=>{const v=copy(args,selection);if(!validId(v.revision,256)||!Array.isArray(v.ids)||v.ids.length>64||Reflect.ownKeys(v.ids).length!==v.ids.length+1)throw Error('Provide current sketch IDs.');v.ids=Object.freeze(Array.from({length:v.ids.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v.ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!validId(d.value,256))throw Error('Provide current sketch IDs.');return d.value;}));const t=target('selectWorkerSketchView');return settleScopedCommand(t.craft.selectWorkerSketchView(Object.freeze(v)),{signal:host.signal,valid:t.valid});}));
 }catch(error){for(const stop of stops.reverse())stop();throw error;}
 return ()=>{for(const stop of stops.splice(0).reverse())stop();};
}
