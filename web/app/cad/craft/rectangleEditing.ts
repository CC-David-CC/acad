import {runSketchSolve} from 'sketcher/headless/client';
import rectangleWorkerUrl from 'codi-headless-sketch-worker';
import {validateProjectSketch} from 'sketcher/io';
import {PreparedSketchCommand} from './rectangleCreation';
import {MOpenFaceShell} from '../model/mopenFace';
import {captureAuthoredHistory} from './captureAuthoredHistory.mjs';
import {sketchRevision} from './sketchRevision.mjs';
import {captureSketchFailure} from 'sketcher/constr/admissionCause.mjs';

function aborted(committed=false) {
  const error=new DOMException(committed?'Accepted rectangle edit was superseded.':'Rectangle edit was cancelled or superseded.','AbortError');
  Object.defineProperty(error,'committed',{value:committed,enumerable:true});return error;
}
function capture(value:any,keys:string[]) {
  const prototype=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Invalid rectangle edit.');
  const result:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Rectangle edit fields must be data.');result[key]=d.value;}return result;
}
function captureOptions(value:any) {
  if(value===undefined)value={};if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!['signal','valid'].includes(k)))throw Error('Invalid rectangle edit options.');
  const result:any={};for(const key of Reflect.ownKeys(value) as string[]){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Invalid rectangle edit options.');result[key]=d.value;}
  if(result.valid!==undefined&&typeof result.valid!=='function')throw Error('Invalid lifetime guard.');
  if(result.signal!==undefined){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(result.signal)}catch{throw Error('Invalid cancellation signal.');}}
  return result;
}

const rectangleIds=['rect-0','rect-1','rect-2','rect-3'];
const rectangleReferences=new Set(rectangleIds.flatMap(id=>[id,id+':A',id+':B']));
function rectangleSegments(sketch:any) {
  return rectangleIds.map(id=>{
    const matches=sketch.objects.filter((o:any)=>o.id===id);
    if(matches.length!==1||matches[0].type!=='Segment'||matches[0].role!==null||matches[0].stage!==0)throw Error('The authored rectangle edges are ambiguous or unsupported.');
    return matches[0];
  });
}
function authoredRectangle(source:string) {
  if(typeof source!=='string'||source.length>65536)throw Error('A bounded authored rectangle sketch is required.');
  let sketch;try{sketch=JSON.parse(source);validateProjectSketch(sketch);}catch{throw Error('The authored rectangle sketch is invalid.');}
  if(!Array.isArray(sketch.objects)||sketch.objects.length<4||!Array.isArray(sketch.stages)||sketch.stages.length!==1||!Array.isArray(sketch.stages[0].constraints)||!Array.isArray(sketch.stages[0].generators)||sketch.stages[0].generators.length||
     !sketch.boundary||!['lines','arcs','circles','nurbses'].every(k=>Array.isArray(sketch.boundary[k])&&sketch.boundary[k].length===0))throw Error('Only an authored four-segment rectangle on a sketch plane is supported.');
  const segments=rectangleSegments(sketch),unrelated=sketch.objects.filter((o:any)=>!rectangleIds.includes(o.id));
  // Points do not contribute profile edges. Other unrelated geometry remains
  // unsupported here until its edit/travel preservation is qualified.
  if(unrelated.some((o:any)=>o.type!=='Point'||o.role!==null||o.stage!==0||rectangleReferences.has(o.id)))throw Error('Only independent ordinary Points may accompany the authored rectangle.');
  const constraints=sketch.stages[0].constraints,targets=['rect-0','rect-1'].map(id=>constraints.filter((c:any)=>c.typeId==='SegmentLength'&&Array.isArray(c.objects)&&c.objects.length===1&&c.objects[0]===id));
  if(constraints.some((c:any)=>!Array.isArray(c.objects)||(c.objects.some((id:string)=>rectangleReferences.has(id))&&!c.objects.every((id:string)=>rectangleReferences.has(id)))))throw Error('Rectangle dimensions cannot drive constraints coupled to unrelated objects.');
  if(targets.some((matches:any[])=>matches.length!==1)||targets.some((matches:any[])=>typeof matches[0].constants?.length!=='string'||!matches[0].constants.length.trim()||!Number.isFinite(Number(matches[0].constants.length))||Number(matches[0].constants.length)<0.001||Number(matches[0].constants.length)>1e6))throw Error('The rectangle driving dimensions are ambiguous or unsupported.');
  const width=Number(targets[0][0].constants.length),height=Number(targets[1][0].constants.length),origin=segments[0].data?.a;
  if(!origin||![origin.x,origin.y].every((n:any)=>typeof n==='number'&&Number.isFinite(n)))throw Error('Invalid authored rectangle geometry.');
  const corners=[origin,{x:origin.x+width,y:origin.y},{x:origin.x+width,y:origin.y+height},{x:origin.x,y:origin.y+height}];
  for(let i=0;i<4;i++)for(const [end,corner] of [['a',corners[i]],['b',corners[(i+1)%4]]] as [string,any][])for(const axis of ['x','y']){
    const value=segments[i].data?.[end]?.[axis];
    if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value-corner[axis])>1e-6)throw Error('The authored rectangle geometry does not match its driving dimensions.');
  }
  return {sketch,segments,constraints,targets,width,height};
}

