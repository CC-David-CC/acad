// Test-only disposable real Worker using the production geometry dependency.
(self as any).importScripts('/static/verb.js');
const {replaySketchTransition,addLengthRelationTransition}=require('../../web/app/sketcher/headless/sketchTransition');
let used=false;
self.onmessage=event=>{if(used)return;used=true;if(event.data.mode==='external-getter'){let reads=0;const external={};Object.defineProperty(external,'X',{enumerable:true,get(){reads++;return 1}});self.postMessage({result:replaySketchTransition({revision:'get-external',sketchJSON:'{}',externalParameters:external}),reads});return;}if(event.data.mode==='getter'){let reads=0;const request={sketchJSON:'{}',externalParameters:{}};Object.defineProperty(request,'revision',{enumerable:true,get(){reads++;return 'forbidden'}});self.postMessage({result:replaySketchTransition(request),reads});return;}self.postMessage(event.data.mode==='length'?addLengthRelationTransition(event.data.request):replaySketchTransition(event.data.request));};
