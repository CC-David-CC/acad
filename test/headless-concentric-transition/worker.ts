// Test-only dispatch: production solveWorker/client/publication remain untouched.
// One request per actual disposable Worker; no DOM/window/canvas shim.
(self as any).importScripts(new URL('../lib/verb.js',self.location.href).href);
const {addConcentricTransition}=require('../../web/app/sketcher/headless/concentricTransition');
const {replaySketchTransition}=require('../../web/app/sketcher/headless/sketchTransition');
const {HeadlessSketchWorkspace}=require('../../web/app/sketcher/headless/workspace');
const {prepareConcentric}=require('../../web/app/sketcher/actions/concentricAdmission');
let used=false;
self.onmessage=event=>{
  if(used)return;used=true;
  const {mode,request}=event.data;
  try {
    if(mode==='fixture'){
      const workspace=new HeadlessSketchWorkspace(request.externalParameters||{});workspace.io._loadSketch(request.sketch,{strict:true});
      const native=JSON.parse(workspace.io.serializeSketch(request.sketch.metadata,{strict:true}));native.boundary=request.sketch.boundary;
      self.postMessage({serializedSketch:JSON.stringify(native)});return;
    }
    if(mode==='rollback'){
      const workspace=new HeadlessSketchWorkspace(request.externalParameters),native=JSON.parse(request.sketchJSON);workspace.io._loadSketch(native,{strict:true});
      const save=()=>workspace.io.serializeSketch(native.metadata,{strict:true}),before=save(),pm=workspace.parametricManager,index=workspace.createIndex(),prepared=prepareConcentric(pm,request.intent.ids.map(id=>index[id]));let error=null;
      pm.startTransaction();try{pm._add(prepared.constraint);pm.finishTransaction(prepared.validate,false)}catch(e){error={message:e.message};}
      self.postMessage({before,after:save(),error,inTransaction:pm.inTransaction,stageTransactions:pm.stages.map(s=>({inTransaction:s.algNumSystem.inTransaction,hasSnapshot:!!s.algNumSystem.transactionBefore})),centers:request.intent.ids.map(id=>({id,x:index[id].c.x,y:index[id].c.y}))});return;
    }
    if(mode==='accessor'){
      let reads=0;const input={...request},external={};Object.defineProperty(external,'X',{enumerable:true,get(){reads++;return 1}});input.externalParameters=external;
      self.postMessage({result:addConcentricTransition(input),reads});return;
    }
    const inputBefore=JSON.stringify(request),result=mode==='replay'?replaySketchTransition(request):addConcentricTransition(request);
    self.postMessage({result,inputUnchanged:JSON.stringify(request)===inputBefore,realm:{hasDocument:typeof document!=='undefined',hasWindow:typeof window!=='undefined',hasCanvas:typeof HTMLCanvasElement!=='undefined'}});
  } catch(error){self.postMessage({testHarnessError:error?.message||String(error)});}
};
