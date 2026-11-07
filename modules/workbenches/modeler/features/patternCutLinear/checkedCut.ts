import {ApplicationContext} from 'cad/context';
import CadError from 'utils/errors';
import {MObject, MObjectIdGenerator} from 'cad/model/mobject';
import {FromMObjectProductionAnalyzer} from 'cad/craft/production/productionAnalyzer';
import {assertLegacyGeometry, requireLegacyPointer} from 'cad/model/workerGeometry';

const failure = () => new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_BOOLEAN_FAILED',userMessage:'The patterned cut could not be constructed.'});
const check = (code: number) => { if (code !== 0) throw failure(); };

// Reuse bounded names, but ensure a successful no-op cannot expose their old
// contents. Interrogating the empty sentinel must not consume model IDs.
export function clearOutput(ctx: ApplicationContext, name: string): void {
  check(ctx.occService.commandInterface.shape(name,'C'));
  const registry=MObjectIdGenerator.context.ID_REGISTRY, saved=new Map(registry);
  try {
    const empty=ctx.occService.io.getShell(name);
    if (!empty?.faces || empty.faces.length || empty.edges.length || empty.vertices.length) throw failure();
  } catch (_) { throw failure(); }
  finally { registry.clear(); saved.forEach((v,k)=>registry.set(k,v)); }
}

export function checkedCut(ctx: ApplicationContext, target: MObject, tools: MObject[],
                           name: string, simplify: boolean, mustAdvance: MObject[] = []) {
  const occ=ctx.occService, oci=occ.commandInterface;
  [target, ...tools].forEach(model => requireLegacyPointer(model, 'Patterned cut'));
  mustAdvance.forEach(model => assertLegacyGeometry(model, 'Patterned cut'));
  if (!occ.io.pushModel(target,'CodiCutTarget')) throw failure();
  check(oci.bclearobjects()); check(oci.bcleartools()); check(oci.baddobjects('CodiCutTarget'));
  tools.forEach((tool,i) => {
    const toolName=`CodiCutTool${i}`;
    if (!occ.io.pushModel(tool,toolName)) throw failure();
    check(oci.baddtools(toolName));
  });
  check(oci.bsimplify('-e',simplify?1:0,'-f',simplify?1:0));
  check(oci.bfuzzyvalue(0.0001)); check(oci.bcheckinverted(1)); check(oci.bfillds());
  clearOutput(ctx,name);
  check(oci.bapibop(name,2));
  let result: MObject;
  try { result=occ.io.getShell(name,new FromMObjectProductionAnalyzer([target,...tools],mustAdvance)); }
  catch (_) { throw failure(); }
  if (!(result as any)?.faces || (result as any).faces.length < 4) throw failure();
  return {created:[result],consumed:[target,...tools]};
}
