import CadError from 'utils/errors';
import {getSketchBoundaries} from 'cad/sketch/sketchBoundaries';
import {resolveDependentSketch} from 'cad/sketch/dependentSketchSolve';
import {ReadSketch} from 'cad/sketch/sketchReader';
import {Circle} from 'cad/sketch/sketchModel';
import {MObjectIdGenerator} from 'cad/model/mobject';
import {PatternReplay} from '../patternCutLinear/replayLedger';
import {checkedCut, clearOutput} from '../patternCutLinear/checkedCut';
import {runSketchSolve} from 'sketcher/headless/client';
import dependentSketchWorkerUrl from 'codi-headless-sketch-worker';
import {roundValueForPresentation as r} from 'cad/craft/operationHelper';
import {MBrepFace, MFace} from "cad/model/mface";
import {ApplicationContext} from "cad/context";
import {EntityKind} from "cad/model/entities";
import {BooleanDefinition} from "cad/craft/schema/common/BooleanDefinition";
import {UnitVector} from "math/vector";
import {OperationDescriptor} from "cad/craft/operationBundle";
import {MObject} from "cad/model/mobject";
import {FaceRef} from "cad/craft/e0/OCCUtils";
import {MSketchRegion} from 'cad/model/msketchRegion';
import {describeSketchRegions} from 'cad/sketch/sketchRegions';
import {FromSketchProductionAnalyzer, PushPullFaceProductionAnalyzer} from "cad/craft/production/productionAnalyzer";


interface ExtrudeParams {
  length: number;
  doubleSided:boolean,
  face: MFace;
  direction?: UnitVector,
  boolean: BooleanDefinition;
  regions?: MSketchRegion[];
  bodyPolicy?: string;
}

