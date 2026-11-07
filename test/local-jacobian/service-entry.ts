import {createSketchDiagnosticService} from '../../web/app/cad/sketch/sketchDiagnosticService';
import {runSketchSolve} from '../../web/app/sketcher/headless/client';
(window as any).createTestSketchDiagnostics = ctx => createSketchDiagnosticService(ctx,runSketchSolve,'/static/test-diagnostic-worker.js');
(window as any).createFailingTestSketchDiagnostics = ctx => createSketchDiagnosticService(ctx,async (_url, request) => ({revision:request.revision,ok:false,error:{code:'SOLVE_FAILED',message:'Injected numerical failure'}}),'/static/test-diagnostic-worker.js');
