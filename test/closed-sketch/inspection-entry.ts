import {runClosedSketchInspection} from '../../web/app/sketcher/headless/inspectionClient';
import {runSketchSolve} from '../../web/app/sketcher/headless/client';
(window as any).inspectClosedSketchWorker=runClosedSketchInspection;
(window as any).solveClosedSketchFixture=runSketchSolve;
