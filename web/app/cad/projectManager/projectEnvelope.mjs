import {validateManufacturingMetadata} from './manufacturingMetadata.mjs';
import {captureDisplayUnitsMetadata} from './displayUnits.mjs';
import {captureLinkedPartDrawingDefinition} from '../../../../modules/drawing/linkedPartDrawingDefinition.mjs';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const only = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
export function validateProjectTree(root) {
  const stack = [[root, 0]];
  let seen = 0;
  while (stack.length) {
    const [value, depth] = stack.pop();
    if (++seen > 1000000 || depth > 128) throw new Error('Project structure exceeds validation limits');
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Project contains a non-finite number');
    if (value && typeof value === 'object') {
      const children = Object.values(value);
      if (children.length + stack.length + seen > 1000000) throw new Error('Project structure exceeds validation limits');
      for (const child of children) stack.push([child, depth + 1]);
    }
  }
}
function validateProject(project) {
  if (!record(project) || !only(project, ['model','sketches','surfacing']) || !record(project.model) ||
      !only(project.model, ['history','expressions','assembly','workbench','counters']) ||
      !Array.isArray(project.model.history) || project.model.history.length > 10000 ||
      typeof project.model.expressions !== 'string' || !Array.isArray(project.sketches) || project.sketches.length > 10000) {
    throw new Error('Invalid or unsupported project structure');
  }
  if (project.model.counters !== undefined && (!record(project.model.counters) ||
      !only(project.model.counters, ['featureId']) || !Number.isSafeInteger(project.model.counters.featureId) || project.model.counters.featureId < 0)) {
    throw new Error('Invalid project counters');
  }
  for (const sketch of project.sketches) {
    if (!record(sketch) || !only(sketch, ['id','data']) || typeof sketch.id !== 'string' || !record(sketch.data)) throw new Error('Invalid project sketch');
  }
}

// Deliberately omit legacy top-level model/sketches so old guarded readers
// reject the file instead of silently discarding admission priority.
export function encodeProjectEnvelope(project, manufacturing = null, presentation = null, drawing = null) {
  validateProject(project);
  const metadata = manufacturing === null ? null : validateManufacturingMetadata(manufacturing);
  if (metadata && metadata.unit !== 'millimeter') throw new Error('Manufacturing unit must match the project unit');
  const display=presentation===null?null:captureDisplayUnitsMetadata(presentation);
  const definition=drawing===null?null:captureLinkedPartDrawingDefinition(drawing);
  return {format: 'codi-jsketcher-project', version: definition===null?2:3, unit: 'millimeter', project,
    ...(metadata === null ? {} : {manufacturing: metadata}),...(display===null?{}:{presentation:display}),
    ...(definition===null?{}:{drawings:Object.freeze([definition])})};
}

// Version3 is intentionally narrow: one detached authored definition. Native
// reference resolution is separate; a valid unresolved definition must survive
// Open/Save. No projected/solved geometry or runtime custody is admitted here.
function drawingEnvelope(value) {
  if(![null,Object.prototype].includes(Object.getPrototypeOf(value)))throw new Error('Invalid drawing project envelope');
  const required=['format','version','unit','project','drawings'],allowed=[...required,'manufacturing','presentation'];
  const keys=Reflect.ownKeys(value);
  if(keys.some(key=>typeof key!=='string'||!allowed.includes(key))||required.some(key=>!keys.includes(key)))throw new Error('Invalid drawing project envelope');
  const captured={};
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw new Error('Drawing project fields must be own data');captured[key]=d.value;}
  const list=captured.drawings;
  if(!Array.isArray(list)||![null,Array.prototype].includes(Object.getPrototypeOf(list))||
      Object.getOwnPropertyDescriptor(list,'length')?.value!==1||Reflect.ownKeys(list).length!==2)throw new Error('A drawing project requires exactly one definition');
  const item=Object.getOwnPropertyDescriptor(list,'0');
  if(!item?.enumerable||!Object.prototype.hasOwnProperty.call(item,'value'))throw new Error('Drawing project definitions must be own data');
  return {value:captured,drawing:captureLinkedPartDrawingDefinition(item.value)};
}

export function decodeProjectEnvelope(value) {
  // Read the discriminator without invoking a caller-supplied accessor. The
  // ordinary v2 decoded shape stays unchanged for existing consumers.
  const version=record(value)?Object.getOwnPropertyDescriptor(value,'version')?.value:undefined;
  const captured=version===3?drawingEnvelope(value):null;
  if(captured)value=captured.value;
  if (!record(value) || value.format !== 'codi-jsketcher-project' || ![2,3].includes(version) || value.unit !== 'millimeter' ||
      Object.keys(value).some(key => !['format', 'version', 'unit', 'project', 'manufacturing', 'presentation',...(version===3?['drawings']:[])].includes(key)) ||
      !record(value.project)) {
    throw new Error('Unsupported or invalid JSketcher project format');
  }
  validateProject(value.project);
  const metadata = Object.prototype.hasOwnProperty.call(value, 'manufacturing') ? validateManufacturingMetadata(value.manufacturing) : null;
  if (metadata && metadata.unit !== value.unit) throw new Error('Manufacturing unit must match the project unit');
  const presentation=Object.prototype.hasOwnProperty.call(value,'presentation')?captureDisplayUnitsMetadata(value.presentation):null;
  return {project: value.project, manufacturing: metadata,...(presentation===null?{}:{presentation}),...(captured?{drawing:captured.drawing}:{})};
}