function verifyUnrelatedRectangleObjects(expected:any,solved:any) {
  const unrelated=(sketch:any)=>sketch.objects.filter((o:any)=>!rectangleIds.includes(o.id));
  if(JSON.stringify(unrelated(expected))!==JSON.stringify(unrelated(solved)))throw Error('Rectangle solve changed unrelated objects.');
}

// Journal snapshots are private authored source, not caller-provided model data.
// The only differences allowed across a rectangle edit are its two driving
// lengths and coordinates produced by the solver; all other intent survives.
function rectangleTravelSnapshots(expected:string,target:string) {
  const before=authoredRectangle(expected),after=authoredRectangle(target);
  const normalize=(rectangle:any)=>{
    const sketch=structuredClone(rectangle.sketch);
    for(const segment of rectangleSegments(sketch))for(const point of [segment.data?.a,segment.data?.b]){
      if(!point||![point.x,point.y].every((n:any)=>typeof n==='number'&&Number.isFinite(n)))throw Error('Invalid rectangle journal geometry.');
      point.x=0;point.y=0;
    }
    for(const id of ['rect-0','rect-1'])sketch.stages[0].constraints.find((c:any)=>c.typeId==='SegmentLength'&&c.objects?.length===1&&c.objects[0]===id).constants.length='0';
    return JSON.stringify(sketch);
  };
  if(normalize(before)!==normalize(after))throw Error('Rectangle journal would change other authored intent.');
  return {before,after};
}

function verifyRectangleTravelGeometry(target:any,solved:any) {
  const expectedSegments=rectangleSegments(target),actualSegments=rectangleSegments(solved);
  for(let index=0;index<4;index++)for(const end of ['a','b'])for(const axis of ['x','y']){
    const expected=expectedSegments[index].data?.[end]?.[axis],actual=actualSegments[index].data?.[end]?.[axis];
    if(typeof expected!=='number'||typeof actual!=='number'||!Number.isFinite(expected)||!Number.isFinite(actual)||Math.abs(actual-expected)>1e-6)throw Error('Saved rectangle geometry does not satisfy its driving constraints.');
  }
}