export const ExtrudeOperation: OperationDescriptor<ExtrudeParams> = {
  id: 'EXTRUDE',
  label: 'Extrude',
  dynamicLabel: params => {
    switch (params.boolean?.kind) {
      case 'SUBTRACT': return 'Extrude-Cut';
      case 'INTERSECT': return 'Extrude-Intersect';
      case 'UNION': return 'Extrude-Fuse';
    }
    return null;
  },
  dynamicIcon: params => {
    switch (params.boolean?.kind) {
      case 'SUBTRACT': return 'img/cad/cut';
    }
    return null;
  },
  icon: 'img/cad/extrude',
  info: 'extrudes 2D sketch',
  path:__dirname,
  paramsInfo: ({length}) => `(${r(length)})`,
  run: async (params: ExtrudeParams, ctx: ApplicationContext, rawParams: any) => {

    const occ = ctx.occService;
    const oci = occ.commandInterface;

    const face = params.face;
    // EXTRUDE is implemented by OCC. A Native Mesh face has no OCC backing;
    // using its sketch here would otherwise silently create an OCC body.
    if (face.root?.topology?.data?.__meshWithOrigins) {
      throw new CadError({kind: CadError.KIND.UNSUPPORTED_CASE, userMessage: 'Extruding a sketch on a Native Mesh face is not supported; no engine conversion was performed.'});
    }

    let dir: UnitVector;
    if (params.direction) {
      dir = params.direction.normalize();
    } else {
      dir = face.normal().normalize();
      if (rawParams.direction?.flip) {
        dir._negate();
      }
    }
    const extrusionVector = dir._multiply(params.length);

    const sketchId = face.id;
    const controller = new AbortController();
    const abort = () => controller.abort();
    window.addEventListener('pagehide', abort, {once:true});
    const documentSignal = (ctx.projectService as any).documentSignal as AbortSignal;
    if (documentSignal?.aborted) abort();
    else documentSignal?.addEventListener('abort', abort, {once:true});
    let solved;
    try {
      solved = await resolveDependentSketch({ctx, face, getBoundary:getSketchBoundaries,
        run:runSketchSolve, workerUrl:dependentSketchWorkerUrl, signal:controller.signal});
    } catch (error) {
      throw new CadError({kind:CadError.KIND.INVALID_INPUT, userMessage:error.message || 'Dependent sketch could not be resolved.'});
    } finally { window.removeEventListener('pagehide', abort); documentSignal?.removeEventListener('abort', abort); }
    const sketch = solved ? ReadSketch(solved, sketchId, true) : ctx.sketchStorageService.readSketch(sketchId);

    if (!sketch) {
      if (face instanceof MBrepFace) {
        oci.prism("FaceTool", face, ...extrusionVector.data());
        return occ.utils.applyBooleanModifier([occ.io.getShell("FaceTool")], params.boolean, face, [],
          (targets, tools) => new PushPullFaceProductionAnalyzer(targets, face.brepFace));
      } else {
        throw "can't extrude an empty surface";
      }
    }

    let csys = face.csys;
    if (params.doubleSided) {
      csys = csys.clone();
      csys.origin._minus(extrusionVector);
      extrusionVector._scale(2);
    }
    const contours=sketch.contours;
    if(!contours.length)throw new Error('A closed sketch region is required.');
    const selected=params.regions || [];
    if(contours.length>1 && !selected.length)throw new Error('Select the sketch regions to extrude; contour nesting alone does not choose a region.');
    let plan=null;
    if(selected.length) {
      if(!['separate','union'].includes(params.bodyPolicy))throw new Error('Choose whether selected regions are separate bodies or combined.');
      if(selected.some(r=>!(r instanceof MSketchRegion)||r.face!==face))throw new Error('Selected regions must belong to the chosen sketch face.');
      const current=describeSketchRegions(face.id,sketch);
      const selectedKeys=selected.map(r=>JSON.stringify(r.descriptor));
      if(new Set(selectedKeys).size!==selectedKeys.length)throw new Error('A sketch region was selected more than once.');
      const indexes=selectedKeys.map(k=>current.findIndex(r=>JSON.stringify(r)===k));
      if(indexes.some(i=>i<0))throw new Error('A selected region changed or is no longer available; select it again.');
      const boundaryKey=ids=>JSON.stringify(ids);
      const outerKeys=current.map(r=>boundaryKey(r.outer));
      const holes=current.map(r=>r.holes.map(h=>outerKeys.indexOf(boundaryKey(h))));
      if(holes.some(list=>list.some(i=>i<0)))throw new Error('A sketch region boundary is ambiguous.');
      if(params.bodyPolicy==='union'&&indexes.length>1){
        const reached=new Set([indexes[0]]),pending=[indexes[0]];
        while(pending.length){const i=pending.pop();for(const j of indexes)if(!reached.has(j)&&(holes[i].includes(j)||holes[j].includes(i))){reached.add(j);pending.push(j);}}
        if(reached.size!==indexes.length)throw new Error('Disconnected regions cannot be combined into one solid.');
      }
      plan={indexes,holes,policy:params.bodyPolicy};
    }
    const sweepSources = occ.utils.sketchToFaces(sketch, csys)

    const productionAnalyzer = new FromSketchProductionAnalyzer(sweepSources);

    const shapes = sweepSources.map((faceRef, i) => {
      const shapeName = "Tool/" + i;
      if(oci.prism(shapeName, faceRef.face, ...extrusionVector.data())!==0)throw new Error('Could not extrude the selected profile.');
      return shapeName;
    });
    let resultShapes=shapes;
    if(plan){
      oci.bfuzzyvalue(0.0001);
      resultShapes=plan.indexes.map(index=>{
        let current=shapes[index];
        for(const hole of plan.holes[index]){
          const next=`RegionCut/${index}/${hole}`;
          if(oci.bcut(next,current,shapes[hole])!==0)throw new Error('Could not construct the selected sketch region.');
          current=next;
        }
        return current;
      });
      if(plan.policy==='union'&&resultShapes.length>1){
        let current=resultShapes[0];
        for(let i=1;i<resultShapes.length;i++){
          const next=`RegionUnion/${i}`;
          if(oci.bfuse(next,current,resultShapes[i])!==0)throw new Error('Could not combine the selected sketch regions.');
          current=next;
        }
        resultShapes=[current];
      }
    }
    const tools=resultShapes.map(shape=>occ.io.getShell(shape,productionAnalyzer));
    const replay = (ctx as any).patternReplay as PatternReplay | undefined;
    let captured: any = null;
    if (replay && replay.requestedSeed === Number(rawParams.featureId)) {
      const fail = () => { throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE,code:'PATTERN_SEED_UNSUPPORTED',userMessage:'This pattern requires one circular through-cut on an axis-aligned rectangular OCC plate.'}); };
      const body: any = face.root;
      const circle = sketch.loops[0];
      const boundary = getSketchBoundaries(face);
      if (params.boolean?.kind !== 'SUBTRACT' || !(face instanceof MBrepFace) ||
          body?.topology?.data?.__meshWithOrigins || sketch.loops.length !== 1 ||
          !(circle instanceof Circle) || sketch.connections.length || resultShapes.length !== 1 ||
          !body?.brepShell || body.faces.length !== 6 || body.edges.length !== 12 || Array.from(body.brepShell.vertices).length !== 8 ||
          boundary.lines.length !== 4 || boundary.arcs.length || boundary.circles.length || boundary.nurbses.length ||
          (params.boolean.targets?.length && (params.boolean.targets.length !== 1 || params.boolean.targets[0] !== body))) fail();
      const pts: any[] = Array.from(body.brepShell.vertices, (v: any) => v.point);
      const bounds = {minX:Math.min(...pts.map(p=>p.x)), maxX:Math.max(...pts.map(p=>p.x)),
        minY:Math.min(...pts.map(p=>p.y)), maxY:Math.max(...pts.map(p=>p.y)),
        minZ:Math.min(...pts.map(p=>p.z)), maxZ:Math.max(...pts.map(p=>p.z))};
      const tol=1e-6, isEnd=(n,a,b)=>Math.abs(n-a)<tol || Math.abs(n-b)<tol;
      if (!pts.every(p=>isEnd(p.x,bounds.minX,bounds.maxX) && isEnd(p.y,bounds.minY,bounds.maxY) && isEnd(p.z,bounds.minZ,bounds.maxZ)) ||
          Math.abs(extrusionVector.x)>tol || Math.abs(extrusionVector.y)>tol ||
          Math.abs(extrusionVector.z)+tol < bounds.maxZ-bounds.minZ) fail();
      const center = csys.outTransformation.apply(circle.c);
      const startZ = center.z, endZ = startZ+extrusionVector.z;
      if (Math.min(startZ,endZ)>bounds.minZ+tol || Math.max(startZ,endZ)<bounds.maxZ-tol) fail();
      const temp='CodiPatternSeed';
      clearOutput(ctx,temp);
      if (oci.copy(resultShapes[0],temp)!==0) throw new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_COPY_FAILED',userMessage:'Could not independently copy the cut seed.'});
      // Creating a private shell must not consume authored feature/model IDs.
      const registry=MObjectIdGenerator.context.ID_REGISTRY, saved=new Map(registry);
      let tool: MObject;
      try { tool=occ.io.getShell(temp); } finally { registry.clear(); saved.forEach((v,k)=>registry.set(k,v)); }
      if (!(tool as any)?.faces || (tool as any).faces.length < 3) throw new CadError({kind:CadError.KIND.INVALID_INPUT,code:'PATTERN_COPY_FAILED',userMessage:'Could not independently copy the cut seed.'});
      captured={featureId:Number(rawParams.featureId),sourceFaceId:face.id,circleId:circle.id,
        radius:circle.r,center:{x:center.x,y:center.y},bounds,tool};
    }
    const result=captured ? checkedCut(ctx,face.root,tools,'CodiPatternSeedResult',params.boolean.simplify,[face]) :
      occ.utils.applyBooleanModifier(tools, params.boolean, face, [face]);
    if (captured) {
      if (result.created.length !== 1 || result.consumed.indexOf(face.root) < 0) throw new Error('Cut seed did not produce one target body.');
      replay.seed={...captured,result:result.created[0]};
    }
    return result;

  },

  form: [
    {
      type: 'number',
      label: 'length',
      name: 'length',
      defaultValue: 50,
    },
    {
      type: 'checkbox',
      label: 'Double Sided',
      name: 'doubleSided',
      defaultValue: false,
    },
    {
      type: 'selection',
      name: 'face',
      capture: [EntityKind.FACE],
      label: 'face',
      multi: false,
      defaultValue: {
        usePreselection: true,
        preselectionIndex: 0
      },
    },
    {
      type: 'selection',
      name: 'regions',
      capture: [EntityKind.SKETCH_REGION],
      label: 'Sketch regions',
      sketchRegionChoices: true,
      multi: true,
      optional: true,
      max: 128,
    },
    {
      type: 'choice',
      name: 'bodyPolicy',
      label: 'Selected regions',
      style: 'dropdown',
      values: [['','Choose body behavior'],['separate','Separate bodies'],['union','Combine into one body']],
      defaultValue: '',
      optional: true,
    },
    {
      type: 'direction',
      name: 'direction',
      label: 'direction',
      optional: true
    },
    {
      type: 'boolean',
      name: 'boolean',
      label: 'boolean',
      optional: true,
    }

  ],

  defaultActiveField: 'face',

  masking: [
    {
      id: 'CUT',
      label: 'Cut',
      icon: 'img/cad/cut',
      info: 'makes a cut based on 2D sketch',
      maskingParams: {
        direction: {
          flip: true
        },
        boolean: {
          kind: 'SUBTRACT',
          simplify: true
        }
      }
    }
  ]
}
