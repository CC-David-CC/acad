import {ApplicationContext} from 'cad/context';
import CadError from 'utils/errors';
import {roundValueForPresentation as r} from 'cad/craft/operationHelper';

import {EntityKind} from "cad/model/entities";
import {OperationDescriptor} from "cad/craft/operationBundle";
import {FromMObjectProductionAnalyzer} from "cad/craft/production/productionAnalyzer";
import {MEdge} from "cad/model/medge";
import {MObject} from "cad/model/mobject";
import {MShell} from "cad/model/mshell";
import { MBrepFace } from 'cad/model/mface';
import {requireLegacyPointer} from 'cad/model/workerGeometry';

interface FilletParams {
  edges: MEdge[] | MBrepFace[],
  size: number
  opperationType: 'Champher'|'Fillet'
}

export const FilletOperation: OperationDescriptor<any> = {
  id: 'FILLET_TOOL',
  label: 'Fillet/Chapher',
  icon: 'img/cad/fillet',
  info: 'Fillet/Champher',
  path:__dirname,
  paramsInfo: ({size, opperationType,}) => `(${r(size)} ${r(opperationType)}})`,
  run: (params: FilletParams, ctx: ApplicationContext) => {

    if (!Number.isFinite(params.size) || params.size <= 0) {
      throw new CadError({kind: CadError.KIND.INVALID_PARAMS, userMessage: 'Fillet or chamfer size must be a positive finite number.'});
    }
    if (!Array.isArray(params.edges) || !params.edges.length) {
      throw new CadError({kind: CadError.KIND.INVALID_PARAMS, userMessage: 'Select at least one edge or face to fillet or chamfer.'});
    }
    if (params.opperationType !== 'Fillet' && params.opperationType !== 'Champher') {
      throw new CadError({kind: CadError.KIND.INVALID_PARAMS, userMessage: 'Select a supported fillet or chamfer operation.'});
    }
    if (params.edges.some(item => item?.root?.topology?.data?.__meshWithOrigins)) {
      throw new CadError({kind: CadError.KIND.UNSUPPORTED_CASE, userMessage: 'Fillet or chamfer on Native Mesh geometry is not supported; no engine conversion was performed.'});
    }
    params.edges.forEach(item => requireLegacyPointer(item, 'Fillet or chamfer'));
    const occ = ctx.occService;
    const oci = occ.commandInterface;
    let edgeList = [];

    //check if input contains faces and if a face is an input add all adjacent edges to list for processing. 
    params.edges.forEach((edge) => {
      if(edge.TYPE === EntityKind.FACE){
        edgeList = edgeList.concat(edge.edges);
      }
      if(edge.TYPE === EntityKind.EDGE){
        edgeList.push(edge);
      }
    });

    
    //add all the edges and size to seperate arrays for each shell that edges are selected from
    const groups = new Map<MShell, any[]>()

    edgeList.forEach((edge) => {
      let shellArgs = groups.get(edge.shell);
      if (!shellArgs) {
        shellArgs = [];
        groups.set(edge.shell, shellArgs);
      }

      if (params.opperationType == "Fillet") {
        //order of parameters is diferent between fillet and champher
        shellArgs.push(params.size, edge);
      } else if (params.opperationType == "Champher") {
        //order of parameters is diferent between fillet and champher
        shellArgs.push(edge, params.size);
      } else {
        throw 'unsupported';
      }
    });

    //perform the opperations on each of the bodies.
    let result = {
      created: [],
      consumed: Array.from(groups.keys()),
      error: {},
    }

    const analyzer = new FromMObjectProductionAnalyzer(result.consumed);
    groups.forEach((shellArgs, shellToOpperateOn) => {
      const newShellName = shellToOpperateOn.id+'/MOD';
      if (params.opperationType == "Fillet") {
        oci.blend(newShellName, shellToOpperateOn, ...shellArgs);
      } else if (params.opperationType == "Champher") {
        oci.chamf(newShellName, shellToOpperateOn, ...shellArgs);
      } else {
        throw 'unsupported';
      }
      result.created.push(occ.io.getShell(newShellName, analyzer));
    });


    if (!result.created.length || result.created.some(item => !item || !Array.isArray(item.faces) || item.faces.length <= 1)) {
      throw new CadError({kind: CadError.KIND.INVALID_INPUT, userMessage: 'Fillet or chamfer failed. Choose a smaller size or different edges.'});
    }

    return result;
  },
  form: [
    {
      type: 'selection',
      name: 'edges',
      capture: [EntityKind.EDGE,EntityKind.FACE],
      label: 'edges',
      multi: true,
      defaultValue: {
        usePreselection: true,
        preselectionIndex: 0
      },
    },
    {
      type: 'choice',
      style: "dropdown",
      label: 'opperationType',
      name: 'opperationType',
      values: ["Fillet", "Champher"],
      defaultValue: "Fillet",
    },
    {
      type: 'number',
      label: 'size',
      name: 'size',
      defaultValue: 5,
    },
  ],
}

