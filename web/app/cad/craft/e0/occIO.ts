import {OCI} from "cad/craft/e0/occCommandInterface";
import {MShell} from "cad/model/mshell";
import {MObject} from "cad/model/mobject";
import {Interrogate} from "cad/craft/e0/interact";
import {readShellEntityFromJson} from "cad/scene/wrappers/entityIO";
import {createOCCSketchLoader, OCCSketchLoader} from "cad/craft/e0/occSketchLoader";
import {ApplicationContext} from "cad/context";
import {ProductionAnalyzer} from "cad/craft/production/productionAnalyzer";
import {readBrep} from "brep/io/brepIO";
import {Shell} from "brep/topo/shell";
import {requireLegacyPointer} from 'cad/model/workerGeometry';
import CadError from 'utils/errors';

export interface OCCIO {

  getShell(name: string, productionAnalyzer?: ProductionAnalyzer): MShell;

  getLightShell(name: string): Shell;

  pushModel(model: MObject, name: string);

  cleanupRegistry();

  sketchLoader: OCCSketchLoader
}

export function createOCCIO(ctx: ApplicationContext): OCCIO {

  function getShell(shapeName: string, productionAnalyzer?: ProductionAnalyzer): MShell {
    const shapeJson = Interrogate(shapeName);
    return readShellEntityFromJson(shapeJson, productionAnalyzer);
  }

  function getLightShell(shapeName: string): Shell {
    const shapeJson = Interrogate(shapeName);
    return readBrep(shapeJson);
  }

  function pushModel(model: MObject, name: string) {
    const ptr = requireLegacyPointer(model, 'OCC operation');
    const status = ctx.occService.engineInterface.io.pushModel({
      name,
      operand: ptr
    });
    if (status !== 0) {
      throw new CadError({kind:CadError.KIND.INVALID_INPUT, code:'LEGACY_GEOMETRY_UNAVAILABLE',
        userMessage:'The engine could not register the selected geometry. No operation was performed.'});
    }
    return true;
  }

  function cleanupRegistry() {

  }


  return {
    getShell, getLightShell, pushModel, cleanupRegistry,
    sketchLoader: createOCCSketchLoader(OCI)
  }

}
