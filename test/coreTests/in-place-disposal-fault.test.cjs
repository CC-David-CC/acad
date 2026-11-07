// Source-method fault control, not a browser/native lifecycle test.
// Usage: node FILE [CAD-repository] [commit]
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const repo=process.argv[2]||require('node:path').resolve(__dirname,'../..');
const revision=process.argv[3]||'WORKTREE';
const source=path=>revision==='WORKTREE'?require('node:fs').readFileSync(require('node:path').join(repo,path),'utf8'):execFileSync('git',['show',`${revision}:${path}`],{cwd:repo,encoding:'utf8'});
const method=(text,name)=>{
  const match=text.match(new RegExp(`\\n  ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n  \\}`));
  assert.ok(match,name);return match[1];
};
const calls={reset:0,release:0,detach:0,switch:0};
global.window={removeEventListener(){}};
const dispose=new Function('Generator',`return function(){${method(source('web/app/sketcher/viewer2d.ts'),'dispose')}}`)({resetIDGenerator(){calls.reset++}});
const exit=new Function(`return function(){${method(source('web/app/cad/sketch/inPlaceSketcher.js'),'exit')}}`)();
const enter=new Function('face','headless',method(source('web/app/cad/sketch/inPlaceSketcher.js'),'enter'));
const stream=value=>({value,next(next){this.value=next}});
const face={ext:{view:{sketchGroup:{visible:false}}}};
const viewer={onWindowResize(){},canvas:{parentNode:{removeChild(){}}},
  historyManager:{lastCheckpoint:'retained',init(value){this.lastCheckpoint=value}},
  toolManager:{dispose(){assert.throws(()=>enter.call(editor,{}),/still closing/);throw Error('injected tool cleanup failure')}},dispose};
const context={viewer};
const editor={face,sketcherAppContext:context,get viewer(){return this.sketcherAppContext?.viewer},
  disposers:{call(){calls.detach++}},pickControlToken:17,
  ctx:{services:{viewer:{requestRender(){}}},streams:{sketcher:{sketchingFace:stream(face),sketcherAppContext:stream(context)}},
    workbenchService:{switchToDefaultWorkbench(){calls.switch++}},pickControlService:{releasePickControl(){calls.release++}}}};
assert.throws(()=>exit.call(editor),/injected tool cleanup/);
assert.equal(editor.face,null);
assert.equal(viewer.canvas,null);
assert.equal(viewer.historyManager.lastCheckpoint,'');
assert.equal(editor.sketcherAppContext,null);
assert.equal(editor.disposers,null);
assert.equal(editor.exiting,false);
assert.equal(editor.pickControlToken,null);
assert.equal(editor.ctx.streams.sketcher.sketchingFace.value,null);
assert.equal(editor.ctx.streams.sketcher.sketcherAppContext.value,null);
assert.deepEqual(calls,{reset:1,release:1,detach:1,switch:1});
exit.call(editor);
assert.deepEqual(calls,{reset:1,release:1,detach:1,switch:1});
console.log('PASS source-method disposal fault: history/context/streams/pick/listeners/workbench released; original failure retained and repeated exit is harmless.');
