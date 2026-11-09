import {prepareHumanTangency} from './tangencyAdmission';import {addConstraintGroup} from './addConstraintGroup';
// Same genuine PM transaction as existing human constraint groups. Source
// references are selected native objects, not IDs constructed by this action.
export function addMechanicalTangency(viewer,objects,typeId,constants){const pm=viewer?.parametricManager;if(!pm)throw Error('A current sketch is required.');const owned=new Set();viewer.traverse(o=>owned.add(o));if(objects.some(o=>!owned.has(o)))throw Error('Choose tangent objects from this actual sketch.');const p=prepareHumanTangency(pm,objects,{typeId,objects:objects.map(o=>o.id),constants});addConstraintGroup(pm,[p.constraint],stages=>p.validate(stages));return p.constraint;}
