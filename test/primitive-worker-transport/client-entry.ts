import {runSketchTransition} from '../../web/app/sketcher/headless/transitionClient';
import {runEmptySketchPreparation} from '../../web/app/sketcher/headless/emptySketchClient';
import {runClosedSketchInspection} from '../../web/app/sketcher/headless/inspectionClient';
Object.assign(window,{runSketchTransition,runEmptySketchPreparation,runClosedSketchInspection});