// This command changes the two authored driving lengths, retaining all other
// input records; private journal travel revalidates exact saved sketch bytes.
export function createRectangleEditingCommands(ctx:any,submitReplay:any,cancelEpoch:(epoch:number)=>void,registerTravel?:(callback:any)=>void) {
  const streams=()=>[ctx.craftService.modifications$,ctx.craftService.models$,ctx.craftService.pipelineFailure$,ctx.craftService.engineCleanupFailure$,ctx.expressionService.script$,ctx.expressionService.list$,ctx.expressionService.errors$,ctx.streams.sketcher.sketchingFace,ctx.wizardService.workingRequest$,ctx.workbenchService.currentWorkbench$,ctx.assemblyService.constraints$];
  const services=()=>[ctx.projectService,ctx.storageService,ctx.craftService,ctx.cadRegistry,ctx.sketchStorageService,ctx.operationService,ctx.expressionService,ctx.projectManager,ctx.services.sketcher,ctx.wizardService,ctx.workbenchService,ctx.assemblyService];
  function inspectRectangleDimensions() {
    const info=ctx.craftService.inspectRectangleCreation(),revision=info.revision;
    if(!info.ready)return Object.freeze({ready:false,reason:info.reason,revision,unit:'millimeter',candidates:Object.freeze([])});
    if(!ctx.projectService.hasHostLifetime)return Object.freeze({ready:false,reason:'A current host-bound workspace is required.',revision,unit:'millimeter',candidates:Object.freeze([])});
    const storage=ctx.storageService,sketchStorage=ctx.sketchStorageService,registry=ctx.cadRegistry,history=ctx.craftService.modifications$.value,storageRevision=storage.revision;
    const sketches=sketchStorage.getAllSketches();if(!Array.isArray(sketches)||sketches.length>64||history.history.length>256)throw Error('Rectangle discovery exceeds its bounds.');
    const referenced=new Set(history.history.filter((h:any)=>h.type==='WORKER_RECTANGLE_EXTRUDE_V1'&&typeof h.params?.face==='string').map((h:any)=>h.params.face));
    const candidates:any[]=[],seen=new Set<string>();let total=0;
    for(const item of sketches){const id=item?.id;if(typeof id!=='string'||!id||id.length>1024||seen.has(id))throw Error('Invalid sketch inventory.');seen.add(id);
      const face=registry.findFace(id);if(!referenced.has(id)&&!(face?.root instanceof MOpenFaceShell))continue;
      const source=sketchStorage.getSketchData(id);if(typeof source!=='string')continue;total+=source.length;if(total>262144)throw Error('Rectangle discovery exceeds its byte bound.');
      try{const rectangle=authoredRectangle(source);candidates.push(Object.freeze({faceId:id,width:rectangle.width,height:rectangle.height}));}catch{ /* Unsupported sketches are not advertised. */ }
    }
    if(ctx.storageService!==storage||ctx.sketchStorageService!==sketchStorage||ctx.cadRegistry!==registry||ctx.craftService.modifications$.value!==history||storage.revision!==storageRevision||ctx.craftService.inspectRectangleCreation().revision!==revision)throw aborted();
    return Object.freeze({ready:true,reason:null,revision,unit:'millimeter',candidates:Object.freeze(candidates)});
  }
  async function prepareRectangleDimensions(input:any,options:any,travel?:{expected:string;target:string;committedValid:()=>boolean}) {
    const args=capture(input,['revision','faceId','width','height']),opts=captureOptions(options),info=ctx.craftService.inspectRectangleCreation();
    if(typeof args.revision!=='string'||!args.revision||args.revision.length>256||typeof args.faceId!=='string'||!args.faceId||args.faceId.length>1024||![args.width,args.height].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0.001&&n<=1e6))throw Error('Invalid rectangle edit dimensions or reference.');
    if(!info.ready)throw Error(info.reason||'Rectangle editing is unavailable.');
    if(!ctx.projectService.hasHostLifetime)throw Error('A current host-bound workspace is required.');
    const hostValid=()=>{try{return !opts.signal?.aborted&&(!opts.valid||opts.valid()===true)}catch{return false}};
    if(!hostValid()||args.revision!==info.revision)throw aborted();
    const project=ctx.projectService,storage=ctx.storageService,craft=ctx.craftService,sketchStorage=ctx.sketchStorageService,
      generation=project.documentGeneration,sketchNamespace=project.sketchStorageNamespace,sourceSketchRevision=sketchRevision(storage,sketchNamespace),tracked=streams(),versions=tracked.map(s=>s.revision),capturedServices=services(),history=craft.modifications$.value,
      key=project.sketchStorageKey(args.faceId),source=sketchStorage.getSketchData(args.faceId),historyEntries=history.history,historyPointer=history.pointer,table=ctx.expressionService.table$.value;
    if(travel&&source!==travel.expected)throw aborted();
    const travelSnapshots=travel?rectangleTravelSnapshots(source,travel.target):null;
    const rectangle=travelSnapshots?travelSnapshots.before:authoredRectangle(source),historical=travelSnapshots?.after;
    const {sketch,constraints,targets}=rectangle;
    const unchanged=!travel&&rectangle.width===args.width&&rectangle.height===args.height;
    if(travel&&(historical.width!==args.width||historical.height!==args.height))throw Error('Rectangle journal dimensions do not match.');
    const edit={width:args.width,height:args.height,widthRow:{stage:0,index:constraints.indexOf(targets[0][0])},heightRow:{stage:0,index:constraints.indexOf(targets[1][0])}};
    targets[0][0].constants.length=String(args.width);targets[1][0].constants.length=String(args.height);
    const controller=new AbortController(),scope:{epoch:number|null}={epoch:null};let settled=false;
    const stop=()=>{controller.abort();if(!settled&&scope.epoch!==null)cancelEpoch(scope.epoch);};
    const signals=[project.documentSignal,opts.signal].filter(Boolean);for(const signal of signals)signal.addEventListener('abort',stop,{once:true});
    const alive=()=>hostValid()&&!controller.signal.aborted&&ctx.projectService===project&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.sketchStorageService===sketchStorage;
    const current=()=>{if(!alive()||services().some((s,i)=>s!==capturedServices[i])||project.sketchStorageNamespace!==sketchNamespace||sketchRevision(storage,sketchNamespace)!==sourceSketchRevision||sketchStorage.getSketchData(args.faceId)!==source||craft.modifications$.value!==history||history.history!==historyEntries||history.pointer!==historyPointer||ctx.expressionService.table$.value!==table||streams().some((s,i)=>s!==tracked[i]||s.revision!==versions[i]))throw aborted();};
    const poll=setInterval(()=>{if(!alive())stop()},100);let prepared:any=null;
    const dispose=()=>{if(settled)return;settled=true;clearInterval(poll);prepared?.discard();for(const signal of signals)signal.removeEventListener('abort',stop);};
    try {
      current();const snapshot=await captureAuthoredHistory(historyEntries,current);current();
      const matchingHistory=snapshot.history.some((h:any)=>h.type==='WORKER_RECTANGLE_EXTRUDE_V1'&&h.params?.face===args.faceId),currentFace=ctx.cadRegistry.findFace(args.faceId);
      if(!matchingHistory&&!(currentFace?.root instanceof MOpenFaceShell))throw Error('The rectangle source face is not current.');
      if(unchanged){current();return {noop:true,dispose,craft,alive,current};}
      if(!table||typeof table!=='object'||Array.isArray(table))throw Error('Invalid shared sketch parameter table.');
      const names=Object.keys(table),params=Object.create(null);if(names.length>256||ctx.expressionService.errors$.value.length)throw Error('Shared expressions are invalid or exceed limits.');
      for(const name of names){const field=Object.getOwnPropertyDescriptor(table,name),value=field?.value;if(!field?.enumerable||!Object.prototype.hasOwnProperty.call(field,'value')||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(name)||typeof value!=='number'||!Number.isFinite(value))throw Error('Invalid shared sketch parameter.');params[name]=value;}
      const checkParams=()=>{current();const keys=Object.keys(table);if(keys.length!==names.length||keys.some(name=>!Object.prototype.hasOwnProperty.call(params,name)||!Object.is(Object.getOwnPropertyDescriptor(table,name)?.value,params[name])))throw aborted();};
      const revision=crypto.randomUUID(),result=await runSketchSolve(rectangleWorkerUrl,{task:'rectangle-dimensions-edit',revision,originalSketchJSON:source,draftSketchJSON:JSON.stringify(sketch),travelTargetSketchJSON:travel?travel.target:null,boundary:sketch.boundary,externalParameters:params,edit},{signal:controller.signal,valid:()=>{try{current();return true}catch{return false}}});
      current();if(!result?.ok){const failure=captureSketchFailure(result?.error||{code:'SOLVE_ERROR',message:'Rectangle solve failed.'});throw Object.assign(new Error(failure.message),failure);}
      if(result.revision!==revision||typeof result.serializedSketch!=='string'||result.serializedSketch.length>65536||!Array.isArray(result.evidence)||result.evidence.length!==constraints.length||result.evidence.some(e=>!['accepted','redundant'].includes(e.state)||!Array.isArray(e.residuals)||!Number.isFinite(e.tolerance)||e.residuals.some(n=>!Number.isFinite(n)||Math.abs(n)>e.tolerance)))throw Error('Invalid rectangle solve evidence.');
      if(travel&&result.serializedSketch!==travel.target)throw Error('Rectangle travel did not preserve exact historical source bytes.');
      const solved=JSON.parse(result.serializedSketch),expectedSolved=travel?historical.sketch:sketch;validateProjectSketch(solved);
      if(JSON.stringify(solved)!==JSON.stringify(result.sketch)||JSON.stringify(solved.stages)!==JSON.stringify(expectedSolved.stages)||JSON.stringify(solved.objects.map(o=>[o.id,o.type,o.role,o.stage]))!==JSON.stringify(expectedSolved.objects.map(o=>[o.id,o.type,o.role,o.stage])))throw Error('Rectangle solve changed authored intent.');
      const verified=authoredRectangle(result.serializedSketch);
      verifyUnrelatedRectangleObjects(sketch,solved);
      for(const [i,expected] of [[0,args.width],[1,args.height]] as [number,number][]) {
        const segment=verified.segments[i].data,a=segment?.a,b=segment?.b;
        if(!a||!b||![a.x,a.y,b.x,b.y].every(Number.isFinite)||Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-expected)>1e-6)throw Error('The solved rectangle does not match its driving dimensions.');
      }
      if(travel)verifyRectangleTravelGeometry(historical.sketch,solved);
      const override=Object.freeze({id:args.faceId,data:travel?travel.target:result.serializedSketch});
      const committedAlive=()=>{try{return !controller.signal.aborted&&ctx.projectService===project&&project.isDocumentCurrent(generation)&&ctx.storageService===storage&&ctx.craftService===craft&&ctx.sketchStorageService===sketchStorage&&(!travel||travel.committedValid()===true)}catch{return false}};
      const preparation:PreparedSketchCommand={candidateScope:scope,sketchOverrides:Object.freeze([override]),requireCurrent:current,requireCommittedCurrent(){if(travel?!committedAlive():!alive())throw aborted(true);},async prepare(){current();const latest=await captureAuthoredHistory(historyEntries,current);if(latest.signature!==snapshot.signature)throw aborted();checkParams();current();prepared=storage.prepareWrites([{key,value:override.data}]);return prepared;}};
      return {preparation,dispose,source,override,craft,alive};
    } catch(error) {dispose();if(!alive()&&!error?.committed)throw aborted();throw error;}
  }
  async function editRectangleDimensions(input:any,options?:{signal?:AbortSignal;valid?:()=>boolean}) {
    const args=capture(input,['revision','faceId','width','height']);
    const job=await prepareRectangleDimensions(args,options);
    try{if(job.noop){job.current();return Object.freeze({changed:false,faceId:args.faceId,width:args.width,height:args.height,unit:'millimeter',persistence:'volatile-workspace',revision:job.craft.inspectRectangleCreation().revision,authoredUndo:false});}
      await new Promise<void>((yes,no)=>submitReplay(yes,no,job.preparation,{kind:'sketch-bytes',faceId:args.faceId,before:job.source,after:job.override.data}));
      return Object.freeze({faceId:args.faceId,width:args.width,height:args.height,unit:'millimeter',persistence:'volatile-workspace',revision:job.craft.inspectRectangleCreation().revision,authoredUndo:true});
    }catch(error){if(!job.alive()&&!error?.committed)throw aborted();throw error;}finally{job.dispose();}
  }
  if(registerTravel)registerTravel(async(faceId:string,expected:string,target:string,options:any)=>{
    const parsed=rectangleTravelSnapshots(expected,target).after,revision=ctx.craftService.inspectRectangleCreation().revision;
    const job=await prepareRectangleDimensions({revision,faceId,width:parsed.width,height:parsed.height},{signal:options.signal,valid:options.valid},{expected,target,committedValid:options.committedValid});
    return {preparation:job.preparation,dispose:job.dispose};
  });
  return {inspectRectangleDimensions,editRectangleDimensions};
}
