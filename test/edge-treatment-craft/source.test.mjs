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

test('edge size and exact-kind travel share the existing owned feature transaction',()=>{
 const wrapper=fn('authoredSolidEdgeTreatmentOperation');assert.equal(calls(wrapper,'authoredFeatureOperation').length,1);
 assert.deepEqual(calls(wrapper,'authoredFeatureOperation')[0].arguments.map(text),["'solid-edge-treatment'",'args','options']);
 const route=ifBranch(fn('authoredEditTravel'),"target.kind==='solid-edge-treatment'");assert.equal(calls(route,'authoredSolidEdgeTreatmentOperation').length,1);
 const method=nodes(file,n=>ts.isPropertySignature(n)&&n.name?.getText(file)==='authoredSolidEdgeTreatmentOperation');assert.equal(method.length,1);assert.match(text(method[0]),/Promise<Readonly/);
 const assigned=calls(file,'Object.assign').filter(n=>text(n.arguments[0])==='ctx.craftService');assert(assigned.some(n=>text(n.arguments[1]).includes('authoredSolidEdgeTreatmentOperation')));
 // The isolated Craft lane originally forbade public registration. The root
 // integration now mounts that facade through the same prepared publisher.
 const publicFactory=calls(file,'createWorkerEdgeTreatmentCommands');assert.equal(publicFactory.length,1);
 assert.equal(text(publicFactory[0].arguments[0]),'ctx');
 assert.match(text(publicFactory[0].arguments[1]),/submitModification\(request,addModification,accepted,rejected,false,preparation\)/);
 assert.match(text(publicFactory[0].arguments[2]),/epoch===evaluationEpoch/);
 assert(assigned.some(n=>n.arguments[1]===publicFactory[0]));
});
test('treatment branch changes only size and uses the exact capture/record/travel helpers',()=>{
 const operation=fn('authoredFeatureOperation'),branch=ifBranch(operation,"kind==='solid-edge-treatment'");
 for(const name of ['captureSolidEdgeTreatmentParameters','recordSolidEdgeTreatmentEdit','planSolidEdgeTreatmentTravel'])assert.equal(calls(branch,name).length,1,name);
 const writes=nodes(branch,n=>ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&text(n.left).startsWith('request.params'));
 assert.deepEqual(writes.map(n=>text(n.left)),['request.params.size']);
 assert(text(operation).includes("kind==='solid-edge-treatment'?'WORKER_SOLID_EDGE_TREATMENT_V1'"));
 assert.match(text(branch),/nextSize===parameters\.size\)return Object\.freeze\(\{changed:false/);
 assert.match(text(branch),/parameters,after:nextSize/);
});
test('existing replay/publication/committed-outcome path remains after the edge branch',()=>{
 const operation=fn('authoredFeatureOperation'),body=text(operation),branch=ifBranch(operation,"kind==='solid-edge-treatment'");
 const nextCapture=calls(operation,'captureAuthoredHistory').find(n=>text(n.arguments[0])==='captured.history');assert(nextCapture.pos>branch.end);
 assert(body.includes('journalProposal:proposal,journalSignature:nextCapture.signature'));
 assert(body.includes('modificationCallbacks.set(nextState'));
 assert(body.includes('modifications$.next(nextState)'));
 assert(body.indexOf('preparation.requireCommittedCurrent();')>body.indexOf('modifications$.next(nextState)'));
 assert(body.includes('if(!current)throw superseded(true)'));
 assert(body.includes("kind==='solid-edge-treatment'?{size:nextSize}"));
 assert(body.includes('engineResources.cancelCandidates()'));
 assert(body.includes("options.signal?.removeEventListener('abort',stop)"));
});
test('source, services, runtime-bearing history and expression table are currentness-bound',()=>{
 const body=text(fn('authoredFeatureOperation'));
 for(const fragment of ['captured.signature !== fullTipSignature','modifications$.value !== before','authoredJournal$.value !== journal','trackedServices().some','trackedStreams().some','sketchRevision(storage,sketchNamespace)!==sourceSketchRevision','manager.inspectMaterialSurfaceRevision()!==materialSurfaceRevision','!service.isDocumentCurrent(document)'])assert(body.includes(fragment),fragment);
 // This contract requires these edits to participate; newly supported edit
 // kinds must not make the older coverage assertion fail merely by expanding
 // the list. Inspect the actual AST list and retain every required member.
 const kindLists=nodes(fn('authoredFeatureOperation'),n=>ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='includes'&&n.arguments.length===1&&text(n.arguments[0])==='kind'&&ts.isArrayLiteralExpression(n.expression.expression));
 const tableList=kindLists.filter(n=>ts.isConditionalExpression(n.parent)&&n.parent.condition===n&&text(n.parent.whenTrue)==='[ctx.expressionService.table$]');
 assert.equal(tableList.length,1,'one expression-table dependency gate');
 const typedList=kindLists.filter(n=>ts.isBinaryExpression(n.parent)&&n.parent.left===n&&text(n.parent.right).startsWith('(ctx.expressionService.isTyped'));
 assert.equal(typedList.length,1,'one typed-parameter refusal gate');
 const members=n=>n.expression.expression.elements.map(e=>{assert(ts.isStringLiteral(e));return e.text});
 for(const kind of ['selected-profile-depth','solid-edge-treatment','through-hole','linear-hole-pattern','operation-append'])assert(members(tableList[0]).includes(kind),`expression table tracks ${kind}`);
 for(const kind of ['selected-profile-depth','solid-edge-treatment','through-hole','linear-hole-pattern'])assert(members(typedList[0]).includes(kind),`typed refusal covers ${kind}`);
 assert(body.includes("code:'UNSUPPORTED_PARAMETERS'"));
 assert(body.includes("kind==='solid-edge-treatment'?'featureId,index,revision,size'"));
 assert(!calls(fn('authoredSolidEdgeTreatmentOperation'),'runPipeline').length,'wrapper does not add a separate replay path');
});
