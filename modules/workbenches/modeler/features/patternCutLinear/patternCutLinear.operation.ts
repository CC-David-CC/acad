import {ApplicationContext} from 'cad/context';
import CadError from 'utils/errors';
import {OperationDescriptor} from 'cad/craft/operationBundle';
import {MObject, MObjectIdGenerator} from 'cad/model/mobject';
import {Matrix3x4} from 'math/matrix';
import {AddLocation} from 'cad/craft/e0/interact';
import {PatternReplay} from './replayLedger';
import {checkedCut, clearOutput} from './checkedCut';
import {PatternCutForm} from './PatternCutForm';
import {Types} from 'cad/craft/schema/types';
import {assertLegacyGeometry, requireLegacyPointer} from 'cad/model/workerGeometry';

interface Params { seedFeatureId: number; seedObjectId: number; count: number; spacing: number; axis: string; featureId: number }

// Deliberately limited to an immediately preceding, qualified through-cut.
export const PatternCutLinearOperation: OperationDescriptor<Params> = {
  id: 'PATTERN_CUT_LINEAR', label: 'Linear cut pattern',
  icon: 'img/cad/patternLinear', info: 'Repeat the preceding circular through-cut on a rectangular plate.',
  path: __dirname, paramsInfo: p => `(${p.count} × ${p.spacing})`,
  form: PatternCutForm,
  schema: {
    seedFeatureId: {type:Types.number}, seedObjectId: {type:Types.number},
    count: {type:Types.number, defaultValue:3}, spacing: {type:Types.number, defaultValue:20},
    axis: {type:Types.string, enum:['X','Y'], defaultValue:'X'}
  } as any,
  run: (p: Params, ctx: ApplicationContext) => {
    ctx.cadRegistry.shells.forEach(body => assertLegacyGeometry(body, 'Linear cut pattern'));
    if (ctx.cadRegistry.shells.some(body => body.topology?.data?.__meshWithOrigins)) throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE,code:'PATTERN_NATIVE_UNSUPPORTED',userMessage:'Linear cut patterns on Native Mesh geometry are not supported.'});
    const replay=(ctx as any).patternReplay as PatternReplay | undefined, seed=replay?.seed;
    if (!seed || seed.featureId !== Number(p.seedFeatureId)) throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE,code:'PATTERN_SEED_UNSUPPORTED',userMessage:'The immediately preceding circular through-cut seed is missing or unsupported.'});
    [seed.tool, seed.result].forEach(model => requireLegacyPointer(model, 'Linear cut pattern'));
    if (!Number.isSafeInteger(p.seedObjectId) || p.seedObjectId < 0 || seed.circleId !== seed.sourceFaceId + '/' + p.seedObjectId) throw new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_SEED_CHANGED',userMessage:'The authored seed circle changed; select the intended seed again.'});
    if (!Number.isSafeInteger(p.count) || p.count < 2 || p.count > 16 || !Number.isFinite(p.spacing) ||
        Math.abs(p.spacing) <= 2*seed.radius + 1e-6 || !['X','Y'].includes(p.axis)) {
      throw new CadError({kind:CadError.KIND.INVALID_PARAMS,code:'PATTERN_PARAMETERS_INVALID',userMessage:'Choose 2–16 non-overlapping cuts, finite spacing, and world X or Y.'});
    }
    if (ctx.cadRegistry.shells.length !== 1 || ctx.cadRegistry.shells[0] !== seed.result) throw new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_TARGET_CHANGED',userMessage:'The pattern target changed; repair the seed reference.'});
    for (let i=0;i<p.count;i++) {
      const x=seed.center.x+(p.axis==='X'?p.spacing*i:0), y=seed.center.y+(p.axis==='Y'?p.spacing*i:0), r=seed.radius;
      if (x-r <= seed.bounds.minX+1e-6 || x+r >= seed.bounds.maxX-1e-6 || y-r <= seed.bounds.minY+1e-6 || y+r >= seed.bounds.maxY-1e-6) {
        throw new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_OUTSIDE_PLATE',userMessage:'Every patterned cut must remain strictly inside the plate.'});
      }
    }
    const occ=ctx.occService, oci=occ.commandInterface;
    if (!occ.io.pushModel(seed.tool,'CodiPatternSource')) throw new Error('The cut seed geometry is unavailable.');
    const tools: MObject[]=[];
    for (let i=1;i<p.count;i++) {
      const name=`CodiPatternInstance${i}`;
      clearOutput(ctx,name);
      if (oci.copy('CodiPatternSource',name)!==0) throw new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_COPY_FAILED',userMessage:'Could not copy the pattern seed.'});
      const d=p.spacing*i, tr=new Matrix3x4().setTranslation(p.axis==='X'?d:0,p.axis==='Y'?d:0,0);
      AddLocation(name,tr.toFlatArray());
      const registry=MObjectIdGenerator.context.ID_REGISTRY, saved=new Map(registry);
      let tool: MObject;
      try { tool=occ.io.getShell(name); } finally { registry.clear(); saved.forEach((v,k)=>registry.set(k,v)); }
      let member=0;
      if (!(tool as any)?.faces || (tool as any).faces.length < 3) throw new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_COPY_FAILED',userMessage:'Could not copy the pattern seed.'});
      tool.traverse(object => { object.id=`CodiPatternTool:${p.featureId}:${i}/${member++}`; });
      tools.push(tool);
    }
    return checkedCut(ctx,seed.result,tools,'CodiPatternResult',true);
  }
};
