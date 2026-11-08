import {preparePointCoincidence} from './pointCoincidenceAdmission';
import {addConstraintGroup} from './addConstraintGroup';
// The existing human star selection remains ONE transaction. Prepare every
// target first; a rejected member cannot leave earlier new rows committed.
export function addPointCoincidenceGroup(viewer,points){
 const pm=viewer?.parametricManager;
 if(!pm||!Array.isArray(points)||points.length<2||points.length>1024||new Set(points).size!==points.length||new Set(points.map(p=>p?.id)).size!==points.length)throw Object.assign(Error('Choose at least two distinct current points.'),{code:'COINCIDENCE_TARGET'});
 const live=new Set();viewer.traverse(object=>live.add(object));if(points.some(p=>!live.has(p)))throw Object.assign(Error('The selected point is no longer in this sketch.'),{code:'COINCIDENCE_TARGET'});
 const prepared=points.slice(1).map(point=>preparePointCoincidence(pm,[points[0],point])),created=prepared.filter(p=>!p.existing);
 if(!created.length){for(const p of prepared)p.validate(pm.stages);return{changed:false,rows:prepared.map(p=>p.constraint)};}
 addConstraintGroup(pm,created.map(p=>p.constraint),stages=>{for(const p of prepared)p.validate(stages);});
 return{changed:true,rows:prepared.map(p=>p.constraint)};
}
