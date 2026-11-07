// Source/AST boundary checks only. No Craft activation, native geometry or UI is simulated.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require(process.env.CODI_TYPESCRIPT_PATH||'typescript');
const path=new URL('../../web/app/cad/craft/craftBundle.ts',import.meta.url);
const source=fs.readFileSync(path,'utf8'),file=ts.createSourceFile(path.pathname,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
assert.equal(file.parseDiagnostics.length,0);
function nodes(root,predicate){const out=[];function walk(n){if(predicate(n))out.push(n);ts.forEachChild(n,walk)}walk(root);return out}
function fn(name){const found=nodes(file,n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.equal(found.length,1);return found[0]}
const text=n=>n.getText(file),calls=(root,name)=>nodes(root,n=>ts.isCallExpression(n)&&text(n.expression)===name);
function ifBranch(root,condition){const found=nodes(root,n=>ts.isIfStatement(n)&&text(n.expression)===condition);assert.equal(found.length,1);return found[0].thenStatement}

test('pattern registration and exact-kind travel use the same shared publisher/owned dispatcher',()=>{
 const wrapper=fn('authoredLinearHolePatternOperation');assert.deepEqual(calls(wrapper,'authoredFeatureOperation')[0].arguments.map(text),["'linear-hole-pattern'",'args','options']);
 assert.equal(calls(ifBranch(fn('authoredEditTravel'),"target.kind==='linear-hole-pattern'"),'authoredLinearHolePatternOperation').length,1);
 const factory=calls(file,'createWorkerLinearHolePatternCommands');assert.equal(factory.length,1);assert.match(text(factory[0].arguments[1]),/submitModification\(request,addModification,accepted,rejected,false,preparation\)/);assert.match(text(factory[0].arguments[2]),/epoch===evaluationEpoch/);
});
test('pattern branch mutates only count/spacing after capture and uses exact journal replay',()=>{
 const op=fn('authoredFeatureOperation'),branch=ifBranch(op,"kind==='linear-hole-pattern'");for(const name of ['captureLinearHolePatternParameters','recordLinearHolePatternEdit','planLinearHolePatternTravel'])assert(calls(branch,name).length>=1);
 const writes=nodes(branch,n=>ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&text(n.left).startsWith('request.params'));assert.deepEqual(writes.map(n=>text(n.left)),['request.params.count','request.params.spacing']);assert.match(text(branch),/captureLinearHolePatternParameters\(\{\.\.\.parameters,\.\.\.nextDimensions\}\)/);assert.match(text(branch),/changed:false/);
 const replay=calls(op,'captureAuthoredHistory').find(n=>text(n.arguments[0])==='captured.history');assert(replay.pos>branch.end);for(const fragment of ['journalProposal:proposal','modifications$.next(nextState)','preparation.requireCommittedCurrent();','if(!current)throw superseded(true)','options.signal?.removeEventListener'])assert(text(op).includes(fragment),fragment);
});
test('creation append explicitly admits edge and pattern only, sharing existing bounded append journal',()=>{
 const checks=nodes(file,n=>ts.isIfStatement(n)&&text(n.expression).includes('normalized.type')&&text(n.expression).includes('WORKER_LINEAR_HOLE_PATTERN_V1'));assert.equal(checks.length,1);assert(text(checks[0].expression).includes("['WORKER_SOLID_EDGE_TREATMENT_V1','WORKER_LINEAR_HOLE_PATTERN_V1']"));assert(calls(checks[0].thenStatement,'recordOperationAppend').length===1);assert(calls(checks[0].thenStatement,'captureOperationAppend').length>=1);
});
