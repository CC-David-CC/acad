import {SketchGeom} from "cad/sketch/sketchReader";
import {ApplicationContext} from "cad/context";
import CSys from "math/csys";
import {OperationResult} from "cad/craft/craftBundle";
import {BooleanDefinition, BooleanKind} from "cad/craft/schema/common/BooleanDefinition";
import {MObject} from "cad/model/mobject";
import {Shell} from "brep/topo/shell";
import {MOpenFaceShell} from "cad/model/mopenFace";
import {MBrepShell} from "cad/model/mshell";
import {Contour} from "cad/sketch/sketchModel";
import BrepCurve from "geom/curves/brepCurve";
import {Plane} from "geom/impl/plane";
import {enclose} from "brep/operations/brep-enclose";
import Vector from "math/vector";
import {ProductionAnalyzer} from "cad/craft/production/productionAnalyzer";
import {manifoldBooleanRaw, BooleanOp, MeshWithOrigins, shellToMeshWithOrigins, ManifoldTolerances} from "brep/operations/mesh/manifoldBoolean";
import {ShellMesh, MBrepShell as MBrepShellType} from "cad/model/mshell";
import {assertLegacyGeometry} from 'cad/model/workerGeometry';
import CadError from 'utils/errors';

export interface SketchProfile {
  contour: Contour;
  shell: Shell;
}

export interface NativeOperationService {

  sketchToProfiles(sketch: SketchGeom, csys: CSys): SketchProfile[];

  extrudeProfile(profile: SketchProfile, extrusionVector: Vector, csys: CSys): Shell;

  applyBooleanModifier(tools: MBrepShell[],
                       booleanDef: BooleanDefinition,
                       sketchSource?: MObject,
                       mustAdvance? : MObject[],
                       analyzerCreator?: (targets: MObject[], tools: MObject[]) => ProductionAnalyzer): OperationResult | Promise<OperationResult>;
}

