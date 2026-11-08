import {preparePointLineDistance} from './pointLineDistanceAdmission';
import {addConstraintGroup} from './addConstraintGroup';
// Existing real human history owns the same model admission; headless callers
// retain the outer one-sketch-bytes journal instead of a separate history stack.
export function addPointLineDistance(viewer,point,line,distance,inverted){
 const pm=viewer.parametricManager,prepared=preparePointLineDistance(pm,point,line,distance,inverted);
 if(prepared.existing){prepared.constraint.resolveConstants(pm.constantResolver);return{changed:false,constraint:prepared.constraint};}
 addConstraintGroup(pm,[prepared.constraint],prepared.validate);return{changed:true,constraint:prepared.constraint};
}
