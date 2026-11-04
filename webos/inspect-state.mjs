// Read-only inspection mirrors the host's serialized saved envelope.
export function inspectedProjectIsDirty(project, baseline, getManufacturing, unit) {
  const prior = JSON.parse(baseline);
  if(prior?.format!=='codi-jsketcher-project'||prior.version!==2||prior.unit!=='millimeter'||unit!==prior.unit)throw Error('Supported project units and format are unavailable.');
  const wrapped = Object.prototype.hasOwnProperty.call(prior,'manufacturing');
  if (wrapped && typeof getManufacturing !== 'function') throw Error('Manufacturing state is unavailable.');
  const manufacturing = typeof getManufacturing === 'function' ? getManufacturing() : null;
  if (wrapped && !manufacturing) throw Error('Manufacturing state is unavailable.');
  if(manufacturing&&manufacturing.unit!==unit)throw Error('Manufacturing units do not match the model.');
  const inspected = {format:'codi-jsketcher-project',version:2,unit,project,...(manufacturing?{manufacturing}:{})};
  return JSON.stringify(inspected) !== baseline;
}
