import {GiCubes} from 'react-icons/gi';
import {WorkbenchConfig} from './workbenchService';
import {WorkerRectangleExtrudeOperation} from 'workbenches/modeler/features/workerRectangleExtrude/workerRectangleExtrude.operation';

export const WorkbenchRegistry: WorkbenchConfig[] = [{
  workbenchId: 'modeler',
  features: [WorkerRectangleExtrudeOperation],
  actions: [],
  ui: {
    toolbar: ['DesktopDimensionedRectangle', 'DesktopEditRectangleDimensions', 'EditFace', '-', 'WORKER_RECTANGLE_EXTRUDE_V1', 'FitWorkerSolids'],
  },
  icon: GiCubes,
}];