export function createNativeOperationService(ctx: ApplicationContext): NativeOperationService {

  function sketchToProfiles(sketch: SketchGeom, csys: CSys): SketchProfile[] {
    const contours = sketch.fetchContours();
    return contours.map(contour => {
      const curves3D = contour.transferInCoordinateSystem(csys);
      const tessPoints = contour.tessellateInCoordinateSystem(csys);

      const normal = csys.z.normalize();
      const origin = csys.outTransformation.apply((contour.segments[0] as any).a || (contour.segments[0] as any).c);
      const basePlane = new Plane(normal, normal.dot(origin));

      return {
        contour,
        shell: null,
        curves3D,
        tessPoints,
        basePlane,
      } as SketchProfile & { curves3D: BrepCurve[], tessPoints: Vector[], basePlane: Plane };
    });
  }

  function extrudeProfile(profile: SketchProfile & { curves3D?: BrepCurve[], basePlane?: Plane },
                          extrusionVector: Vector, csys: CSys): Shell {

    let baseCurves: BrepCurve[];
    let basePlane: Plane;

    if (profile.curves3D && profile.basePlane) {
      baseCurves = profile.curves3D;
      basePlane = profile.basePlane;
    } else {
      baseCurves = profile.contour.transferInCoordinateSystem(csys);
      const normal = csys.z.normalize();
      const origin = csys.outTransformation.apply(
        (profile.contour.segments[0] as any).a || (profile.contour.segments[0] as any).c
      );
      basePlane = new Plane(normal, normal.dot(origin));
    }

    const lidCurves = baseCurves.map(c => c.translate(extrusionVector));
    const lidPlane = basePlane.translate(extrusionVector).invert();

    return enclose(baseCurves, lidCurves, basePlane, lidPlane);
  }

  async function applyBooleanModifier(tools: MBrepShell[],
                                booleanDef: BooleanDefinition,
                                sketchSource: MObject,
                                mustAdvance? : MObject[],
                                analyzerCreator?: (targets: MObject[], tools: MObject[]) => ProductionAnalyzer): Promise<OperationResult> {

    const consumed: MObject[] = [];
    tools.forEach(tool => assertLegacyGeometry(tool, 'Native Mesh Boolean'));
    if (sketchSource) assertLegacyGeometry(sketchSource, 'Native Mesh Boolean');
    (mustAdvance || []).forEach(model => assertLegacyGeometry(model, 'Native Mesh Boolean'));

    if (sketchSource && sketchSource.parent instanceof MOpenFaceShell) {
      consumed.push(sketchSource.parent);
    }

    if (!booleanDef || booleanDef.kind === 'NONE') {
      return {
        created: tools,
        consumed
      };
    }

    const kind = booleanDef.kind;

    let targets: MObject[] = booleanDef.targets;
    if (!targets || targets.length === 0) {
      targets = ctx.cadRegistry.shells.filter(target => !(target instanceof MOpenFaceShell));
    }

    targets.forEach(target => assertLegacyGeometry(target, 'Native Mesh Boolean'));
    const targetShells = targets as MBrepShell[];

    const opMap: Record<string, BooleanOp> = {
      'UNION': 'union', 'SUBTRACT': 'subtract', 'INTERSECT': 'intersect'
    };
    if (!Object.prototype.hasOwnProperty.call(opMap, kind)) {
      throw new CadError({kind:CadError.KIND.INVALID_PARAMS, code:'BOOLEAN_KIND_UNSUPPORTED',
        userMessage:'Choose a supported Boolean operation.'});
    }

    // Extract tolerances from boolean definition if provided
    const tolerances: ManifoldTolerances = (booleanDef as any)?.tolerances || {};

    function getMeshWithOrigins(mShell: MBrepShell): MeshWithOrigins {
      if (!(mShell instanceof MBrepShell)) {
        throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE, code:'NATIVE_REPRESENTATION_UNSUPPORTED',
          userMessage:'Native Mesh Boolean operations require solid mesh operands. No conversion was performed.'});
      }
      const shell = mShell.brepShell;
      const mwo = shell.data?.__meshWithOrigins
        || (shell as any).__meshWithOrigins
        || (mShell as any).__meshWithOrigins;
      if (mwo) return mwo;
      throw new CadError({kind:CadError.KIND.UNSUPPORTED_CASE, code:'NATIVE_REPRESENTATION_UNSUPPORTED',
        userMessage:'An operand has no Native Mesh representation. No geometry conversion was performed.'});
    }

    // Validate the entire operand set before the first asynchronous kernel job.
    const targetMeshes = targetShells.map(getMeshWithOrigins);
    const toolMeshes = tools.map(getMeshWithOrigins);
    if (targetShells.length === 0) return {created:tools, consumed};
    let current = targetMeshes[0];
    let resultShell: Shell = targetShells[0].brepShell;

    for (let i = 1; i < targetShells.length; i++) {
      const boolResult = await manifoldBooleanRaw(
        current, targetMeshes[i], 'union', tolerances
      );
      resultShell = boolResult.shell;
      current = boolResult.meshWithOrigins;
    }

    for (let i = 0; i < tools.length; i++) {
      const boolResult = await manifoldBooleanRaw(
        current, toolMeshes[i], opMap[kind], tolerances
      );
      resultShell = boolResult.shell;
      current = boolResult.meshWithOrigins;
    }

    targets.forEach(t => consumed.push(t));
    tools.forEach(t => consumed.push(t));

    const resultMShell = new MBrepShell(resultShell);

    // Build shared mesh on result shell from face tessellation data
    resultMShell.mesh = buildShellMeshFromTessData(resultMShell);

    return {
      consumed,
      created: [resultMShell]
    };
  }

  return {
    sketchToProfiles, extrudeProfile, applyBooleanModifier
  };
}

function buildShellMeshFromTessData(mShell: any): ShellMesh {
  const allVerts: number[] = [];
  const allNormals: number[] = [];
  const faceTriRanges: [number, number][] = [];
  let triIdx = 0;

  for (const mFace of mShell.faces) {
    const startTri = triIdx;
    const tessData = mFace.brepFace?.data?.tessellation?.data;
    if (tessData) {
      for (const [verts] of tessData) {
        for (const v of verts) {
          allVerts.push(v[0], v[1], v[2]);
        }
        const a = verts[0], b = verts[1], c = verts[2];
        const abx = b[0]-a[0], aby = b[1]-a[1], abz = b[2]-a[2];
        const acx = c[0]-a[0], acy = c[1]-a[1], acz = c[2]-a[2];
        let nx = aby*acz-abz*acy, ny = abz*acx-abx*acz, nz = abx*acy-aby*acx;
        const len = Math.sqrt(nx*nx+ny*ny+nz*nz);
        if (len > 0) { nx/=len; ny/=len; nz/=len; }
        allNormals.push(nx,ny,nz, nx,ny,nz, nx,ny,nz);
        triIdx++;
      }
    }
    faceTriRanges.push([startTri, triIdx]);
  }

  return {
    vertices: new Float32Array(allVerts),
    normals: new Float32Array(allNormals),
    faceTriRanges,
  };
}
