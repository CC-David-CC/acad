// Read-only inspection mirrors the host's serialized saved envelope.
export function inspectedProjectIsDirty(project, baseline, getManufacturing, unit, getPresentation) {
  const prior = JSON.parse(baseline);
  if(prior?.format!=='codi-jsketcher-project'||prior.version!==2||prior.unit!=='millimeter'||unit!==prior.unit)throw Error('Supported project units and format are unavailable.');
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
  const inspected = {format:'codi-jsketcher-project',version:2,unit,project,...(manufacturing?{manufacturing}:{}),...(display?{presentation:display}:{})};
  return JSON.stringify(inspected) !== baseline;
}
