import modellerUISubject from '../coreTests/subjects/modellerTPI';
import {createPlaneAndOpenSketcher} from '../coreTests/utils/scripts';
import {checkSplineEndpoints} from '../regression/bspline-endpoints';
import {initProjectService} from '../../web/app/cad/projectBundle';
import {activate as activateStorage} from '../../web/app/cad/storage/storageBundle';
window.webosTest = {modellerUISubject, createPlaneAndOpenSketcher, checkSplineEndpoints, initProjectService, activateStorage};
