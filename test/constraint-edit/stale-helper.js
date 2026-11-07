import {captureExistingConstraintEdit,editExistingConstraint} from '../../web/app/sketcher/actions/editExistingConstraint';
window.concurrentConstraintEdit=(viewer,constraint,values)=>editExistingConstraint(viewer,constraint,values,captureExistingConstraintEdit(constraint));
