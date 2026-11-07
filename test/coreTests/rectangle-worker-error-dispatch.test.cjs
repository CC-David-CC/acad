// Source-dispatch unit control; real Worker and CAD integration are tested separately.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),babel=require('@babel/core');
const src=fs.readFileSync('web/app/sketcher/headless/solveWorker.ts','utf8');
const js=babel.transformSync(src,{filename:'solveWorker.ts',babelrc:false,configFile:false,presets:['@babel/preset-typescript']}).code;
class RectangleInputError extends Error {}
let posted;const self={location:{href:'https://example.test/static/worker.js'},importScripts(){},postMessage(x){posted=x;}};
const fakeRequire=id=>id==='./solve'?{solveSketch(){throw Error('unexpected secret: solve')}}:id==='./rectangleDraft'?{RectangleInputError,makeRectangleDraft(){throw Error('unexpected secret: draft')}}:(()=>{throw Error('unexpected module')})();
vm.runInNewContext(js,{self,URL,require:fakeRequire});
self.onmessage({data:{task:'rectangle',revision:'test',unit:'millimeter',frame:{},origin:[0,0],width:1,height:1}});
assert.equal(posted.ok,false);assert.equal(posted.error.code,'INVALID');assert.equal(posted.error.message,'Rectangle request could not be prepared.');assert.equal(JSON.stringify(posted).includes('secret'),false);assert.equal(JSON.stringify(posted).includes('stack'),false);
console.log('PASS injected unexpected rectangle dispatcher exception remains generic');
