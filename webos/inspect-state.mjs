// Read-only inspection mirrors the host's serialized saved envelope.
export function inspectedProjectIsDirty(project, baseline, getManufacturing, unit, getPresentation, getDrawing) {
  const prior = JSON.parse(baseline);
  if(prior?.format!=='codi-jsketcher-project'||![2,3].includes(prior.version)||prior.unit!=='millimeter'||unit!==prior.unit)throw Error('Supported project units and format are unavailable.');
  const drawingWrapped=Object.hasOwn(prior,'drawings');
  function drawing(value){
    if(!value||typeof value!=='object'||Array.isArray(value)||![1,2,3].includes(value.version)||value.unit!=='millimeter')throw Error('Drawing metadata is unavailable.');
    return value;
  }
  if(prior.version===3){
    if(!drawingWrapped||!Array.isArray(prior.drawings)||prior.drawings.length!==1)throw Error('Drawing metadata is unavailable.');
    drawing(prior.drawings[0]);
    if(typeof getDrawing!=='function')throw Error('Drawing metadata is unavailable.');
  }else if(drawingWrapped)throw Error('Drawing metadata is unavailable.');
  const currentDrawing=typeof getDrawing==='function'?getDrawing():null;
  const definition=currentDrawing===null?null:drawing(currentDrawing);
  const wrapped = Object.prototype.hasOwnProperty.call(prior,'manufacturing');
  if (wrapped && typeof getManufacturing !== 'function') throw Error('Manufacturing state is unavailable.');
  const manufacturing = typeof getManufacturing === 'function' ? getManufacturing() : null;
  if (wrapped && !manufacturing) throw Error('Manufacturing state is unavailable.');
  if(manufacturing&&manufacturing.unit!==unit)throw Error('Manufacturing units do not match the model.');
  function presentation(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Reflect.ownKeys(value).length !== 2) throw Error('Display presentation is unavailable.');
    const version = Object.getOwnPropertyDescriptor(value, 'version'), lengthUnit = Object.getOwnPropertyDescriptor(value, 'lengthUnit');
    if (!version?.enumerable || !Object.hasOwn(version, 'value') || version.value !== 1 ||
        !lengthUnit?.enumerable || !Object.hasOwn(lengthUnit, 'value') || lengthUnit.value !== 'inch') throw Error('Display presentation is unavailable.');
    return {version: 1, lengthUnit: 'inch'};
  }
  if (Object.hasOwn(prior, 'presentation')) {
    presentation(prior.presentation);
    if (typeof getPresentation !== 'function') throw Error('Display presentation is unavailable.');
  }
  const currentPresentation = typeof getPresentation === 'function' ? getPresentation() : null;
  const display = currentPresentation === null ? null : presentation(currentPresentation);
  const inspected = {format:'codi-jsketcher-project',version:definition===null?2:3,unit,project,...(manufacturing?{manufacturing}:{}),...(display?{presentation:display}:{}),...(definition===null?{}:{drawings:[definition]})};
  return JSON.stringify(inspected) !== baseline;
}
